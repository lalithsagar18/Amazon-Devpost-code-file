from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
from backend.app.core.database import get_db
from backend.app.schemas.calendar import CalendarEventCreate, CalendarEventUpdate, CalendarEventResponse, FreeTimeRequest, FreeTimeResponse
from backend.app.services.calendar_service import CalendarService

router = APIRouter(prefix="/calendar", tags=["Calendar"])

@router.get("/events", response_model=List[CalendarEventResponse])
def list_events(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    event_type: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return CalendarService.get_events(db, start_date=start_date, end_date=end_date, event_type=event_type)

@router.post("/events", response_model=CalendarEventResponse, status_code=201)
def create_event(event_in: CalendarEventCreate, db: Session = Depends(get_db)):
    overlaps = CalendarService.check_overlaps(db, event_in.start_time, event_in.end_time)
    if overlaps:
        overlap_titles = ", ".join([o.title for o in overlaps])
        # We allow creation but could flag conflict; let's record and return
    return CalendarService.create_event(db, event_in)

@router.get("/events/{event_id}", response_model=CalendarEventResponse)
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = CalendarService.get_event_by_id(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@router.patch("/events/{event_id}", response_model=CalendarEventResponse)
def update_event(event_id: int, event_in: CalendarEventUpdate, db: Session = Depends(get_db)):
    event = CalendarService.update_event(db, event_id, event_in)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@router.delete("/events/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db)):
    success = CalendarService.delete_event(db, event_id)
    if not success:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"success": True, "message": f"Event {event_id} deleted."}

@router.post("/find-free-time", response_model=FreeTimeResponse)
def find_free_time(req: FreeTimeRequest, db: Session = Depends(get_db)):
    try:
        t_date = date.fromisoformat(req.date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
        
    return CalendarService.find_free_time(
        db=db,
        target_date=t_date,
        duration_minutes=req.duration_minutes,
        window_start_hour=req.window_start_hour,
        window_end_hour=req.window_end_hour
    )
