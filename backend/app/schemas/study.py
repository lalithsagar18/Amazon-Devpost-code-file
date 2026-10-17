from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class StudyPlanRequest(BaseModel):
    subject: str = Field(..., min_length=2)
    exam_date: datetime
    available_hours_per_day: float = Field(default=2.5, ge=0.5, le=10.0)
    topics: Optional[List[str]] = None
    target_sessions_count: Optional[int] = Field(default=4, ge=1, le=14)

class ProposedStudySession(BaseModel):
    title: str
    subject: str
    topic: str
    start_time: datetime
    end_time: datetime
    duration_minutes: int
    focus_objective: str
    requires_approval: bool = True

class StudyPlanResponse(BaseModel):
    subject: str
    exam_date: datetime
    days_until_exam: int
    total_study_hours: float
    sessions: List[ProposedStudySession]
    reasoning: str
    approval_required: bool = True
