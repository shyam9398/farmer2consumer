from typing import Any, Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """
    Standard health check schema strictly conforming to contract:
    {
      "status": "ok",
      "service": "mandi-direct-api"
    }
    """
    status: str = Field(default="ok", example="ok")
    service: str = Field(default="mandi-direct-api", example="mandi-direct-api")


class ErrorResponse(BaseModel):
    """Standardized error response payload."""
    detail: str = Field(..., description="Human-readable error explanation")
    code: Optional[str] = Field(None, description="System error code")
    field_errors: Optional[Any] = Field(None, description="Validation errors if applicable")


class MessageResponse(BaseModel):
    """Generic message response."""
    message: str
