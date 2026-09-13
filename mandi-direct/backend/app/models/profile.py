from sqlalchemy import Boolean, CheckConstraint, Column, Enum as SQLEnum, Index, String, Text
from app.models.base import BaseModel
from app.models.enums import UserRole, UserStatus


class Profile(BaseModel):
    """
    User profile table mapped to Supabase auth.users.
    
    Database constraints enforce:
    - Unique auth_user_id linked to Supabase authentication identity
    - Strict role validation: FARMER, BUYER, ADMIN, FPO, LOGISTICS
    - Status validation: ACTIVE, PENDING, SUSPENDED
    """
    __tablename__ = "profiles"

    auth_user_id = Column(
        String(64),
        unique=True,
        nullable=False,
        index=True,
        doc="References Supabase auth.users UUID",
    )
    full_name = Column(String(255), nullable=False)
    phone = Column(String(32), nullable=True)
    email = Column(String(255), nullable=False, index=True)
    
    avatar_url = Column(Text, nullable=True)
    is_active = Column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
        doc="Whether profile account is active",
    )
    role = Column(
        String(32),
        nullable=False,
        default=UserRole.FARMER.value,
        doc="Enforced system role: FARMER, BUYER, ADMIN, FPO, LOGISTICS",
    )
    status = Column(
        String(32),
        nullable=False,
        default=UserStatus.ACTIVE.value,
        doc="Account state: ACTIVE, PENDING, SUSPENDED",
    )

    __table_args__ = (
        CheckConstraint(
            "role IN ('FARMER', 'BUYER', 'ADMIN', 'FPO', 'LOGISTICS', 'CONSUMER')",
            name="check_valid_user_role",
        ),
        CheckConstraint(
            "status IN ('ACTIVE', 'PENDING', 'SUSPENDED')",
            name="check_valid_user_status",
        ),
        Index("ix_profiles_role", "role"),
    )

    def __repr__(self) -> str:
        return f"<Profile id={self.id} email={self.email} role={self.role}>"
