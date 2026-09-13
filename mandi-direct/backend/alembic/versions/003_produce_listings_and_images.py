"""Create produce_listings and produce_images tables

Revision ID: 003_produce_listings_and_images
Revises: 002_farmer_profiles_and_farms
Create Date: 2026-09-08 21:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "003_produce_listings_and_images"
down_revision: Union[str, None] = "002_farmer_profiles_and_farms"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create produce_listings table
    op.create_table(
        "produce_listings",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column(
            "farmer_profile_id",
            sa.String(length=36),
            sa.ForeignKey("farmer_profiles.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "farm_id",
            sa.String(length=36),
            sa.ForeignKey("farms.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("product_name", sa.String(length=150), nullable=False),
        sa.Column(
            "category",
            sa.String(length=50),
            nullable=False,
            server_default="VEGETABLE",
        ),
        sa.Column("variety", sa.String(length=100), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("total_quantity", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("available_quantity", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column(
            "reserved_quantity",
            sa.Numeric(precision=12, scale=2),
            nullable=False,
            server_default="0",
        ),
        sa.Column(
            "sold_quantity",
            sa.Numeric(precision=12, scale=2),
            nullable=False,
            server_default="0",
        ),
        sa.Column(
            "quantity_unit",
            sa.String(length=20),
            nullable=False,
            server_default="KG",
        ),
        sa.Column(
            "quality_grade",
            sa.String(length=30),
            nullable=False,
            server_default="UNGRADED",
        ),
        sa.Column("harvest_date", sa.Date(), nullable=False),
        sa.Column("available_from", sa.Date(), nullable=False),
        sa.Column("available_until", sa.Date(), nullable=True),
        sa.Column("expected_price", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column(
            "price_unit",
            sa.String(length=20),
            nullable=False,
            server_default="PER_KG",
        ),
        sa.Column(
            "minimum_order_quantity",
            sa.Numeric(precision=12, scale=2),
            nullable=False,
            server_default="1",
        ),
        sa.Column(
            "status",
            sa.String(length=30),
            nullable=False,
            server_default="DRAFT",
        ),
        sa.Column("verification_notes", sa.Text(), nullable=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
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
            "status IN ('DRAFT', 'PENDING_VERIFICATION', 'APPROVED', 'REJECTED', 'LISTED', 'PARTIALLY_SOLD', 'SOLD_OUT', 'EXPIRED', 'ARCHIVED')",
            name="check_valid_produce_status",
        ),
        sa.CheckConstraint(
            "category IN ('VEGETABLE', 'FRUIT', 'GRAIN', 'PULSE', 'SPICE', 'OILSEED', 'OTHER')",
            name="check_valid_product_category",
        ),
        sa.CheckConstraint(
            "quantity_unit IN ('KG', 'QUINTAL', 'TON')",
            name="check_valid_quantity_unit",
        ),
        sa.CheckConstraint(
            "price_unit IN ('PER_KG', 'PER_QUINTAL', 'PER_TON')",
            name="check_valid_price_unit",
        ),
        sa.CheckConstraint(
            "quality_grade IN ('PREMIUM', 'GRADE_A', 'GRADE_B', 'GRADE_C', 'UNGRADED')",
            name="check_valid_quality_grade",
        ),
        sa.CheckConstraint("total_quantity > 0", name="check_positive_total_quantity"),
        sa.CheckConstraint("available_quantity >= 0", name="check_non_negative_available_quantity"),
        sa.CheckConstraint("reserved_quantity >= 0", name="check_non_negative_reserved_quantity"),
        sa.CheckConstraint("sold_quantity >= 0", name="check_non_negative_sold_quantity"),
        sa.CheckConstraint("expected_price > 0", name="check_positive_expected_price"),
        sa.CheckConstraint("minimum_order_quantity > 0", name="check_positive_minimum_order_quantity"),
    )
    op.create_index("ix_produce_listings_farmer_profile_id", "produce_listings", ["farmer_profile_id"])
    op.create_index("ix_produce_listings_farm_id", "produce_listings", ["farm_id"])
    op.create_index("ix_produce_listings_product_name", "produce_listings", ["product_name"])
    op.create_index("ix_produce_listings_status", "produce_listings", ["status"])
    op.create_index("ix_produce_listings_category_status", "produce_listings", ["category", "status"])

    # 2. Create produce_images table
    op.create_table(
        "produce_images",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column(
            "produce_listing_id",
            sa.String(length=36),
            sa.ForeignKey("produce_listings.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("storage_path", sa.Text(), nullable=False),
        sa.Column("image_url", sa.Text(), nullable=False),
        sa.Column(
            "is_primary",
            sa.Boolean(),
            nullable=False,
            server_default="0",
        ),
        sa.Column(
            "sort_order",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
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
    )
    op.create_index("ix_produce_images_produce_listing_id", "produce_images", ["produce_listing_id"])


def downgrade() -> None:
    op.drop_index("ix_produce_images_produce_listing_id", table_name="produce_images")
    op.drop_table("produce_images")

    op.drop_index("ix_produce_listings_category_status", table_name="produce_listings")
    op.drop_index("ix_produce_listings_status", table_name="produce_listings")
    op.drop_index("ix_produce_listings_product_name", table_name="produce_listings")
    op.drop_index("ix_produce_listings_farm_id", table_name="produce_listings")
    op.drop_index("ix_produce_listings_farmer_profile_id", table_name="produce_listings")
    op.drop_table("produce_listings")
