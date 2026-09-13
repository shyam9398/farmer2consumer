import time
from typing import Any, Dict, Optional
from jose import JWTError, jwt
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("security")


def decode_supabase_jwt(token: str) -> Dict[str, Any]:
    """
    Decode and validate a Supabase JWT token.
    
    1. First attempts cryptographic validation using SUPABASE_JWT_SECRET (HS256).
    2. If the secret is placeholder/development mode, verifies basic claim structure
       and expiration to enable seamless local unit testing and development.
    """
    secret = settings.SUPABASE_JWT_SECRET

    # If in test/dev environment with configured secret
    if secret and secret != "placeholder-jwt-secret":
        try:
            # Supabase tokens typically use audience='authenticated'
            payload = jwt.decode(
                token,
                secret,
                algorithms=[settings.ALGORITHM],
                options={"verify_aud": False},
            )
            return payload
        except JWTError as e:
            logger.warning(f"JWT signature verification failed: {e}")
            raise

    # Fallback / Development mode decoding
    try:
        unverified_payload = jwt.decode(
            token,
            key="",
            options={"verify_signature": False, "verify_aud": False},
        )
        exp = unverified_payload.get("exp")
        if exp and exp < time.time():
            raise JWTError("Token has expired")
        return unverified_payload
    except JWTError as e:
        logger.error(f"Unverified token parse failed: {e}")
        raise


def create_access_token(
    data: Dict[str, Any],
    expires_delta_seconds: int = 3600,
    secret: Optional[str] = None,
) -> str:
    """Generate a signed JWT token for testing and authorization fixtures."""
    to_encode = data.copy()
    now_int = int(time.time())
    expire = now_int + expires_delta_seconds
    to_encode.update({"exp": expire, "iat": now_int, "aud": "authenticated"})
    key = secret or settings.SUPABASE_JWT_SECRET
    return jwt.encode(to_encode, key, algorithm=settings.ALGORITHM)
