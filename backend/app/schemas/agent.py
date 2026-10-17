from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict
from datetime import datetime

class PlanStep(BaseModel):
    step_number: int
    description: str
    tool_name: Optional[str] = None
    status: str = "pending"  # pending, running, completed, skipped, failed
    result_preview: Optional[str] = None

class ToolCallRecord(BaseModel):
    tool_name: str
    arguments: Dict[str, Any]
    status: str = "success"  # success, failed, requires_approval
    result: Optional[Any] = None
    error: Optional[str] = None
    executed_at: datetime = Field(default_factory=datetime.utcnow)

class AgentRunResponse(BaseModel):
    id: int
    conversation_id: Optional[str] = None
    user_prompt: str
    intent: Optional[str] = None
    status: str
    plan: Optional[List[Dict[str, Any]]] = None
    tool_calls: Optional[List[Dict[str, Any]]] = None
    summary: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
