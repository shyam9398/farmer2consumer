from sqlalchemy import (
    CheckConstraint,
    Column,
    Date,
    DateTime,
    Index,
    Numeric,
    String,
)
from app.models.base import BaseModel
from app.models.enums import PriceUnit, ProductCategory, QualityGrade


class PriceObservation(BaseModel):
    """
    Market reference price observation collected from external market APIs,
    government databases, admin manual entries, CSV imports, or Mandi Direct transactions.
    Used by PriceIntelligenceService for regional pricing and recommendation models.
    """
    __tablename__ = "price_observations"

    product_name = Column(String(150), nullable=False, index=True)
    category = Column(
        String(50),
        nullable=False,
        default=ProductCategory.VEGETABLE.value,
        index=True,
    )
    variety = Column(String(100), nullable=True, index=True)
    quality_grade = Column(
        String(30),
        nullable=True,
        default=QualityGrade.UNGRADED.value,
        index=True,
    )

    # Price & Unit
    price = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), nullable=False, default="INR", server_default="INR")
    price_unit = Column(
        String(20),
        nullable=False,
        default=PriceUnit.PER_KG.value,
        server_default="PER_KG",
    )

    # Location & Mandi Metadata
    market_name = Column(String(150), nullable=True, index=True)
    district = Column(String(100), nullable=True, index=True)
    state = Column(String(100), nullable=True, index=True)

    # Provenance / Lineage
    source_type = Column(
        String(50),
        nullable=False,
        index=True,
        doc="MANDI_DIRECT_TRANSACTION | GOVERNMENT_DATA | EXTERNAL_API | ADMIN_IMPORT | OTHER",
    )
    source_name = Column(String(150), nullable=False)
    source_reference = Column(String(255), nullable=True)

    # Date of observation
    observation_date = Column(Date, nullable=False, index=True)

    __table_args__ = (
        CheckConstraint("price > 0", name="check_positive_observation_price"),
        CheckConstraint(
            "source_type IN ('MANDI_DIRECT_TRANSACTION', 'GOVERNMENT_DATA', 'EXTERNAL_API', 'ADMIN_IMPORT', 'OTHER')",
            name="check_valid_price_source_type",
        ),
        Index("ix_price_obs_product_date", "product_name", "observation_date"),
        Index("ix_price_obs_prod_var_qual", "product_name", "variety", "quality_grade"),
        Index("ix_price_obs_loc_prod", "state", "district", "product_name"),
    )

    def __repr__(self) -> str:
        return f"<PriceObservation id={self.id} product={self.product_name} price={self.price}/{self.price_unit} source={self.source_type}>"
