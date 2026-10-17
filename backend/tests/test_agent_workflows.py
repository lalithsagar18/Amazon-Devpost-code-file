def test_workflow_a_prioritize_tasks(client):
    """Workflow A: User enters 'Show my pending tasks and prioritize them.'"""
    chat_req = {
        "message": "Show my pending tasks and prioritize them.",
        "voice_input": False
    }
    res = client.post("/api/chat", json=chat_req)
    assert res.status_code == 200
    data = res.json()
    assert data["provider_used"] == "deterministic_demo_provider"
    assert data["agent_run"]["intent"] == "prioritize_tasks"
    assert data["agent_run"]["status"] == "completed"
    assert "Prioritized Task Analysis" in data["message"]["content"]
    assert "scored_tasks" in data["message"]["extra_data"]

def test_workflow_b_find_free_time_and_approve(client):
    """Workflow B: User enters 'Find two free hours tomorrow for project work.'"""
    chat_req = {
        "message": "Find two free hours tomorrow for project work."
    }
    res = client.post("/api/chat", json=chat_req)
    assert res.status_code == 200
    data = res.json()
    assert data["agent_run"]["intent"] == "find_free_time"
    assert data["agent_run"]["status"] == "awaiting_approval"
    assert data["pending_approval"] is not None
    approval_id = data["pending_approval"]["id"]

    # Now approve the proposed project work block
    approve_res = client.post(f"/api/approvals/{approval_id}/approve")
    assert approve_res.status_code == 200
    appr_data = approve_res.json()
    assert appr_data["status"] == "executed"
    assert "verified_record" in appr_data
    assert "event_id" in appr_data["execution_result"]

def test_workflow_c_exam_study_plan_and_approve(client):
    """Workflow C: User enters 'Plan my week around my exams.'"""
    chat_req = {
        "message": "Plan my week around my exams."
    }
    res = client.post("/api/chat", json=chat_req)
    assert res.status_code == 200
    data = res.json()
    assert data["agent_run"]["intent"] == "create_study_plan"
    assert data["agent_run"]["status"] == "awaiting_approval"
    assert data["pending_approval"] is not None
    approval_id = data["pending_approval"]["id"]

    # Approve multi-session study plan
    approve_res = client.post(f"/api/approvals/{approval_id}/approve")
    assert approve_res.status_code == 200
    appr_data = approve_res.json()
    assert appr_data["status"] == "executed"
    assert appr_data["execution_result"]["sessions_created_count"] > 0
