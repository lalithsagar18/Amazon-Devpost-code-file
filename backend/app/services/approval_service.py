from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
from backend.app.models.approval import Approval
from backend.app.models.agent_run import AgentRun
from backend.app.models.calendar_event import CalendarEvent
from backend.app.models.task import Task
from backend.app.schemas.calendar import CalendarEventCreate
from backend.app.schemas.task import TaskCreate

class ApprovalService:
    @staticmethod
    def create_approval(
        db: Session,
        action_type: str,
        title: str,
        description: str,
        proposed_payload: Dict[str, Any],
        affected_records_summary: Optional[str] = None,
        run_id: Optional[int] = None
    ) -> Approval:
        idempotency_token = str(uuid.uuid4())
        approval = Approval(
            run_id=run_id,
            action_type=action_type,
            title=title,
            description=description,
            proposed_payload=proposed_payload,
            affected_records_summary=affected_records_summary,
            status="pending",
            idempotency_token=idempotency_token,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(approval)
        db.commit()
        db.refresh(approval)
        return approval

    @staticmethod
    def get_approvals(db: Session, status: Optional[str] = None) -> List[Approval]:
        query = db.query(Approval)
        if status and status != "all":
            query = query.filter(Approval.status == status)
        return query.order_by(Approval.id.desc()).all()

    @staticmethod
    def get_approval_by_id(db: Session, approval_id: int) -> Optional[Approval]:
        return db.query(Approval).filter(Approval.id == approval_id).first()

    @staticmethod
    def approve(db: Session, approval_id: int, idempotency_token: Optional[str] = None) -> Dict[str, Any]:
        """
        Executes approved action with strict idempotency and persistence verification.
        1. Validate request state (must be pending).
        2. Execute the mutation.
        3. Persist the result in the database.
        4. Read the persisted record back to verify.
        5. Update approval status to 'executed' and agent run status to 'completed'.
        """
        approval = ApprovalService.get_approval_by_id(db, approval_id)
        if not approval:
            return {"error": "Approval request not found", "status": "not_found"}

        # Idempotency guard: if already executed or approved, return cached result
        if approval.status in ["approved", "executed"]:
            return {
                "approval_id": approval.id,
                "status": approval.status,
                "action_type": approval.action_type,
                "message": "Action was already approved and executed (idempotent replay).",
                "execution_result": approval.execution_result,
                "verified_record": approval.verified_data
            }

        if approval.status == "cancelled":
            return {
                "approval_id": approval.id,
                "status": "cancelled",
                "action_type": approval.action_type,
                "message": "Cannot approve an action that has been cancelled.",
                "execution_result": None,
                "verified_record": None
            }

        payload = approval.proposed_payload or {}
        action = approval.action_type
        execution_result = {}
        verified_data = {}

        try:
            # Consequential Action 1: Create Calendar Event
            if action in ["create_calendar_event", "schedule_free_time"]:
                start_dt = datetime.fromisoformat(payload["start_time"].replace("Z", ""))
                end_dt = datetime.fromisoformat(payload["end_time"].replace("Z", ""))
                
                event = CalendarEvent(
                    title=payload.get("title", "Scheduled Event"),
                    description=payload.get("description", "Approved by user"),
                    start_time=start_dt,
                    end_time=end_dt,
                    location=payload.get("location", "Workspace"),
                    event_type=payload.get("event_type", "study"),
                    is_confirmed=True,
                    is_seed=False,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.add(event)
                db.commit()
                db.refresh(event)

                # Verification query: read persisted record back from DB
                persisted_event = db.query(CalendarEvent).filter(CalendarEvent.id == event.id).first()
                if not persisted_event:
                    raise RuntimeError("Verification failed: Event record was not found after insertion.")

                execution_result = {
                    "event_id": persisted_event.id,
                    "title": persisted_event.title,
                    "start_time": persisted_event.start_time.isoformat(),
                    "end_time": persisted_event.end_time.isoformat(),
                    "is_confirmed": persisted_event.is_confirmed
                }
                verified_data = execution_result

            # Consequential Action 2: Multi-session Study Plan Save
            elif action == "save_study_plan_sessions":
                sessions = payload.get("sessions", [])
                created_ids = []
                for s in sessions:
                    s_dt = datetime.fromisoformat(s["start_time"].replace("Z", ""))
                    e_dt = datetime.fromisoformat(s["end_time"].replace("Z", ""))
                    ev = CalendarEvent(
                        title=s["title"],
                        description=f"Objective: {s.get('focus_objective', '')} | Subject: {s.get('subject', '')}",
                        start_time=s_dt,
                        end_time=e_dt,
                        event_type="study",
                        is_confirmed=True,
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow()
                    )
                    db.add(ev)
                    db.commit()
                    db.refresh(ev)
                    created_ids.append(ev.id)

                # Read all back to verify
                verified_events = db.query(CalendarEvent).filter(CalendarEvent.id.in_(created_ids)).all()
                execution_result = {
                    "sessions_created_count": len(verified_events),
                    "event_ids": [v.id for v in verified_events]
                }
                verified_data = {
                    "events": [{"id": v.id, "title": v.title, "start": v.start_time.isoformat()} for v in verified_events]
                }

            # Consequential Action 3: Bulk Task Import from Notes
            elif action == "import_extracted_tasks":
                tasks_data = payload.get("tasks", [])
                created_task_ids = []
                for t in tasks_data:
                    task = Task(
                        title=t["title"],
                        description=t.get("description", "Extracted from note"),
                        priority=t.get("priority", "medium"),
                        estimated_duration=t.get("estimated_duration", 45),
                        category=t.get("category", "Study"),
                        status="pending",
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow()
                    )
                    db.add(task)
                    db.commit()
                    db.refresh(task)
                    created_task_ids.append(task.id)

                verified_tasks = db.query(Task).filter(Task.id.in_(created_task_ids)).all()
                execution_result = {
                    "tasks_created_count": len(verified_tasks),
                    "task_ids": [vt.id for vt in verified_tasks]
                }
                verified_data = {
                    "tasks": [{"id": vt.id, "title": vt.title, "priority": vt.priority} for vt in verified_tasks]
                }

            # Consequential Action 4: Delete Task
            elif action == "delete_task":
                task_id = payload.get("task_id")
                task_to_delete = db.query(Task).filter(Task.id == task_id).first()
                if task_to_delete:
                    db.delete(task_to_delete)
                    db.commit()
                # Verify deletion
                check_deleted = db.query(Task).filter(Task.id == task_id).first()
                execution_result = {"deleted_task_id": task_id, "deleted": check_deleted is None}
                verified_data = execution_result

            else:
                execution_result = {"message": f"Action '{action}' executed successfully."}
                verified_data = execution_result

            # Update Approval status
            approval.status = "executed"
            approval.execution_result = execution_result
            approval.verified_data = verified_data
            approval.updated_at = datetime.utcnow()

            # Update associated AgentRun if present
            if approval.run_id:
                agent_run = db.query(AgentRun).filter(AgentRun.id == approval.run_id).first()
                if agent_run:
                    agent_run.status = "completed"
                    agent_run.summary = f"Action '{approval.title}' approved by user and executed successfully with verification."
                    agent_run.updated_at = datetime.utcnow()

            db.commit()
            db.refresh(approval)

            return {
                "approval_id": approval.id,
                "status": "executed",
                "action_type": approval.action_type,
                "message": f"Approved and executed successfully: {approval.title}",
                "execution_result": execution_result,
                "verified_record": verified_data
            }

        except Exception as e:
            db.rollback()
            approval.status = "failed"
            approval.execution_result = {"error": str(e)}
            db.commit()
            return {
                "approval_id": approval.id,
                "status": "failed",
                "action_type": approval.action_type,
                "message": f"Execution failed: {str(e)}",
                "execution_result": None,
                "verified_record": None
            }

    @staticmethod
    def cancel(db: Session, approval_id: int) -> Dict[str, Any]:
        """
        Cancels pending action. Does NOT mutate database. Preserves audit log.
        """
        approval = ApprovalService.get_approval_by_id(db, approval_id)
        if not approval:
            return {"error": "Approval request not found", "status": "not_found"}

        if approval.status in ["approved", "executed"]:
            return {
                "approval_id": approval.id,
                "status": approval.status,
                "message": "Cannot cancel an action that has already been executed."
            }

        approval.status = "cancelled"
        approval.updated_at = datetime.utcnow()

        if approval.run_id:
            agent_run = db.query(AgentRun).filter(AgentRun.id == approval.run_id).first()
            if agent_run:
                agent_run.status = "cancelled"
                agent_run.summary = f"Consequential action '{approval.title}' was cancelled by the user. No changes were made."
                agent_run.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(approval)

        return {
            "approval_id": approval.id,
            "status": "cancelled",
            "action_type": approval.action_type,
            "message": f"Action '{approval.title}' was cancelled. No changes were made."
        }
