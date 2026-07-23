from app.core.database import Base  # noqa: F401

# Import all models here so Alembic or Base.metadata can discover them easily
__all__ = ["Base"]
