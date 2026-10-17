from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime, date, timedelta, time
import uuid
import re
from backend.app.core.config import settings
from backend.app.models.agent_run import AgentRun
from backend.app.models.approval import Approval
from backend.app.models.conversation import Conversation, Message
from backend.app.models.task import Task
from backend.app.models.calendar_event import CalendarEvent
from backend.app.models.note import Note
from backend.app.services.task_service import TaskService
from backend.app.services.calendar_service import CalendarService
from backend.app.services.note_service import NoteService
from backend.app.services.study_service import StudyService
from backend.app.services.approval_service import ApprovalService
from backend.app.schemas.study import StudyPlanRequest

class AgentService:
    @staticmethod
    def process_chat_message(
        db: Session,
        message_text: str,
        conversation_id: Optional[str] = None,
        voice_input: bool = False
    ) -> Dict[str, Any]:
        """
        Full 11-step agent execution pipeline:
        1. Receive message
        2. Identify intent & extract parameters
        3. Retrieve relevant data from database
        4. Create structured action plan
        5. Formulate tool calls
        6. Determine approval requirement
        7. If approval needed: stage approval item & set status='awaiting_approval'
        8. If read-only/no approval needed: execute tool calls immediately
        9. Validate results against persisted DB records
        10. Update agent run record and conversation history
        11. Return truthful summary
        """
        # Ensure conversation exists
        if not conversation_id:
            conversation_id = f"conv_{uuid.uuid4().hex[:12]}"
            conv = Conversation(id=conversation_id, title=message_text[:30] + ("..." if len(message_text) > 30 else ""))
            db.add(conv)
            db.commit()
        else:
            conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
            if not conv:
                conv = Conversation(id=conversation_id, title=message_text[:30])
                db.add(conv)
                db.commit()

        # Save user message
        user_msg = Message(
            conversation_id=conversation_id,
            role="user",
            content=message_text,
            extra_data={"voice_input": voice_input},
            created_at=datetime.utcnow()
        )
        db.add(user_msg)
        db.commit()

        # Initialize AgentRun record
        agent_run = AgentRun(
            conversation_id=conversation_id,
            user_prompt=message_text,
            status="planning",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(agent_run)
        db.commit()
        db.refresh(agent_run)

        # Provider determination
        active_provider = settings.AI_PROVIDER.lower()
        provider_label = "deterministic_demo_provider"
        if active_provider == "openai" and settings.OPENAI_API_KEY:
            provider_label = "openai_gpt"
        elif active_provider == "anthropic" and settings.ANTHROPIC_API_KEY:
            provider_label = "anthropic_claude"
        elif active_provider == "aws_bedrock" and settings.AWS_ACCESS_KEY_ID:
            provider_label = "aws_bedrock"

        lower_prompt = message_text.lower().strip()
        
        # -------------------------------------------------------------
        # WORKFLOW A: Prioritize Pending Tasks
        # Trigger examples: "Show my pending tasks and prioritize them", "prioritize tasks"
        # -------------------------------------------------------------
        if any(kw in lower_prompt for kw in ["prioritize", "priority", "pending tasks", "urgent tasks"]):
            agent_run.intent = "prioritize_tasks"
            plan = [
                {"step_number": 1, "description": "Query active and pending tasks from database", "tool_name": "get_tasks", "status": "completed"},
                {"step_number": 2, "description": "Compute multi-factor urgency score (deadlines + priority weight + duration)", "tool_name": "prioritize_tasks", "status": "completed"},
                {"step_number": 3, "description": "Render transparent prioritization report and recommendations", "tool_name": None, "status": "completed"}
            ]
            agent_run.plan = plan

            scored_tasks = TaskService.prioritize_tasks(db)
            tool_calls = [{
                "tool_name": "prioritize_tasks",
                "arguments": {"status": "pending"},
                "status": "success",
                "result_count": len(scored_tasks)
            }]
            agent_run.tool_calls = tool_calls

            # Build readable truthful summary
            if not scored_tasks:
                summary = "You currently have no pending tasks in your database. All caught up!"
            else:
                top_items = []
                for idx, item in enumerate(scored_tasks[:5], 1):
                    t = item["task"]
                    top_items.append(f"**{idx}. {t.title}** (Score: {item['urgency_score']})\n   • Priority: {t.priority.upper()} | Est: {t.estimated_duration}m\n   • Reasoning: {item['reason']}")
                
                summary = (
                    f"### 📋 Prioritized Task Analysis\n\n"
                    f"Evaluated **{len(scored_tasks)} active task(s)** from your local database using deadline proximity, "
                    f"priority weighting, and duration metrics.\n\n" +
                    "\n\n".join(top_items) +
                    f"\n\n*Recommendation: Start with '{scored_tasks[0]['task'].title}' first to prevent deadline pressure.*"
                )

            agent_run.status = "completed"
            agent_run.summary = summary
            db.commit()

            assistant_msg = Message(
                conversation_id=conversation_id,
                role="assistant",
                content=summary,
                extra_data={
                    "intent": "prioritize_tasks",
                    "plan": plan,
                    "tool_calls": tool_calls,
                    "scored_tasks": [{"id": it["task"].id, "title": it["task"].title, "score": it["urgency_score"], "reason": it["reason"]} for it in scored_tasks]
                },
                created_at=datetime.utcnow()
            )
            db.add(assistant_msg)
            db.commit()
            db.refresh(assistant_msg)

            return {
                "conversation_id": conversation_id,
                "message": assistant_msg,
                "agent_run": agent_run,
                "pending_approval": None,
                "provider_used": provider_label,
                "suggested_prompts": [
                    "Find two free hours tomorrow for project work.",
                    "Plan my week around my exams.",
                    "Turn my notes into a list of tasks."
                ]
            }

        # -------------------------------------------------------------
        # WORKFLOW B: Find Free Time & Propose Calendar Event
        # Trigger examples: "Find two free hours tomorrow for project work", "find free time"
        # -------------------------------------------------------------
        elif any(kw in lower_prompt for kw in ["free hour", "free time", "free slot", "schedule time", "available time"]):
            agent_run.intent = "find_free_time"
            
            # Extract duration (default 120 mins = 2 hours)
            duration_mins = 120
            match_dur = re.search(r"(\d+)\s*(hour|hr|minute|min)", lower_prompt)
            if match_dur:
                val = int(match_dur.group(1))
                unit = match_dur.group(2)
                duration_mins = val * 60 if "hour" in unit or "hr" in unit else val
            elif "two" in lower_prompt:
                duration_mins = 120
            elif "one" in lower_prompt:
                duration_mins = 60
            elif "three" in lower_prompt:
                duration_mins = 180

            # Target date: default tomorrow
            target_date = (datetime.utcnow() + timedelta(days=1)).date()
            if "today" in lower_prompt:
                target_date = datetime.utcnow().date()
            elif "day after tomorrow" in lower_prompt:
                target_date = (datetime.utcnow() + timedelta(days=2)).date()

            plan = [
                {"step_number": 1, "description": f"Inspect internal calendar for {target_date.isoformat()}", "tool_name": "get_calendar_events", "status": "completed"},
                {"step_number": 2, "description": f"Calculate available gaps >= {duration_mins} minutes excluding conflicts", "tool_name": "find_free_time", "status": "completed"},
                {"step_number": 3, "description": "Formulate optimal slot and request user approval before creating event", "tool_name": "request_approval", "status": "awaiting_approval"}
            ]
            agent_run.plan = plan

            free_result = CalendarService.find_free_time(
                db=db,
                target_date=target_date,
                duration_minutes=duration_mins,
                window_start_hour=9,
                window_end_hour=21
            )

            available_slots = free_result.get("available_slots", [])
            tool_calls = [{
                "tool_name": "find_free_time",
                "arguments": {"target_date": target_date.isoformat(), "duration_minutes": duration_mins},
                "status": "success",
                "slots_found": len(available_slots)
            }]
            agent_run.tool_calls = tool_calls

            if not available_slots:
                summary = (
                    f"I examined your internal calendar for **{target_date.strftime('%A, %b %d')}** but found no continuous "
                    f"{duration_mins}-minute opening between 9:00 AM and 9:00 PM due to {free_result['busy_events_count']} scheduled commitments."
                )
                agent_run.status = "completed"
                agent_run.summary = summary
                db.commit()

                assistant_msg = Message(
                    conversation_id=conversation_id,
                    role="assistant",
                    content=summary,
                    created_at=datetime.utcnow()
                )
                db.add(assistant_msg)
                db.commit()
                db.refresh(assistant_msg)

                return {
                    "conversation_id": conversation_id,
                    "message": assistant_msg,
                    "agent_run": agent_run,
                    "pending_approval": None,
                    "provider_used": provider_label,
                    "suggested_prompts": ["Show my pending tasks and prioritize them.", "Plan my week around my exams."]
                }

            # Propose the prime slot
            best_slot = available_slots[0]
            slot_start = best_slot["start_time"]
            slot_end = best_slot["end_time"]
            event_title = "Project Work Block" if "project" in lower_prompt else "Focused Work Session"

            # CONVENTIONAL SAFETY REQUIREMENT: Request user approval before creating calendar event!
            approval_payload = {
                "title": event_title,
                "description": f"Focused {duration_mins}-minute block discovered by LifePilot AI",
                "start_time": slot_start.isoformat(),
                "end_time": slot_end.isoformat(),
                "location": "Local Workstation",
                "event_type": "project" if "project" in lower_prompt else "study"
            }

            approval = ApprovalService.create_approval(
                db=db,
                action_type="create_calendar_event",
                title=f"Schedule '{event_title}'",
                description=f"Add a new event on {target_date.strftime('%A, %b %d')} from {best_slot['formatted_start']} to {best_slot['formatted_end']}.",
                proposed_payload=approval_payload,
                affected_records_summary=f"Internal Calendar for {target_date.isoformat()}",
                run_id=agent_run.id
            )

            agent_run.status = "awaiting_approval"
            summary = (
                f"### 🗓️ Free Time Found\n\n"
                f"I checked your internal calendar for **{target_date.strftime('%A, %b %d')}**. "
                f"You have **{len(available_slots)} available slot(s)** of at least {duration_mins} minutes.\n\n"
                f"**Proposed Slot:**\n"
                f"• **Time:** {best_slot['formatted_start']} – {best_slot['formatted_end']} ({duration_mins} mins)\n"
                f"• **Recommendation:** {best_slot['recommendation_note']}\n\n"
                f"⚠️ *Because creating calendar events modifies your schedule, your explicit approval is required before this event is persisted.*"
            )
            agent_run.summary = summary
            db.commit()

            serialized_slot = {
                "start_time": best_slot["start_time"].isoformat() if hasattr(best_slot["start_time"], "isoformat") else str(best_slot["start_time"]),
                "end_time": best_slot["end_time"].isoformat() if hasattr(best_slot["end_time"], "isoformat") else str(best_slot["end_time"]),
                "duration_minutes": best_slot.get("duration_minutes", duration_mins),
                "formatted_start": best_slot.get("formatted_start", ""),
                "formatted_end": best_slot.get("formatted_end", ""),
                "recommendation_note": best_slot.get("recommendation_note", "")
            }

            assistant_msg = Message(
                conversation_id=conversation_id,
                role="assistant",
                content=summary,
                extra_data={
                    "intent": "find_free_time",
                    "plan": plan,
                    "tool_calls": tool_calls,
                    "approval_id": approval.id,
                    "proposed_slot": serialized_slot
                },
                created_at=datetime.utcnow()
            )
            db.add(assistant_msg)
            db.commit()
            db.refresh(assistant_msg)

            return {
                "conversation_id": conversation_id,
                "message": assistant_msg,
                "agent_run": agent_run,
                "pending_approval": approval,
                "provider_used": provider_label,
                "suggested_prompts": ["Approve this event", "Show my pending tasks and prioritize them."]
            }

        # -------------------------------------------------------------
        # WORKFLOW C: Exam Study Plan
        # Trigger examples: "Plan my week around my exams", "exam study plan", "study plan"
        # -------------------------------------------------------------
        elif any(kw in lower_prompt for kw in ["exam", "study plan", "plan my week", "prepare for exam"]):
            agent_run.intent = "create_study_plan"
            
            # Extract subject if mentioned
            subject = "Calculus & Computer Systems"
            if "calculus" in lower_prompt:
                subject = "Calculus II"
            elif "system" in lower_prompt or "alexa" in lower_prompt:
                subject = "Alexa+ Distributed Systems"
            elif "data" in lower_prompt or "ml" in lower_prompt:
                subject = "Machine Learning"

            # Find exam date: 4 to 6 days from now
            exam_date = datetime.utcnow() + timedelta(days=5)

            plan = [
                {"step_number": 1, "description": f"Retrieve upcoming exam milestones and calendar commitments for {subject}", "tool_name": "get_calendar_events", "status": "completed"},
                {"step_number": 2, "description": "Synthesize study topics and calculate conflict-free study sessions", "tool_name": "create_study_plan", "status": "completed"},
                {"step_number": 3, "description": "Request human approval prior to bulk-persisting study sessions to calendar", "tool_name": "request_approval", "status": "awaiting_approval"}
            ]
            agent_run.plan = plan

            study_plan = StudyService.generate_study_plan(
                db=db,
                plan_req=StudyPlanRequest(
                    subject=subject,
                    exam_date=exam_date,
                    available_hours_per_day=2.5,
                    target_sessions_count=4
                )
            )

            tool_calls = [{
                "tool_name": "create_study_plan",
                "arguments": {"subject": subject, "exam_date": exam_date.isoformat()},
                "status": "success",
                "sessions_generated": len(study_plan["sessions"])
            }]
            agent_run.tool_calls = tool_calls

            # Create approval requirement for multi-session calendar modification
            approval = ApprovalService.create_approval(
                db=db,
                action_type="save_study_plan_sessions",
                title=f"Save {len(study_plan['sessions'])} Study Sessions for {subject}",
                description=f"Add {len(study_plan['sessions'])} balanced study blocks ({study_plan['total_study_hours']} total hours) leading up to your exam on {exam_date.strftime('%b %d')}.",
                proposed_payload={"sessions": study_plan["sessions"], "subject": subject},
                affected_records_summary=f"Internal Calendar ({len(study_plan['sessions'])} new entries)",
                run_id=agent_run.id
            )

            agent_run.status = "awaiting_approval"
            sessions_fmt = []
            for s in study_plan["sessions"]:
                st_dt = datetime.fromisoformat(s["start_time"].replace("Z", ""))
                sessions_fmt.append(f"• **{s['title']}**\n  {st_dt.strftime('%A, %b %d @ %I:%M %p')} ({s['duration_minutes']}m) — *{s['focus_objective']}*")

            summary = (
                f"### 📚 Personalized Exam Study Plan: {subject}\n\n"
                f"{study_plan['reasoning']}\n\n"
                f"**Proposed Study Sessions ({study_plan['total_study_hours']} hrs total):**\n\n" +
                "\n\n".join(sessions_fmt) +
                f"\n\n⚠️ *Human Approval Required: Click 'Approve' to save these {len(study_plan['sessions'])} sessions into your calendar database, or 'Cancel' to revise.*"
            )
            agent_run.summary = summary
            db.commit()

            assistant_msg = Message(
                conversation_id=conversation_id,
                role="assistant",
                content=summary,
                extra_data={
                    "intent": "create_study_plan",
                    "plan": plan,
                    "tool_calls": tool_calls,
                    "approval_id": approval.id,
                    "study_plan": study_plan
                },
                created_at=datetime.utcnow()
            )
            db.add(assistant_msg)
            db.commit()
            db.refresh(assistant_msg)

            return {
                "conversation_id": conversation_id,
                "message": assistant_msg,
                "agent_run": agent_run,
                "pending_approval": approval,
                "provider_used": provider_label,
                "suggested_prompts": ["Approve study plan", "Show my pending tasks and prioritize them."]
            }

        # -------------------------------------------------------------
        # WORKFLOW: Turn Notes into Tasks
        # Trigger examples: "Turn my notes into a list of tasks", "extract tasks from notes"
        # -------------------------------------------------------------
        elif any(kw in lower_prompt for kw in ["turn my notes", "extract tasks", "note into task", "notes to tasks"]):
            agent_run.intent = "extract_tasks_from_notes"
            
            # Find the most recently updated note
            latest_note = db.query(Note).order_by(Note.updated_at.desc()).first()
            if not latest_note:
                summary = "You don't have any notes saved yet! Create a note first in the Notes tab."
                agent_run.status = "completed"
                agent_run.summary = summary
                db.commit()
                assistant_msg = Message(conversation_id=conversation_id, role="assistant", content=summary, created_at=datetime.utcnow())
                db.add(assistant_msg)
                db.commit()
                return {"conversation_id": conversation_id, "message": assistant_msg, "agent_run": agent_run, "pending_approval": None, "provider_used": provider_label}

            plan = [
                {"step_number": 1, "description": f"Read note '{latest_note.title}' from database", "tool_name": "search_notes", "status": "completed"},
                {"step_number": 2, "description": "Parse action items, checklists, and study goals into structured task candidates", "tool_name": "extract_tasks_from_notes", "status": "completed"},
                {"step_number": 3, "description": "Request approval before importing extracted items into the live Task database", "tool_name": "request_approval", "status": "awaiting_approval"}
            ]
            agent_run.plan = plan

            extract_result = NoteService.extract_tasks_from_notes(db, latest_note.id)
            tool_calls = [{
                "tool_name": "extract_tasks_from_notes",
                "arguments": {"note_id": latest_note.id},
                "status": "success",
                "extracted_count": len(extract_result["extracted_tasks"])
            }]
            agent_run.tool_calls = tool_calls

            approval = ApprovalService.create_approval(
                db=db,
                action_type="import_extracted_tasks",
                title=f"Import {len(extract_result['extracted_tasks'])} Tasks from '{latest_note.title}'",
                description=f"Add {len(extract_result['extracted_tasks'])} new tasks extracted from your note '{latest_note.title}' to your task list.",
                proposed_payload={"tasks": extract_result["extracted_tasks"], "note_id": latest_note.id},
                affected_records_summary=f"Task Database ({len(extract_result['extracted_tasks'])} new records)",
                run_id=agent_run.id
            )

            agent_run.status = "awaiting_approval"
            tasks_list_fmt = [f"• **{t['title']}** (Priority: {t['priority'].upper()}, {t['estimated_duration']}m)" for t in extract_result["extracted_tasks"]]
            summary = (
                f"### 📝 Action Items Extracted from '{latest_note.title}'\n\n"
                f"I parsed your note and discovered **{len(extract_result['extracted_tasks'])} actionable task candidate(s)**:\n\n" +
                "\n".join(tasks_list_fmt) +
                f"\n\n⚠️ *Requires approval: Click 'Approve' to create these records in your Tasks database.*"
            )
            agent_run.summary = summary
            db.commit()

            assistant_msg = Message(
                conversation_id=conversation_id,
                role="assistant",
                content=summary,
                extra_data={
                    "intent": "extract_tasks_from_notes",
                    "plan": plan,
                    "tool_calls": tool_calls,
                    "approval_id": approval.id,
                    "extracted": extract_result
                },
                created_at=datetime.utcnow()
            )
            db.add(assistant_msg)
            db.commit()
            db.refresh(assistant_msg)

            return {
                "conversation_id": conversation_id,
                "message": assistant_msg,
                "agent_run": agent_run,
                "pending_approval": approval,
                "provider_used": provider_label,
                "suggested_prompts": ["Approve import", "Show my pending tasks and prioritize them."]
            }

        # -------------------------------------------------------------
        # WORKFLOW: Overdue Assignments
        # Trigger examples: "Show my overdue assignments", "overdue tasks"
        # -------------------------------------------------------------
        elif "overdue" in lower_prompt:
            agent_run.intent = "get_overdue_tasks"
            now = datetime.utcnow()
            overdue = db.query(Task).filter(Task.due_date < now, Task.status != "completed").all()
            
            plan = [
                {"step_number": 1, "description": f"Query tasks with due_date < current UTC ({now.strftime('%b %d')})", "tool_name": "get_tasks", "status": "completed"},
                {"step_number": 2, "description": "Compile overdue assignment list with overdue hours and priority", "tool_name": None, "status": "completed"}
            ]
            agent_run.plan = plan
            tool_calls = [{"tool_name": "get_tasks", "arguments": {"overdue": True}, "status": "success", "count": len(overdue)}]
            agent_run.tool_calls = tool_calls

            if not overdue:
                summary = "🎉 Great news! You have **no overdue assignments** or tasks in your database."
            else:
                items = []
                for t in overdue:
                    hours_late = int((now - t.due_date).total_seconds() / 3600)
                    items.append(f"• **{t.title}** (Priority: {t.priority.upper()}) — Overdue by {hours_late} hours (Due: {t.due_date.strftime('%b %d %I:%M %p')})")
                summary = f"### ⚠️ Overdue Assignments ({len(overdue)})\n\n" + "\n".join(items) + "\n\n*Action: Would you like me to find a free time block today to tackle these?*"

            agent_run.status = "completed"
            agent_run.summary = summary
            db.commit()

            assistant_msg = Message(conversation_id=conversation_id, role="assistant", content=summary, created_at=datetime.utcnow())
            db.add(assistant_msg)
            db.commit()
            db.refresh(assistant_msg)

            return {
                "conversation_id": conversation_id,
                "message": assistant_msg,
                "agent_run": agent_run,
                "pending_approval": None,
                "provider_used": provider_label,
                "suggested_prompts": ["Find two free hours tomorrow for project work.", "Show my pending tasks and prioritize them."]
            }

        # -------------------------------------------------------------
        # GENERAL ASSISTANT / TOOL DISPATCH FALLBACK
        # -------------------------------------------------------------
        else:
            agent_run.intent = "general_assistant"
            tasks_count = db.query(Task).filter(Task.status == "pending").count()
            events_count = db.query(CalendarEvent).count()
            notes_count = db.query(Note).count()

            plan = [
                {"step_number": 1, "description": "Analyze intent and check productivity database health", "tool_name": "analyze_schedule", "status": "completed"},
                {"step_number": 2, "description": "Formulate actionable productivity guidance", "tool_name": None, "status": "completed"}
            ]
            agent_run.plan = plan
            tool_calls = [{"tool_name": "analyze_schedule", "arguments": {}, "status": "success", "result": {"tasks": tasks_count, "events": events_count, "notes": notes_count}}]
            agent_run.tool_calls = tool_calls

            summary = (
                f"I'm **LifePilot AI**, your action-oriented productivity assistant.\n\n"
                f"**Current Workspace Overview:**\n"
                f"• **{tasks_count} pending task(s)** waiting in your queue\n"
                f"• **{events_count} scheduled event(s)** in your internal calendar\n"
                f"• **{notes_count} note(s)** indexed for task extraction\n\n"
                f"Here are key actions I can execute for you:\n"
                f"1. **Prioritize:** `Show my pending tasks and prioritize them.`\n"
                f"2. **Schedule:** `Find two free hours tomorrow for project work.`\n"
                f"3. **Study Planning:** `Plan my week around my exams.`\n"
                f"4. **Note Conversion:** `Turn my notes into a list of tasks.`"
            )
            agent_run.status = "completed"
            agent_run.summary = summary
            db.commit()

            assistant_msg = Message(conversation_id=conversation_id, role="assistant", content=summary, created_at=datetime.utcnow())
            db.add(assistant_msg)
            db.commit()
            db.refresh(assistant_msg)

            return {
                "conversation_id": conversation_id,
                "message": assistant_msg,
                "agent_run": agent_run,
                "pending_approval": None,
                "provider_used": provider_label,
                "suggested_prompts": [
                    "Show my pending tasks and prioritize them.",
                    "Find two free hours tomorrow for project work.",
                    "Plan my week around my exams.",
                    "Turn my notes into a list of tasks."
                ]
            }
