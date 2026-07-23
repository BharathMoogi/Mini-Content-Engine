from typing import Any, Dict
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.database import get_db

router = APIRouter()


@router.get("", summary="Health Check Endpoint")
def health_check(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Returns system status and validates PostgreSQL connection status.
    """
    db_status = "unhealthy"
    try:
        # Simple test query to check DB connectivity
        db.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception as e:
        db_status = f"unreachable: {str(e)}"

    return {
        "status": "online",
        "database": db_status,
        "service": "Mini Content Engine API",
    }
