from datetime import datetime, timedelta

def test_generate_study_plan(client):
    exam_dt = datetime.utcnow() + timedelta(days=6)
    req = {
        "subject": "Discrete Mathematics",
        "exam_date": exam_dt.isoformat(),
        "available_hours_per_day": 3.0,
        "target_sessions_count": 4,
        "topics": [
            "Propositional & Predicate Logic",
            "Proof by Induction & Contradiction",
            "Graph Theory & Trees",
            "Combinatorics & Generating Functions"
        ]
    }
    res = client.post("/api/study-planner/generate-plan", json=req)
    assert res.status_code == 200
    data = res.json()
    assert data["subject"] == "Discrete Mathematics"
    assert data["days_until_exam"] >= 5
    assert len(data["sessions"]) > 0
    assert data["approval_required"] is True
    assert "reasoning" in data
