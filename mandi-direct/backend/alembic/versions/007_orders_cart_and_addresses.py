"""Add buyer addresses, shopping cart, orders, order items, and status history tables.

Revision ID: 007_orders_cart_and_addresses
Revises: 006_marketplace_indexes
Create Date: 2026-09-10 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "007_orders_cart_and_addresses"
down_revision: Union[str, None] = "006_marketplace_indexes"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. buyer_addresses table
    op.create_table(
        "buyer_addresses",
        sa.Column("id", sa.String(36), primary_key=True, nullable=False),
        sa.Column("buyer_user_id", sa.String(36), sa.ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("full_name", sa.String(150), nullable=False),
        sa.Column("phone", sa.String(32), nullable=False),
        sa.Column("address_line1", sa.Text(), nullable=False),
        sa.Column("address_line2", sa.Text(), nullable=True),
        sa.Column("village", sa.String(100), nullable=True),
        sa.Column("mandal", sa.String(100), nullable=True),
        sa.Column("district", sa.String(100), nullable=False),
        sa.Column("state", sa.String(100), nullable=False),
        sa.Column("pincode", sa.String(10), nullable=False),
        sa.Column("landmark", sa.String(150), nullable=True),
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_buyer_addresses_buyer_id", "buyer_addresses", ["buyer_user_id"])
    op.create_index("ix_buyer_addresses_buyer_default", "buyer_addresses", ["buyer_user_id", "is_default"])

    # 2. shopping_carts table
    op.create_table(
        "shopping_carts",
        sa.Column("id", sa.String(36), primary_key=True, nullable=False),
        sa.Column("buyer_user_id", sa.String(36), sa.ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_shopping_carts_buyer_id", "shopping_carts", ["buyer_user_id"])

    # 3. cart_items table
    op.create_table(
        "cart_items",
        sa.Column("id", sa.String(36), primary_key=True, nullable=False),
        sa.Column("cart_id", sa.String(36), sa.ForeignKey("shopping_carts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("produce_listing_id", sa.String(36), sa.ForeignKey("produce_listings.id", ondelete="CASCADE"), nullable=False),
        sa.Column("quantity", sa.Numeric(12, 2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("cart_id", "produce_listing_id", name="uq_cart_items_produce"),
    )
    op.create_index("ix_cart_items_cart_id", "cart_items", ["cart_id"])
    op.create_index("ix_cart_items_produce_id", "cart_items", ["produce_listing_id"])

    # 4. orders table
    op.create_table(
        "orders",
        sa.Column("id", sa.String(36), primary_key=True, nullable=False),
        sa.Column("order_number", sa.String(64), nullable=False, unique=True),
        sa.Column("buyer_user_id", sa.String(36), sa.ForeignKey("profiles.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default="PENDING"),
        sa.Column("payment_status", sa.String(32), nullable=False, server_default="PENDING"),
        sa.Column("subtotal", sa.Numeric(12, 2), nullable=False),
        sa.Column("delivery_fee", sa.Numeric(12, 2), nullable=False, server_default="0.00"),
        sa.Column("total_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("delivery_address_id", sa.String(36), sa.ForeignKey("buyer_addresses.id", ondelete="SET NULL"), nullable=True),
        sa.Column("delivery_address_snapshot", sa.JSON(), nullable=False),
        sa.Column("buyer_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "status IN ('PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REJECTED')",
            name="check_valid_order_status",
        ),
        sa.CheckConstraint(
            "payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')",
            name="check_valid_payment_status",
        ),
    )
    op.create_index("ix_orders_order_number", "orders", ["order_number"])
    op.create_index("ix_orders_buyer_status", "orders", ["buyer_user_id", "status"])
    op.create_index("ix_orders_created_at", "orders", ["created_at"])

    # 5. order_items table
    op.create_table(
        "order_items",
        sa.Column("id", sa.String(36), primary_key=True, nullable=False),
        sa.Column("order_id", sa.String(36), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False),
        sa.Column("produce_listing_id", sa.String(36), sa.ForeignKey("produce_listings.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("farmer_profile_id", sa.String(36), sa.ForeignKey("farmer_profiles.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("product_name", sa.String(150), nullable=False),
        sa.Column("quantity", sa.Numeric(12, 2), nullable=False),
        sa.Column("quantity_unit", sa.String(20), nullable=False),
        sa.Column("unit_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("subtotal", sa.Numeric(12, 2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_order_items_order_id", "order_items", ["order_id"])
    op.create_index("ix_order_items_farmer_order", "order_items", ["farmer_profile_id", "order_id"])
    op.create_index("ix_order_items_produce_id", "order_items", ["produce_listing_id"])

    # 6. order_status_history table
    op.create_table(
        "order_status_history",
        sa.Column("id", sa.String(36), primary_key=True, nullable=False),
        sa.Column("order_id", sa.String(36), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False),
        sa.Column("previous_status", sa.String(32), nullable=True),
        sa.Column("new_status", sa.String(32), nullable=False),
        sa.Column("changed_by", sa.String(36), sa.ForeignKey("profiles.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_order_status_history_order_id", "order_status_history", ["order_id"])


def downgrade() -> None:
    op.drop_table("order_status_history")
    op.drop_table("order_items")
    op.drop_table("orders")
    op.drop_table("cart_items")
    op.drop_table("shopping_carts")
    op.drop_table("buyer_addresses")
