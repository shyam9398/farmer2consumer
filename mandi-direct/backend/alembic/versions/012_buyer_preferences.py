"""Create buyer_preferences table for Phase 13 Smart Farmer-Buyer Matching.

Revision ID: 012_buyer_preferences
Revises: 011_demand_intelligence_indexes
Create Date: 2026-09-12 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "012_buyer_preferences"
down_revision: Union[str, None] = "011_demand_intelligence_indexes"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "buyer_preferences",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("buyer_user_id", sa.String(length=36), nullable=False),
        sa.Column("preferred_categories", sa.JSON(), nullable=True),
        sa.Column("preferred_products", sa.JSON(), nullable=True),
        sa.Column("preferred_varieties", sa.JSON(), nullable=True),
        sa.Column("preferred_quality_grades", sa.JSON(), nullable=True),
        sa.Column("preferred_districts", sa.JSON(), nullable=True),
        sa.Column("preferred_states", sa.JSON(), nullable=True),
        sa.Column("minimum_quantity", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("maximum_quantity", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("minimum_price", sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column("maximum_price", sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["buyer_user_id"], ["profiles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("buyer_user_id", name="uq_buyer_preferences_buyer_user_id"),
        sa.CheckConstraint("minimum_quantity IS NULL OR minimum_quantity >= 0", name="check_valid_pref_min_qty"),
        sa.CheckConstraint("maximum_quantity IS NULL OR maximum_quantity >= 0", name="check_valid_pref_max_qty"),
        sa.CheckConstraint("minimum_price IS NULL OR minimum_price >= 0", name="check_valid_pref_min_price"),
        sa.CheckConstraint("maximum_price IS NULL OR maximum_price >= 0", name="check_valid_pref_max_price"),
    )
    op.create_index("ix_buyer_preferences_buyer_id", "buyer_preferences", ["buyer_user_id"])


def downgrade() -> None:
    op.drop_index("ix_buyer_preferences_buyer_id", table_name="buyer_preferences")
    op.drop_table("buyer_preferences")
