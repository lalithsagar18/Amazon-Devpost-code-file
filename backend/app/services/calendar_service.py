from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, asc
from typing import Optional, List, Dict, Any
from datetime import datetime, date, time, timedelta
from backend.app.models.calendar_event import CalendarEvent
from backend.app.schemas.calendar import CalendarEventCreate, CalendarEventUpdate

class CalendarService:
    @staticmethod
    def get_events(
        db: Session,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        event_type: Optional[str] = None
    ) -> List[CalendarEvent]:
        query = db.query(CalendarEvent)
        if start_date:
            query = query.filter(CalendarEvent.end_time >= start_date)
        if end_date:
            query = query.filter(CalendarEvent.start_time <= end_date)
        if event_type and event_type != "all":
            query = query.filter(CalendarEvent.event_type == event_type)
        return query.order_by(asc(CalendarEvent.start_time)).all()

    @staticmethod
    def get_event_by_id(db: Session, event_id: int) -> Optional[CalendarEvent]:
        return db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()

    @staticmethod
    def check_overlaps(
        db: Session,
        start_time: datetime,
        end_time: datetime,
        exclude_id: Optional[int] = None
    ) -> List[CalendarEvent]:
        """Find any existing events that overlap with the proposed interval [start_time, end_time]."""
        query = db.query(CalendarEvent).filter(
            CalendarEvent.start_time < end_time,
            CalendarEvent.end_time > start_time
        )
        if exclude_id:
            query = query.filter(CalendarEvent.id != exclude_id)
        return query.all()

    @staticmethod
    def create_event(db: Session, event_in: CalendarEventCreate, is_seed: bool = False) -> CalendarEvent:
        event = CalendarEvent(
            title=event_in.title,
            description=event_in.description,
            start_time=event_in.start_time,
            end_time=event_in.end_time,
            location=event_in.location,
            event_type=event_in.event_type,
            is_confirmed=event_in.is_confirmed,
            is_seed=is_seed,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event

    @staticmethod
    def update_event(db: Session, event_id: int, event_in: CalendarEventUpdate) -> Optional[CalendarEvent]:
        event = CalendarService.get_event_by_id(db, event_id)
        if not event:
            return None
        update_data = event_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(event, field, value)
        event.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(event)
        return event

    @staticmethod
    def delete_event(db: Session, event_id: int) -> bool:
        event = CalendarService.get_event_by_id(db, event_id)
        if not event:
            return False
        db.delete(event)
        db.commit()
        return True

    @staticmethod
    def find_free_time(
        db: Session,
        target_date: date,
        duration_minutes: int = 120,
        window_start_hour: int = 8,
        window_end_hour: int = 22
    ) -> Dict[str, Any]:
        """
        Step 1: Read actual internal calendar events for the target date.
        Step 2: Define the requested window (e.g., 08:00 to 22:00).
        Step 3: Exclude occupied periods.
        Step 4: Return available slots with clear start and end times >= requested duration.
        """
        day_start = datetime.combine(target_date, time(window_start_hour, 0))
        day_end = datetime.combine(target_date, time(window_end_hour, 0))

        # Query events occurring on target_date within or overlapping the window
        busy_events = db.query(CalendarEvent).filter(
            CalendarEvent.start_time < day_end,
            CalendarEvent.end_time > day_start
        ).order_by(asc(CalendarEvent.start_time)).all()

        # Merge overlapping or contiguous busy intervals
        busy_intervals = []
        for ev in busy_events:
            s = max(ev.start_time, day_start)
            e = min(ev.end_time, day_end)
            if s < e:
                busy_intervals.append((s, e, ev.title))

        # Calculate free gaps between busy intervals
        free_slots = []
        curr_pointer = day_start

        for busy_s, busy_e, _ in busy_intervals:
            if busy_s > curr_pointer:
                gap_minutes = int((busy_s - curr_pointer).total_seconds() / 60)
                if gap_minutes >= duration_minutes:
                    slot_end = curr_pointer + timedelta(minutes=duration_minutes)
                    free_slots.append({
                        "start_time": curr_pointer,
                        "end_time": slot_end,
                        "duration_minutes": duration_minutes,
                        "available_window_minutes": gap_minutes,
                        "date_str": target_date.isoformat(),
                        "formatted_start": curr_pointer.strftime("%I:%M %p"),
                        "formatted_end": slot_end.strftime("%I:%M %p"),
                        "recommendation_note": f"Clear {gap_minutes}m block available (proposing {duration_minutes}m)"
                    })
            curr_pointer = max(curr_pointer, busy_e)

        # Check trailing gap after last busy event
        if curr_pointer < day_end:
            gap_minutes = int((day_end - curr_pointer).total_seconds() / 60)
            if gap_minutes >= duration_minutes:
                slot_end = curr_pointer + timedelta(minutes=duration_minutes)
                free_slots.append({
                    "start_time": curr_pointer,
                    "end_time": slot_end,
                    "duration_minutes": duration_minutes,
                    "available_window_minutes": gap_minutes,
                    "date_str": target_date.isoformat(),
                    "formatted_start": curr_pointer.strftime("%I:%M %p"),
                    "formatted_end": slot_end.strftime("%I:%M %p"),
                    "recommendation_note": f"Clear afternoon/evening block available ({gap_minutes}m free)"
                })

        return {
            "requested_date": target_date.isoformat(),
            "requested_duration_minutes": duration_minutes,
            "busy_events_count": len(busy_events),
            "busy_events": [{"title": ev.title, "start": ev.start_time.isoformat(), "end": ev.end_time.isoformat()} for ev in busy_events],
            "available_slots": free_slots
        }
