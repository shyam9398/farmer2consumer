from typing import List, Optional, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Mandi Direct API"
    VERSION: str = "0.1.0"
    DESCRIPTION: str = (
        "Production-ready backend API for Mandi Direct (SIH 2026 Problem Statement 26033). "
        "Eliminating intermediaries by connecting farmers directly with institutional buyers, "
        "retailers, and consumers."
    )
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    # Security
    SECRET_KEY: str = "default-insecure-secret-key-change-in-production"
    ALGORITHM: str = "HS256"

    # Supabase Credentials
    SUPABASE_URL: str = "https://placeholder-project.supabase.co"
    SUPABASE_PUBLISHABLE_KEY: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: str = "placeholder-service-role-key"
    SUPABASE_JWT_SECRET: str = "placeholder-jwt-secret"

    # PostgreSQL Database URL
    DATABASE_URL: str = "sqlite:///./mandi_direct_dev.db"

    # CORS configuration
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "https://farmer2consumer.vercel.app",
        "https://farmer2consumer-5uxb.vercel.app",
    ]
    CORS_ORIGIN_REGEX: Optional[str] = r"^https:\/\/.*\.vercel\.app$"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if not v.strip():
                return []
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        elif isinstance(v, (list, tuple)):
            return [str(origin).strip() for origin in v if str(origin).strip()]
        return []

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
