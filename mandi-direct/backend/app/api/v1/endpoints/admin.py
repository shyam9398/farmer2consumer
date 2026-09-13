from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_roles
from app.models.enums import UserRole
from app.models.profile import Profile
from app.schemas.admin import (
    AdminDashboardStats,
    FarmerVerificationDetailResponse,
    FarmerVerificationListResponse,
    ProduceVerificationDetailResponse,
    ProduceVerificationListResponse,
    VerificationDecisionRequest,
    VerificationRecordListResponse,
    VerificationRejectRequest,
)
from app.services.admin import admin_service

router = APIRouter(prefix="/admin", tags=["Admin Verification & Governance"])


@router.get(
    "/dashboard/stats",
    response_model=AdminDashboardStats,
    summary="Get Verification Dashboard Statistics",
    description="Live aggregate counts of pending, verified, and rejected farmers and produce listings.",
)
def get_dashboard_stats(
    current_user: Profile = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
) -> AdminDashboardStats:
    return admin_service.get_dashboard_stats(db)


# -------------------------------------------------------------------------
# Farmer Verification Routes
# -------------------------------------------------------------------------


@router.get(
    "/farmers/verification",
    response_model=FarmerVerificationListResponse,
    summary="List Farmers for Verification",
    description="Paginated queue of farmers with search and status filtering (PENDING, VERIFIED, REJECTED, or ALL).",
)
def list_farmers_for_verification(
    status_filter: Optional[str] = Query(None, alias="status", description="VerificationStatus filter"),
    search: Optional[str] = Query(None, description="Search query matching farmer name, phone, email, district, state"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: Profile = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
) -> FarmerVerificationListResponse:
    return admin_service.list_farmer_verifications(
        db,
        status=status_filter,
        search=search,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/farmers/{farmer_id}/verification",
    response_model=FarmerVerificationDetailResponse,
    summary="Get Farmer Verification Details",
    description="Comprehensive verification view including profile, farm parcels, produce history, and audit trail.",
)
def get_farmer_verification_detail(
    farmer_id: str,
    current_user: Profile = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
) -> FarmerVerificationDetailResponse:
    return admin_service.get_farmer_verification_detail(db, farmer_id=farmer_id)


@router.post(
    "/farmers/{farmer_id}/approve",
    response_model=FarmerVerificationDetailResponse,
    summary="Approve Farmer Profile",
    description="Approves a farmer's profile, marking them VERIFIED with timestamp and admin audit record.",
)
def approve_farmer(
    farmer_id: str,
    decision: Optional[VerificationDecisionRequest] = None,
    current_user: Profile = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
) -> FarmerVerificationDetailResponse:
    note = (decision.notes or decision.note) if decision else None
    return admin_service.approve_farmer(
        db,
        farmer_id=farmer_id,
        admin_profile=current_user,
        notes=note,
    )


@router.post(
    "/farmers/{farmer_id}/reject",
    response_model=FarmerVerificationDetailResponse,
    summary="Reject Farmer Profile",
    description="Rejects a farmer's profile. Requires a mandatory explanatory reason of at least 5 characters.",
)
def reject_farmer(
    farmer_id: str,
    decision: VerificationRejectRequest,
    current_user: Profile = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
) -> FarmerVerificationDetailResponse:
    return admin_service.reject_farmer(
        db,
        farmer_id=farmer_id,
        admin_profile=current_user,
        reason=decision.reason,
    )


# -------------------------------------------------------------------------
# Produce Verification Routes
# -------------------------------------------------------------------------


@router.get(
    "/produce/verification",
    response_model=ProduceVerificationListResponse,
    summary="List Produce for Verification",
    description="Paginated queue of produce lots with search, category, and status filtering.",
)
def list_produce_for_verification(
    status_filter: Optional[str] = Query(None, alias="status", description="ProduceStatus filter"),
    category: Optional[str] = Query(None, description="Product category filter"),
    search: Optional[str] = Query(None, description="Search query matching produce name, variety, or farmer details"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: Profile = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
) -> ProduceVerificationListResponse:
    return admin_service.list_produce_verifications(
        db,
        status=status_filter,
        search=search,
        category=category,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/produce/{produce_id}/verification",
    response_model=ProduceVerificationDetailResponse,
    summary="Get Produce Verification Details",
    description="Comprehensive produce lot review view with high-res photo gallery, farmer profile, farm parcel, and audit logs.",
)
def get_produce_verification_detail(
    produce_id: str,
    current_user: Profile = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
) -> ProduceVerificationDetailResponse:
    return admin_service.get_produce_verification_detail(db, produce_id=produce_id)


@router.post(
    "/produce/{produce_id}/approve",
    response_model=ProduceVerificationDetailResponse,
    summary="Approve Produce Lot",
    description="Approves a produce lot for public market listing. Enforces farmer is VERIFIED and >= 1 photo is present.",
)
def approve_produce(
    produce_id: str,
    decision: Optional[VerificationDecisionRequest] = None,
    current_user: Profile = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
) -> ProduceVerificationDetailResponse:
    note = (decision.notes or decision.note) if decision else None
    return admin_service.approve_produce(
        db,
        produce_id=produce_id,
        admin_profile=current_user,
        notes=note,
    )


@router.post(
    "/produce/{produce_id}/reject",
    response_model=ProduceVerificationDetailResponse,
    summary="Reject Produce Lot",
    description="Rejects a produce lot back to farmer for corrections. Requires a mandatory explanatory reason (>= 5 chars).",
)
def reject_produce(
    produce_id: str,
    decision: VerificationRejectRequest,
    current_user: Profile = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
) -> ProduceVerificationDetailResponse:
    return admin_service.reject_produce(
        db,
        produce_id=produce_id,
        admin_profile=current_user,
        reason=decision.reason,
    )


@router.post(
    "/produce/{produce_id}/publish",
    response_model=ProduceVerificationDetailResponse,
    summary="Publish Approved Produce to Marketplace",
    description="Publishes an approved produce listing directly to the public marketplace as LISTED.",
)
def admin_publish_produce(
    produce_id: str,
    note: Optional[str] = Query(None, description="Optional listing notes"),
    current_user: Profile = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
) -> ProduceVerificationDetailResponse:
    return admin_service.publish_produce(
        db,
        produce_id=produce_id,
        admin_profile=current_user,
        notes=note,
    )


# -------------------------------------------------------------------------
# Audit Trail Route
# -------------------------------------------------------------------------


@router.get(
    "/verification-history",
    response_model=VerificationRecordListResponse,
    summary="List Verification Audit History",
    description="Paginated global verification log capturing every approve, reject, and resubmit event with admin traceability.",
)
def list_verification_history(
    entity_type: Optional[str] = Query(None, description="Filter by entity type (FARMER, PRODUCE)"),
    action: Optional[str] = Query(None, description="Filter by action (APPROVE, REJECT, RESUBMIT)"),
    search: Optional[str] = Query(None, description="Search query matching reason, entity ID, or admin name"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: Profile = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
) -> VerificationRecordListResponse:
    return admin_service.list_verification_records(
        db,
        entity_type=entity_type,
        action=action,
        search=search,
        page=page,
        page_size=page_size,
    )
