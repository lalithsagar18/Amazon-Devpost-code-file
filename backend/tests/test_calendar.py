from datetime import datetime, timedelta, date

def test_calendar_crud_and_free_time(client):
    target_day = (datetime.utcnow() + timedelta(days=3)).date()
    
    # 1. Test finding free time
    free_req = {
        "date": target_day.isoformat(),
        "duration_minutes": 120,
        "window_start_hour": 8,
        "window_end_hour": 22
    }
    free_res = client.post("/api/calendar/find-free-time", json=free_req)
    assert free_res.status_code == 200
    free_data = free_res.json()
    assert "available_slots" in free_data
    assert len(free_data["available_slots"]) > 0
    slot = free_data["available_slots"][0]
    assert slot["duration_minutes"] == 120
    assert "formatted_start" in slot

    # 2. Create Calendar Event
    start_dt = datetime.combine(target_day, datetime.min.time()).replace(hour=13, minute=0)
    end_dt = start_dt + timedelta(hours=2)
    ev_payload = {
        "title": "Hackathon Deep Work Session",
        "description": "Integration testing and polishing",
        "start_time": start_dt.isoformat(),
        "end_time": end_dt.isoformat(),
        "location": "Local Dev Machine",
        "event_type": "project"
    }
    create_res = client.post("/api/calendar/events", json=ev_payload)
    assert create_res.status_code == 201
    created = create_res.json()
    ev_id = created["id"]
    assert created["title"] == "Hackathon Deep Work Session"

    # 3. Get Event
    get_res = client.get(f"/api/calendar/events/{ev_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == ev_id

    # 4. Update Event
    update_res = client.patch(f"/api/calendar/events/{ev_id}", json={"location": "Lab 101"})
    assert update_res.status_code == 200
    assert update_res.json()["location"] == "Lab 101"

    # 5. Delete Event
    del_res = client.delete(f"/api/calendar/events/{ev_id}")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True
