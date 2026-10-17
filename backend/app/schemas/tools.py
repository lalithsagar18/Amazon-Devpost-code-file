from pydantic import BaseModel
from typing import Optional, Dict, Any, List

class ToolParameter(BaseModel):
    name: str
    type: str
    description: str
    required: bool = True

class ToolInfoResponse(BaseModel):
    name: str
    description: str
    category: str
    parameters: List[ToolParameter]
    requires_approval: bool = False
    consequential: bool = False

class ToolsHealthResponse(BaseModel):
    status: str
    mcp_server: str
    mcp_specification: str
    total_tools: int
    tools: List[ToolInfoResponse]
