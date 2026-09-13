import os
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

# Set test environment variables before importing app
os.environ["ENVIRONMENT"] = "testing"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["SECRET_KEY"] = "test-secret-key-mandi-direct-sih-2026"
os.environ["SUPABASE_JWT_SECRET"] = "test-jwt-secret-mandi-direct-32-chars-long"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_db
from app.core.database import Base
from app.core.security import create_access_token
from app.main import app
from app.models.enums import UserRole, UserStatus
from app.models.profile import Profile

# In-memory SQLite engine for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Create database tables once for test session."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session():
    """Yield an isolated transactional database session for each test."""
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    """Provide a FastAPI TestClient with overridden database session."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def create_test_user(db_session):
    """Factory fixture to create test profiles in the database."""
    def _create_user(
        auth_user_id: str,
        email: str,
        full_name: str,
        role: UserRole = UserRole.FARMER,
        status: UserStatus = UserStatus.ACTIVE,
    ) -> Profile:
        profile = Profile(
            auth_user_id=auth_user_id,
            email=email,
            full_name=full_name,
            role=role.value if isinstance(role, UserRole) else role,
            status=status.value if isinstance(status, UserStatus) else status,
        )
        db_session.add(profile)
        db_session.commit()
        db_session.refresh(profile)
        return profile

    return _create_user


@pytest.fixture
def make_auth_header():
    """Factory fixture to generate an Authorization: Bearer <jwt> header."""
    def _make_header(auth_user_id: str, email: str, role: str = "authenticated") -> dict:
        token = create_access_token(
            data={"sub": auth_user_id, "email": email, "role": role},
            secret="test-jwt-secret-mandi-direct-32-chars-long",
        )
        return {"Authorization": f"Bearer {token}"}

    return _make_header
