from fastapi import APIRouter
from app.schemas.common import HealthResponse

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Service Health Check",
    description="Check backend operational status and service identification.",
    tags=["System"],
)
def check_health() -> HealthResponse:
    """
    Returns standard health check response:
    {
      "status": "ok",
      "service": "mandi-direct-api"
    }
    """
    return HealthResponse(status="ok", service="mandi-direct-api")


@router.get(
    "/health/db",
    summary="Database Health Check",
    description="Check backend database connectivity.",
    tags=["System"],
)
def check_db_health():
    from sqlalchemy import text
    from app.core.database import SessionLocal
    from fastapi import HTTPException, status
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "service": "mandi-direct-api", "database": "connected"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connectivity probe failed",
        )
    finally:
        db.close()
