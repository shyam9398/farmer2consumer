"""Add price_observations table with indexes and constraints for Phase 11.

Revision ID: 010_price_intelligence_observations
Revises: 009_farmer_earnings_and_payouts
Create Date: 2026-09-11 21:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "010_price_intelligence_observations"
down_revision: Union[str, None] = "009_farmer_earnings_and_payouts"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "price_observations",
        sa.Column("id", sa.String(36), primary_key=True, nullable=False),
        sa.Column("product_name", sa.String(150), nullable=False),
        sa.Column("category", sa.String(50), nullable=False, server_default="VEGETABLE"),
        sa.Column("variety", sa.String(100), nullable=True),
        sa.Column("quality_grade", sa.String(30), nullable=True, server_default="UNGRADED"),
        sa.Column("price", sa.Numeric(10, 2), nullable=False),
        sa.Column("currency", sa.String(10), nullable=False, server_default="INR"),
        sa.Column("price_unit", sa.String(20), nullable=False, server_default="PER_KG"),
        sa.Column("market_name", sa.String(150), nullable=True),
        sa.Column("district", sa.String(100), nullable=True),
        sa.Column("state", sa.String(100), nullable=True),
        sa.Column("source_type", sa.String(50), nullable=False),
        sa.Column("source_name", sa.String(150), nullable=False),
        sa.Column("source_reference", sa.String(255), nullable=True),
        sa.Column("observation_date", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint("price > 0", name="check_positive_observation_price"),
        sa.CheckConstraint(
            "source_type IN ('MANDI_DIRECT_TRANSACTION', 'GOVERNMENT_DATA', 'EXTERNAL_API', 'ADMIN_IMPORT', 'OTHER')",
            name="check_valid_price_source_type",
        ),
    )

    # Create Indexes
    op.create_index("ix_price_observations_product_name", "price_observations", ["product_name"])
    op.create_index("ix_price_observations_category", "price_observations", ["category"])
    op.create_index("ix_price_observations_variety", "price_observations", ["variety"])
    op.create_index("ix_price_observations_quality_grade", "price_observations", ["quality_grade"])
    op.create_index("ix_price_observations_observation_date", "price_observations", ["observation_date"])
    op.create_index("ix_price_observations_district", "price_observations", ["district"])
    op.create_index("ix_price_observations_state", "price_observations", ["state"])
    op.create_index("ix_price_observations_market_name", "price_observations", ["market_name"])
    op.create_index("ix_price_observations_source_type", "price_observations", ["source_type"])

    # Composite Indexes for Aggregations
    op.create_index("ix_price_obs_product_date", "price_observations", ["product_name", "observation_date"])
    op.create_index("ix_price_obs_prod_var_qual", "price_observations", ["product_name", "variety", "quality_grade"])
    op.create_index("ix_price_obs_loc_prod", "price_observations", ["state", "district", "product_name"])


def downgrade() -> None:
    op.drop_table("price_observations")
