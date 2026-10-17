from sqlalchemy.orm import Session
from datetime import datetime, timedelta, time
from backend.app.models.task import Task
from backend.app.models.calendar_event import CalendarEvent
from backend.app.models.note import Note
from backend.app.models.conversation import Conversation, Message

def seed_database(db: Session, force_reset: bool = False):
    """Seeds realistic student & professional productivity records."""
    if force_reset:
        db.query(Task).delete()
        db.query(CalendarEvent).delete()
        db.query(Note).delete()
        db.commit()

    # Check if seed data already exists
    existing = db.query(Task).filter(Task.is_seed == True).first()
    if existing and not force_reset:
        return {"status": "already_seeded", "message": "Database already has seed records."}

    now = datetime.utcnow()
    tomorrow = now + timedelta(days=1)
    day_after = now + timedelta(days=2)
    five_days_ahead = now + timedelta(days=5)

    # 1. SEED TASKS
    seed_tasks = [
        Task(
            title="Complete Alexa+ MCP Server Implementation",
            description="Implement all 14 official MCP tools with Streamable HTTP transport and test integration.",
            status="pending",
            priority="urgent",
            due_date=tomorrow.replace(hour=18, minute=0, second=0),
            estimated_duration=60,
            category="Project",
            is_seed=True,
            created_at=now,
            updated_at=now
        ),
        Task(
            title="Review Calculus II Practice Exam (Derivatives & Integrals)",
            description="Focus on series convergence, integration by parts, and high-yield mock problems.",
            status="pending",
            priority="high",
            due_date=five_days_ahead.replace(hour=12, minute=0, second=0),
            estimated_duration=90,
            category="Study",
            is_seed=True,
            created_at=now,
            updated_at=now
        ),
        Task(
            title="Submit Machine Learning Assignment 3",
            description="Finalize model evaluation metrics and upload PyTorch notebook to student portal.",
            status="pending",
            priority="high",
            due_date=now + timedelta(hours=6),
            estimated_duration=45,
            category="Assignment",
            is_seed=True,
            created_at=now,
            updated_at=now
        ),
        Task(
            title="Read Research Paper on Autonomous Tool Use",
            description="Read survey paper on tool use in conversational agent architectures.",
            status="pending",
            priority="medium",
            due_date=day_after.replace(hour=20, minute=0, second=0),
            estimated_duration=35,
            category="Study",
            is_seed=True,
            created_at=now,
            updated_at=now
        ),
        Task(
            title="Prepare Hackathon Pitch Slides & Demo Recording",
            description="Create concise 3-minute presentation walking through the three primary agent workflows.",
            status="pending",
            priority="urgent",
            due_date=tomorrow.replace(hour=22, minute=0, second=0),
            estimated_duration=45,
            category="Project",
            is_seed=True,
            created_at=now,
            updated_at=now
        ),
        Task(
            title="Weekly Computer Systems Reading Quiz",
            description="Answer online chapter quiz for memory hierarchies and cache coherence.",
            status="completed",
            priority="medium",
            due_date=now - timedelta(days=1),
            estimated_duration=25,
            category="Study",
            is_seed=True,
            created_at=now - timedelta(days=2),
            updated_at=now - timedelta(days=1)
        )
    ]
    db.add_all(seed_tasks)

    # 2. SEED CALENDAR EVENTS
    # Create strategic calendar events for tomorrow:
    # 09:00 - 10:30 (Busy)
    # 11:30 - 12:30 (Busy)
    # 13:00 - 15:30 (FREE SLOT! 2.5 hours free for Workflow B)
    # 15:30 - 17:00 (Busy)
    # 17:00 - 21:00 (Evening Free)
    seed_events = [
        CalendarEvent(
            title="CS301: Distributed Systems Lecture",
            description="Room 402 - Microservices, consensus protocols and stream processing.",
            start_time=tomorrow.replace(hour=9, minute=0, second=0),
            end_time=tomorrow.replace(hour=10, minute=30, second=0),
            location="Hall B",
            event_type="lecture",
            is_confirmed=True,
            is_seed=True
        ),
        CalendarEvent(
            title="Team Sync: Alexa+ Hackathon Sprint",
            description="Virtual standup to review MCP tools, UI components, and demo script.",
            start_time=tomorrow.replace(hour=11, minute=30, second=0),
            end_time=tomorrow.replace(hour=12, minute=30, second=0),
            location="Zoom",
            event_type="meeting",
            is_confirmed=True,
            is_seed=True
        ),
        CalendarEvent(
            title="Calculus Problem Session (Office Hours)",
            description="Review session for Taylor Series and convergence tests.",
            start_time=tomorrow.replace(hour=15, minute=30, second=0),
            end_time=tomorrow.replace(hour=17, minute=0, second=0),
            location="Science Hall 204",
            event_type="study",
            is_confirmed=True,
            is_seed=True
        ),
        CalendarEvent(
            title="AI Systems Seminar: Agentic Tool Protocols",
            description="Guest lecture on MCP standards and streamable HTTP agents.",
            start_time=day_after.replace(hour=14, minute=0, second=0),
            end_time=day_after.replace(hour=15, minute=30, second=0),
            location="Virtual Webinar",
            event_type="lecture",
            is_confirmed=True,
            is_seed=True
        ),
        CalendarEvent(
            title="Calculus II Midterm Exam",
            description="Comprehensive midterm examination covering differential equations & integration.",
            start_time=five_days_ahead.replace(hour=14, minute=0, second=0),
            end_time=five_days_ahead.replace(hour=16, minute=30, second=0),
            location="Main Auditorium",
            event_type="study",
            is_confirmed=True,
            is_seed=True
        )
    ]
    db.add_all(seed_events)

    # 3. SEED NOTES
    seed_notes = [
        Note(
            title="Calculus II Exam Prep & High-Yield Topics",
            content="""Important topics for upcoming exam on Friday:
- Integration by Parts and Trigonometric Substitution
- Differential equation modeling and initial value problems
- [ ] Complete practice exam section 4.2
- [ ] Review error bounds for Taylor series
- [ ] Memorize standard trigonometric reduction formulas
TODO: solve at least 15 past paper questions before Thursday.""",
            tags="Calculus, Exam, Study",
            is_seed=True,
            created_at=now,
            updated_at=now
        ),
        Note(
            title="Alexa+ Hackathon Architecture & Action Plan",
            content="""Key components for LifePilot AI:
- Streamable HTTP MCP server on port 8001
- 14 validated MCP tools connecting to live database
- Human-in-the-loop approval workflow for calendar and multi-session creations
- [ ] Implement responsive Tailwind dashboard with quick actions
- [ ] Add speech recognition voice input demo with microphone indicator
- [ ] Write integration test suite covering all 3 hackathon workflows
TODO: Record 3-minute demonstration video focusing on real execution.""",
            tags="Hackathon, Alexa+, Dev",
            is_seed=True,
            created_at=now,
            updated_at=now
        ),
        Note(
            title="Machine Learning: Agent Evaluation & Tool Calling",
            content="""Lecture summary:
• Structured planning prevents circular reasoning in LLMs
• Validating tool outputs against persisted database state prevents hallucinations
• Deterministic demo providers ensure repeatable hackathon evaluations
• Transparent reasoning explains why tasks or sessions were prioritized.""",
            tags="ML, AI, Architecture",
            is_seed=True,
            created_at=now,
            updated_at=now
        )
    ]
    db.add_all(seed_notes)

    db.commit()
    return {
        "status": "success",
        "tasks_seeded": len(seed_tasks),
        "events_seeded": len(seed_events),
        "notes_seeded": len(seed_notes),
        "message": "Realistic seed data initialized successfully."
    }
