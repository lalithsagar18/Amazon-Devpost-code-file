from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from backend.app.schemas.approval import ApprovalResponse
from backend.app.schemas.agent import AgentRunResponse

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    conversation_id: Optional[str] = None
    voice_input: bool = False

class MessageResponse(BaseModel):
    id: int
    conversation_id: str
    role: str
    content: str
    extra_data: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse] = []

    class Config:
        from_attributes = True

class ChatResponse(BaseModel):
    conversation_id: str
    message: MessageResponse
    agent_run: AgentRunResponse
    pending_approval: Optional[ApprovalResponse] = None
    provider_used: str  # e.g., "deterministic_demo_provider", "openai", "anthropic"
    suggested_prompts: List[str] = []
