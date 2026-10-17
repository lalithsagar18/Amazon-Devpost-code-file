from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from typing import Optional, List, Dict, Any
from datetime import datetime
import re
from backend.app.models.note import Note
from backend.app.schemas.note import NoteCreate, NoteUpdate, ExtractedTaskCandidate

class NoteService:
    @staticmethod
    def get_notes(
        db: Session,
        search: Optional[str] = None,
        tag: Optional[str] = None
    ) -> List[Note]:
        query = db.query(Note)
        if tag and tag != "all":
            query = query.filter(Note.tags.ilike(f"%{tag}%"))
        if search:
            search_fmt = f"%{search}%"
            query = query.filter(or_(Note.title.ilike(search_fmt), Note.content.ilike(search_fmt)))
        return query.order_by(desc(Note.updated_at)).all()

    @staticmethod
    def get_note_by_id(db: Session, note_id: int) -> Optional[Note]:
        return db.query(Note).filter(Note.id == note_id).first()

    @staticmethod
    def create_note(db: Session, note_in: NoteCreate, is_seed: bool = False) -> Note:
        note = Note(
            title=note_in.title,
            content=note_in.content,
            tags=note_in.tags or "",
            is_seed=is_seed,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(note)
        db.commit()
        db.refresh(note)
        return note

    @staticmethod
    def update_note(db: Session, note_id: int, note_in: NoteUpdate) -> Optional[Note]:
        note = NoteService.get_note_by_id(db, note_id)
        if not note:
            return None
        update_data = note_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(note, field, value)
        note.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(note)
        return note

    @staticmethod
    def delete_note(db: Session, note_id: int) -> bool:
        note = NoteService.get_note_by_id(db, note_id)
        if not note:
            return False
        db.delete(note)
        db.commit()
        return True

    @staticmethod
    def summarize_notes(db: Session, note_id: int) -> Dict[str, Any]:
        note = NoteService.get_note_by_id(db, note_id)
        if not note:
            return {"error": "Note not found"}
            
        lines = [line.strip() for line in note.content.split("\n") if line.strip()]
        key_points = []
        for line in lines:
            if line.startswith("-") or line.startswith("*") or line.startswith("•") or ":" in line:
                cleaned = line.lstrip("-*• ").strip()
                if len(cleaned) > 5:
                    key_points.append(cleaned)
                    
        summary = (
            f"Note summary for '{note.title}': Contains {len(lines)} structured lines and {len(key_points)} key focal items. "
            f"Tags: [{note.tags}]. Key takeaway: " + (key_points[0] if key_points else (lines[0] if lines else "Empty note"))
        )
        return {
            "note_id": note.id,
            "title": note.title,
            "tags": note.tags,
            "line_count": len(lines),
            "key_points": key_points[:6],
            "summary": summary
        }

    @staticmethod
    def extract_tasks_from_notes(db: Session, note_id: int) -> Dict[str, Any]:
        note = NoteService.get_note_by_id(db, note_id)
        if not note:
            return {"error": "Note not found", "extracted_tasks": []}

        extracted_tasks: List[ExtractedTaskCandidate] = []
        lines = note.content.split("\n")
        
        # Action triggers
        action_keywords = ["todo", "task", "implement", "review", "read", "prepare", "submit", "complete", "study", "design", "test"]
        
        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue

            is_candidate = False
            title = ""
            priority = "medium"
            duration = 45

            # Markdown check box: [ ] or - [ ]
            if re.match(r"^[-*]?\s*\[\s*\]\s+(.+)$", line_str):
                match = re.match(r"^[-*]?\s*\[\s*\]\s+(.+)$", line_str)
                title = match.group(1).strip()
                is_candidate = True
            elif line_str.startswith("-") or line_str.startswith("*") or line_str.startswith("•"):
                candidate = line_str.lstrip("-*• ").strip()
                # Check if first word is an action verb or contains TODO
                lower_cand = candidate.lower()
                if any(kw in lower_cand for kw in action_keywords) or ":" in candidate:
                    title = candidate
                    is_candidate = True
            elif any(line_str.lower().startswith(kw) for kw in action_keywords):
                title = line_str
                is_candidate = True

            if is_candidate and title:
                # Infer priority and duration
                lower_t = title.lower()
                if "urgent" in lower_t or "exam" in lower_t or "due today" in lower_t or "critical" in lower_t:
                    priority = "urgent"
                    duration = 60
                elif "important" in lower_t or "review" in lower_t or "submit" in lower_t:
                    priority = "high"
                    duration = 45
                elif "quick" in lower_t or "read" in lower_t:
                    priority = "low"
                    duration = 20

                extracted_tasks.append(ExtractedTaskCandidate(
                    title=title[:250],
                    description=f"Auto-extracted from note: '{note.title}'",
                    priority=priority,
                    estimated_duration=duration,
                    category="Study" if "study" in note.tags.lower() or "study" in lower_t else "General"
                ))

        # Fallback if no specific bullet points matched, use title
        if not extracted_tasks and lines:
            extracted_tasks.append(ExtractedTaskCandidate(
                title=f"Review and follow up on {note.title}",
                description=f"Review full contents of note '{note.title}'",
                priority="medium",
                estimated_duration=30,
                category="General"
            ))

        return {
            "note_id": note.id,
            "note_title": note.title,
            "extracted_tasks": [task.model_dump() for task in extracted_tasks],
            "count": len(extracted_tasks),
            "message": f"Successfully identified {len(extracted_tasks)} actionable task(s) from note '{note.title}'."
        }
