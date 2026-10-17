from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from datetime import datetime
from backend.app.core.database import Base

class Approval(Base):
    __tablename__ = "approvals"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, nullable=True, index=True)
    action_type = Column(String(100), nullable=False, index=True) 
    # e.g., create_calendar_event, create_study_plan, bulk_update_tasks, delete_task
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    proposed_payload = Column(JSON, nullable=False)
    affected_records_summary = Column(Text, nullable=True)
    
    status = Column(String(50), default="pending", index=True)  # pending, approved, cancelled, executed, failed
    idempotency_token = Column(String(100), unique=True, index=True, nullable=True)
    
    execution_result = Column(JSON, nullable=True)
    verified_data = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
