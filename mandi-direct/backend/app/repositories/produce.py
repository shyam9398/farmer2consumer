from datetime import date
from decimal import Decimal
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload
from app.models.enums import ProduceStatus
from app.models.produce import ProduceImage, ProduceListing
from app.repositories.base import BaseRepository
from app.schemas.produce import ProduceCreate, ProduceSummaryStats, ProduceUpdate


class ProduceRepository(BaseRepository[ProduceListing, ProduceCreate, ProduceUpdate]):
    """Repository for Produce Listing operations with tenant isolation."""

    def __init__(self):
        super().__init__(ProduceListing)

    def get_by_id_and_farmer(
        self,
        db: Session,
        produce_id: str,
        farmer_profile_id: str,
    ) -> Optional[ProduceListing]:
        """Fetch a specific produce listing ensuring farmer ownership with joined relations."""
        return (
            db.query(ProduceListing)
            .options(
                joinedload(ProduceListing.images),
                joinedload(ProduceListing.farm),
            )
            .filter(
                ProduceListing.id == produce_id,
                ProduceListing.farmer_profile_id == farmer_profile_id,
            )
            .first()
        )

    def list_by_farmer(
        self,
        db: Session,
        farmer_profile_id: str,
        status: Optional[str] = None,
        category: Optional[str] = None,
        farm_id: Optional[str] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[List[ProduceListing], int]:
        """
        List produce listings for a farmer with optional filters, keyword search, and pagination.
        Returns (items, total_count).
        """
        query = (
            db.query(ProduceListing)
            .options(
                joinedload(ProduceListing.images),
                joinedload(ProduceListing.farm),
            )
            .filter(ProduceListing.farmer_profile_id == farmer_profile_id)
        )

        if status:
            query = query.filter(ProduceListing.status == status)

        if category:
            query = query.filter(ProduceListing.category == category)

        if farm_id:
            query = query.filter(ProduceListing.farm_id == farm_id)

        if search and search.strip():
            search_pattern = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    ProduceListing.product_name.ilike(search_pattern),
                    ProduceListing.variety.ilike(search_pattern),
                    ProduceListing.description.ilike(search_pattern),
                )
            )

        total = query.count()
        items = (
            query.order_by(ProduceListing.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return items, total

    def create_produce(
        self,
        db: Session,
        *,
        farmer_profile_id: str,
        data: ProduceCreate,
        status_override: Optional[str] = None,
    ) -> ProduceListing:
        """Create a new produce listing lot."""
        db_obj = ProduceListing(
            farmer_profile_id=farmer_profile_id,
            farm_id=data.farm_id,
            product_name=data.product_name.strip(),
            category=data.category.value if hasattr(data.category, "value") else str(data.category),
            variety=data.variety.strip() if data.variety else None,
            description=data.description.strip() if data.description else None,
            total_quantity=data.total_quantity,
            available_quantity=data.total_quantity,
            reserved_quantity=Decimal("0.00"),
            sold_quantity=Decimal("0.00"),
            quantity_unit=data.quantity_unit.value if hasattr(data.quantity_unit, "value") else str(data.quantity_unit),
            quality_grade=data.quality_grade.value if hasattr(data.quality_grade, "value") else str(data.quality_grade),
            harvest_date=data.harvest_date,
            available_from=data.available_from,
            available_until=data.available_until,
            expected_price=data.expected_price,
            price_unit=data.price_unit.value if hasattr(data.price_unit, "value") else str(data.price_unit),
            minimum_order_quantity=data.minimum_order_quantity,
            status=status_override or ProduceStatus.DRAFT.value,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update_produce(
        self,
        db: Session,
        *,
        db_obj: ProduceListing,
        data: ProduceUpdate,
    ) -> ProduceListing:
        """Update draft or rejected produce lot."""
        update_data = data.model_dump(exclude_unset=True)

        if "category" in update_data and update_data["category"]:
            val = update_data["category"]
            update_data["category"] = val.value if hasattr(val, "value") else str(val)

        if "quantity_unit" in update_data and update_data["quantity_unit"]:
            val = update_data["quantity_unit"]
            update_data["quantity_unit"] = val.value if hasattr(val, "value") else str(val)

        if "quality_grade" in update_data and update_data["quality_grade"]:
            val = update_data["quality_grade"]
            update_data["quality_grade"] = val.value if hasattr(val, "value") else str(val)

        if "price_unit" in update_data and update_data["price_unit"]:
            val = update_data["price_unit"]
            update_data["price_unit"] = val.value if hasattr(val, "value") else str(val)

        if "product_name" in update_data and update_data["product_name"]:
            update_data["product_name"] = update_data["product_name"].strip()

        if "variety" in update_data and update_data["variety"]:
            update_data["variety"] = update_data["variety"].strip()

        if "description" in update_data and update_data["description"]:
            update_data["description"] = update_data["description"].strip()

        if "total_quantity" in update_data and update_data["total_quantity"] is not None:
            new_total = update_data["total_quantity"]
            # Recalculate available_quantity: new_total - reserved - sold
            reserved = db_obj.reserved_quantity or Decimal("0.00")
            sold = db_obj.sold_quantity or Decimal("0.00")
            update_data["available_quantity"] = max(Decimal("0.00"), new_total - reserved - sold)

        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete_produce(self, db: Session, *, db_obj: ProduceListing) -> None:
        """Delete produce lot record."""
        db.delete(db_obj)
        db.commit()

    def get_stats_by_farmer(self, db: Session, farmer_profile_id: str) -> ProduceSummaryStats:
        """Aggregate produce listing counts across statuses for dashboard."""
        status_counts = (
            db.query(ProduceListing.status, func.count(ProduceListing.id))
            .filter(ProduceListing.farmer_profile_id == farmer_profile_id)
            .group_by(ProduceListing.status)
            .all()
        )

        counts_map = {row[0]: row[1] for row in status_counts}
        total_listings = sum(counts_map.values())

        return ProduceSummaryStats(
            total_listings=total_listings,
            draft_count=counts_map.get(ProduceStatus.DRAFT.value, 0),
            pending_count=counts_map.get(ProduceStatus.PENDING_VERIFICATION.value, 0),
            approved_count=counts_map.get(ProduceStatus.APPROVED.value, 0),
            listed_count=counts_map.get(ProduceStatus.LISTED.value, 0),
            partially_sold_count=counts_map.get(ProduceStatus.PARTIALLY_SOLD.value, 0),
            sold_out_count=counts_map.get(ProduceStatus.SOLD_OUT.value, 0),
            rejected_count=counts_map.get(ProduceStatus.REJECTED.value, 0),
            archived_count=counts_map.get(ProduceStatus.ARCHIVED.value, 0),
        )

    def get_by_id_with_details(self, db: Session, produce_id: str) -> Optional[ProduceListing]:
        """Fetch produce listing with farm, farmer profile, and all images."""
        from sqlalchemy.orm import joinedload
        from app.models.farmer import FarmerProfile

        return (
            db.query(ProduceListing)
            .options(
                joinedload(ProduceListing.images),
                joinedload(ProduceListing.farm),
                joinedload(ProduceListing.farmer_profile).joinedload(FarmerProfile.profile),
            )
            .filter(ProduceListing.id == produce_id)
            .first()
        )

    def list_for_admin_verification(
        self,
        db: Session,
        *,
        status: Optional[str] = None,
        category: Optional[str] = None,
        search: Optional[str] = None,
        farmer_id: Optional[str] = None,
        farm_id: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[ProduceListing], int]:
        """Paginated query of produce lots for admin verification review."""
        from sqlalchemy import or_, desc
        from sqlalchemy.orm import joinedload
        from app.models.farmer import Farm, FarmerProfile
        from app.models.profile import Profile

        query = (
            db.query(ProduceListing)
            .join(FarmerProfile, ProduceListing.farmer_profile_id == FarmerProfile.id)
            .join(Profile, FarmerProfile.profile_id == Profile.id)
            .join(Farm, ProduceListing.farm_id == Farm.id)
            .options(
                joinedload(ProduceListing.images),
                joinedload(ProduceListing.farm),
                joinedload(ProduceListing.farmer_profile).joinedload(FarmerProfile.profile),
            )
        )

        if status and status.upper() != "ALL":
            query = query.filter(ProduceListing.status == status.upper())
        elif not status:
            # Default to PENDING_VERIFICATION
            query = query.filter(ProduceListing.status == ProduceStatus.PENDING_VERIFICATION.value)

        if category and category.upper() != "ALL":
            query = query.filter(ProduceListing.category == category.upper())

        if farmer_id:
            query = query.filter(ProduceListing.farmer_profile_id == farmer_id)

        if farm_id:
            query = query.filter(ProduceListing.farm_id == farm_id)

        if search and search.strip():
            term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    ProduceListing.product_name.ilike(term),
                    ProduceListing.variety.ilike(term),
                    Profile.full_name.ilike(term),
                    Farm.farm_name.ilike(term),
                    Farm.village.ilike(term),
                    Farm.district.ilike(term),
                )
            )

        total = query.count()
        offset = (max(1, page) - 1) * page_size
        items = query.order_by(desc(ProduceListing.created_at)).offset(offset).limit(page_size).all()
        return items, total

    def get_admin_verification_counts(self, db: Session) -> Dict[str, int]:
        """Aggregate counts of produce listings by status for admin dashboard."""
        rows = (
            db.query(ProduceListing.status, func.count(ProduceListing.id))
            .group_by(ProduceListing.status)
            .all()
        )
        counts = {
            "PENDING_VERIFICATION": 0,
            "APPROVED": 0,
            "REJECTED": 0,
            "DRAFT": 0,
            "LISTED": 0,
        }
        total = 0
        for status_val, count in rows:
            counts[status_val] = count
            total += count
        counts["TOTAL"] = total
        return counts

    def publish_produce(self, db: Session, *, db_obj: ProduceListing) -> ProduceListing:
        """Transitions an approved produce listing to LISTED for marketplace visibility."""
        db_obj.status = ProduceStatus.LISTED.value
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def list_for_marketplace(
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
    ) -> Tuple[List[ProduceListing], int]:
        """
        Public marketplace discovery query.
        Strictly enforces:
        - status == 'LISTED'
        - available_quantity > 0
        - available_until >= current date (or null)
        """
        from sqlalchemy import and_, asc, desc, or_
        from app.models.farmer import Farm, FarmerProfile
        from app.models.profile import Profile

        query = (
            db.query(ProduceListing)
            .join(FarmerProfile, ProduceListing.farmer_profile_id == FarmerProfile.id)
            .join(Profile, FarmerProfile.profile_id == Profile.id)
            .join(Farm, ProduceListing.farm_id == Farm.id)
            .options(
                joinedload(ProduceListing.images),
                joinedload(ProduceListing.farm),
                joinedload(ProduceListing.farmer_profile).joinedload(FarmerProfile.profile),
            )
            .filter(
                ProduceListing.status == ProduceStatus.LISTED.value,
                ProduceListing.available_quantity > 0,
                or_(
                    ProduceListing.available_until.is_(None),
                    ProduceListing.available_until >= date.today(),
                ),
            )
        )

        # Filters
        if category and category.upper() != "ALL":
            query = query.filter(ProduceListing.category == category.upper())

        if quality_grade and quality_grade.upper() != "ALL":
            query = query.filter(ProduceListing.quality_grade == quality_grade.upper())

        if farm_id:
            query = query.filter(ProduceListing.farm_id == farm_id)

        if district and district.strip():
            query = query.filter(Farm.district.ilike(f"%{district.strip()}%"))

        if mandal and mandal.strip():
            query = query.filter(Farm.mandal.ilike(f"%{mandal.strip()}%"))

        if village and village.strip():
            query = query.filter(Farm.village.ilike(f"%{village.strip()}%"))

        if state and state.strip():
            query = query.filter(Farm.state.ilike(f"%{state.strip()}%"))

        if min_price is not None and min_price > 0:
            query = query.filter(ProduceListing.expected_price >= Decimal(str(min_price)))

        if max_price is not None and max_price > 0:
            query = query.filter(ProduceListing.expected_price <= Decimal(str(max_price)))

        if min_quantity is not None and min_quantity > 0:
            query = query.filter(ProduceListing.available_quantity >= Decimal(str(min_quantity)))

        # Full-text search
        if search and search.strip():
            term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    ProduceListing.product_name.ilike(term),
                    ProduceListing.variety.ilike(term),
                    ProduceListing.description.ilike(term),
                    Farm.village.ilike(term),
                    Farm.mandal.ilike(term),
                    Farm.district.ilike(term),
                    Farm.state.ilike(term),
                    Profile.full_name.ilike(term),
                )
            )

        # Sorting
        sort_key = (sort or "").lower().strip()
        if sort_key == "price_asc":
            order_by_clause = [asc(ProduceListing.expected_price), desc(ProduceListing.created_at)]
        elif sort_key == "price_desc":
            order_by_clause = [desc(ProduceListing.expected_price), desc(ProduceListing.created_at)]
        elif sort_key == "harvest_date":
            order_by_clause = [desc(ProduceListing.harvest_date), desc(ProduceListing.created_at)]
        elif sort_key == "quantity_desc":
            order_by_clause = [desc(ProduceListing.available_quantity), desc(ProduceListing.created_at)]
        elif sort_key == "newest":
            order_by_clause = [desc(ProduceListing.created_at)]
        else:
            # Default / recommended: newest listings first
            order_by_clause = [desc(ProduceListing.created_at)]

        total = query.count()
        offset = (max(1, page) - 1) * page_size
        items = query.order_by(*order_by_clause).offset(offset).limit(page_size).all()
        return items, total

    def get_marketplace_product_by_id(
        self, db: Session, produce_id: str
    ) -> Optional[ProduceListing]:
        """
        Fetch single listed produce item for marketplace product detail.
        Strictly enforces status == 'LISTED', available_quantity > 0, and unexpired.
        """
        from app.models.farmer import FarmerProfile

        return (
            db.query(ProduceListing)
            .options(
                joinedload(ProduceListing.images),
                joinedload(ProduceListing.farm),
                joinedload(ProduceListing.farmer_profile).joinedload(FarmerProfile.profile),
            )
            .filter(
                ProduceListing.id == produce_id,
                ProduceListing.status == ProduceStatus.LISTED.value,
                ProduceListing.available_quantity > 0,
                or_(
                    ProduceListing.available_until.is_(None),
                    ProduceListing.available_until >= func.current_date(),
                ),
            )
            .first()
        )


class ProduceImageRepository:
    """Repository for ProduceImage gallery management."""

    def get_by_id(self, db: Session, image_id: str) -> Optional[ProduceImage]:
        return db.query(ProduceImage).filter(ProduceImage.id == image_id).first()

    def count_by_listing(self, db: Session, produce_listing_id: str) -> int:
        return (
            db.query(func.count(ProduceImage.id))
            .filter(ProduceImage.produce_listing_id == produce_listing_id)
            .scalar()
            or 0
        )

    def list_by_listing(
        self, db: Session, produce_listing_id: str
    ) -> List[ProduceImage]:
        """Fetch all photos for a listing ordered by display_order ascending."""
        return (
            db.query(ProduceImage)
            .filter(ProduceImage.produce_listing_id == produce_listing_id)
            .order_by(
                ProduceImage.display_order.asc(),
                ProduceImage.sort_order.asc(),
                ProduceImage.created_at.asc(),
            )
            .all()
        )

    def add_image(
        self,
        db: Session,
        *,
        produce_listing_id: str,
        storage_path: str,
        image_url: str,
        public_url: Optional[str] = None,
        file_name: str = "photo.jpg",
        mime_type: str = "image/jpeg",
        file_size: int = 0,
        width: Optional[int] = None,
        height: Optional[int] = None,
        is_primary: bool = False,
        display_order: int = 0,
        sort_order: int = 0,
    ) -> ProduceImage:
        """Create and append an image with full metadata to a produce listing."""
        # If is_primary, clear existing primary flags for this listing
        if is_primary:
            db.query(ProduceImage).filter(
                ProduceImage.produce_listing_id == produce_listing_id
            ).update({"is_primary": False})

        effective_order = display_order if display_order != 0 else sort_order
        img_obj = ProduceImage(
            produce_listing_id=produce_listing_id,
            storage_path=storage_path,
            image_url=image_url,
            public_url=public_url or image_url,
            file_name=file_name,
            mime_type=mime_type,
            file_size=file_size,
            width=width,
            height=height,
            is_primary=is_primary,
            display_order=effective_order,
            sort_order=effective_order,
        )
        db.add(img_obj)
        db.commit()
        db.refresh(img_obj)
        return img_obj

    def set_primary(
        self,
        db: Session,
        *,
        produce_listing_id: str,
        image_id: str,
    ) -> Optional[ProduceImage]:
        """Mark one image as primary and clear others."""
        target = (
            db.query(ProduceImage)
            .filter(
                ProduceImage.id == image_id,
                ProduceImage.produce_listing_id == produce_listing_id,
            )
            .first()
        )
        if not target:
            return None

        db.query(ProduceImage).filter(
            ProduceImage.produce_listing_id == produce_listing_id
        ).update({"is_primary": False})

        target.is_primary = True
        db.add(target)
        db.commit()
        db.refresh(target)
        return target

    def reorder_images(
        self,
        db: Session,
        *,
        produce_listing_id: str,
        image_ids: List[str],
    ) -> List[ProduceImage]:
        """Update display_order for all images belonging to the listing."""
        # Fetch existing images for verification
        existing = (
            db.query(ProduceImage)
            .filter(ProduceImage.produce_listing_id == produce_listing_id)
            .all()
        )
        existing_ids = {img.id for img in existing}

        for img_id in image_ids:
            if img_id not in existing_ids:
                raise ValueError(f"Image '{img_id}' does not belong to produce listing '{produce_listing_id}'.")

        for idx, img_id in enumerate(image_ids):
            db.query(ProduceImage).filter(
                ProduceImage.id == img_id,
                ProduceImage.produce_listing_id == produce_listing_id,
            ).update({"display_order": idx, "sort_order": idx})

        db.commit()
        return self.list_by_listing(db, produce_listing_id)

    def delete_image(self, db: Session, *, db_obj: ProduceImage) -> None:
        """Remove image record from DB and promote next image to primary if needed."""
        produce_id = db_obj.produce_listing_id
        was_primary = db_obj.is_primary
        db.delete(db_obj)
        db.commit()

        # If deleted image was primary, set the earliest remaining image as primary
        if was_primary:
            next_img = (
                db.query(ProduceImage)
                .filter(ProduceImage.produce_listing_id == produce_id)
                .order_by(
                    ProduceImage.display_order.asc(),
                    ProduceImage.sort_order.asc(),
                    ProduceImage.created_at.asc(),
                )
                .first()
            )
            if next_img:
                next_img.is_primary = True
                db.add(next_img)
                db.commit()


produce_repository = ProduceRepository()
produce_image_repository = ProduceImageRepository()
