from typing import Callable, Generator, List, Optional
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.logging import get_logger
from app.core.security import decode_supabase_jwt
from app.models.enums import UserRole, UserStatus
from app.models.profile import Profile
from app.schemas.auth import TokenPayload
from app.services.profile import profile_service

logger = get_logger("deps")

security_bearer = HTTPBearer(auto_error=False)


def get_db() -> Generator[Session, None, None]:
    """Provide a database session for request scope."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_token_payload(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_bearer),
) -> TokenPayload:
    """
    Validate Supabase Bearer token and return extracted token claims.
    Raises HTTP 401 if token is missing, invalid, or expired.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    try:
        payload = decode_supabase_jwt(token)
    except JWTError as e:
        logger.warning(f"Rejected invalid JWT token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Unexpected token validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is invalid.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    auth_user_id: Optional[str] = payload.get("sub")
    if not auth_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing subject identifier (sub).",
            headers={"WWW-Authenticate": "Bearer"},
        )

    email: Optional[str] = payload.get("email")
    role: Optional[str] = payload.get("role")
    exp: Optional[int] = payload.get("exp")

    return TokenPayload(sub=auth_user_id, email=email, role=role, exp=exp)


def get_current_user(
    token_payload: TokenPayload = Depends(get_token_payload),
    db: Session = Depends(get_db),
) -> Profile:
    """
    Load user's Profile record from PostgreSQL using verified auth_user_id.
    Raises HTTP 401 if user profile does not exist.
    """
    profile = profile_service.get_profile_by_auth_id(db, token_payload.sub)
    if not profile:
        logger.warning(f"Profile not found for auth_user_id: {token_payload.sub}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User profile not found. Please complete profile registration.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return profile


def get_current_active_user(
    current_user: Profile = Depends(get_current_user),
) -> Profile:
    """
    Ensure the authenticated user account is in ACTIVE status.
    Raises HTTP 403 if account is suspended.
    """
    if current_user.status == UserStatus.SUSPENDED.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended. Please contact Mandi Direct support.",
        )
    return current_user


def require_roles(*allowed_roles: UserRole) -> Callable[[Profile], Profile]:
    """
    Role-Based Access Control (RBAC) Dependency Factory.
    
    Validates that the active user possesses one of the allowed roles.
    Never trusts frontend-supplied roles: compares against the DB-verified profile.role.
    Raises HTTP 403 Forbidden if user does not have permission.
    """
    expected_values = [r.value if isinstance(r, UserRole) else str(r) for r in allowed_roles]

    def role_checker(current_user: Profile = Depends(get_current_active_user)) -> Profile:
        if current_user.role not in expected_values:
            logger.warning(
                f"Forbidden access: User {current_user.id} with role '{current_user.role}' "
                f"attempted to access endpoint restricted to {expected_values}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: Insufficient role permissions. Required: {expected_values}",
            )
        return current_user

    return role_checker


def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_bearer),
    db: Session = Depends(get_db),
) -> Optional[Profile]:
    """
    Optional authentication dependency. Returns Profile if valid Bearer token provided, else None.
    """
    if not credentials or not credentials.credentials:
        return None
    try:
        payload = decode_supabase_jwt(credentials.credentials)
        auth_user_id = payload.get("sub")
        if not auth_user_id:
            return None
        return profile_service.get_profile_by_auth_id(db, auth_user_id)
    except Exception:
        return None

