"""Add marketplace discovery indexes to produce_listings.

Revision ID: 006_marketplace_indexes
Revises: 005_verification_system
Create Date: 2026-09-09 12:45:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "006_marketplace_indexes"
down_revision: Union[str, None] = "005_verification_system"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        "ix_produce_listings_expected_price",
        "produce_listings",
        ["expected_price"],
    )
    op.create_index(
        "ix_produce_listings_harvest_date",
        "produce_listings",
        ["harvest_date"],
    )
    op.create_index(
        "ix_produce_listings_available_until",
        "produce_listings",
        ["available_until"],
    )
    op.create_index(
        "ix_produce_listings_status_available_qty",
        "produce_listings",
        ["status", "available_quantity"],
    )


def downgrade() -> None:
    op.drop_index("ix_produce_listings_status_available_qty", table_name="produce_listings")
    op.drop_index("ix_produce_listings_available_until", table_name="produce_listings")
    op.drop_index("ix_produce_listings_harvest_date", table_name="produce_listings")
    op.drop_index("ix_produce_listings_expected_price", table_name="produce_listings")
