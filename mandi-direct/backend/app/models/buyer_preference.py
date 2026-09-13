from sqlalchemy import (
    CheckConstraint,
    Column,
    ForeignKey,
    Index,
    JSON,
    Numeric,
    String,
)
from sqlalchemy.orm import relationship, backref
from app.models.base import BaseModel


class BuyerPreference(BaseModel):
    """
    Buyer produce and procurement interest preferences.
    Used by Smart Farmer-Buyer Matching Engine for deterministic matching recommendations.
    Enforces tenant isolation by buyer_user_id.
    """
    __tablename__ = "buyer_preferences"

    buyer_user_id = Column(
        String(36),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
        doc="References profiles.id of the buyer",
    )

    # Criteria Arrays stored as cross-compatible JSON
    preferred_categories = Column(
        JSON,
        nullable=True,
        default=list,
        doc="List of preferred ProductCategory values (e.g. ['VEGETABLE', 'FRUIT'])",
    )
    preferred_products = Column(
        JSON,
        nullable=True,
        default=list,
        doc="List of preferred product names (e.g. ['Tomato', 'Onion'])",
    )
    preferred_varieties = Column(
        JSON,
        nullable=True,
        default=list,
        doc="List of preferred produce varieties (e.g. ['Hybrid', 'Desi'])",
    )
    preferred_quality_grades = Column(
        JSON,
        nullable=True,
        default=list,
        doc="List of preferred QualityGrade values (e.g. ['GRADE_A', 'PREMIUM'])",
    )
    preferred_districts = Column(
        JSON,
        nullable=True,
        default=list,
        doc="List of preferred farming districts (e.g. ['Krishna', 'Kolar'])",
    )
    preferred_states = Column(
        JSON,
        nullable=True,
        default=list,
        doc="List of preferred farming states (e.g. ['Andhra Pradesh', 'Karnataka'])",
    )

    # Quantity range compatibility
    minimum_quantity = Column(
        Numeric(12, 2),
        nullable=True,
        doc="Minimum acceptable procurement lot size in KG",
    )
    maximum_quantity = Column(
        Numeric(12, 2),
        nullable=True,
        doc="Maximum acceptable procurement lot size in KG",
    )

    # Price range compatibility
    minimum_price = Column(
        Numeric(10, 2),
        nullable=True,
        doc="Target minimum price per KG (INR)",
    )
    maximum_price = Column(
        Numeric(10, 2),
        nullable=True,
        doc="Target maximum price per KG (INR)",
    )

    # Relationships
    buyer = relationship(
        "Profile",
        foreign_keys=[buyer_user_id],
        backref=backref("preferences", uselist=False, cascade="all, delete-orphan"),
    )

    __table_args__ = (
        CheckConstraint(
            "minimum_quantity IS NULL OR minimum_quantity >= 0",
            name="check_valid_pref_min_qty",
        ),
        CheckConstraint(
            "maximum_quantity IS NULL OR maximum_quantity >= 0",
            name="check_valid_pref_max_qty",
        ),
        CheckConstraint(
            "minimum_price IS NULL OR minimum_price >= 0",
            name="check_valid_pref_min_price",
        ),
        CheckConstraint(
            "maximum_price IS NULL OR maximum_price >= 0",
            name="check_valid_pref_max_price",
        ),
        Index("ix_buyer_preferences_buyer_id", "buyer_user_id"),
    )

    def __repr__(self) -> str:
        return f"<BuyerPreference id={self.id} buyer_user_id={self.buyer_user_id}>"
