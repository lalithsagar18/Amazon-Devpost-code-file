from datetime import datetime, timedelta

def test_task_crud_lifecycle(client):
    # 1. Create Task
    new_task = {
        "title": "Build Integration Test Suite",
        "description": "Comprehensive tests for LifePilot AI backend",
        "priority": "high",
        "estimated_duration": 45,
        "category": "Project",
        "status": "pending"
    }
    create_res = client.post("/api/tasks", json=new_task)
    assert create_res.status_code == 201
    created = create_res.json()
    task_id = created["id"]
    assert created["title"] == "Build Integration Test Suite"
    assert created["priority"] == "high"

    # 2. Get Task
    get_res = client.get(f"/api/tasks/{task_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == task_id

    # 3. Update Task
    update_res = client.patch(f"/api/tasks/{task_id}", json={"priority": "urgent"})
    assert update_res.status_code == 200
    assert update_res.json()["priority"] == "urgent"

    # 4. Complete Task
    comp_res = client.post(f"/api/tasks/{task_id}/complete")
    assert comp_res.status_code == 200
    assert comp_res.json()["status"] == "completed"

    # 5. Reopen Task
    reopen_res = client.post(f"/api/tasks/{task_id}/reopen")
    assert reopen_res.status_code == 200
    assert reopen_res.json()["status"] == "pending"

    # 6. Delete Task
    del_res = client.delete(f"/api/tasks/{task_id}")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # 7. Verify deletion
    verify_res = client.get(f"/api/tasks/{task_id}")
    assert verify_res.status_code == 404

def test_prioritize_tasks(client):
    res = client.get("/api/tasks/prioritized")
    assert res.status_code == 200
    items = res.json()
    assert len(items) > 0
    # Check that highest score is first
    scores = [it["urgency_score"] for it in items]
    assert scores == sorted(scores, reverse=True)
    assert "reason" in items[0]
