"""Add collection_points, order_logistics, and delivery_confirmations tables.

Revision ID: 008_logistics_and_collection_points
Revises: 007_orders_cart_and_addresses
Create Date: 2026-09-11 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "008_logistics_and_collection_points"
down_revision: Union[str, None] = "007_orders_cart_and_addresses"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. collection_points table
    op.create_table(
        "collection_points",
        sa.Column("id", sa.String(36), primary_key=True, nullable=False),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("address", sa.Text(), nullable=False),
        sa.Column("village", sa.String(100), nullable=True),
        sa.Column("mandal", sa.String(100), nullable=True),
        sa.Column("district", sa.String(100), nullable=False),
        sa.Column("state", sa.String(100), nullable=False),
        sa.Column("pincode", sa.String(10), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("contact_name", sa.String(150), nullable=False),
        sa.Column("contact_phone", sa.String(32), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_collection_points_name", "collection_points", ["name"])
    op.create_index("ix_collection_points_district", "collection_points", ["district"])
    op.create_index("ix_collection_points_pincode", "collection_points", ["pincode"])
    op.create_index("ix_collection_points_is_active", "collection_points", ["is_active"])
    op.create_index("ix_collection_points_district_active", "collection_points", ["district", "is_active"])

    # 2. order_logistics table
    op.create_table(
        "order_logistics",
        sa.Column("id", sa.String(36), primary_key=True, nullable=False),
        sa.Column("order_id", sa.String(36), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("collection_type", sa.String(32), nullable=False, server_default="COLLECTION_POINT"),
        sa.Column("collection_point_id", sa.String(36), sa.ForeignKey("collection_points.id", ondelete="SET NULL"), nullable=True),
        sa.Column("pickup_address", sa.Text(), nullable=True),
        sa.Column("pickup_village", sa.String(100), nullable=True),
        sa.Column("pickup_mandal", sa.String(100), nullable=True),
        sa.Column("pickup_district", sa.String(100), nullable=True),
        sa.Column("pickup_state", sa.String(100), nullable=True),
        sa.Column("pickup_pincode", sa.String(10), nullable=True),
        sa.Column("pickup_latitude", sa.Float(), nullable=True),
        sa.Column("pickup_longitude", sa.Float(), nullable=True),
        sa.Column("delivery_address", sa.Text(), nullable=True),
        sa.Column("delivery_village", sa.String(100), nullable=True),
        sa.Column("delivery_mandal", sa.String(100), nullable=True),
        sa.Column("delivery_district", sa.String(100), nullable=True),
        sa.Column("delivery_state", sa.String(100), nullable=True),
        sa.Column("delivery_pincode", sa.String(10), nullable=True),
        sa.Column("delivery_latitude", sa.Float(), nullable=True),
        sa.Column("delivery_longitude", sa.Float(), nullable=True),
        sa.Column("assigned_agent_name", sa.String(150), nullable=True),
        sa.Column("assigned_agent_phone", sa.String(32), nullable=True),
        sa.Column("vehicle_type", sa.String(64), nullable=True),
        sa.Column("vehicle_number", sa.String(32), nullable=True),
        sa.Column("pickup_scheduled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("pickup_completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("delivery_started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("delivery_completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("estimated_delivery_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("delivery_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_order_logistics_order_id", "order_logistics", ["order_id"])
    op.create_index("ix_order_logistics_collection_point_id", "order_logistics", ["collection_point_id"])
    op.create_index("ix_order_logistics_pickup_sched", "order_logistics", ["pickup_scheduled_at"])
    op.create_index("ix_order_logistics_est_delivery", "order_logistics", ["estimated_delivery_at"])

    # 3. delivery_confirmations table
    op.create_table(
        "delivery_confirmations",
        sa.Column("id", sa.String(36), primary_key=True, nullable=False),
        sa.Column("order_id", sa.String(36), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("confirmed_by", sa.String(36), sa.ForeignKey("profiles.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("confirmation_type", sa.String(32), nullable=False, server_default="MANUAL"),
        sa.Column("recipient_name", sa.String(150), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("confirmed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_delivery_confirmations_order_id", "delivery_confirmations", ["order_id"])
    op.create_index("ix_delivery_confirmations_confirmed_by", "delivery_confirmations", ["confirmed_by"])


def downgrade() -> None:
    op.drop_table("delivery_confirmations")
    op.drop_table("order_logistics")
    op.drop_table("collection_points")
