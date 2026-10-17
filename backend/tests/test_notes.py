def test_note_crud_and_extract_tasks(client):
    # 1. Create Note with tasks
    note_payload = {
        "title": "Operating Systems Revision Notes",
        "content": """Summary of Virtual Memory:
- Paging and Segmentation trade-offs
- [ ] Solve chapter 7 virtual memory exercises
- [ ] Review TLB miss handling sequence
- Prepare summary flashcards for cache lines
TODO: Review page replacement algorithms (LRU, Clock).""",
        "tags": "OS, Systems, Study"
    }
    create_res = client.post("/api/notes", json=note_payload)
    assert create_res.status_code == 201
    created_note = create_res.json()
    note_id = created_note["id"]
    assert created_note["title"] == "Operating Systems Revision Notes"

    # 2. Summarize Note
    summary_res = client.get(f"/api/notes/{note_id}/summarize")
    assert summary_res.status_code == 200
    sum_data = summary_res.json()
    assert "summary" in sum_data
    assert len(sum_data["key_points"]) > 0

    # 3. Extract Tasks from Note
    extract_res = client.post(f"/api/notes/{note_id}/extract-tasks")
    assert extract_res.status_code == 200
    extracted_data = extract_res.json()
    tasks = extracted_data["extracted_tasks"]
    assert len(tasks) >= 2
    task_titles = [t["title"] for t in tasks]
    assert any("virtual memory" in t.lower() for t in task_titles)

    # 4. Delete Note
    del_res = client.delete(f"/api/notes/{note_id}")
    assert del_res.status_code == 200
