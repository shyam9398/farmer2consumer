from datetime import datetime, timezone
import math
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.core.logging import get_logger
from app.models.enums import NotificationType, ProduceStatus, VerificationStatus
from app.models.farmer import FarmerProfile
from app.models.produce import ProduceListing
from app.models.profile import Profile
from app.repositories.farmer import farm_repository, farmer_profile_repository
from app.repositories.produce import produce_repository
from app.repositories.verification import verification_record_repository
from app.schemas.admin import (
    AdminDashboardStats,
    FarmerVerificationDetailResponse,
    FarmerVerificationItem,
    FarmerVerificationListResponse,
    ProduceVerificationDetailResponse,
    ProduceVerificationItem,
    ProduceVerificationListResponse,
    VerificationRecordListResponse,
    VerificationRecordResponse,
)
from app.services.farmer import farmer_service
from app.services.notification_service import notification_service
from app.services.produce import produce_service

logger = get_logger("admin_service")


class AdminService:
    """Business logic for administrator verification, quality inspection, and audit management."""

    def get_dashboard_stats(self, db: Session) -> AdminDashboardStats:
        """Returns aggregate verification statistics across farmers and produce listings."""
        farmer_counts = farmer_profile_repository.get_verification_counts(db)
        produce_counts = produce_repository.get_admin_verification_counts(db)

        return AdminDashboardStats(
            pending_farmers=farmer_counts.get("PENDING", 0),
            verified_farmers=farmer_counts.get("VERIFIED", 0),
            rejected_farmers=farmer_counts.get("REJECTED", 0),
            total_farmers=farmer_counts.get("TOTAL", 0),
            pending_produce=produce_counts.get("PENDING_VERIFICATION", 0),
            approved_produce=produce_counts.get("APPROVED", 0),
            rejected_produce=produce_counts.get("REJECTED", 0),
            total_produce=produce_counts.get("TOTAL", 0),
        )

    # -------------------------------------------------------------------------
    # Farmer Verification
    # -------------------------------------------------------------------------

    def _build_farmer_item(self, db: Session, fp: FarmerProfile) -> FarmerVerificationItem:
        profile = fp.profile
        farms = fp.farms or []
        completion_info = (
            farmer_service.calculate_profile_completion(profile=profile, farmer_profile=fp, farms=farms)
            if profile
            else None
        )
        completion_pct = completion_info.completion_percentage if completion_info else 0

        verified_by_name = None
        if fp.verified_by_admin:
            verified_by_name = fp.verified_by_admin.full_name

        return FarmerVerificationItem(
            id=fp.id,
            farmer_id=fp.id,
            profile_id=fp.profile_id,
            full_name=profile.full_name if profile else "Unknown Farmer",
            phone=profile.phone if profile else None,
            email=profile.email if profile else "",
            profile_photo_url=fp.profile_photo_url,
            village=fp.village,
            mandal=fp.mandal,
            district=fp.district,
            state=fp.state,
            pincode=fp.pincode,
            profile_completion_percentage=completion_pct,
            farm_count=len(farms),
            verification_status=fp.verification_status,
            verification_notes=fp.verification_notes,
            verified_at=fp.verified_at.isoformat() if fp.verified_at else None,
            verified_by_name=verified_by_name,
            created_at=fp.created_at.isoformat() if fp.created_at else "",
        )

    def list_farmer_verifications(
        self,
        db: Session,
        *,
        status: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> FarmerVerificationListResponse:
        """Fetch a paginated list of farmer profiles for admin review."""
        items, total = farmer_profile_repository.list_for_admin_verification(
            db, status=status, search=search, page=page, page_size=page_size
        )
        farmer_items = [self._build_farmer_item(db, fp) for fp in items]
        total_pages = max(1, math.ceil(total / page_size)) if total > 0 else 1

        return FarmerVerificationListResponse(
            items=farmer_items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    def get_farmer_verification_detail(
        self, db: Session, farmer_id: Optional[str] = None, *, farmer_profile_id: Optional[str] = None
    ) -> FarmerVerificationDetailResponse:
        """Fetch comprehensive farmer profile, farm parcels, and audit trail history."""
        f_id = farmer_id or farmer_profile_id
        if not f_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Farmer ID is required.")
        fp = db.query(FarmerProfile).filter(FarmerProfile.id == f_id).first()
        if not fp:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Farmer profile with ID '{farmer_id}' not found.",
            )

        farms = farm_repository.list_by_farmer(db, fp.id)
        farm_responses = [farmer_service._map_farm_response(farm) for farm in farms]
        history_records = verification_record_repository.get_history_for_entity(db, "FARMER", fp.id)

        history_items = [
            VerificationRecordResponse(
                id=rec.id,
                entity_type=rec.entity_type,
                entity_id=rec.entity_id,
                action=rec.action,
                previous_status=rec.previous_status,
                new_status=rec.new_status,
                admin_user_id=rec.admin_user_id,
                admin_name=rec.admin_user.full_name if rec.admin_user else "System / Farmer",
                admin_email=rec.admin_user.email if rec.admin_user else None,
                reason=rec.reason,
                created_at=rec.created_at.isoformat() if rec.created_at else "",
            )
            for rec in history_records
        ]

        return FarmerVerificationDetailResponse(
            farmer=self._build_farmer_item(db, fp),
            farms=farm_responses,
            history=history_items,
        )

    def approve_farmer(
        self,
        db: Session,
        *,
        admin_profile: Profile,
        farmer_id: str,
        notes: Optional[str] = None,
    ) -> FarmerVerificationDetailResponse:
        """Approves farmer profile, transitioning status to VERIFIED and creating an audit record."""
        fp = db.query(FarmerProfile).filter(FarmerProfile.id == farmer_id).first()
        if not fp:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Farmer profile with ID '{farmer_id}' not found.",
            )

        previous_status = fp.verification_status
        if previous_status == VerificationStatus.VERIFIED.value:
            # Already verified
            return self.get_farmer_verification_detail(db, farmer_id)

        now = datetime.now(timezone.utc)
        fp.verification_status = VerificationStatus.VERIFIED.value
        fp.verified_at = now
        fp.verified_by = admin_profile.id
        if notes:
            fp.verification_notes = notes.strip()

        db.add(fp)
        db.commit()
        db.refresh(fp)

        # Audit Record
        verification_record_repository.create_record(
            db,
            entity_type="FARMER",
            entity_id=fp.id,
            action="APPROVE",
            previous_status=previous_status,
            new_status=VerificationStatus.VERIFIED.value,
            admin_user_id=admin_profile.id,
            reason=notes.strip() if notes else "Farmer profile and farm parcel documentation verified.",
        )

        logger.info(f"Admin {admin_profile.email} approved farmer {fp.id}")

        # Phase 14: Notify farmer of verification approval
        notification_service.create_notification(
            db,
            recipient_user_id=fp.profile_id,
            type=NotificationType.VERIFICATION,
            title="Farmer Verification Approved",
            message="Your farmer profile and farm documentation have been verified and approved.",
            entity_type="FARMER",
            entity_id=fp.id,
            action_url="/farmer/profile",
        )
        db.commit()

        return self.get_farmer_verification_detail(db, farmer_id)

    def reject_farmer(
        self,
        db: Session,
        *,
        admin_profile: Profile,
        farmer_id: str,
        reason: str,
    ) -> FarmerVerificationDetailResponse:
        """Rejects farmer profile with mandatory reason, recording an audit event."""
        clean_reason = reason.strip()
        if len(clean_reason) < 5:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="A detailed rejection explanation of at least 5 characters is mandatory.",
            )

        fp = db.query(FarmerProfile).filter(FarmerProfile.id == farmer_id).first()
        if not fp:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Farmer profile with ID '{farmer_id}' not found.",
            )

        previous_status = fp.verification_status
        now = datetime.now(timezone.utc)
        fp.verification_status = VerificationStatus.REJECTED.value
        fp.verified_at = now
        fp.verified_by = admin_profile.id
        fp.verification_notes = clean_reason

        db.add(fp)
        db.commit()
        db.refresh(fp)

        # Audit Record
        verification_record_repository.create_record(
            db,
            entity_type="FARMER",
            entity_id=fp.id,
            action="REJECT",
            previous_status=previous_status,
            new_status=VerificationStatus.REJECTED.value,
            admin_user_id=admin_profile.id,
            reason=clean_reason,
        )

        logger.info(f"Admin {admin_profile.email} rejected farmer {fp.id}: {clean_reason}")

        # Phase 14: Notify farmer of verification rejection
        notification_service.create_notification(
            db,
            recipient_user_id=fp.profile_id,
            type=NotificationType.VERIFICATION,
            title="Farmer Verification Rejected",
            message=f"Your farmer verification was rejected. Reason: {clean_reason}",
            entity_type="FARMER",
            entity_id=fp.id,
            action_url="/farmer/profile",
        )
        db.commit()

        return self.get_farmer_verification_detail(db, farmer_id)

    # -------------------------------------------------------------------------
    # Produce Verification
    # -------------------------------------------------------------------------

    def _build_produce_item(self, produce: ProduceListing) -> ProduceVerificationItem:
        farmer = produce.farmer_profile
        profile = farmer.profile if farmer else None
        farm = produce.farm

        location_str = f"{farm.village}, {farm.district}, {farm.state}" if farm else "Unknown Location"
        primary_img = next((img for img in produce.images if img.is_primary), None)
        if not primary_img and produce.images:
            primary_img = produce.images[0]

        primary_url = primary_img.public_url or primary_img.image_url if primary_img else None

        return ProduceVerificationItem(
            id=produce.id,
            produce_id=produce.id,
            product_name=produce.product_name,
            category=produce.category,
            variety=produce.variety,
            total_quantity=float(produce.total_quantity),
            quantity_unit=produce.quantity_unit,
            quality_grade=produce.quality_grade,
            expected_price=float(produce.expected_price),
            price_unit=produce.price_unit,
            harvest_date=produce.harvest_date.isoformat() if produce.harvest_date else "",
            farmer_id=produce.farmer_profile_id,
            farmer_name=profile.full_name if profile else "Unknown Farmer",
            farmer_status=farmer.verification_status if farmer else "PENDING",
            farm_id=produce.farm_id,
            farm_name=farm.farm_name if farm else "Unknown Farm",
            location=location_str,
            image_count=len(produce.images),
            primary_image_url=primary_url,
            status=produce.status,
            verification_notes=produce.verification_notes,
            submitted_at=produce.submitted_at.isoformat() if produce.submitted_at else None,
            created_at=produce.created_at.isoformat() if produce.created_at else "",
        )

    def list_produce_verifications(
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
    ) -> ProduceVerificationListResponse:
        """Fetch a paginated list of produce listings for admin verification review."""
        items, total = produce_repository.list_for_admin_verification(
            db,
            status=status,
            category=category,
            search=search,
            farmer_id=farmer_id,
            farm_id=farm_id,
            page=page,
            page_size=page_size,
        )

        produce_items = [self._build_produce_item(item) for item in items]
        total_pages = max(1, math.ceil(total / page_size)) if total > 0 else 1

        return ProduceVerificationListResponse(
            items=produce_items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    def get_produce_verification_detail(
        self, db: Session, produce_id: str
    ) -> ProduceVerificationDetailResponse:
        """Fetch full review details: produce specs, images with metadata, farm parcel, and audit log."""
        produce = produce_repository.get_by_id_with_details(db, produce_id)
        if not produce:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Produce listing with ID '{produce_id}' not found.",
            )

        farmer = produce.farmer_profile
        profile = farmer.profile if farmer else None
        farm = produce.farm

        history_records = verification_record_repository.get_history_for_entity(
            db, "PRODUCE", produce.id
        )

        history_items = [
            VerificationRecordResponse(
                id=rec.id,
                entity_type=rec.entity_type,
                entity_id=rec.entity_id,
                action=rec.action,
                previous_status=rec.previous_status,
                new_status=rec.new_status,
                admin_user_id=rec.admin_user_id,
                admin_name=rec.admin_user.full_name if rec.admin_user else "System / Farmer",
                admin_email=rec.admin_user.email if rec.admin_user else None,
                reason=rec.reason,
                created_at=rec.created_at.isoformat() if rec.created_at else "",
            )
            for rec in history_records
        ]

        produce_resp = produce_service._format_produce_response(produce)
        farm_resp = farmer_service._map_farm_response(farm) if farm else None

        location_str = f"{farm.village}, {farm.district}, {farm.state}" if farm else "Unknown Location"

        return ProduceVerificationDetailResponse(
            produce=produce_resp,
            farmer_id=produce.farmer_profile_id,
            farmer_name=profile.full_name if profile else "Unknown Farmer",
            farmer_verification_status=farmer.verification_status if farmer else "PENDING",
            farmer_location=location_str,
            farm=farm_resp,
            images=produce_resp.images,
            history=history_items,
        )

    def approve_produce(
        self,
        db: Session,
        *,
        admin_profile: Profile,
        produce_id: str,
        notes: Optional[str] = None,
    ) -> ProduceVerificationDetailResponse:
        """
        Approves a produce listing.
        Pre-conditions enforced:
        - Must be in PENDING_VERIFICATION status
        - Originating FarmerProfile must be VERIFIED
        - Listing must have at least 1 image
        """
        produce = produce_repository.get_by_id_with_details(db, produce_id)
        if not produce:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Produce listing with ID '{produce_id}' not found.",
            )

        if produce.status != ProduceStatus.PENDING_VERIFICATION.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot approve produce in '{produce.status}' state. Only lots in PENDING_VERIFICATION can be approved.",
            )

        # Farmer verification guard
        farmer = produce.farmer_profile
        if not farmer or farmer.verification_status != VerificationStatus.VERIFIED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot approve produce listing until the farmer profile is verified. Please verify the farmer first.",
            )

        # Photo guard
        if not produce.images or len(produce.images) < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one produce image is required to approve.",
            )

        previous_status = produce.status
        now = datetime.now(timezone.utc)
        produce.status = ProduceStatus.APPROVED.value
        produce.verified_at = now
        produce.approved_at = now
        produce.verified_by = admin_profile.id
        if notes:
            produce.verification_notes = notes.strip()

        db.add(produce)
        db.commit()
        db.refresh(produce)

        # Audit record
        verification_record_repository.create_record(
            db,
            entity_type="PRODUCE",
            entity_id=produce.id,
            action="APPROVE",
            previous_status=previous_status,
            new_status=ProduceStatus.APPROVED.value,
            admin_user_id=admin_profile.id,
            reason=notes.strip() if notes else "Produce quality grade, inventory lot, and imagery verified.",
        )

        logger.info(f"Admin {admin_profile.email} approved produce {produce.id}")

        # Phase 14: Notify farmer/producer of produce approval
        if produce.farmer_profile and produce.farmer_profile.profile_id:
            notification_service.create_notification(
                db,
                recipient_user_id=produce.farmer_profile.profile_id,
                type=NotificationType.PRODUCE,
                title="Produce Listing Approved",
                message=f"Your listing for '{produce.product_name}' has been approved.",
                entity_type="PRODUCE",
                entity_id=produce.id,
                action_url=f"/farmer/produce/{produce.id}",
            )
            db.commit()

        return self.get_produce_verification_detail(db, produce_id)

    def publish_produce(
        self,
        db: Session,
        *,
        admin_profile: Profile,
        produce_id: str,
        notes: Optional[str] = None,
    ) -> ProduceVerificationDetailResponse:
        """Publishes an APPROVED produce listing to LISTED for marketplace visibility."""
        produce = produce_repository.get_by_id_with_details(db, produce_id)
        if not produce:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Produce listing with ID '{produce_id}' not found.",
            )

        if produce.status != ProduceStatus.APPROVED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot publish produce in '{produce.status}' state. Only APPROVED lots can be published.",
            )

        previous_status = produce.status
        produce_repository.publish_produce(db, db_obj=produce)

        logger.info(f"Admin {admin_profile.email} published produce {produce.id} to LISTED")
        return self.get_produce_verification_detail(db, produce_id)

    def reject_produce(
        self,
        db: Session,
        *,
        admin_profile: Profile,
        produce_id: str,
        reason: str,
    ) -> ProduceVerificationDetailResponse:
        """
        Rejects a produce listing with mandatory explanation.
        Transitions lot to REJECTED so the farmer can edit and resubmit.
        """
        clean_reason = reason.strip()
        if len(clean_reason) < 5:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="A detailed rejection explanation of at least 5 characters is mandatory.",
            )

        produce = produce_repository.get_by_id_with_details(db, produce_id)
        if not produce:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Produce listing with ID '{produce_id}' not found.",
            )

        if produce.status != ProduceStatus.PENDING_VERIFICATION.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot reject produce in '{produce.status}' state. Only lots in PENDING_VERIFICATION can be rejected.",
            )

        previous_status = produce.status
        now = datetime.now(timezone.utc)
        produce.status = ProduceStatus.REJECTED.value
        produce.verified_at = now
        produce.verified_by = admin_profile.id
        produce.verification_notes = clean_reason

        db.add(produce)
        db.commit()
        db.refresh(produce)

        # Audit record
        verification_record_repository.create_record(
            db,
            entity_type="PRODUCE",
            entity_id=produce.id,
            action="REJECT",
            previous_status=previous_status,
            new_status=ProduceStatus.REJECTED.value,
            admin_user_id=admin_profile.id,
            reason=clean_reason,
        )

        logger.info(f"Admin {admin_profile.email} rejected produce {produce.id}: {clean_reason}")

        # Phase 14: Notify farmer/producer of produce rejection
        if produce.farmer_profile and produce.farmer_profile.profile_id:
            notification_service.create_notification(
                db,
                recipient_user_id=produce.farmer_profile.profile_id,
                type=NotificationType.PRODUCE,
                title="Produce Listing Rejected",
                message=f"Your listing for '{produce.product_name}' was rejected. Reason: {clean_reason}",
                entity_type="PRODUCE",
                entity_id=produce.id,
                action_url=f"/farmer/produce/{produce.id}",
            )
            db.commit()

        return self.get_produce_verification_detail(db, produce_id)

    # -------------------------------------------------------------------------
    # Verification History / Audit
    # -------------------------------------------------------------------------

    def list_verification_records(
        self,
        db: Session,
        *,
        entity_type: Optional[str] = None,
        action: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> VerificationRecordListResponse:
        """Paginated query of verification audit history logs."""
        items, total = verification_record_repository.list_records(
            db,
            entity_type=entity_type,
            action=action,
            search=search,
            page=page,
            page_size=page_size,
        )

        record_responses = [
            VerificationRecordResponse(
                id=rec.id,
                entity_type=rec.entity_type,
                entity_id=rec.entity_id,
                action=rec.action,
                previous_status=rec.previous_status,
                new_status=rec.new_status,
                admin_user_id=rec.admin_user_id,
                admin_name=rec.admin_user.full_name if rec.admin_user else "System / Farmer",
                admin_email=rec.admin_user.email if rec.admin_user else None,
                reason=rec.reason,
                created_at=rec.created_at.isoformat() if rec.created_at else "",
            )
            for rec in items
        ]

        total_pages = max(1, math.ceil(total / page_size)) if total > 0 else 1

        return VerificationRecordListResponse(
            items=record_responses,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )


admin_service = AdminService()
