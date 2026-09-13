from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class FpoOrganization(BaseModel):
    """
    Farmer Producer Organization (FPO) entity for collective produce aggregation,
    processing, and institutional supply chain coordination.
    """
    __tablename__ = "fpo_organizations"

    name = Column(String(200), nullable=False, index=True)
    registration_number = Column(String(100), nullable=True, unique=True, index=True)
    description = Column(Text, nullable=True)
    phone = Column(String(32), nullable=True)
    email = Column(String(255), nullable=True, index=True)
    address = Column(Text, nullable=True)
    village = Column(String(100), nullable=True)
    mandal = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True, index=True)
    state = Column(String(100), nullable=True, index=True)
    pincode = Column(String(10), nullable=True, index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    verification_status = Column(
        String(32),
        nullable=False,
        default="PENDING",
        server_default="PENDING",
        index=True,
    )

    # Relationships
    members = relationship("FpoMember", back_populates="fpo", cascade="all, delete-orphan")
    collection_points = relationship("CollectionPoint", back_populates="fpo")

    def __repr__(self) -> str:
        return f"<FpoOrganization id={self.id} name='{self.name}' status='{self.verification_status}'>"


class FpoMember(BaseModel):
    """
    Association between an FPO Organization and an enrolled FarmerProfile.
    """
    __tablename__ = "fpo_members"

    fpo_id = Column(
        String(36),
        ForeignKey("fpo_organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    farmer_profile_id = Column(
        String(36),
        ForeignKey("farmer_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    membership_status = Column(
        String(32),
        nullable=False,
        default="ACTIVE",
        server_default="ACTIVE",
        index=True,
    )
    joined_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    fpo = relationship("FpoOrganization", back_populates="members")
    farmer_profile = relationship("FarmerProfile", foreign_keys=[farmer_profile_id])

    __table_args__ = (
        UniqueConstraint("fpo_id", "farmer_profile_id", name="uq_fpo_farmer_member"),
        Index("ix_fpo_members_status", "fpo_id", "membership_status"),
    )

    def __repr__(self) -> str:
        return f"<FpoMember id={self.id} fpo={self.fpo_id} farmer={self.farmer_profile_id}>"
