from typing import Optional
from sqlalchemy.orm import Session
from app.models.enums import UserRole, UserStatus
from app.models.profile import Profile
from app.repositories.base import BaseRepository
from app.schemas.auth import ProfileCreateRequest, ProfileUpdateRequest


class ProfileRepository(BaseRepository[Profile, ProfileCreateRequest, ProfileUpdateRequest]):
    """Profile data access methods."""

    def __init__(self):
        super().__init__(Profile)

    def get_by_auth_user_id(self, db: Session, auth_user_id: str) -> Optional[Profile]:
        return db.query(Profile).filter(Profile.auth_user_id == auth_user_id).first()

    def get_by_email(self, db: Session, email: str) -> Optional[Profile]:
        return db.query(Profile).filter(Profile.email == email.lower().strip()).first()

    def create_with_auth(
        self,
        db: Session,
        *,
        auth_user_id: str,
        email: str,
        full_name: str,
        phone: Optional[str] = None,
        role: UserRole = UserRole.FARMER,
        status: UserStatus = UserStatus.ACTIVE,
    ) -> Profile:
        db_obj = Profile(
            auth_user_id=auth_user_id,
            email=email.lower().strip(),
            full_name=full_name.strip(),
            phone=phone.strip() if phone else None,
            role=role.value if isinstance(role, UserRole) else role,
            status=status.value if isinstance(status, UserStatus) else status,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


profile_repository = ProfileRepository()
