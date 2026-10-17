from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.seed_data import seed_database

router = APIRouter(prefix="/seed", tags=["Seed & Demo Data"])

@router.post("/initialize")
def initialize_seed(db: Session = Depends(get_db)):
    return seed_database(db, force_reset=False)

@router.post("/reset")
def reset_seed(db: Session = Depends(get_db)):
    return seed_database(db, force_reset=True)
