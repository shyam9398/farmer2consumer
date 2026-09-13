from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
from app.models.enums import (
    PriceUnit,
    ProduceStatus,
    ProductCategory,
    QualityGrade,
    QuantityUnit,
)


class ProduceListing(BaseModel):
    """
    Produce listing representing harvest lots created by verified farmers.
    Guards inventory quantities and state machine transitions.
    """
    __tablename__ = "produce_listings"

    farmer_profile_id = Column(
        String(36),
        ForeignKey("farmer_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="References farmer_profiles.id",
    )
    farm_id = Column(
        String(36),
        ForeignKey("farms.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
        doc="References farms.id parcel where produce was cultivated",
    )
    fpo_id = Column(
        String(36),
        ForeignKey("fpo_organizations.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        doc="Optional association with an FPO organization",
    )

    product_name = Column(String(150), nullable=False, index=True)
    category = Column(
        String(50),
        nullable=False,
        default=ProductCategory.VEGETABLE.value,
        index=True,
    )
    variety = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)

    # Inventory Model (Precision decimals for quantities)
    total_quantity = Column(Numeric(12, 2), nullable=False)
    available_quantity = Column(Numeric(12, 2), nullable=False)
    reserved_quantity = Column(
        Numeric(12, 2), nullable=False, default=0, server_default="0"
    )
    sold_quantity = Column(
        Numeric(12, 2), nullable=False, default=0, server_default="0"
    )
    quantity_unit = Column(
        String(20),
        nullable=False,
        default=QuantityUnit.KG.value,
        server_default="KG",
    )

    # Quality Assessment
    quality_grade = Column(
        String(30),
        nullable=False,
        default=QualityGrade.UNGRADED.value,
        server_default="UNGRADED",
    )

    # Harvest & Availability Dates
    harvest_date = Column(Date, nullable=False)
    available_from = Column(Date, nullable=False)
    available_until = Column(Date, nullable=True)

    # Pricing & Order Terms
    expected_price = Column(Numeric(10, 2), nullable=False)
    price_unit = Column(
        String(20),
        nullable=False,
        default=PriceUnit.PER_KG.value,
        server_default="PER_KG",
    )
    minimum_order_quantity = Column(
        Numeric(12, 2), nullable=False, default=1, server_default="1"
    )

    # State Machine & Verification Notes
    status = Column(
        String(30),
        nullable=False,
        default=ProduceStatus.DRAFT.value,
        server_default="DRAFT",
        index=True,
    )
    verification_notes = Column(Text, nullable=True)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    verified_by = Column(
        String(36),
        ForeignKey("profiles.id", ondelete="SET NULL"),
        nullable=True,
        doc="Admin profile ID who approved/rejected the produce listing",
    )

    # Relationships
    verified_by_admin = relationship("Profile", foreign_keys=[verified_by])
    farmer_profile = relationship("FarmerProfile", back_populates="produce_listings")
    farm = relationship("Farm", back_populates="produce_listings")
    images = relationship(
        "ProduceImage",
        back_populates="produce_listing",
        cascade="all, delete-orphan",
        order_by="ProduceImage.sort_order",
    )

    __table_args__ = (
        CheckConstraint(
            "status IN ('DRAFT', 'PENDING_VERIFICATION', 'APPROVED', 'REJECTED', 'LISTED', 'PARTIALLY_SOLD', 'SOLD_OUT', 'EXPIRED', 'ARCHIVED')",
            name="check_valid_produce_status",
        ),
        CheckConstraint(
            "category IN ('VEGETABLE', 'FRUIT', 'GRAIN', 'PULSE', 'SPICE', 'OILSEED', 'OTHER')",
            name="check_valid_product_category",
        ),
        CheckConstraint(
            "quantity_unit IN ('KG', 'QUINTAL', 'TON')",
            name="check_valid_quantity_unit",
        ),
        CheckConstraint(
            "price_unit IN ('PER_KG', 'PER_QUINTAL', 'PER_TON')",
            name="check_valid_price_unit",
        ),
        CheckConstraint(
            "quality_grade IN ('PREMIUM', 'GRADE_A', 'GRADE_B', 'GRADE_C', 'UNGRADED')",
            name="check_valid_quality_grade",
        ),
        CheckConstraint("total_quantity > 0", name="check_positive_total_quantity"),
        CheckConstraint("available_quantity >= 0", name="check_non_negative_available_quantity"),
        CheckConstraint("reserved_quantity >= 0", name="check_non_negative_reserved_quantity"),
        CheckConstraint("sold_quantity >= 0", name="check_non_negative_sold_quantity"),
        CheckConstraint("expected_price > 0", name="check_positive_expected_price"),
        CheckConstraint("minimum_order_quantity > 0", name="check_positive_minimum_order_quantity"),
        Index("ix_produce_listings_category_status", "category", "status"),
        Index("ix_produce_listings_expected_price", "expected_price"),
        Index("ix_produce_listings_harvest_date", "harvest_date"),
        Index("ix_produce_listings_available_until", "available_until"),
        Index("ix_produce_listings_status_available_qty", "status", "available_quantity"),
    )

    def __repr__(self) -> str:
        return (
            f"<ProduceListing id={self.id} product='{self.product_name}' "
            f"qty={self.total_quantity} {self.quantity_unit} status={self.status}>"
        )


class ProduceImage(BaseModel):
    """
    Produce image reference pointing to Supabase Storage objects.
    Enforces 1-5 photos per listing with single primary flag and full metadata.
    """
    __tablename__ = "produce_images"

    produce_listing_id = Column(
        String(36),
        ForeignKey("produce_listings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    storage_path = Column(Text, nullable=False)
    image_url = Column(Text, nullable=False)
    public_url = Column(Text, nullable=True)

    file_name = Column(String(255), nullable=False, default="photo.jpg", server_default="photo.jpg")
    mime_type = Column(String(100), nullable=False, default="image/jpeg", server_default="image/jpeg")
    file_size = Column(Integer, nullable=False, default=0, server_default="0")
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)

    is_primary = Column(Boolean, nullable=False, default=False, server_default="0")
    display_order = Column(Integer, nullable=False, default=0, server_default="0")
    sort_order = Column(Integer, nullable=False, default=0, server_default="0")

    # Relationship
    produce_listing = relationship("ProduceListing", back_populates="images")

    def __repr__(self) -> str:
        return (
            f"<ProduceImage id={self.id} listing_id={self.produce_listing_id} "
            f"name='{self.file_name}' primary={self.is_primary} order={self.display_order}>"
        )
