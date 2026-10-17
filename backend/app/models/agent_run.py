from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from datetime import datetime
from backend.app.core.database import Base

class AgentRun(Base):
    __tablename__ = "agent_runs"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(String(100), nullable=True, index=True)
    user_prompt = Column(Text, nullable=False)
    intent = Column(String(100), nullable=True, index=True)
    status = Column(String(50), default="pending", index=True)
    # statuses: pending, planning, awaiting_approval, executing, completed, failed, cancelled
    
    plan = Column(JSON, nullable=True)  # List of planned steps
    tool_calls = Column(JSON, nullable=True)  # List of executed or proposed tool calls
    summary = Column(Text, nullable=True)  # Truthful explanation of what was done
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
