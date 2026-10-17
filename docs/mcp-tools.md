# LifePilot AI — Official Model Context Protocol (MCP) Tools

## Specification Overview
- **Implementation**: Official Python MCP SDK (`mcp.server.mcpserver.MCPServer`)
- **Transport**: Streamable HTTP & Server-Sent Events (SSE)
- **Specification Version**: `2025-11-25`
- **Server Name**: `lifepilot-mcp`

All tools connect directly to the application's unified service and database layer. No fake or mock tool results are used.

---

## Tool Catalog (14 Tools)

### 1. `get_tasks`
- **Category**: Tasks
- **Description**: Retrieve tasks with optional filtering by status, priority, category or search query.
- **Safety**: Read-only
- **Parameters**:
  - `status` (string, optional): Filter by `pending`, `in_progress`, `completed`, `cancelled` or `all`.
  - `priority` (string, optional): Filter by `low`, `medium`, `high`, `urgent` or `all`.
  - `category` (string, optional): Filter by category name or `all`.
  - `search` (string, optional): Text keyword search.

### 2. `create_task`
- **Category**: Tasks
- **Description**: Create a new task with title, description, priority, and optional due date.
- **Safety**: Consequential mutation (Safe for immediate execution in task workspace)
- **Parameters**:
  - `title` (string, required): Task title.
  - `description` (string, optional): Task details.
  - `priority` (string, optional, default="medium"): Task priority.
  - `due_date` (string ISO, optional): Target deadline.
  - `estimated_duration` (integer, optional, default=30): Estimated minutes.
  - `category` (string, optional, default="General"): Categorical grouping.

### 3. `update_task`
- **Category**: Tasks
- **Description**: Update an existing task title, description, status, or priority.
- **Safety**: Consequential mutation
- **Parameters**:
  - `task_id` (integer, required): ID of the task to update.
  - `title` (string, optional): Updated title.
  - `status` (string, optional): Updated status.
  - `priority` (string, optional): Updated priority.

### 4. `complete_task`
- **Category**: Tasks
- **Description**: Mark a task as completed in the database.
- **Safety**: Consequential mutation
- **Parameters**:
  - `task_id` (integer, required): ID of the task to mark completed.

### 5. `get_calendar_events`
- **Category**: Calendar
- **Description**: Retrieve internal calendar events within an optional date range.
- **Safety**: Read-only
- **Parameters**:
  - `start_date` (string ISO, optional): Start of time range.
  - `end_date` (string ISO, optional): End of time range.
  - `event_type` (string, optional): Filter by event type or `all`.

### 6. `find_free_time`
- **Category**: Calendar
- **Description**: Find unconflicted free slots on a given date for requested duration.
- **Safety**: Read-only
- **Parameters**:
  - `target_date` (string YYYY-MM-DD, required): Target date to search.
  - `duration_minutes` (integer, optional, default=120): Minimum duration in minutes.
  - `window_start_hour` (integer, optional, default=8): Earliest acceptable hour (0-23).
  - `window_end_hour` (integer, optional, default=22): Latest acceptable hour (0-24).

### 7. `create_calendar_event`
- **Category**: Calendar
- **Description**: Create an event in the internal calendar.
- **Safety**: Consequential mutation — **Requires User Approval**
- **Parameters**:
  - `title` (string, required): Event title.
  - `start_time` (string ISO, required): Start datetime.
  - `end_time` (string ISO, required): End datetime.
  - `description` (string, optional): Event description.
  - `location` (string, optional, default="Workspace"): Event location.
  - `event_type` (string, optional, default="study"): Type (`study`, `project`, `lecture`, `meeting`, `personal`).

### 8. `update_calendar_event`
- **Category**: Calendar
- **Description**: Update an existing internal calendar event.
- **Safety**: Consequential mutation — **Requires User Approval**
- **Parameters**:
  - `event_id` (integer, required): ID of the event.
  - `title` (string, optional): Updated title.
  - `start_time` (string ISO, optional): Updated start time.
  - `end_time` (string ISO, optional): Updated end time.
  - `location` (string, optional): Updated location.

### 9. `search_notes`
- **Category**: Notes
- **Description**: Search notes by query string or tag.
- **Safety**: Read-only
- **Parameters**:
  - `query` (string, optional): Search keyword.
  - `tag` (string, optional): Tag filter.

### 10. `summarize_notes`
- **Category**: Notes
- **Description**: Summarize a specific note and extract its focal points.
- **Safety**: Read-only
- **Parameters**:
  - `note_id` (integer, required): ID of the note.

### 11. `extract_tasks_from_notes`
- **Category**: Notes
- **Description**: Extract actionable tasks and checklist items from a note.
- **Safety**: Read-only (Importing tasks requires user approval)
- **Parameters**:
  - `note_id` (integer, required): ID of the note to parse.

### 12. `analyze_schedule`
- **Category**: Analytics
- **Description**: Analyze overall schedule balance, task burden, and free-time density.
- **Safety**: Read-only
- **Parameters**:
  - `date_str` (string YYYY-MM-DD, optional): Target date.

### 13. `create_study_plan`
- **Category**: Study
- **Description**: Generate a conflict-free study session plan leading up to an exam.
- **Safety**: Consequential mutation — **Requires User Approval prior to calendar persistence**
- **Parameters**:
  - `subject` (string, required): Exam course subject.
  - `exam_date` (string ISO, required): Target examination date.
  - `available_hours_per_day` (float, optional, default=2.5): Study capacity.
  - `target_sessions` (integer, optional, default=4): Desired number of sessions.

### 14. `prioritize_tasks`
- **Category**: Analytics
- **Description**: Compute transparent algorithmic priority scores for all active tasks.
- **Safety**: Read-only
- **Parameters**: None
