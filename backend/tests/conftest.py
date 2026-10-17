import pytest
import os
from fastapi.testclient import TestClient
from backend.app.core.database import Base, engine, SessionLocal, get_db
from backend.app.main import app
from backend.app.seed_data import seed_database
from backend.app.models.agent_run import AgentRun
from backend.app.models.approval import Approval
from backend.app.models.conversation import Conversation, Message

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db, force_reset=True)
    db.close()
    yield

@pytest.fixture(autouse=True)
def clean_each_test():
    """Resets to fresh seed data before each test to guarantee complete isolation."""
    db = SessionLocal()
    db.query(Approval).delete()
    db.query(AgentRun).delete()
    db.query(Message).delete()
    db.query(Conversation).delete()
    db.commit()
    seed_database(db, force_reset=True)
    db.close()
    yield

@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
