from fastapi import APIRouter, HTTPException, Body
from typing import List, Dict, Any
from backend.app.schemas.tools import ToolInfoResponse, ToolsHealthResponse
from backend.app.mcp_server.server import (
    get_tasks, create_task, update_task, complete_task,
    get_calendar_events, find_free_time, create_calendar_event, update_calendar_event,
    search_notes, summarize_notes, extract_tasks_from_notes,
    analyze_schedule, create_study_plan, prioritize_tasks
)

router = APIRouter(prefix="/tools", tags=["MCP Tools & Health"])

TOOL_REGISTRY: List[Dict[str, Any]] = [
    {
        "name": "get_tasks",
        "description": "Retrieve tasks with optional filtering by status, priority, category or search query.",
        "category": "Tasks",
        "parameters": [
            {"name": "status", "type": "string", "description": "pending, in_progress, completed, cancelled or all", "required": False},
            {"name": "priority", "type": "string", "description": "low, medium, high, urgent or all", "required": False},
            {"name": "category", "type": "string", "description": "Category name or all", "required": False},
            {"name": "search", "type": "string", "description": "Text search keyword", "required": False}
        ],
        "requires_approval": False,
        "consequential": False
    },
    {
        "name": "create_task",
        "description": "Create a new task with title, description, priority, and optional due date.",
        "category": "Tasks",
        "parameters": [
            {"name": "title", "type": "string", "description": "Task title", "required": True},
            {"name": "description", "type": "string", "description": "Task description", "required": False},
            {"name": "priority", "type": "string", "description": "low, medium, high, urgent", "required": False},
            {"name": "due_date", "type": "string (ISO)", "description": "Deadline timestamp", "required": False},
            {"name": "estimated_duration", "type": "integer", "description": "Minutes required", "required": False},
            {"name": "category", "type": "string", "description": "Study, Work, Personal, etc.", "required": False}
        ],
        "requires_approval": False,
        "consequential": True
    },
    {
        "name": "update_task",
        "description": "Update an existing task title, description, status, or priority.",
        "category": "Tasks",
        "parameters": [
            {"name": "task_id", "type": "integer", "description": "Task ID", "required": True},
            {"name": "title", "type": "string", "description": "New title", "required": False},
            {"name": "status", "type": "string", "description": "New status", "required": False},
            {"name": "priority", "type": "string", "description": "New priority", "required": False}
        ],
        "requires_approval": False,
        "consequential": True
    },
    {
        "name": "complete_task",
        "description": "Mark a task as completed in the database.",
        "category": "Tasks",
        "parameters": [
            {"name": "task_id", "type": "integer", "description": "Task ID", "required": True}
        ],
        "requires_approval": False,
        "consequential": True
    },
    {
        "name": "get_calendar_events",
        "description": "Retrieve internal calendar events within an optional date range.",
        "category": "Calendar",
        "parameters": [
            {"name": "start_date", "type": "string (ISO)", "description": "Start of range", "required": False},
            {"name": "end_date", "type": "string (ISO)", "description": "End of range", "required": False},
            {"name": "event_type", "type": "string", "description": "study, lecture, project, meeting", "required": False}
        ],
        "requires_approval": False,
        "consequential": False
    },
    {
        "name": "find_free_time",
        "description": "Find unconflicted free slots on a given date for requested duration.",
        "category": "Calendar",
        "parameters": [
            {"name": "target_date", "type": "string (YYYY-MM-DD)", "description": "Target date", "required": True},
            {"name": "duration_minutes", "type": "integer", "description": "Slot duration in minutes", "required": False},
            {"name": "window_start_hour", "type": "integer", "description": "Start hour 0-23", "required": False},
            {"name": "window_end_hour", "type": "integer", "description": "End hour 0-24", "required": False}
        ],
        "requires_approval": False,
        "consequential": False
    },
    {
        "name": "create_calendar_event",
        "description": "Create an event in the internal calendar.",
        "category": "Calendar",
        "parameters": [
            {"name": "title", "type": "string", "description": "Event title", "required": True},
            {"name": "start_time", "type": "string (ISO)", "description": "Event start time", "required": True},
            {"name": "end_time", "type": "string (ISO)", "description": "Event end time", "required": True},
            {"name": "description", "type": "string", "description": "Event description", "required": False},
            {"name": "location", "type": "string", "description": "Event location", "required": False},
            {"name": "event_type", "type": "string", "description": "study, project, lecture, etc.", "required": False}
        ],
        "requires_approval": True,
        "consequential": True
    },
    {
        "name": "update_calendar_event",
        "description": "Update an existing internal calendar event.",
        "category": "Calendar",
        "parameters": [
            {"name": "event_id", "type": "integer", "description": "Event ID", "required": True},
            {"name": "title", "type": "string", "description": "New title", "required": False},
            {"name": "start_time", "type": "string (ISO)", "description": "New start time", "required": False},
            {"name": "end_time", "type": "string (ISO)", "description": "New end time", "required": False}
        ],
        "requires_approval": True,
        "consequential": True
    },
    {
        "name": "search_notes",
        "description": "Search notes by query string or tag.",
        "category": "Notes",
        "parameters": [
            {"name": "query", "type": "string", "description": "Search keyword", "required": False},
            {"name": "tag", "type": "string", "description": "Filter tag", "required": False}
        ],
        "requires_approval": False,
        "consequential": False
    },
    {
        "name": "summarize_notes",
        "description": "Summarize a specific note and extract its focal points.",
        "category": "Notes",
        "parameters": [
            {"name": "note_id", "type": "integer", "description": "Note ID", "required": True}
        ],
        "requires_approval": False,
        "consequential": False
    },
    {
        "name": "extract_tasks_from_notes",
        "description": "Extract actionable tasks and checklist items from a note.",
        "category": "Notes",
        "parameters": [
            {"name": "note_id", "type": "integer", "description": "Note ID", "required": True}
        ],
        "requires_approval": False,
        "consequential": False
    },
    {
        "name": "analyze_schedule",
        "description": "Analyze overall schedule balance, task burden, and free-time density.",
        "category": "Analytics",
        "parameters": [
            {"name": "date_str", "type": "string (YYYY-MM-DD)", "description": "Date to analyze", "required": False}
        ],
        "requires_approval": False,
        "consequential": False
    },
    {
        "name": "create_study_plan",
        "description": "Generate a conflict-free study session plan leading up to an exam.",
        "category": "Study",
        "parameters": [
            {"name": "subject", "type": "string", "description": "Exam subject name", "required": True},
            {"name": "exam_date", "type": "string (ISO)", "description": "Target exam date", "required": True},
            {"name": "available_hours_per_day", "type": "float", "description": "Study hours available per day", "required": False},
            {"name": "target_sessions", "type": "integer", "description": "Desired count of sessions", "required": False}
        ],
        "requires_approval": True,
        "consequential": True
    },
    {
        "name": "prioritize_tasks",
        "description": "Compute transparent algorithmic priority scores for all active tasks.",
        "category": "Analytics",
        "parameters": [],
        "requires_approval": False,
        "consequential": False
    }
]

@router.get("", response_model=List[ToolInfoResponse])
def get_tools():
    return TOOL_REGISTRY

@router.get("/health", response_model=ToolsHealthResponse)
def get_tools_health():
    return {
        "status": "healthy",
        "mcp_server": "lifepilot-mcp",
        "mcp_specification": "2025-11-25 (Streamable HTTP)",
        "total_tools": len(TOOL_REGISTRY),
        "tools": TOOL_REGISTRY
    }

@router.post("/execute/{tool_name}")
def execute_tool(tool_name: str, payload: Dict[str, Any] = Body(default={})):
    """Direct execution interface for inspecting and verifying MCP tools."""
    tool_map = {
        "get_tasks": lambda p: get_tasks(**p),
        "create_task": lambda p: create_task(**p),
        "update_task": lambda p: update_task(**p),
        "complete_task": lambda p: complete_task(**p),
        "get_calendar_events": lambda p: get_calendar_events(**p),
        "find_free_time": lambda p: find_free_time(**p),
        "create_calendar_event": lambda p: create_calendar_event(**p),
        "update_calendar_event": lambda p: update_calendar_event(**p),
        "search_notes": lambda p: search_notes(**p),
        "summarize_notes": lambda p: summarize_notes(**p),
        "extract_tasks_from_notes": lambda p: extract_tasks_from_notes(**p),
        "analyze_schedule": lambda p: analyze_schedule(**p),
        "create_study_plan": lambda p: create_study_plan(**p),
        "prioritize_tasks": lambda p: prioritize_tasks()
    }
    
    if tool_name not in tool_map:
        raise HTTPException(status_code=404, detail=f"Tool '{tool_name}' not found.")
        
    try:
        result = tool_map[tool_name](payload)
        return {
            "tool_name": tool_name,
            "success": True,
            "result": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error executing tool '{tool_name}': {str(e)}")
