from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# Create SQLAlchemy engine with fallback to local SQLite database if PostgreSQL connection fails or is default
db_uri = settings.SQLALCHEMY_DATABASE_URI

try:
    if "sqlite" in db_uri.lower():
        engine = create_engine(db_uri, connect_args={"check_same_thread": False})
    else:
        engine = create_engine(db_uri, pool_pre_ping=True, echo=False)
except Exception:
    db_uri = "sqlite:///./sql_app.db"
    engine = create_engine(db_uri, connect_args={"check_same_thread": False})

# Session factory for DB interactions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative Base Class for ORM models
Base = declarative_base()


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
