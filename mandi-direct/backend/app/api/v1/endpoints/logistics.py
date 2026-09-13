from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_active_user, get_db, require_roles
from app.models.enums import UserRole
from app.models.profile import Profile
from app.schemas.logistics import (
    AcceptBookingRequest,
    CollectionPointCreate,
    CollectionPointListResponse,
    CollectionPointResponse,
    CollectionPointUpdate,
    CompletePickupRequest,
    DeliveryConfirmationCreate,
    LogisticsBookingListResponse,
    LogisticsDashboardResponse,
    OrderLogisticsConfigureRequest,
    OrderLogisticsResponse,
    SchedulePickupRequest,
    StartDeliveryRequest,
    UpdateBookingLocationRequest,
    UpdateBookingStatusRequest,
)
from app.services.logistics import collection_point_service, logistics_service

router = APIRouter(tags=["Logistics & Collection Points"])


# ==============================================================================
# Collection Points Endpoints (Admin Management & Active List)
# ==============================================================================

@router.get(
    "/admin/collection-points",
    response_model=CollectionPointListResponse,
    summary="List all collection points (Admin only)",
)
def list_collection_points(
    district: Optional[str] = Query(None, description="Filter by district"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search by name, village, or pincode"),
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.ADMIN.value)),
):
    return collection_point_service.list_collection_points(
        db, district=district, is_active=is_active, search=search
    )


@router.post(
    "/admin/collection-points",
    response_model=CollectionPointResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new produce aggregation / collection point (Admin only)",
)
def create_collection_point(
    point_in: CollectionPointCreate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.ADMIN.value)),
):
    return collection_point_service.create_collection_point(db, point_in)


@router.get(
    "/admin/collection-points/{point_id}",
    response_model=CollectionPointResponse,
    summary="Get collection point by ID (Admin only)",
)
def get_collection_point(
    point_id: str,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.ADMIN.value)),
):
    point = collection_point_service.get_collection_point(db, point_id)
    return CollectionPointResponse.model_validate(point)


@router.put(
    "/admin/collection-points/{point_id}",
    response_model=CollectionPointResponse,
    summary="Update collection point (Admin only)",
)
def update_collection_point(
    point_id: str,
    point_in: CollectionPointUpdate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.ADMIN.value)),
):
    return collection_point_service.update_collection_point(db, point_id, point_in)


@router.delete(
    "/admin/collection-points/{point_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete collection point (Admin only)",
)
def delete_collection_point(
    point_id: str,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.ADMIN.value)),
):
    collection_point_service.delete_collection_point(db, point_id)
    return None


@router.get(
    "/collection-points/active",
    response_model=CollectionPointListResponse,
    summary="List active collection aggregation centers (Authenticated users)",
)
def list_active_collection_points(
    district: Optional[str] = Query(None, description="Filter by district"),
    search: Optional[str] = Query(None, description="Search by name or village"),
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_active_user),
):
    return collection_point_service.list_collection_points(
        db, district=district, is_active=True, search=search
    )


# ==============================================================================
# Order Logistics & Fulfillment Endpoints
# ==============================================================================

@router.get(
    "/orders/{order_id}/logistics",
    response_model=OrderLogisticsResponse,
    summary="Get order logistics and delivery progress (Buyer / Farmer / Admin)",
)
def get_order_logistics(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_active_user),
):
    return logistics_service.get_order_logistics(
        db, order_id=order_id, user_id=current_user.id, user_role=current_user.role
    )


@router.patch(
    "/admin/orders/{order_id}/logistics",
    response_model=OrderLogisticsResponse,
    summary="Configure order logistics, agent, vehicle, and estimates (Admin only)",
)
def configure_order_logistics(
    order_id: str,
    config_in: OrderLogisticsConfigureRequest,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.ADMIN.value)),
):
    return logistics_service.configure_logistics(
        db, order_id=order_id, config_in=config_in, admin_user_id=current_user.id
    )


@router.post(
    "/admin/orders/{order_id}/pickup/schedule",
    response_model=OrderLogisticsResponse,
    summary="Schedule pickup time and collection location for ready produce (Admin only)",
)
def schedule_order_pickup(
    order_id: str,
    schedule_in: SchedulePickupRequest,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.ADMIN.value)),
):
    return logistics_service.schedule_pickup(
        db, order_id=order_id, schedule_in=schedule_in, admin_user_id=current_user.id
    )


@router.post(
    "/admin/orders/{order_id}/pickup/complete",
    response_model=OrderLogisticsResponse,
    summary="Mark produce pickup completed: Transitions READY_FOR_PICKUP -> PICKED_UP (Admin only)",
)
def complete_order_pickup(
    order_id: str,
    payload: CompletePickupRequest = CompletePickupRequest(),
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.ADMIN.value)),
):
    return logistics_service.complete_pickup(
        db, order_id=order_id, notes=payload.notes, admin_user_id=current_user.id
    )


@router.post(
    "/admin/orders/{order_id}/delivery/start",
    response_model=OrderLogisticsResponse,
    summary="Dispatch produce: Transitions PICKED_UP -> OUT_FOR_DELIVERY (Admin only)",
)
def start_order_delivery(
    order_id: str,
    start_in: StartDeliveryRequest = StartDeliveryRequest(),
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.ADMIN.value)),
):
    return logistics_service.start_delivery(
        db, order_id=order_id, start_in=start_in, admin_user_id=current_user.id
    )


@router.post(
    "/admin/orders/{order_id}/delivery/complete",
    response_model=OrderLogisticsResponse,
    summary="Confirm delivery handover: Transitions OUT_FOR_DELIVERY -> DELIVERED (Admin only)",
)
def complete_order_delivery(
    order_id: str,
    confirm_in: DeliveryConfirmationCreate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.ADMIN.value)),
):
    return logistics_service.complete_delivery(
        db, order_id=order_id, confirm_in=confirm_in, admin_user_id=current_user.id
    )


@router.get(
    "/admin/logistics/dashboard",
    response_model=LogisticsDashboardResponse,
    summary="Logistics management dashboard with metrics, filters, and multi-farmer order tracking (Admin only)",
)
def get_logistics_dashboard(
    date_filter: Optional[str] = Query(None, description="Filter by date"),
    status: Optional[str] = Query(None, description="Filter by order status"),
    collection_point_id: Optional[str] = Query(None, description="Filter by collection point"),
    district: Optional[str] = Query(None, description="Filter by district"),
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.ADMIN.value)),
):
    return logistics_service.get_logistics_dashboard(
        db,
        date_filter=date_filter,
        status_filter=status,
        collection_point_id=collection_point_id,
        district=district,
    )


# ==============================================================================
# Buyer Logistics Booking & Partner Operations
# ==============================================================================

@router.post(
    "/orders/{order_id}/book-logistics",
    response_model=OrderLogisticsResponse,
    summary="Buyer books logistics fulfillment for an order (Buyer only)",
)
def book_order_logistics(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.BUYER.value)),
):
    return logistics_service.book_order_logistics(db, order_id=order_id, buyer_user_id=current_user.id)


@router.get(
    "/logistics/bookings",
    response_model=LogisticsBookingListResponse,
    summary="List available & assigned logistics bookings (Logistics / Admin)",
)
def list_logistics_bookings(
    status: Optional[str] = Query(None, description="Filter by booking status"),
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.LOGISTICS.value, UserRole.ADMIN.value)),
):
    uid = current_user.id if current_user.role == UserRole.LOGISTICS.value else None
    items = logistics_service.list_bookings(db, logistics_user_id=uid, status_filter=status)
    return LogisticsBookingListResponse(items=items, total=len(items))


@router.post(
    "/logistics/bookings/{order_id}/accept",
    response_model=OrderLogisticsResponse,
    summary="Logistics partner accepts booking and assigns available vehicle (Logistics only)",
)
def accept_logistics_booking(
    order_id: str,
    payload: AcceptBookingRequest,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.LOGISTICS.value)),
):
    return logistics_service.accept_booking(
        db, order_id=order_id, vehicle_id=payload.vehicle_id, logistics_user_id=current_user.id
    )


@router.post(
    "/logistics/bookings/{order_id}/status",
    response_model=OrderLogisticsResponse,
    summary="Update delivery status milestone: GOING_TO_COLLECTION -> AT_COLLECTION -> PRODUCT_LOADED -> OUT_FOR_DELIVERY -> ARRIVED_AT_DELIVERY -> DELIVERED",
)
def update_logistics_status(
    order_id: str,
    payload: UpdateBookingStatusRequest,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.LOGISTICS.value, UserRole.ADMIN.value)),
):
    return logistics_service.update_booking_status(
        db,
        order_id=order_id,
        new_status=payload.status,
        logistics_user_id=current_user.id,
        lat=payload.latitude,
        lng=payload.longitude,
        notes=payload.notes,
    )


@router.post(
    "/logistics/bookings/{order_id}/location",
    summary="Logistics broadcasts live vehicle coordinates during transit",
)
def update_vehicle_location(
    order_id: str,
    payload: UpdateBookingLocationRequest,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.LOGISTICS.value)),
):
    return logistics_service.update_booking_location(
        db,
        order_id=order_id,
        lat=payload.latitude,
        lng=payload.longitude,
        logistics_user_id=current_user.id,
    )

