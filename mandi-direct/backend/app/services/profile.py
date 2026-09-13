from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.core.logging import get_logger
from app.models.enums import UserRole, UserStatus
from app.models.profile import Profile
from app.repositories.profile import profile_repository
from app.schemas.auth import ProfileCreateRequest, ProfileUpdateRequest

logger = get_logger("profile_service")


class ProfileService:
    """Service handling profile synchronization and role queries."""

    def get_profile_by_auth_id(self, db: Session, auth_user_id: str) -> Optional[Profile]:
        return profile_repository.get_by_auth_user_id(db, auth_user_id)

    def create_or_sync_profile(
        self,
        db: Session,
        *,
        auth_user_id: str,
        email: str,
        data: ProfileCreateRequest,
    ) -> Profile:
        # Check if already registered
        existing = profile_repository.get_by_auth_user_id(db, auth_user_id)
        if existing:
            logger.info(f"Profile already exists for auth_user_id {auth_user_id}")
            return existing

        # Check for email collision
        existing_email = profile_repository.get_by_email(db, email)
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A profile with this email address already exists.",
            )

        # Enforce server-side security rule: ADMIN role can never be self-assigned
        if data.role == UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="ADMIN role cannot be self-assigned through profile registration.",
            )

        profile = profile_repository.create_with_auth(
            db,
            auth_user_id=auth_user_id,
            email=email,
            full_name=data.full_name,
            phone=data.phone,
            role=data.role,
            status=UserStatus.ACTIVE,
        )
        logger.info(f"Created profile {profile.id} for user {email} with role {profile.role}")
        return profile

    def update_profile(
        self,
        db: Session,
        *,
        profile: Profile,
        data: ProfileUpdateRequest,
    ) -> Profile:
        return profile_repository.update(db, db_obj=profile, obj_in=data)


profile_service = ProfileService()
