from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("database")

database_url = settings.DATABASE_URL
engine_kwargs = {}

if database_url.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs.update(
        {
            "pool_pre_ping": True,
            "pool_size": 10,
            "max_overflow": 20,
        }
    )

try:
    engine = create_engine(database_url, **engine_kwargs)
except Exception as e:
    logger.warning(f"Could not initialize primary database engine: {e}. Falling back to SQLite dev db.")
    database_url = "sqlite:///./mandi_direct_dev.db"
    engine = create_engine(database_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db_session() -> Generator[Session, None, None]:
    """Dependency generator that yields a database session and safely closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
