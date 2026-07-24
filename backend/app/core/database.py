import logging
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

logger = logging.getLogger(__name__)

db_uri = settings.SQLALCHEMY_DATABASE_URI or "sqlite:///./sql_app.db"

# Test PostgreSQL engine connection; fallback to local SQLite if unreachable
try:
    if "sqlite" in db_uri.lower():
        engine = create_engine(db_uri, connect_args={"check_same_thread": False})
    else:
        engine = create_engine(db_uri, pool_pre_ping=True, echo=False)
        # Attempt connection check
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("[Database] Successfully connected to PostgreSQL database.")
except Exception as e:
    logger.warning(f"[Database] PostgreSQL connection unavailable ({e}). Falling back to local SQLite database.")
    db_uri = "sqlite:///./sql_app.db"
    engine = create_engine(db_uri, connect_args={"check_same_thread": False})

# Session factory for DB interactions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative Base Class for ORM models
Base = declarative_base()

# Auto-create tables on startup if using SQLite or fresh database
try:
    from app.models.job import Job  # noqa
    Base.metadata.create_all(bind=engine)
except Exception as table_err:
    logger.warning(f"[Database] Could not auto-create tables: {table_err}")


def get_db() -> Generator:
    """
    Dependency function yielding a database session per request.
    Ensures connection closure after completion.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
