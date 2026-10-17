# LifePilot AI — Testing & Verification Guide

This document details the automated test suites, execution commands, and verified results for LifePilot AI.

---

## 1. Automated Test Execution

### 1.1 Backend Pytest Suite
Run the full pytest suite with verbose output:
```bash
# From workspace root:
.\venv\Scripts\python -m pytest backend/tests -v
```

### 1.2 Frontend Type Checking & Production Build
Run TypeScript type-checking and Vite bundling:
```bash
# Inside frontend directory:
cd frontend
npm run build
```

---

## 2. Test Suite Breakdown

### 2.1 Backend Tests (`backend/tests/`)

| Test File | Target Module | Description | Status |
| :--- | :--- | :--- | :--- |
| `test_health.py` | Core API | Validates `/health` status, metadata, and `/` root endpoint. | **PASSED** |
| `test_tasks.py` | Task Management | Full CRUD lifecycle, completion toggle, priority sorting, and 404 deletion verification. | **PASSED** |
| `test_calendar.py` | Calendar Service | CRUD lifecycle, overlap checking, and free-time gap calculation. | **PASSED** |
| `test_notes.py` | Notes & Knowledge | CRUD, content summarization, and checklist task extraction (`[ ]`). | **PASSED** |
| `test_study_planner.py` | Study Planner | Multi-session generation leading up to exam date without calendar conflict. | **PASSED** |
| `test_approvals.py` | Safety & Idempotency | Tests approval execution, persistence verification, duplicate execution prevention, and cancellation. | **PASSED** |
| `test_agent_workflows.py` | Agent Orchestrator | Tests end-to-end Workflows A, B, and C with live database records. | **PASSED** |
| `test_mcp_tools.py` | MCP Server | Validates tool schemas, health endpoint, and direct invocation of all tools. | **PASSED** |

**Summary**: 14/14 automated tests passing.

---

## 3. Workflow End-to-End Verification

### Workflow A: Task Prioritization
- **Input**: `"Show my pending tasks and prioritize them."`
- **Verified Result**: Reads live tasks from DB, computes urgency scores using deadline proximity + priority multiplier + duration bonus, returns transparent reasoning.

### Workflow B: Find Free Time & Human Approval
- **Input**: `"Find two free hours tomorrow for project work."`
- **Verified Result**: Scans tomorrow's calendar, finds continuous 2-hour opening, stages an `Approval` record with `awaiting_approval` status, requires human confirmation, executes insertion, and verifies the created event in the database.

### Workflow C: Exam Study Plan
- **Input**: `"Plan my week around my exams."`
- **Verified Result**: Analyzes days until exam, proposes balanced study blocks in calendar free slots, requires approval, and bulk-persists verified study events upon user approval.

---

## 4. Approval Idempotency Test Verification
Repeated clicks or retried requests on `/api/approvals/{id}/approve` return the cached execution result and do NOT create duplicate calendar events. Verified by `test_approval_lifecycle_and_idempotency`.
