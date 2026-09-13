import logging
import sys
from app.core.config import settings


def setup_logging() -> None:
    """Configure structured console logging for the application."""
    log_format = "%(asctime)s | %(levelname)-8s | %(name)s:%(funcName)s:%(lineno)d - %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"

    level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    # Configure root handler
    logging.basicConfig(
        level=level,
        format=log_format,
        datefmt=date_format,
        handlers=[
            logging.StreamHandler(sys.stdout),
        ],
        force=True,
    )

    # Suppress verbose third-party loggers in dev/test
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(
        logging.INFO if settings.ENVIRONMENT == "development" else logging.WARNING
    )


def get_logger(name: str) -> logging.Logger:
    """Get a named logger with project-standard formatting."""
    return logging.getLogger(f"mandi_direct.{name}")
