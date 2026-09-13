"""Create farmer_profiles and farms tables

Revision ID: 002_farmer_profiles_and_farms
Revises: 001_profiles
Create Date: 2026-09-08 14:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "002_farmer_profiles_and_farms"
down_revision: Union[str, None] = "001_profiles"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create farmer_profiles table
    op.create_table(
        "farmer_profiles",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column(
            "profile_id",
            sa.String(length=36),
            sa.ForeignKey("profiles.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("date_of_birth", sa.Date(), nullable=True),
        sa.Column("gender", sa.String(length=32), nullable=True),
        sa.Column("profile_photo_url", sa.Text(), nullable=True),
        sa.Column("address_line", sa.Text(), nullable=False),
        sa.Column("village", sa.String(length=100), nullable=False),
        sa.Column("mandal", sa.String(length=100), nullable=False),
        sa.Column("district", sa.String(length=100), nullable=False),
        sa.Column("state", sa.String(length=100), nullable=False),
        sa.Column("pincode", sa.String(length=10), nullable=False),
        sa.Column(
            "verification_status",
            sa.String(length=32),
            nullable=False,
            server_default="PENDING",
        ),
        sa.Column("verification_notes", sa.Text(), nullable=True),
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
            "verification_status IN ('PENDING', 'VERIFIED', 'REJECTED')",
            name="check_valid_verification_status",
        ),
        sa.CheckConstraint(
            "gender IS NULL OR gender IN ('MALE', 'FEMALE', 'OTHER')",
            name="check_valid_farmer_gender",
        ),
    )
    op.create_index("ix_farmer_profiles_profile_id", "farmer_profiles", ["profile_id"], unique=True)
    op.create_index("ix_farmer_profiles_verification_status", "farmer_profiles", ["verification_status"])
    op.create_index("ix_farmer_profiles_district_state", "farmer_profiles", ["district", "state"])

    # 2. Create farms table
    op.create_table(
        "farms",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column(
            "farmer_profile_id",
            sa.String(length=36),
            sa.ForeignKey("farmer_profiles.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("farm_name", sa.String(length=150), nullable=False),
        sa.Column("total_area", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("area_unit", sa.String(length=20), nullable=False, server_default="ACRE"),
        sa.Column("ownership_type", sa.String(length=20), nullable=False, server_default="OWNED"),
        sa.Column("soil_type", sa.String(length=30), nullable=True),
        sa.Column("irrigation_type", sa.String(length=30), nullable=True),
        sa.Column("primary_crops", sa.JSON(), nullable=True),
        sa.Column("latitude", sa.Numeric(precision=9, scale=6), nullable=True),
        sa.Column("longitude", sa.Numeric(precision=9, scale=6), nullable=True),
        sa.Column("address_line", sa.Text(), nullable=True),
        sa.Column("village", sa.String(length=100), nullable=False),
        sa.Column("mandal", sa.String(length=100), nullable=False),
        sa.Column("district", sa.String(length=100), nullable=False),
        sa.Column("state", sa.String(length=100), nullable=False),
        sa.Column("pincode", sa.String(length=10), nullable=False),
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
        sa.CheckConstraint("total_area > 0", name="check_positive_farm_area"),
        sa.CheckConstraint("area_unit IN ('ACRE', 'HECTARE')", name="check_valid_area_unit"),
        sa.CheckConstraint(
            "ownership_type IN ('OWNED', 'LEASED', 'FAMILY', 'OTHER')",
            name="check_valid_ownership_type",
        ),
    )
    op.create_index("ix_farms_farmer_profile_id", "farms", ["farmer_profile_id"])
    op.create_index("ix_farms_district_state", "farms", ["district", "state"])


def downgrade() -> None:
    op.drop_index("ix_farms_district_state", table_name="farms")
    op.drop_index("ix_farms_farmer_profile_id", table_name="farms")
    op.drop_table("farms")

    op.drop_index("ix_farmer_profiles_district_state", table_name="farmer_profiles")
    op.drop_index("ix_farmer_profiles_verification_status", table_name="farmer_profiles")
    op.drop_index("ix_farmer_profiles_profile_id", table_name="farmer_profiles")
    op.drop_table("farmer_profiles")
