from datetime import date
import math
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.core.logging import get_logger
from app.models.produce import ProduceImage, ProduceListing
from app.repositories.produce import produce_repository
from app.schemas.marketplace import (
    MarketplaceFarmDetail,
    MarketplaceFarmerDetail,
    MarketplaceFarmerSummary,
    MarketplaceImageItem,
    MarketplaceLocationSummary,
    MarketplaceProductDetailResponse,
    MarketplaceProductListResponse,
    MarketplaceProductSummaryResponse,
    MarketplaceTransparentPricing,
)

logger = get_logger("marketplace_service")


class MarketplaceService:
    """Business logic for public and buyer marketplace discovery."""

    def _get_primary_image_url(self, images: List[ProduceImage]) -> Optional[str]:
        if not images:
            return None
        primary_img = next((img for img in images if img.is_primary), None)
        if primary_img:
            return primary_img.public_url or primary_img.image_url
        first_img = images[0]
        return first_img.public_url or first_img.image_url

    def _build_summary_response(self, produce: ProduceListing) -> MarketplaceProductSummaryResponse:
        farmer_profile = produce.farmer_profile
        profile = farmer_profile.profile if farmer_profile else None
        farm = produce.farm

        farmer_name = profile.full_name if profile else "Verified Farmer"
        is_verified = (farmer_profile.verification_status == "VERIFIED") if farmer_profile else False

        location = MarketplaceLocationSummary(
            village=farm.village if farm else "",
            mandal=farm.mandal if farm else "",
            district=farm.district if farm else "",
            state=farm.state if farm else "",
        )

        farmer_summary = MarketplaceFarmerSummary(
            id=farmer_profile.id if farmer_profile else "",
            name=farmer_name,
            is_verified=is_verified,
            verification_status=farmer_profile.verification_status if farmer_profile else "PENDING",
        )

        images = produce.images or []
        primary_image_url = self._get_primary_image_url(images)

        return MarketplaceProductSummaryResponse(
            id=produce.id,
            product_name=produce.product_name,
            category=produce.category,
            variety=produce.variety,
            description=produce.description,
            total_quantity=float(produce.total_quantity),
            available_quantity=float(produce.available_quantity),
            quantity_unit=produce.quantity_unit,
            quality_grade=produce.quality_grade,
            price=float(produce.expected_price),
            expected_price=float(produce.expected_price),
            price_unit=produce.price_unit,
            harvest_date=produce.harvest_date.isoformat() if produce.harvest_date else "",
            available_from=produce.available_from.isoformat() if produce.available_from else "",
            available_until=produce.available_until.isoformat() if produce.available_until else None,
            minimum_order_quantity=float(produce.minimum_order_quantity),
            status=produce.status,
            primary_image_url=primary_image_url,
            image_count=len(images),
            farmer=farmer_summary,
            location=location,
        )

    def list_products(
        self,
        db: Session,
        *,
        search: Optional[str] = None,
        category: Optional[str] = None,
        quality_grade: Optional[str] = None,
        farm_id: Optional[str] = None,
        district: Optional[str] = None,
        mandal: Optional[str] = None,
        village: Optional[str] = None,
        state: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        min_quantity: Optional[float] = None,
        sort: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> MarketplaceProductListResponse:
        """Paginated marketplace product listings for public discovery."""
        items, total = produce_repository.list_for_marketplace(
            db,
            search=search,
            category=category,
            quality_grade=quality_grade,
            farm_id=farm_id,
            district=district,
            mandal=mandal,
            village=village,
            state=state,
            min_price=min_price,
            max_price=max_price,
            min_quantity=min_quantity,
            sort=sort,
            page=page,
            page_size=page_size,
        )

        formatted_items = [self._build_summary_response(p) for p in items]
        total_pages = max(1, math.ceil(total / page_size)) if total > 0 else 0

        return MarketplaceProductListResponse(
            items=formatted_items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    def get_product_detail(
        self,
        db: Session,
        produce_id: str,
    ) -> MarketplaceProductDetailResponse:
        """
        Public product detail for marketplace.
        Strictly returns 404 if product is not LISTED or has expired.
        Guarantees zero leakage of private farmer or admin data.
        """
        produce = produce_repository.get_marketplace_product_by_id(db, produce_id)
        if not produce:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product Not Available. This produce may have been sold, withdrawn, expired, or removed from the marketplace.",
            )

        farmer_profile = produce.farmer_profile
        profile = farmer_profile.profile if farmer_profile else None
        farm = produce.farm

        images_sorted = sorted(produce.images or [], key=lambda img: (img.display_order, img.sort_order))
        image_items = [
            MarketplaceImageItem(
                id=img.id,
                image_url=img.image_url,
                public_url=img.public_url or img.image_url,
                is_primary=img.is_primary,
                display_order=img.display_order,
                sort_order=img.sort_order,
            )
            for img in images_sorted
        ]

        primary_image_url = self._get_primary_image_url(produce.images or [])

        member_since = None
        if farmer_profile and farmer_profile.created_at:
            member_since = farmer_profile.created_at.strftime("%B %Y")

        farmer_detail = MarketplaceFarmerDetail(
            id=farmer_profile.id if farmer_profile else "",
            name=profile.full_name if profile else "Verified Farmer",
            is_verified=(farmer_profile.verification_status == "VERIFIED") if farmer_profile else False,
            verification_status=farmer_profile.verification_status if farmer_profile else "PENDING",
            member_since=member_since,
        )

        farm_detail = MarketplaceFarmDetail(
            id=farm.id if farm else "",
            farm_name=farm.farm_name if farm else "Farm Parcel",
            total_area=float(farm.total_area) if farm else 0.0,
            area_unit=farm.area_unit if farm else "ACRE",
            soil_type=farm.soil_type if farm else None,
            irrigation_type=farm.irrigation_type if farm else None,
            village=farm.village if farm else "",
            mandal=farm.mandal if farm else "",
            district=farm.district if farm else "",
            state=farm.state if farm else "",
        )

        location = MarketplaceLocationSummary(
            village=farm.village if farm else "",
            mandal=farm.mandal if farm else "",
            district=farm.district if farm else "",
            state=farm.state if farm else "",
        )

        transparent_pricing = MarketplaceTransparentPricing(
            farmer_price=float(produce.expected_price),
            price_unit=produce.price_unit,
            traditional_benchmark_price=None,
            potential_savings=None,
            notes="Direct farmer gate price with 0% intermediary commission.",
        )

        return MarketplaceProductDetailResponse(
            id=produce.id,
            product_name=produce.product_name,
            category=produce.category,
            variety=produce.variety,
            description=produce.description,
            total_quantity=float(produce.total_quantity),
            available_quantity=float(produce.available_quantity),
            quantity_unit=produce.quantity_unit,
            quality_grade=produce.quality_grade,
            price=float(produce.expected_price),
            expected_price=float(produce.expected_price),
            price_unit=produce.price_unit,
            harvest_date=produce.harvest_date.isoformat() if produce.harvest_date else "",
            available_from=produce.available_from.isoformat() if produce.available_from else "",
            available_until=produce.available_until.isoformat() if produce.available_until else None,
            minimum_order_quantity=float(produce.minimum_order_quantity),
            status=produce.status,
            primary_image_url=primary_image_url,
            images=image_items,
            farmer=farmer_detail,
            farm=farm_detail,
            location=location,
            transparent_pricing=transparent_pricing,
        )


marketplace_service = MarketplaceService()
