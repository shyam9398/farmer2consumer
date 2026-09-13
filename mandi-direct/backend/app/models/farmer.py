from sqlalchemy import (
    CheckConstraint,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    JSON,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import relationship, backref
from app.models.base import BaseModel
from app.models.enums import (
    AreaUnit,
    Gender,
    IrrigationType,
    OwnershipType,
    SoilType,
    VerificationStatus,
)


class FarmerProfile(BaseModel):
    """
    Dedicated profile table for users with role FARMER.
    Linked 1-to-1 with the core profiles table.
    """
    __tablename__ = "farmer_profiles"

    profile_id = Column(
        String(36),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
        doc="References profiles.id",
    )
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String(32), nullable=True)
    profile_photo_url = Column(Text, nullable=True)
    address_line = Column(Text, nullable=False)
    village = Column(String(100), nullable=False)
    mandal = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    pincode = Column(String(10), nullable=False)
    verification_status = Column(
        String(32),
        nullable=False,
        default=VerificationStatus.PENDING.value,
        server_default="PENDING",
    )
    verification_notes = Column(Text, nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    verified_by = Column(
        String(36),
        ForeignKey("profiles.id", ondelete="SET NULL"),
        nullable=True,
        doc="Admin profile ID who approved/rejected the farmer",
    )
    rating = Column(Numeric(3, 2), nullable=True, doc="Aggregated rating score from 1.00 to 5.00")
    review_count = Column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
        doc="Total number of verified buyer reviews",
    )

    @property
    def address(self) -> str:
        return self.address_line

    # Relationships
    verified_by_admin = relationship("Profile", foreign_keys=[verified_by])
    profile = relationship(
        "Profile",
        foreign_keys=[profile_id],
        backref=backref("farmer_profile", uselist=False, cascade="all, delete-orphan"),
    )
    farms = relationship(
        "Farm",
        back_populates="farmer_profile",
        cascade="all, delete-orphan",
        order_by="Farm.created_at.desc()",
    )
    produce_listings = relationship(
        "ProduceListing",
        back_populates="farmer_profile",
        cascade="all, delete-orphan",
        order_by="ProduceListing.created_at.desc()",
    )

    __table_args__ = (
        CheckConstraint(
            "verification_status IN ('PENDING', 'VERIFIED', 'REJECTED')",
            name="check_valid_verification_status",
        ),
        CheckConstraint(
            "gender IS NULL OR gender IN ('MALE', 'FEMALE', 'OTHER')",
            name="check_valid_farmer_gender",
        ),
        Index("ix_farmer_profiles_district_state", "district", "state"),
        Index("ix_farmer_profiles_verification_status", "verification_status"),
    )

    def __repr__(self) -> str:
        return (
            f"<FarmerProfile id={self.id} profile_id={self.profile_id} "
            f"status={self.verification_status}>"
        )


class Farm(BaseModel):
    """
    Individual farm parcel belonging to a farmer profile.
    Supports multi-farm management per farmer.
    """
    __tablename__ = "farms"

    farmer_profile_id = Column(
        String(36),
        ForeignKey("farmer_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="References farmer_profiles.id",
    )
    farm_name = Column(String(150), nullable=False)
    total_area = Column(Numeric(10, 2), nullable=False)
    area_unit = Column(
        String(20),
        nullable=False,
        default=AreaUnit.ACRE.value,
        server_default="ACRE",
    )
    ownership_type = Column(
        String(20),
        nullable=False,
        default=OwnershipType.OWNED.value,
        server_default="OWNED",
    )
    soil_type = Column(String(30), nullable=True)
    irrigation_type = Column(String(30), nullable=True)
    primary_crops = Column(
        JSON,
        nullable=True,
        doc="Array of primary crop names cultivated on this farm",
    )
    latitude = Column(Numeric(9, 6), nullable=True)
    longitude = Column(Numeric(9, 6), nullable=True)
    address_line = Column(Text, nullable=True)
    village = Column(String(100), nullable=False)
    mandal = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    pincode = Column(String(10), nullable=False)

    # Relationships
    farmer_profile = relationship("FarmerProfile", back_populates="farms")
    produce_listings = relationship(
        "ProduceListing",
        back_populates="farm",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        CheckConstraint(
            "total_area > 0",
            name="check_positive_farm_area",
        ),
        CheckConstraint(
            "area_unit IN ('ACRE', 'HECTARE')",
            name="check_valid_area_unit",
        ),
        CheckConstraint(
            "ownership_type IN ('OWNED', 'LEASED', 'FAMILY', 'OTHER')",
            name="check_valid_ownership_type",
        ),
        Index("ix_farms_district_state", "district", "state"),
    )

    def __repr__(self) -> str:
        return (
            f"<Farm id={self.id} name='{self.farm_name}' "
            f"area={self.total_area} {self.area_unit}>"
        )
