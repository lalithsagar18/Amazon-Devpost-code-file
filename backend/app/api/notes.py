from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.core.database import get_db
from backend.app.schemas.note import NoteCreate, NoteUpdate, NoteResponse, NoteExtractTasksResponse
from backend.app.services.note_service import NoteService

router = APIRouter(prefix="/notes", tags=["Notes"])

@router.get("", response_model=List[NoteResponse])
def list_notes(
    search: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return NoteService.get_notes(db, search=search, tag=tag)

@router.post("", response_model=NoteResponse, status_code=201)
def create_note(note_in: NoteCreate, db: Session = Depends(get_db)):
    return NoteService.create_note(db, note_in)

@router.get("/{note_id}", response_model=NoteResponse)
def get_note(note_id: int, db: Session = Depends(get_db)):
    note = NoteService.get_note_by_id(db, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note

@router.patch("/{note_id}", response_model=NoteResponse)
def update_note(note_id: int, note_in: NoteUpdate, db: Session = Depends(get_db)):
    note = NoteService.update_note(db, note_id, note_in)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note

@router.delete("/{note_id}")
def delete_note(note_id: int, db: Session = Depends(get_db)):
    success = NoteService.delete_note(db, note_id)
    if not success:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"success": True, "message": f"Note {note_id} deleted."}

@router.get("/{note_id}/summarize")
def summarize_note(note_id: int, db: Session = Depends(get_db)):
    summary = NoteService.summarize_notes(db, note_id)
    if "error" in summary:
        raise HTTPException(status_code=404, detail=summary["error"])
    return summary

@router.post("/{note_id}/extract-tasks", response_model=NoteExtractTasksResponse)
def extract_tasks(note_id: int, db: Session = Depends(get_db)):
    res = NoteService.extract_tasks_from_notes(db, note_id)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res
