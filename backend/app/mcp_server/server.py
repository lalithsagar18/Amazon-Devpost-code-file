from mcp.server.mcpserver import MCPServer
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from backend.app.core.database import SessionLocal
from backend.app.services.task_service import TaskService
from backend.app.services.calendar_service import CalendarService
from backend.app.services.note_service import NoteService
from backend.app.services.study_service import StudyService
from backend.app.schemas.task import TaskCreate, TaskUpdate
from backend.app.schemas.calendar import CalendarEventCreate, CalendarEventUpdate
from backend.app.schemas.study import StudyPlanRequest

mcp_server = MCPServer(
    name="lifepilot-mcp",
    version="2025-11-25",
    description="LifePilot AI Official MCP Server for Alexa+ Productivity"
)

# -------------------------------------------------------------
# TOOL 1: get_tasks
# -------------------------------------------------------------
@mcp_server.tool(name="get_tasks", description="Retrieve tasks with optional filtering by status, priority, category or search query.")
def get_tasks(status: str = "all", priority: str = "all", category: str = "all", search: str = "") -> List[Dict[str, Any]]:
    db = SessionLocal()
    try:
        tasks = TaskService.get_tasks(db, status=status, priority=priority, category=category, search=search)
        return [
            {
                "id": t.id,
                "title": t.title,
                "description": t.description,
                "status": t.status,
                "priority": t.priority,
                "due_date": t.due_date.isoformat() if t.due_date else None,
                "estimated_duration": t.estimated_duration,
                "category": t.category
            }
            for t in tasks
        ]
    finally:
        db.close()

# -------------------------------------------------------------
# TOOL 2: create_task
# -------------------------------------------------------------
@mcp_server.tool(name="create_task", description="Create a new task with title, description, priority, and optional due date.")
def create_task(title: str, description: str = "", priority: str = "medium", due_date: str = "", estimated_duration: int = 30, category: str = "General") -> Dict[str, Any]:
    db = SessionLocal()
    try:
        dt = datetime.fromisoformat(due_date.replace("Z", "")) if due_date else None
        task_in = TaskCreate(
            title=title,
            description=description,
            priority=priority,
            due_date=dt,
            estimated_duration=estimated_duration,
            category=category
        )
        task = TaskService.create_task(db, task_in)
        return {
            "id": task.id,
            "title": task.title,
            "status": task.status,
            "priority": task.priority,
            "due_date": task.due_date.isoformat() if task.due_date else None,
            "created": True
        }
    finally:
        db.close()

# -------------------------------------------------------------
# TOOL 3: update_task
# -------------------------------------------------------------
@mcp_server.tool(name="update_task", description="Update an existing task title, description, status, or priority.")
def update_task(task_id: int, title: str = "", description: str = "", status: str = "", priority: str = "") -> Dict[str, Any]:
    db = SessionLocal()
    try:
        update_data = {}
        if title: update_data["title"] = title
        if description: update_data["description"] = description
        if status: update_data["status"] = status
        if priority: update_data["priority"] = priority
        
        task_in = TaskUpdate(**update_data)
        updated = TaskService.update_task(db, task_id, task_in)
        if not updated:
            return {"error": f"Task {task_id} not found", "success": False}
        return {"id": updated.id, "title": updated.title, "status": updated.status, "priority": updated.priority, "success": True}
    finally:
        db.close()

# -------------------------------------------------------------
# TOOL 4: complete_task
# -------------------------------------------------------------
@mcp_server.tool(name="complete_task", description="Mark a task as completed in the database.")
def complete_task(task_id: int) -> Dict[str, Any]:
    db = SessionLocal()
    try:
        completed = TaskService.complete_task(db, task_id)
        if not completed:
            return {"error": f"Task {task_id} not found", "success": False}
        return {"id": completed.id, "title": completed.title, "status": "completed", "success": True}
    finally:
        db.close()

# -------------------------------------------------------------
# TOOL 5: get_calendar_events
# -------------------------------------------------------------
@mcp_server.tool(name="get_calendar_events", description="Retrieve internal calendar events within an optional date range.")
def get_calendar_events(start_date: str = "", end_date: str = "", event_type: str = "all") -> List[Dict[str, Any]]:
    db = SessionLocal()
    try:
        s_dt = datetime.fromisoformat(start_date.replace("Z", "")) if start_date else None
        e_dt = datetime.fromisoformat(end_date.replace("Z", "")) if end_date else None
        events = CalendarService.get_events(db, start_date=s_dt, end_date=e_dt, event_type=event_type)
        return [
            {
                "id": ev.id,
                "title": ev.title,
                "description": ev.description,
                "start_time": ev.start_time.isoformat(),
                "end_time": ev.end_time.isoformat(),
                "location": ev.location,
                "event_type": ev.event_type
            }
            for ev in events
        ]
    finally:
        db.close()

# -------------------------------------------------------------
# TOOL 6: find_free_time
# -------------------------------------------------------------
@mcp_server.tool(name="find_free_time", description="Find unconflicted free slots on a given date for requested duration.")
def find_free_time(target_date: str, duration_minutes: int = 120, window_start_hour: int = 8, window_end_hour: int = 22) -> Dict[str, Any]:
    db = SessionLocal()
    try:
        t_date = date.fromisoformat(target_date)
        res = CalendarService.find_free_time(
            db=db,
            target_date=t_date,
            duration_minutes=duration_minutes,
            window_start_hour=window_start_hour,
            window_end_hour=window_end_hour
        )
        # Format datetimes for JSON transport
        slots = []
        for s in res.get("available_slots", []):
            slots.append({
                "start_time": s["start_time"].isoformat(),
                "end_time": s["end_time"].isoformat(),
                "duration_minutes": s["duration_minutes"],
                "formatted_start": s["formatted_start"],
                "formatted_end": s["formatted_end"],
                "recommendation_note": s["recommendation_note"]
            })
        return {
            "requested_date": res["requested_date"],
            "requested_duration_minutes": res["requested_duration_minutes"],
            "busy_events_count": res["busy_events_count"],
            "available_slots": slots
        }
    finally:
        db.close()

# -------------------------------------------------------------
# TOOL 7: create_calendar_event
# -------------------------------------------------------------
@mcp_server.tool(name="create_calendar_event", description="Create an event in the internal calendar.")
def create_calendar_event(title: str, start_time: str, end_time: str, description: str = "", location: str = "Workspace", event_type: str = "study") -> Dict[str, Any]:
    db = SessionLocal()
    try:
        s_dt = datetime.fromisoformat(start_time.replace("Z", ""))
        e_dt = datetime.fromisoformat(end_time.replace("Z", ""))
        event_in = CalendarEventCreate(
            title=title,
            description=description,
            start_time=s_dt,
            end_time=e_dt,
            location=location,
            event_type=event_type
        )
        event = CalendarService.create_event(db, event_in)
        return {
            "id": event.id,
            "title": event.title,
            "start_time": event.start_time.isoformat(),
            "end_time": event.end_time.isoformat(),
            "created": True
        }
    finally:
        db.close()

# -------------------------------------------------------------
# TOOL 8: update_calendar_event
# -------------------------------------------------------------
@mcp_server.tool(name="update_calendar_event", description="Update an existing internal calendar event.")
def update_calendar_event(event_id: int, title: str = "", start_time: str = "", end_time: str = "", location: str = "") -> Dict[str, Any]:
    db = SessionLocal()
    try:
        update_data = {}
        if title: update_data["title"] = title
        if start_time: update_data["start_time"] = datetime.fromisoformat(start_time.replace("Z", ""))
        if end_time: update_data["end_time"] = datetime.fromisoformat(end_time.replace("Z", ""))
        if location: update_data["location"] = location
        
        event_in = CalendarEventUpdate(**update_data)
        updated = CalendarService.update_event(db, event_id, event_in)
        if not updated:
            return {"error": f"Event {event_id} not found", "success": False}
        return {"id": updated.id, "title": updated.title, "success": True}
    finally:
        db.close()

# -------------------------------------------------------------
# TOOL 9: search_notes
# -------------------------------------------------------------
@mcp_server.tool(name="search_notes", description="Search notes by query string or tag.")
def search_notes(query: str = "", tag: str = "all") -> List[Dict[str, Any]]:
    db = SessionLocal()
    try:
        notes = NoteService.get_notes(db, search=query, tag=tag)
        return [
            {
                "id": n.id,
                "title": n.title,
                "tags": n.tags,
                "content_preview": n.content[:150] + ("..." if len(n.content) > 150 else ""),
                "updated_at": n.updated_at.isoformat()
            }
            for n in notes
        ]
    finally:
        db.close()

# -------------------------------------------------------------
# TOOL 10: summarize_notes
# -------------------------------------------------------------
@mcp_server.tool(name="summarize_notes", description="Summarize a specific note and extract its focal points.")
def summarize_notes(note_id: int) -> Dict[str, Any]:
    db = SessionLocal()
    try:
        return NoteService.summarize_notes(db, note_id)
    finally:
        db.close()

# -------------------------------------------------------------
# TOOL 11: extract_tasks_from_notes
# -------------------------------------------------------------
@mcp_server.tool(name="extract_tasks_from_notes", description="Extract actionable tasks and checklist items from a note.")
def extract_tasks_from_notes(note_id: int) -> Dict[str, Any]:
    db = SessionLocal()
    try:
        return NoteService.extract_tasks_from_notes(db, note_id)
    finally:
        db.close()

# -------------------------------------------------------------
# TOOL 12: analyze_schedule
# -------------------------------------------------------------
@mcp_server.tool(name="analyze_schedule", description="Analyze overall schedule balance, task burden, and free-time density.")
def analyze_schedule(date_str: str = "") -> Dict[str, Any]:
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        t_date = date.fromisoformat(date_str) if date_str else now.date()
        
        # Pending tasks count and overdue count
        pending_count = TaskService.get_tasks(db, status="pending")
        overdue_count = [t for t in pending_count if t.due_date and t.due_date < now]
        
        # Events on this day
        events = CalendarService.get_events(
            db,
            start_date=datetime.combine(t_date, datetime.min.time()),
            end_date=datetime.combine(t_date, datetime.max.time())
        )
        
        busy_minutes = sum(int((e.end_time - e.start_time).total_seconds() / 60) for e in events)
        
        return {
            "date": t_date.isoformat(),
            "scheduled_events_count": len(events),
            "total_busy_minutes": busy_minutes,
            "total_busy_hours": round(busy_minutes / 60.0, 1),
            "pending_tasks_count": len(pending_count),
            "overdue_tasks_count": len(overdue_count),
            "density_status": "Heavy" if busy_minutes > 360 else ("Moderate" if busy_minutes > 180 else "Light"),
            "recommendation": "Ample free time available for deep study or project work." if busy_minutes < 240 else "Schedule is tight; prioritize high-urgency items."
        }
    finally:
        db.close()

# -------------------------------------------------------------
# TOOL 13: create_study_plan
# -------------------------------------------------------------
@mcp_server.tool(name="create_study_plan", description="Generate a conflict-free study session plan leading up to an exam.")
def create_study_plan(subject: str, exam_date: str, available_hours_per_day: float = 2.5, target_sessions: int = 4) -> Dict[str, Any]:
    db = SessionLocal()
    try:
        ex_dt = datetime.fromisoformat(exam_date.replace("Z", ""))
        req = StudyPlanRequest(
            subject=subject,
            exam_date=ex_dt,
            available_hours_per_day=available_hours_per_day,
            target_sessions_count=target_sessions
        )
        return StudyService.generate_study_plan(db, req)
    finally:
        db.close()

# -------------------------------------------------------------
# TOOL 14: prioritize_tasks
# -------------------------------------------------------------
@mcp_server.tool(name="prioritize_tasks", description="Compute transparent algorithmic priority scores for all active tasks.")
def prioritize_tasks() -> List[Dict[str, Any]]:
    db = SessionLocal()
    try:
        scored = TaskService.prioritize_tasks(db)
        return [
            {
                "task_id": it["task"].id,
                "title": it["task"].title,
                "priority": it["task"].priority,
                "urgency_score": it["urgency_score"],
                "reason": it["reason"],
                "due_date": it["task"].due_date.isoformat() if it["task"].due_date else None
            }
            for it in scored
        ]
    finally:
        db.close()
