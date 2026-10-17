from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from datetime import datetime
from backend.app.core.database import Base

class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=False, index=True)
    location = Column(String(255), nullable=True)
    event_type = Column(String(50), default="study", index=True)  # study, lecture, project, meeting, personal
    is_confirmed = Column(Boolean, default=True)
    is_seed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
