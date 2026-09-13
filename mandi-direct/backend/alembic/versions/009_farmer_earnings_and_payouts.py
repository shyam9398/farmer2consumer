"""Add farmer_earnings, farmer_payouts, and financial_audit_logs tables.

Revision ID: 009_farmer_earnings_and_payouts
Revises: 008_logistics_and_collection_points
Create Date: 2026-09-11 15:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "009_farmer_earnings_and_payouts"
down_revision: Union[str, None] = "008_logistics_and_collection_points"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. farmer_earnings table
    op.create_table(
        "farmer_earnings",
        sa.Column("id", sa.String(36), primary_key=True, nullable=False),
        sa.Column("farmer_profile_id", sa.String(36), sa.ForeignKey("farmer_profiles.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("order_id", sa.String(36), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False),
        sa.Column("order_item_id", sa.String(36), sa.ForeignKey("order_items.id", ondelete="RESTRICT"), nullable=False, unique=True),
        sa.Column("product_name", sa.String(150), nullable=False),
        sa.Column("quantity", sa.Numeric(12, 2), nullable=False),
        sa.Column("quantity_unit", sa.String(20), nullable=False),
        sa.Column("unit_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("gross_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("platform_fee", sa.Numeric(10, 2), nullable=False, server_default="0.00"),
        sa.Column("logistics_fee", sa.Numeric(10, 2), nullable=False, server_default="0.00"),
        sa.Column("other_deductions", sa.Numeric(10, 2), nullable=False, server_default="0.00"),
        sa.Column("net_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(10), nullable=False, server_default="INR"),
        sa.Column("status", sa.String(32), nullable=False, server_default="PENDING_SETTLEMENT"),
        sa.Column("earned_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_farmer_earnings_farmer", "farmer_earnings", ["farmer_profile_id"])
    op.create_index("ix_farmer_earnings_order", "farmer_earnings", ["order_id"])
    op.create_index("ix_farmer_earnings_order_item", "farmer_earnings", ["order_item_id"])
    op.create_index("ix_farmer_earnings_status", "farmer_earnings", ["status"])
    op.create_index("ix_farmer_earnings_earned_at", "farmer_earnings", ["earned_at"])
    op.create_index("ix_farmer_earnings_farmer_status", "farmer_earnings", ["farmer_profile_id", "status"])

    # 2. farmer_payouts table
    op.create_table(
        "farmer_payouts",
        sa.Column("id", sa.String(36), primary_key=True, nullable=False),
        sa.Column("farmer_profile_id", sa.String(36), sa.ForeignKey("farmer_profiles.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("payout_reference", sa.String(64), nullable=False, unique=True),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(10), nullable=False, server_default="INR"),
        sa.Column("status", sa.String(32), nullable=False, server_default="PENDING"),
        sa.Column("payment_method", sa.String(50), nullable=False, server_default="BANK_TRANSFER"),
        sa.Column("provider", sa.String(50), nullable=False, server_default="MANDI_DIRECT_PAY"),
        sa.Column("provider_payout_id", sa.String(100), nullable=True),
        sa.Column("requested_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("failed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("failure_reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_farmer_payouts_farmer", "farmer_payouts", ["farmer_profile_id"])
    op.create_index("ix_farmer_payouts_reference", "farmer_payouts", ["payout_reference"])
    op.create_index("ix_farmer_payouts_status", "farmer_payouts", ["status"])
    op.create_index("ix_farmer_payouts_requested_at", "farmer_payouts", ["requested_at"])
    op.create_index("ix_farmer_payouts_farmer_status", "farmer_payouts", ["farmer_profile_id", "status"])

    # 3. financial_audit_logs table
    op.create_table(
        "financial_audit_logs",
        sa.Column("id", sa.String(36), primary_key=True, nullable=False),
        sa.Column("entity_type", sa.String(50), nullable=False),
        sa.Column("entity_id", sa.String(36), nullable=False),
        sa.Column("action", sa.String(50), nullable=False),
        sa.Column("performed_by", sa.String(36), sa.ForeignKey("profiles.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("previous_status", sa.String(32), nullable=True),
        sa.Column("new_status", sa.String(32), nullable=True),
        sa.Column("amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_financial_audit_entity", "financial_audit_logs", ["entity_type", "entity_id"])
    op.create_index("ix_financial_audit_action", "financial_audit_logs", ["action"])
    op.create_index("ix_financial_audit_performed_by", "financial_audit_logs", ["performed_by"])


def downgrade() -> None:
    op.drop_table("financial_audit_logs")
    op.drop_table("farmer_payouts")
    op.drop_table("farmer_earnings")
