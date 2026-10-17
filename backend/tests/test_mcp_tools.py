from datetime import datetime, timedelta

def test_mcp_tools_registry_and_health(client):
    # 1. Health endpoint
    h_res = client.get("/api/tools/health")
    assert h_res.status_code == 200
    h_data = h_res.json()
    assert h_data["status"] == "healthy"
    assert h_data["mcp_server"] == "lifepilot-mcp"
    assert h_data["total_tools"] == 14

    # 2. Tool list
    t_res = client.get("/api/tools")
    assert t_res.status_code == 200
    tools = t_res.json()
    assert len(tools) == 14
    tool_names = [t["name"] for t in tools]
    expected_tools = [
        "get_tasks", "create_task", "update_task", "complete_task",
        "get_calendar_events", "find_free_time", "create_calendar_event", "update_calendar_event",
        "search_notes", "summarize_notes", "extract_tasks_from_notes",
        "analyze_schedule", "create_study_plan", "prioritize_tasks"
    ]
    for expected in expected_tools:
        assert expected in tool_names

def test_mcp_tool_direct_execution(client):
    # Execute get_tasks
    res = client.post("/api/tools/execute/get_tasks", json={"status": "pending"})
    assert res.status_code == 200
    assert res.json()["success"] is True

    # Execute prioritize_tasks
    res_pri = client.post("/api/tools/execute/prioritize_tasks", json={})
    assert res_pri.status_code == 200
    assert res_pri.json()["success"] is True

    # Execute analyze_schedule
    res_sched = client.post("/api/tools/execute/analyze_schedule", json={})
    assert res_sched.status_code == 200
    assert res_sched.json()["success"] is True
    assert "density_status" in res_sched.json()["result"]

    # Execute find_free_time
    tomorrow = (datetime.utcnow() + timedelta(days=1)).date()
    res_free = client.post("/api/tools/execute/find_free_time", json={"target_date": tomorrow.isoformat(), "duration_minutes": 60})
    assert res_free.status_code == 200
    assert res_free.json()["success"] is True
