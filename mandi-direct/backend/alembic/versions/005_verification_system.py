"""Add verification_records table and verified_by/at columns for Phase 6.

Revision ID: 005_verification_system
Revises: 004_produce_images_metadata
Create Date: 2026-09-09 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "005_verification_system"
down_revision: Union[str, None] = "004_produce_images_metadata"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add verified_at and verified_by to farmer_profiles
    with op.batch_alter_table("farmer_profiles") as batch_op:
        batch_op.add_column(sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(
            sa.Column(
                "verified_by",
                sa.String(length=36),
                sa.ForeignKey("profiles.id", ondelete="SET NULL", name="fk_farmer_profiles_verified_by"),
                nullable=True,
            )
        )

    # 2. Add verified_at and verified_by to produce_listings
    with op.batch_alter_table("produce_listings") as batch_op:
        batch_op.add_column(sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(
            sa.Column(
                "verified_by",
                sa.String(length=36),
                sa.ForeignKey("profiles.id", ondelete="SET NULL", name="fk_produce_listings_verified_by"),
                nullable=True,
            )
        )

    # 3. Create verification_records table
    op.create_table(
        "verification_records",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("entity_type", sa.String(length=32), nullable=False),
        sa.Column("entity_id", sa.String(length=36), nullable=False),
        sa.Column("action", sa.String(length=32), nullable=False),
        sa.Column("previous_status", sa.String(length=50), nullable=True),
        sa.Column("new_status", sa.String(length=50), nullable=False),
        sa.Column(
            "admin_user_id",
            sa.String(length=36),
            sa.ForeignKey("profiles.id", ondelete="SET NULL", name="fk_verification_records_admin_user_id"),
            nullable=True,
        ),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint(
            "entity_type IN ('FARMER', 'PRODUCE')",
            name="check_valid_verification_entity_type",
        ),
        sa.CheckConstraint(
            "action IN ('APPROVE', 'REJECT', 'RESUBMIT')",
            name="check_valid_verification_action",
        ),
    )

    op.create_index(
        "ix_verification_records_entity",
        "verification_records",
        ["entity_type", "entity_id"],
    )
    op.create_index(
        "ix_verification_records_created_at",
        "verification_records",
        ["created_at"],
    )
    op.create_index(
        "ix_verification_records_action",
        "verification_records",
        ["action"],
    )
    op.create_index(
        "ix_verification_records_admin_user_id",
        "verification_records",
        ["admin_user_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_verification_records_admin_user_id", table_name="verification_records")
    op.drop_index("ix_verification_records_action", table_name="verification_records")
    op.drop_index("ix_verification_records_created_at", table_name="verification_records")
    op.drop_index("ix_verification_records_entity", table_name="verification_records")
    op.drop_table("verification_records")

    with op.batch_alter_table("produce_listings") as batch_op:
        batch_op.drop_column("verified_by")
        batch_op.drop_column("verified_at")

    with op.batch_alter_table("farmer_profiles") as batch_op:
        batch_op.drop_column("verified_by")
        batch_op.drop_column("verified_at")
