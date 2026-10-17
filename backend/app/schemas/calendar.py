from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class CalendarEventBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None
    event_type: str = Field(default="study")  # study, lecture, project, meeting, personal
    is_confirmed: bool = True

class CalendarEventCreate(CalendarEventBase):
    pass

class CalendarEventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    event_type: Optional[str] = None
    is_confirmed: Optional[bool] = None

class CalendarEventResponse(CalendarEventBase):
    id: int
    is_seed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class FreeTimeRequest(BaseModel):
    date: str = Field(..., description="Date formatted as YYYY-MM-DD")
    duration_minutes: int = Field(default=120, ge=15, le=720)
    window_start_hour: int = Field(default=8, ge=0, le=23)
    window_end_hour: int = Field(default=22, ge=0, le=24)

class TimeSlotResponse(BaseModel):
    start_time: datetime
    end_time: datetime
    duration_minutes: int
    date_str: str
    formatted_start: str
    formatted_end: str
    recommendation_note: str

class FreeTimeResponse(BaseModel):
    requested_date: str
    requested_duration_minutes: int
    available_slots: List[TimeSlotResponse]
    busy_events_count: int
