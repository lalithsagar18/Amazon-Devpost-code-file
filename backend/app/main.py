from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from datetime import datetime

from backend.app.core.config import settings
from backend.app.core.database import Base, engine, SessionLocal
import backend.app.models  # Ensure all models are registered
from backend.app.seed_data import seed_database

from backend.app.api.tasks import router as tasks_router
from backend.app.api.calendar import router as calendar_router
from backend.app.api.notes import router as notes_router
from backend.app.api.study import router as study_router
from backend.app.api.chat import router as chat_router
from backend.app.api.approvals import router as approvals_router
from backend.app.api.agent_runs import router as agent_runs_router
from backend.app.api.tools import router as tools_router
from backend.app.api.seed import router as seed_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables
    Base.metadata.create_all(bind=engine)
    # Seed default demonstration data if empty
    db = SessionLocal()
    try:
        seed_database(db, force_reset=False)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="LifePilot AI — Action-Oriented AI Productivity Assistant for Alexa+ Track",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root & Health Endpoints
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "lifepilot-ai-backend",
        "version": settings.VERSION,
        "ai_provider": settings.AI_PROVIDER,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/")
def root():
    return {
        "project": "LifePilot AI",
        "tagline": "More than answers. AI that gets things done.",
        "track": "Alexa+",
        "docs": "/docs",
        "health": "/health"
    }

# Mount Routers
app.include_router(tasks_router, prefix=settings.API_V1_STR)
app.include_router(calendar_router, prefix=settings.API_V1_STR)
app.include_router(notes_router, prefix=settings.API_V1_STR)
app.include_router(study_router, prefix=settings.API_V1_STR)
app.include_router(chat_router, prefix=settings.API_V1_STR)
app.include_router(approvals_router, prefix=settings.API_V1_STR)
app.include_router(agent_runs_router, prefix=settings.API_V1_STR)
app.include_router(tools_router, prefix=settings.API_V1_STR)
app.include_router(seed_router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
