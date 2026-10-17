from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.core.database import get_db
from backend.app.schemas.approval import ApprovalResponse, ApprovalActionRequest, ApprovalActionResult
from backend.app.services.approval_service import ApprovalService

router = APIRouter(prefix="/approvals", tags=["Approvals & Safety"])

@router.get("", response_model=List[ApprovalResponse])
def list_approvals(status: Optional[str] = Query(None), db: Session = Depends(get_db)):
    return ApprovalService.get_approvals(db, status=status)

@router.get("/{approval_id}", response_model=ApprovalResponse)
def get_approval(approval_id: int, db: Session = Depends(get_db)):
    approval = ApprovalService.get_approval_by_id(db, approval_id)
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")
    return approval

@router.post("/{approval_id}/approve", response_model=ApprovalActionResult)
def approve_action(approval_id: int, body: Optional[ApprovalActionRequest] = None, db: Session = Depends(get_db)):
    token = body.idempotency_token if body else None
    result = ApprovalService.approve(db, approval_id, idempotency_token=token)
    if result.get("status") == "not_found":
        raise HTTPException(status_code=404, detail=result.get("error"))
    return result

@router.post("/{approval_id}/cancel")
def cancel_action(approval_id: int, db: Session = Depends(get_db)):
    result = ApprovalService.cancel(db, approval_id)
    if result.get("status") == "not_found":
        raise HTTPException(status_code=404, detail=result.get("error"))
    return result
