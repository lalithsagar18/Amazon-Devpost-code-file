from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from backend.app.models.task import Task
from backend.app.schemas.task import TaskCreate, TaskUpdate, PrioritizedTaskItem

class TaskService:
    @staticmethod
    def get_tasks(
        db: Session,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        category: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: Optional[str] = "due_date"
    ) -> List[Task]:
        query = db.query(Task)
        
        if status and status != "all":
            query = query.filter(Task.status == status)
        if priority and priority != "all":
            query = query.filter(Task.priority == priority)
        if category and category != "all":
            query = query.filter(Task.category == category)
        if search:
            search_fmt = f"%{search}%"
            query = query.filter(or_(Task.title.ilike(search_fmt), Task.description.ilike(search_fmt)))
            
        if sort_by == "due_date":
            query = query.order_by(Task.due_date.asc().nullslast(), Task.priority.desc())
        elif sort_by == "priority":
            query = query.order_by(Task.priority.desc(), Task.due_date.asc().nullslast())
        elif sort_by == "created_at":
            query = query.order_by(desc(Task.created_at))
        else:
            query = query.order_by(Task.id.desc())
            
        return query.all()

    @staticmethod
    def get_task_by_id(db: Session, task_id: int) -> Optional[Task]:
        return db.query(Task).filter(Task.id == task_id).first()

    @staticmethod
    def create_task(db: Session, task_in: TaskCreate, is_seed: bool = False) -> Task:
        task = Task(
            title=task_in.title,
            description=task_in.description,
            status=task_in.status,
            priority=task_in.priority,
            due_date=task_in.due_date,
            estimated_duration=task_in.estimated_duration,
            category=task_in.category,
            is_seed=is_seed,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def update_task(db: Session, task_id: int, task_in: TaskUpdate) -> Optional[Task]:
        task = TaskService.get_task_by_id(db, task_id)
        if not task:
            return None
            
        update_data = task_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(task, field, value)
            
        task.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def complete_task(db: Session, task_id: int) -> Optional[Task]:
        task = TaskService.get_task_by_id(db, task_id)
        if not task:
            return None
        task.status = "completed"
        task.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def reopen_task(db: Session, task_id: int) -> Optional[Task]:
        task = TaskService.get_task_by_id(db, task_id)
        if not task:
            return None
        task.status = "pending"
        task.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def delete_task(db: Session, task_id: int) -> bool:
        task = TaskService.get_task_by_id(db, task_id)
        if not task:
            return False
        db.delete(task)
        db.commit()
        return True

    @staticmethod
    def prioritize_tasks(db: Session) -> List[Dict[str, Any]]:
        """
        Rule-based algorithmic prioritization of tasks.
        Combines:
        1. Due date proximity (Overdue: +50, Due Today: +30, Due in 2 days: +20, Due this week: +10)
        2. Priority setting (urgent: +40, high: +25, medium: +10, low: +0)
        3. Estimated effort/duration (quick wins <= 30 mins: +5 bonus)
        """
        active_tasks = db.query(Task).filter(Task.status.in_(["pending", "in_progress"])).all()
        now = datetime.utcnow()
        
        scored_items = []
        for task in active_tasks:
            score = 0.0
            reasons = []
            
            # 1. Priority baseline
            pri_map = {"urgent": 40.0, "high": 25.0, "medium": 10.0, "low": 2.0}
            base_score = pri_map.get(task.priority.lower(), 10.0)
            score += base_score
            reasons.append(f"{task.priority.capitalize()} base priority (+{int(base_score)} pts)")

            # 2. Due date proximity
            if task.due_date:
                diff_hours = (task.due_date - now).total_seconds() / 3600.0
                if diff_hours < 0:
                    score += 55.0
                    reasons.append(f"OVERDUE by {abs(int(diff_hours))}h (+55 pts)")
                elif diff_hours <= 24:
                    score += 35.0
                    reasons.append(f"Due within 24 hours (+35 pts)")
                elif diff_hours <= 72:
                    score += 20.0
                    reasons.append(f"Due in {int(diff_hours/24)} days (+20 pts)")
                elif diff_hours <= 168:
                    score += 10.0
                    reasons.append("Due this week (+10 pts)")
            else:
                reasons.append("No fixed deadline specified")

            # 3. Quick win bonus
            if task.estimated_duration and task.estimated_duration <= 30:
                score += 5.0
                reasons.append(f"Quick win ({task.estimated_duration}m, +5 pts)")

            scored_items.append({
                "task": task,
                "urgency_score": round(score, 1),
                "reason": " • ".join(reasons)
            })

        # Sort highest score first
        scored_items.sort(key=lambda x: x["urgency_score"], reverse=True)
        return scored_items
