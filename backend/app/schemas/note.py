from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class NoteBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(...)
    tags: Optional[str] = ""

class NoteCreate(NoteBase):
    pass

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[str] = None

class NoteResponse(NoteBase):
    id: int
    is_seed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ExtractedTaskCandidate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "medium"
    estimated_duration: int = 45
    category: str = "Study"

class NoteExtractTasksResponse(BaseModel):
    note_id: int
    note_title: str
    extracted_tasks: List[ExtractedTaskCandidate]
    message: str
