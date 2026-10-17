from pydantic import BaseModel, Field
from typing import Optional, Any, Dict
from datetime import datetime

class ApprovalResponse(BaseModel):
    id: int
    run_id: Optional[int] = None
    action_type: str
    title: str
    description: str
    proposed_payload: Dict[str, Any]
    affected_records_summary: Optional[str] = None
    status: str  # pending, approved, cancelled, executed, failed
    idempotency_token: Optional[str] = None
    execution_result: Optional[Dict[str, Any]] = None
    verified_data: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ApprovalActionRequest(BaseModel):
    idempotency_token: Optional[str] = None

class ApprovalActionResult(BaseModel):
    approval_id: int
    status: str
    action_type: str
    message: str
    execution_result: Optional[Dict[str, Any]] = None
    verified_record: Optional[Dict[str, Any]] = None
