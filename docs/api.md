# LifePilot AI — REST API Documentation

Base URL: `http://localhost:8000/api`

---

## 1. System Health & Metadata

### `GET /health`
Returns system operational status, version, and active AI provider.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "service": "lifepilot-ai-backend",
  "version": "1.0.0",
  "ai_provider": "demo",
  "timestamp": "2026-10-17T12:00:00Z"
}
```

---

## 2. Tasks API

### `GET /api/tasks`
Lists tasks with optional filtering and sorting.
- Query Parameters: `status`, `priority`, `category`, `search`, `sort_by` (`due_date`, `priority`, `created_at`)

### `GET /api/tasks/prioritized`
Computes multi-factor urgency scores for active tasks based on due date proximity, priority weights, and quick-win duration metrics.

### `POST /api/tasks`
Creates a task in the database.
```json
{
  "title": "Finalize Alexa+ Sprint",
  "description": "Integration testing",
  "priority": "urgent",
  "due_date": "2026-10-18T18:00:00Z",
  "estimated_duration": 60,
  "category": "Project"
}
```

### `PATCH /api/tasks/{task_id}`
Updates task fields.

### `POST /api/tasks/{task_id}/complete`
Marks task as completed.

### `POST /api/tasks/{task_id}/reopen`
Reopens a completed task.

### `DELETE /api/tasks/{task_id}`
Deletes task permanently from the database.

---

## 3. Calendar & Free-Time API

### `GET /api/calendar/events`
Lists calendar events with optional date range and event_type filters.

### `POST /api/calendar/events`
Creates a calendar event.

### `POST /api/calendar/find-free-time`
Analyzes internal events on a target date and discovers continuous unconflicted openings.
```json
{
  "date": "2026-10-18",
  "duration_minutes": 120,
  "window_start_hour": 8,
  "window_end_hour": 22
}
```
**Response (200 OK):**
```json
{
  "requested_date": "2026-10-18",
  "requested_duration_minutes": 120,
  "busy_events_count": 3,
  "available_slots": [
    {
      "start_time": "2026-10-18T12:30:00",
      "end_time": "2026-10-18T14:30:00",
      "duration_minutes": 120,
      "formatted_start": "12:30 PM",
      "formatted_end": "02:30 PM",
      "recommendation_note": "Clear 180m block available (proposing 120m)"
    }
  ]
}
```

---

## 4. Notes & Knowledge Hub API

### `GET /api/notes`
Lists saved notes with optional search query and tag filter.

### `POST /api/notes`
Creates a new note.

### `GET /api/notes/{note_id}/summarize`
Synthesizes focal points and key takeaways from a note.

### `POST /api/notes/{note_id}/extract-tasks`
Parses checklist items (`[ ]`), bullet points, and action verbs into structured task candidates.

---

## 5. Study Planner API

### `POST /api/study-planner/generate-plan`
Generates a multi-session, conflict-free study plan leading up to an exam.
```json
{
  "subject": "Calculus II",
  "exam_date": "2026-10-23T14:00:00Z",
  "available_hours_per_day": 2.5,
  "target_sessions_count": 4
}
```

---

## 6. AI Assistant & Chat API

### `POST /api/chat`
Ingests natural language instruction, executes 11-step agent pipeline, selects tools, checks approvals, and returns conversational response with structured telemetry.
```json
{
  "message": "Find two free hours tomorrow for project work.",
  "conversation_id": "conv_abc123",
  "voice_input": false
}
```

### `GET /api/conversations`
Returns conversation history list.

---

## 7. Approvals & Safety API

### `GET /api/approvals`
Lists pending and historical approvals.

### `POST /api/approvals/{approval_id}/approve`
Executes approved consequential action idempotently and verifies record persistence.

### `POST /api/approvals/{approval_id}/cancel`
Cancels pending action without mutating database; preserves audit trail.

---

## 8. Connected Tools & MCP API

### `GET /api/tools`
Returns metadata and parameter schemas for all 14 official MCP tools.

### `GET /api/tools/health`
Returns MCP health diagnostic report.

### `POST /api/tools/execute/{tool_name}`
Direct execution endpoint for inspecting tool execution outputs.
