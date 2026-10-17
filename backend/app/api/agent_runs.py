from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.core.database import get_db
from backend.app.models.agent_run import AgentRun
from backend.app.schemas.agent import AgentRunResponse

router = APIRouter(prefix="/agent", tags=["Agent Execution & Runs"])

@router.get("/runs", response_model=List[AgentRunResponse])
def list_runs(status: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(AgentRun)
    if status and status != "all":
        query = query.filter(AgentRun.status == status)
    return query.order_by(AgentRun.id.desc()).all()

@router.get("/runs/{run_id}", response_model=AgentRunResponse)
def get_run(run_id: int, db: Session = Depends(get_db)):
    run = db.query(AgentRun).filter(AgentRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Agent run not found")
    return run
