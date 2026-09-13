from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_active_user, get_db, require_roles
from app.models.enums import UserRole
from app.models.farmer import FarmerProfile
from app.models.profile import Profile
from app.schemas.order import (
    BuyerOrderDetailResponse,
    BuyerOrderSummaryResponse,
    FarmerOrderDetailResponse,
    FarmerOrderStatsResponse,
    FarmerOrderSummaryResponse,
    OrderCancelRequest,
    OrderCreateRequest,
    OrderStatusUpdateRequest,
)
from app.services.order import order_service

router = APIRouter(tags=["Orders & Fulfillment"])


# ------------------------------------------------------------------------------
# Buyer Order Endpoints
# ------------------------------------------------------------------------------

@router.get(
    "/buyer/orders",
    response_model=List[BuyerOrderSummaryResponse],
    summary="List orders placed by the authenticated buyer",
)
def list_buyer_orders(
    status: Optional[str] = Query(None, description="Optional status filter (e.g. PENDING, ACCEPTED)"),
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.BUYER.value, UserRole.ADMIN.value)),
):
    return order_service.get_buyer_orders(db, current_user.id, status_filter=status)


@router.get(
    "/buyer/orders/{order_id}",
    response_model=BuyerOrderDetailResponse,
    summary="Get full order details for buyer",
)
def get_buyer_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.BUYER.value, UserRole.ADMIN.value)),
):
    return order_service.get_buyer_order_detail(db, current_user.id, order_id)


@router.post(
    "/buyer/orders",
    response_model=BuyerOrderDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Checkout: Place order from buyer's shopping cart",
)
def place_order(
    order_in: OrderCreateRequest,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.BUYER.value, UserRole.ADMIN.value)),
):
    return order_service.create_order(db, current_user.id, order_in)


@router.post(
    "/buyer/orders/{order_id}/cancel",
    response_model=BuyerOrderDetailResponse,
    summary="Cancel a PENDING buyer order and restore inventory",
)
def cancel_order(
    order_id: str,
    cancel_in: OrderCancelRequest,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.BUYER.value, UserRole.ADMIN.value)),
):
    return order_service.cancel_buyer_order(db, current_user.id, order_id, cancel_in)


# ------------------------------------------------------------------------------
# Farmer Order Endpoints
# ------------------------------------------------------------------------------

def _get_farmer_profile_id(db: Session, current_user: Profile) -> str:
    fp = db.query(FarmerProfile).filter(FarmerProfile.profile_id == current_user.id).first()
    if not fp:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Farmer profile not initialized. Please complete farmer registration.",
        )
    return fp.id


@router.get(
    "/farmer/orders/stats",
    response_model=FarmerOrderStatsResponse,
    summary="Get live metrics and actionable order counts for farmer dashboard",
)
def get_farmer_order_stats(
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.FARMER.value)),
):
    farmer_profile_id = _get_farmer_profile_id(db, current_user)
    return order_service.get_farmer_order_stats(db, farmer_profile_id)


@router.get(
    "/farmer/orders",
    response_model=List[FarmerOrderSummaryResponse],
    summary="List orders containing produce from the authenticated farmer",
)
def list_farmer_orders(
    status: Optional[str] = Query(None, description="Optional status filter"),
    search: Optional[str] = Query(None, description="Search by order number or product name"),
    sort_by: Optional[str] = Query("newest", description="Sort by newest, oldest, status"),
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.FARMER.value)),
):
    farmer_profile_id = _get_farmer_profile_id(db, current_user)
    return order_service.get_farmer_orders(
        db,
        farmer_profile_id,
        status_filter=status,
        search=search,
        sort_by=sort_by,
    )


@router.get(
    "/farmer/orders/{order_id}",
    response_model=FarmerOrderDetailResponse,
    summary="Get details of an order containing the farmer's produce",
)
def get_farmer_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.FARMER.value)),
):
    farmer_profile_id = _get_farmer_profile_id(db, current_user)
    return order_service.get_farmer_order_detail(db, farmer_profile_id, order_id)


@router.patch(
    "/farmer/orders/{order_id}/status",
    response_model=FarmerOrderDetailResponse,
    summary="Update status of an order containing the farmer's produce (e.g. ACCEPTED, REJECTED, PREPARING, READY_FOR_PICKUP)",
)
def update_farmer_order_status(
    order_id: str,
    payload: OrderStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.FARMER.value)),
):
    farmer_profile_id = _get_farmer_profile_id(db, current_user)
    return order_service.update_farmer_order_status(
        db,
        farmer_profile_id=farmer_profile_id,
        user_profile_id=current_user.id,
        order_id=order_id,
        target_status=payload.status,
        reason=payload.reason,
    )
