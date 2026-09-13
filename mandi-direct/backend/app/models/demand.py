from sqlalchemy import (
    Column,
    Date,
    Index,
    Integer,
    Numeric,
    String,
)
from app.models.base import BaseModel


class DemandSnapshot(BaseModel):
    """
    Persisted demand analytics snapshot aggregated over temporal windows.
    """
    __tablename__ = "demand_snapshots"

    product_name = Column(String(150), nullable=False, index=True)
    category = Column(String(50), nullable=True, index=True)
    district = Column(String(100), nullable=True, index=True)
    state = Column(String(100), nullable=True, index=True)

    period_start = Column(Date, nullable=False, index=True)
    period_end = Column(Date, nullable=False)

    order_count = Column(Integer, nullable=False, default=0, server_default="0")
    quantity_sold = Column(Numeric(12, 2), nullable=False, default=0, server_default="0")
    unique_buyers = Column(Integer, nullable=False, default=0, server_default="0")

    demand_score = Column(Numeric(5, 2), nullable=True)
    demand_level = Column(String(32), nullable=True, doc="VERY_HIGH, HIGH, MODERATE, LOW")
    trend = Column(String(32), nullable=True, doc="UPWARD, STABLE, DOWNWARD")

    __table_args__ = (
        Index("ix_demand_snapshots_product_date", "product_name", "period_start"),
        Index("ix_demand_snapshots_district_product", "district", "product_name"),
    )

    def __repr__(self) -> str:
        return f"<DemandSnapshot id={self.id} product='{self.product_name}' score={self.demand_score}>"
