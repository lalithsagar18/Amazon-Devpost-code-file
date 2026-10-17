from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from datetime import datetime
from backend.app.core.database import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="pending", index=True)  # pending, in_progress, completed, cancelled
    priority = Column(String(20), default="medium", index=True)  # low, medium, high, urgent
    due_date = Column(DateTime, nullable=True, index=True)
    estimated_duration = Column(Integer, default=30)  # minutes
    category = Column(String(50), default="General", index=True)  # Study, Work, Personal, Assignment, Project
    is_seed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
