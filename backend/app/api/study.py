from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.schemas.study import StudyPlanRequest, StudyPlanResponse
from backend.app.services.study_service import StudyService

router = APIRouter(prefix="/study-planner", tags=["Study Planner"])

@router.post("/generate-plan", response_model=StudyPlanResponse)
def generate_study_plan(plan_req: StudyPlanRequest, db: Session = Depends(get_db)):
    return StudyService.generate_study_plan(db, plan_req)
