from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    status: str = Field(default="pending")  # pending, in_progress, completed, cancelled
    priority: str = Field(default="medium")  # low, medium, high, urgent
    due_date: Optional[datetime] = None
    estimated_duration: int = Field(default=30, ge=5, le=1440)  # minutes
    category: str = Field(default="General")

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[datetime] = None
    estimated_duration: Optional[int] = None
    category: Optional[str] = None

class TaskResponse(TaskBase):
    id: int
    is_seed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PrioritizedTaskItem(BaseModel):
    task: TaskResponse
    urgency_score: float
    reason: str
