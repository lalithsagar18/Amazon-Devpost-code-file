import uuid
from datetime import datetime, timedelta
from backend.app.models.approval import Approval
from backend.app.models.calendar_event import CalendarEvent
from backend.app.services.approval_service import ApprovalService

def test_approval_lifecycle_and_idempotency(db_session, client):
    # 1. Stage an approval for creating a calendar event
    unique_title = f"Idempotent Session {uuid.uuid4().hex[:6]}"
    start_dt = datetime.utcnow() + timedelta(days=2, hours=3)
    end_dt = start_dt + timedelta(hours=2)
    payload = {
        "title": unique_title,
        "description": "Created via approval test",
        "start_time": start_dt.isoformat(),
        "end_time": end_dt.isoformat(),
        "location": "Virtual",
        "event_type": "project"
    }

    approval = ApprovalService.create_approval(
        db=db_session,
        action_type="create_calendar_event",
        title=f"Schedule {unique_title}",
        description="Test approval execution",
        proposed_payload=payload,
        affected_records_summary="Calendar Event table"
    )
    approval_id = approval.id
    assert approval.status == "pending"

    # 2. Approve the action
    res1 = client.post(f"/api/approvals/{approval_id}/approve")
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["status"] == "executed"
    assert "verified_record" in data1
    event_id = data1["execution_result"]["event_id"]

    # 3. Verify event is really in the database
    persisted_ev = db_session.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    assert persisted_ev is not None
    assert persisted_ev.title == unique_title

    # 4. Duplicate click test (Idempotency): Calling approve again must NOT duplicate event!
    initial_event_count = db_session.query(CalendarEvent).filter(CalendarEvent.title == unique_title).count()
    res2 = client.post(f"/api/approvals/{approval_id}/approve")
    assert res2.status_code == 200
    data2 = res2.json()
    assert "idempotent replay" in data2["message"].lower()

    after_event_count = db_session.query(CalendarEvent).filter(CalendarEvent.title == unique_title).count()
    assert initial_event_count == after_event_count == 1  # No duplicate record!

def test_approval_cancellation(db_session, client):
    payload = {"title": "Cancelled Event", "start_time": datetime.utcnow().isoformat(), "end_time": (datetime.utcnow() + timedelta(hours=1)).isoformat()}
    approval = ApprovalService.create_approval(
        db=db_session,
        action_type="create_calendar_event",
        title="Cancelled Action",
        description="Should not execute",
        proposed_payload=payload
    )

    # Cancel approval
    cancel_res = client.post(f"/api/approvals/{approval.id}/cancel")
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "cancelled"

    # Verify no calendar event was created
    ev = db_session.query(CalendarEvent).filter(CalendarEvent.title == "Cancelled Event").first()
    assert ev is None
