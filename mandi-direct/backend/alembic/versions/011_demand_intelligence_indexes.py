"""Add indexes on orders and order_items for Phase 12 Demand Intelligence.

Revision ID: 011_demand_intelligence_indexes
Revises: 010_price_intelligence_observations
Create Date: 2026-09-11 21:52:00.000000

"""
from typing import Sequence, Union
from alembic import op

revision: str = "011_demand_intelligence_indexes"
down_revision: Union[str, None] = "010_price_intelligence_observations"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create indexes for Demand Intelligence SQL aggregations
    op.create_index("ix_order_items_product_name", "order_items", ["product_name"])
    op.create_index(
        "ix_order_items_prod_farmer_order",
        "order_items",
        ["product_name", "farmer_profile_id", "order_id"],
    )
    op.create_index(
        "ix_orders_status_created",
        "orders",
        ["status", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_orders_status_created", table_name="orders")
    op.drop_index("ix_order_items_prod_farmer_order", table_name="order_items")
    op.drop_index("ix_order_items_product_name", table_name="order_items")
