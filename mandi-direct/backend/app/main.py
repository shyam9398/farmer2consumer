import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import Base, engine
from app.core.logging import get_logger, setup_logging
from app.schemas.common import HealthResponse

# Initialize logging system
setup_logging()
logger = get_logger("main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup and shutdown routines."""
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION} [{settings.ENVIRONMENT}]")
    try:
        # Create database tables if they do not exist
        Base.metadata.create_all(bind=engine)
        logger.info("Database schemas verified and initialized.")

        # Seed comprehensive demo data (Profiles, Produce Listings, Vehicles, Orders, Earnings)
        import os
        if settings.ENVIRONMENT == "development" and not os.environ.get("PYTEST_CURRENT_TEST"):
            from app.core.database import SessionLocal
            from app.core.seed_demo_data import seed_demo_data
            db = SessionLocal()
            try:
                seed_demo_data(db)
                logger.info("Development demo data (farmers, buyers, logistics, small consumers) seeded and verified.")
            except Exception as seed_err:
                logger.warning(f"Demo data seeding error: {seed_err}")
            finally:
                db.close()
    except Exception as e:
        logger.error(f"Database schema initialization warning: {e}")
    yield
    logger.info(f"Shutting down {settings.PROJECT_NAME}")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request timing and logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration_ms = (time.time() - start_time) * 1000
    logger.info(
        f"{request.method} {request.url.path} -> {response.status_code} ({duration_ms:.2f}ms)"
    )
    return response


# Global Exception Handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    headers = getattr(exc, "headers", None)
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "code": "HTTP_ERROR"},
        headers=headers,
    )


from fastapi.encoders import jsonable_encoder


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning(f"Request validation failed on {request.url.path}: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Request validation error",
            "code": "VALIDATION_ERROR",
            "field_errors": jsonable_encoder(exc.errors()),
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An internal server error occurred. Please try again later.",
            "code": "INTERNAL_SERVER_ERROR",
        },
    )


# Root Health Check Endpoint (Required Contract)
@app.get(
    "/health",
    response_model=HealthResponse,
    summary="Root Health Check",
    tags=["Health"],
)
def root_health() -> HealthResponse:
    """
    Root health check endpoint conforming to required specification:
    {
      "status": "ok",
      "service": "mandi-direct-api"
    }
    """
    return HealthResponse(status="ok", service="mandi-direct-api")


@app.get(
    "/health/db",
    summary="Database Health Check",
    tags=["Health"],
)
def database_health():
    """
    Safely verifies database connectivity without exposing connection strings or passwords.
    """
    from sqlalchemy import text
    from app.core.database import SessionLocal
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "service": "mandi-direct-api", "database": "connected"}
    except Exception as e:
        logger.error(f"Database health check probe failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connectivity probe failed",
        )
    finally:
        db.close()


# Register v1 API Router
app.include_router(api_router, prefix=settings.API_V1_STR)
