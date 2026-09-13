from datetime import date, datetime, time, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.enums import NotificationType, OrderStatus, UserRole
from app.models.farmer import Farm, FarmerProfile
from app.models.logistics import CollectionPoint, DeliveryConfirmation, OrderLogistics
from app.models.order import Order, OrderItem, OrderStatusHistory
from app.models.profile import Profile
from app.models.vehicle import Vehicle
from app.schemas.logistics import (
    AcceptBookingRequest,
    CollectionPointCreate,
    CollectionPointListResponse,
    CollectionPointResponse,
    CollectionPointUpdate,
    DeliveryConfirmationCreate,
    DeliveryConfirmationResponse,
    LogisticsBookingItem,
    LogisticsDashboardResponse,
    LogisticsDashboardStats,
    LogisticsFarmerSummary,
    LogisticsOrderSummary,
    OrderLogisticsConfigureRequest,
    OrderLogisticsResponse,
    SchedulePickupRequest,
    StartDeliveryRequest,
)
from app.services.earnings import earnings_service
from app.services.notification_service import notification_service


class CollectionPointService:
    def list_collection_points(
        self,
        db: Session,
        district: Optional[str] = None,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> CollectionPointListResponse:
        query = db.query(CollectionPoint)
        if district:
            query = query.filter(CollectionPoint.district.ilike(f"%{district}%"))
        if is_active is not None:
            query = query.filter(CollectionPoint.is_active == is_active)
        if search:
            query = query.filter(
                (CollectionPoint.name.ilike(f"%{search}%"))
                | (CollectionPoint.village.ilike(f"%{search}%"))
                | (CollectionPoint.district.ilike(f"%{search}%"))
                | (CollectionPoint.pincode.ilike(f"%{search}%"))
            )

        items = query.order_by(CollectionPoint.name.asc()).all()
        return CollectionPointListResponse(
            items=[CollectionPointResponse.model_validate(p) for p in items],
            total=len(items),
        )

    def get_collection_point(self, db: Session, point_id: str) -> CollectionPoint:
        point = db.query(CollectionPoint).filter(CollectionPoint.id == point_id).first()
        if not point:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Collection point '{point_id}' not found.",
            )
        return point

    def create_collection_point(
        self, db: Session, point_in: CollectionPointCreate
    ) -> CollectionPointResponse:
        point = CollectionPoint(
            name=point_in.name.strip(),
            description=point_in.description.strip() if point_in.description else None,
            address=point_in.address.strip(),
            village=point_in.village.strip() if point_in.village else None,
            mandal=point_in.mandal.strip() if point_in.mandal else None,
            district=point_in.district.strip(),
            state=point_in.state.strip(),
            pincode=point_in.pincode.strip(),
            latitude=point_in.latitude,
            longitude=point_in.longitude,
            contact_name=point_in.contact_name.strip(),
            contact_phone=point_in.contact_phone.strip(),
            is_active=point_in.is_active,
        )
        db.add(point)
        db.commit()
        db.refresh(point)
        return CollectionPointResponse.model_validate(point)

    def update_collection_point(
        self, db: Session, point_id: str, point_in: CollectionPointUpdate
    ) -> CollectionPointResponse:
        point = self.get_collection_point(db, point_id)
        update_data = point_in.model_dump(exclude_unset=True)

        for key, value in update_data.items():
            if isinstance(value, str):
                value = value.strip()
            setattr(point, key, value)

        db.add(point)
        db.commit()
        db.refresh(point)
        return CollectionPointResponse.model_validate(point)

    def delete_collection_point(self, db: Session, point_id: str) -> None:
        point = self.get_collection_point(db, point_id)
        db.delete(point)
        db.commit()


class LogisticsService:
    def get_or_create_logistics(self, db: Session, order: Order) -> OrderLogistics:
        """Fetch existing OrderLogistics or initialize one from delivery address snapshot."""
        if order.logistics:
            return order.logistics

        addr = order.delivery_address_snapshot or {}
        logistics = OrderLogistics(
            order_id=order.id,
            collection_type="COLLECTION_POINT",
            delivery_address=addr.get("address_line1") or addr.get("address", ""),
            delivery_village=addr.get("village"),
            delivery_mandal=addr.get("mandal"),
            delivery_district=addr.get("district"),
            delivery_state=addr.get("state"),
            delivery_pincode=addr.get("pincode"),
        )
        db.add(logistics)
        db.flush()
        db.refresh(logistics)
        return logistics

    def format_logistics_response(
        self, logistics: Optional[OrderLogistics]
    ) -> Optional[OrderLogisticsResponse]:
        if not logistics:
            return None

        cp_resp = (
            CollectionPointResponse.model_validate(logistics.collection_point)
            if logistics.collection_point
            else None
        )
        conf_resp = (
            DeliveryConfirmationResponse.model_validate(logistics.order.delivery_confirmation)
            if logistics.order and logistics.order.delivery_confirmation
            else None
        )

        return OrderLogisticsResponse(
            id=logistics.id,
            order_id=logistics.order_id,
            collection_type=logistics.collection_type,
            collection_point_id=logistics.collection_point_id,
            collection_point=cp_resp,
            pickup_address=logistics.pickup_address,
            pickup_village=logistics.pickup_village,
            pickup_mandal=logistics.pickup_mandal,
            pickup_district=logistics.pickup_district,
            pickup_state=logistics.pickup_state,
            pickup_pincode=logistics.pickup_pincode,
            pickup_latitude=logistics.pickup_latitude,
            pickup_longitude=logistics.pickup_longitude,
            delivery_address=logistics.delivery_address,
            delivery_village=logistics.delivery_village,
            delivery_mandal=logistics.delivery_mandal,
            delivery_district=logistics.delivery_district,
            delivery_state=logistics.delivery_state,
            delivery_pincode=logistics.delivery_pincode,
            delivery_latitude=logistics.delivery_latitude,
            delivery_longitude=logistics.delivery_longitude,
            assigned_agent_name=logistics.assigned_agent_name,
            assigned_agent_phone=logistics.assigned_agent_phone,
            vehicle_type=logistics.vehicle_type,
            vehicle_number=logistics.vehicle_number,
            pickup_scheduled_at=logistics.pickup_scheduled_at,
            pickup_completed_at=logistics.pickup_completed_at,
            delivery_started_at=logistics.delivery_started_at,
            delivery_completed_at=logistics.delivery_completed_at,
            estimated_delivery_at=logistics.estimated_delivery_at,
            delivery_notes=logistics.delivery_notes,
            delivery_confirmation=conf_resp,
            created_at=logistics.created_at,
            updated_at=logistics.updated_at,
        )

    def get_order_logistics(
        self,
        db: Session,
        order_id: str,
        user_id: str,
        user_role: str,
    ) -> OrderLogisticsResponse:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found.",
            )

        # Authorization check
        if user_role == UserRole.BUYER.value and order.buyer_user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access unauthorized: You can only view logistics for your own orders.",
            )
        elif user_role == UserRole.FARMER.value:
            # Farmer must have items in this order
            farmer_profile = db.query(FarmerProfile).filter(FarmerProfile.profile_id == user_id).first()
            if not farmer_profile:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Farmer profile not found.",
                )
            has_items = db.query(OrderItem).filter(
                OrderItem.order_id == order.id,
                OrderItem.farmer_profile_id == farmer_profile.id,
            ).first()
            if not has_items:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access unauthorized: This order contains no produce from your farm.",
                )

        logistics = self.get_or_create_logistics(db, order)
        db.commit()
        return self.format_logistics_response(logistics)

    def configure_logistics(
        self,
        db: Session,
        order_id: str,
        config_in: OrderLogisticsConfigureRequest,
        admin_user_id: str,
    ) -> OrderLogisticsResponse:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

        logistics = self.get_or_create_logistics(db, order)

        if config_in.collection_point_id:
            cp = db.query(CollectionPoint).filter(CollectionPoint.id == config_in.collection_point_id).first()
            if not cp:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection point not found.")
            logistics.collection_point_id = cp.id
            logistics.pickup_address = cp.address
            logistics.pickup_village = cp.village
            logistics.pickup_mandal = cp.mandal
            logistics.pickup_district = cp.district
            logistics.pickup_state = cp.state
            logistics.pickup_pincode = cp.pincode
            logistics.pickup_latitude = cp.latitude
            logistics.pickup_longitude = cp.longitude

        if config_in.collection_type:
            logistics.collection_type = config_in.collection_type
        if config_in.assigned_agent_name is not None:
            logistics.assigned_agent_name = config_in.assigned_agent_name.strip() if config_in.assigned_agent_name else None
        if config_in.assigned_agent_phone is not None:
            logistics.assigned_agent_phone = config_in.assigned_agent_phone.strip() if config_in.assigned_agent_phone else None
        if config_in.vehicle_type is not None:
            logistics.vehicle_type = config_in.vehicle_type.strip() if config_in.vehicle_type else None
        if config_in.vehicle_number is not None:
            logistics.vehicle_number = config_in.vehicle_number.strip() if config_in.vehicle_number else None
        if config_in.estimated_delivery_at is not None:
            logistics.estimated_delivery_at = config_in.estimated_delivery_at
        if config_in.delivery_notes is not None:
            logistics.delivery_notes = config_in.delivery_notes.strip() if config_in.delivery_notes else None

        db.add(logistics)
        db.commit()
        db.refresh(logistics)
        return self.format_logistics_response(logistics)

    def schedule_pickup(
        self,
        db: Session,
        order_id: str,
        schedule_in: SchedulePickupRequest,
        admin_user_id: str,
    ) -> OrderLogisticsResponse:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

        # Pickup can only be scheduled when order is in READY_FOR_PICKUP, ACCEPTED, or PREPARING
        allowed_statuses = [
            OrderStatus.READY_FOR_PICKUP.value,
            OrderStatus.ACCEPTED.value,
            OrderStatus.PREPARING.value,
        ]
        if order.status not in allowed_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot schedule pickup for order with status '{order.status}'. Allowed statuses: {', '.join(allowed_statuses)}.",
            )

        logistics = self.get_or_create_logistics(db, order)
        logistics.pickup_scheduled_at = schedule_in.pickup_scheduled_at

        if schedule_in.collection_point_id:
            cp = db.query(CollectionPoint).filter(CollectionPoint.id == schedule_in.collection_point_id).first()
            if cp:
                logistics.collection_point_id = cp.id
                logistics.pickup_address = cp.address
                logistics.pickup_village = cp.village
                logistics.pickup_mandal = cp.mandal
                logistics.pickup_district = cp.district
                logistics.pickup_state = cp.state
                logistics.pickup_pincode = cp.pincode
                logistics.pickup_latitude = cp.latitude
                logistics.pickup_longitude = cp.longitude

        if schedule_in.assigned_agent_name:
            logistics.assigned_agent_name = schedule_in.assigned_agent_name.strip()
        if schedule_in.assigned_agent_phone:
            logistics.assigned_agent_phone = schedule_in.assigned_agent_phone.strip()
        if schedule_in.vehicle_type:
            logistics.vehicle_type = schedule_in.vehicle_type.strip()
        if schedule_in.vehicle_number:
            logistics.vehicle_number = schedule_in.vehicle_number.strip()
        if schedule_in.pickup_notes:
            logistics.delivery_notes = schedule_in.pickup_notes.strip()

        db.add(logistics)

        # Audit history
        history = OrderStatusHistory(
            order_id=order.id,
            previous_status=order.status,
            new_status=order.status,
            changed_by=admin_user_id,
            reason=f"Pickup scheduled for {schedule_in.pickup_scheduled_at.isoformat()}. Notes: {schedule_in.pickup_notes or 'None'}",
        )
        db.add(history)

        db.commit()
        db.refresh(logistics)
        return self.format_logistics_response(logistics)

    def complete_pickup(
        self,
        db: Session,
        order_id: str,
        notes: Optional[str],
        admin_user_id: str,
    ) -> OrderLogisticsResponse:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

        # Concurrency safety: check current status
        if order.status in [OrderStatus.PICKED_UP.value, OrderStatus.OUT_FOR_DELIVERY.value, OrderStatus.DELIVERED.value]:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Order is already at or past PICKED_UP status (current: '{order.status}').",
            )

        if order.status != OrderStatus.READY_FOR_PICKUP.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Pickup can only be completed when order is in '{OrderStatus.READY_FOR_PICKUP.value}' status (current: '{order.status}').",
            )

        logistics = self.get_or_create_logistics(db, order)
        logistics.pickup_completed_at = datetime.now(timezone.utc)
        if notes:
            logistics.delivery_notes = notes.strip()

        previous_status = order.status
        order.status = OrderStatus.PICKED_UP.value

        history = OrderStatusHistory(
            order_id=order.id,
            previous_status=previous_status,
            new_status=OrderStatus.PICKED_UP.value,
            changed_by=admin_user_id,
            reason=notes or "Produce pickup completed from collection point.",
        )
        db.add(history)
        db.add(order)
        db.add(logistics)

        db.commit()
        db.refresh(logistics)

        # Phase 14: Notify buyer and farmers of pickup
        notification_service.create_notification(
            db,
            recipient_user_id=order.buyer_user_id,
            type=NotificationType.LOGISTICS,
            title="Order Picked Up",
            message=f"Your order #{order.order_number} has been picked up from the collection point.",
            entity_type="ORDER",
            entity_id=order.id,
            action_url=f"/buyer/orders/{order.id}",
        )
        farmer_uids = set()
        for item in order.items:
            fp = db.query(FarmerProfile).filter(FarmerProfile.id == item.farmer_profile_id).first()
            if fp and fp.profile_id:
                farmer_uids.add(fp.profile_id)

        for f_uid in farmer_uids:
            notification_service.create_notification(
                db,
                recipient_user_id=f_uid,
                type=NotificationType.LOGISTICS,
                title="Produce Picked Up",
                message=f"Your produce for order #{order.order_number} has been picked up by logistics.",
                entity_type="ORDER",
                entity_id=order.id,
                action_url=f"/farmer/orders/{order.id}",
            )
        db.commit()

        return self.format_logistics_response(logistics)

    def start_delivery(
        self,
        db: Session,
        order_id: str,
        start_in: StartDeliveryRequest,
        admin_user_id: str,
    ) -> OrderLogisticsResponse:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

        # Concurrency safety
        if order.status in [OrderStatus.OUT_FOR_DELIVERY.value, OrderStatus.DELIVERED.value]:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Order is already at or past OUT_FOR_DELIVERY status (current: '{order.status}').",
            )

        if order.status != OrderStatus.PICKED_UP.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Delivery can only be started when order is in '{OrderStatus.PICKED_UP.value}' status (current: '{order.status}').",
            )

        logistics = self.get_or_create_logistics(db, order)
        logistics.delivery_started_at = datetime.now(timezone.utc)
        if start_in.estimated_delivery_at:
            logistics.estimated_delivery_at = start_in.estimated_delivery_at
        if start_in.notes:
            logistics.delivery_notes = start_in.notes.strip()

        previous_status = order.status
        order.status = OrderStatus.OUT_FOR_DELIVERY.value

        history = OrderStatusHistory(
            order_id=order.id,
            previous_status=previous_status,
            new_status=OrderStatus.OUT_FOR_DELIVERY.value,
            changed_by=admin_user_id,
            reason=start_in.notes or "Order dispatched out for delivery to buyer destination.",
        )
        db.add(history)
        db.add(order)
        db.add(logistics)

        db.commit()
        db.refresh(logistics)

        # Phase 14: Notify buyer order is out for delivery
        notification_service.create_notification(
            db,
            recipient_user_id=order.buyer_user_id,
            type=NotificationType.LOGISTICS,
            title="Out for Delivery",
            message=f"Your order #{order.order_number} is out for delivery.",
            entity_type="ORDER",
            entity_id=order.id,
            action_url=f"/buyer/orders/{order.id}",
        )
        db.commit()

        return self.format_logistics_response(logistics)

    def complete_delivery(
        self,
        db: Session,
        order_id: str,
        confirm_in: DeliveryConfirmationCreate,
        admin_user_id: str,
    ) -> OrderLogisticsResponse:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

        # Concurrency safety
        if order.status == OrderStatus.DELIVERED.value:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Order has already been marked as DELIVERED.",
            )

        if order.status != OrderStatus.OUT_FOR_DELIVERY.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Order must be in '{OrderStatus.OUT_FOR_DELIVERY.value}' status before confirming delivery (current: '{order.status}').",
            )

        logistics = self.get_or_create_logistics(db, order)
        now = datetime.now(timezone.utc)
        logistics.delivery_completed_at = now

        # Record proof of delivery confirmation
        existing_conf = db.query(DeliveryConfirmation).filter(DeliveryConfirmation.order_id == order.id).first()
        if not existing_conf:
            confirmation = DeliveryConfirmation(
                order_id=order.id,
                confirmed_by=admin_user_id,
                confirmation_type=confirm_in.confirmation_type,
                recipient_name=confirm_in.recipient_name.strip(),
                notes=confirm_in.notes.strip() if confirm_in.notes else None,
                confirmed_at=now,
            )
            db.add(confirmation)

        previous_status = order.status
        order.status = OrderStatus.DELIVERED.value

        history = OrderStatusHistory(
            order_id=order.id,
            previous_status=previous_status,
            new_status=OrderStatus.DELIVERED.value,
            changed_by=admin_user_id,
            reason=f"Delivery confirmed by recipient '{confirm_in.recipient_name}'. Notes: {confirm_in.notes or 'None'}",
        )
        db.add(history)
        db.add(order)
        db.add(logistics)

        # Trigger Phase 10 Farmer Earnings Creation transactionally
        earnings_service.create_earnings_for_delivered_order(db, order, admin_user_id)

        db.commit()
        db.refresh(logistics)

        # Phase 14: Notify buyer and farmers of delivery completion
        notification_service.create_notification(
            db,
            recipient_user_id=order.buyer_user_id,
            type=NotificationType.LOGISTICS,
            title="Order Delivered",
            message=f"Your order #{order.order_number} has been delivered successfully.",
            entity_type="ORDER",
            entity_id=order.id,
            action_url=f"/buyer/orders/{order.id}",
        )
        farmer_uids = set()
        for item in order.items:
            fp = db.query(FarmerProfile).filter(FarmerProfile.id == item.farmer_profile_id).first()
            if fp and fp.profile_id:
                farmer_uids.add(fp.profile_id)

        for f_uid in farmer_uids:
            notification_service.create_notification(
                db,
                recipient_user_id=f_uid,
                type=NotificationType.LOGISTICS,
                title="Produce Delivered",
                message=f"Order #{order.order_number} has been delivered. Earnings are now available.",
                entity_type="ORDER",
                entity_id=order.id,
                action_url=f"/farmer/orders/{order.id}",
            )
        db.commit()

        return self.format_logistics_response(logistics)

    def get_logistics_dashboard(
        self,
        db: Session,
        date_filter: Optional[str] = None,
        status_filter: Optional[str] = None,
        collection_point_id: Optional[str] = None,
        district: Optional[str] = None,
    ) -> LogisticsDashboardResponse:
        """Fetch logistics admin dashboard counts and orders with multi-farmer breakdown."""
        # Active counts
        ready_for_pickup = db.query(Order).filter(Order.status == OrderStatus.READY_FOR_PICKUP.value).count()
        picked_up = db.query(Order).filter(Order.status == OrderStatus.PICKED_UP.value).count()
        out_for_delivery = db.query(Order).filter(Order.status == OrderStatus.OUT_FOR_DELIVERY.value).count()

        # Delivered today count
        today_start = datetime.combine(date.today(), time.min, tzinfo=timezone.utc)
        delivered_today = (
            db.query(Order)
            .join(OrderLogistics, Order.id == OrderLogistics.order_id)
            .filter(
                Order.status == OrderStatus.DELIVERED.value,
                OrderLogistics.delivery_completed_at >= today_start,
            )
            .count()
        )

        today_pickups = (
            db.query(OrderLogistics)
            .filter(OrderLogistics.pickup_scheduled_at >= today_start)
            .count()
        )

        stats = LogisticsDashboardStats(
            ready_for_pickup=ready_for_pickup,
            picked_up=picked_up,
            out_for_delivery=out_for_delivery,
            delivered_today=delivered_today,
            total_active_deliveries=ready_for_pickup + picked_up + out_for_delivery,
            today_scheduled_pickups=today_pickups,
        )

        # Build order list query
        query = db.query(Order).outerjoin(OrderLogistics, Order.id == OrderLogistics.order_id)

        if status_filter and status_filter.upper() != "ALL":
            query = query.filter(Order.status == status_filter.upper())

        if collection_point_id:
            query = query.filter(OrderLogistics.collection_point_id == collection_point_id)

        if district:
            query = query.filter(
                (OrderLogistics.delivery_district.ilike(f"%{district}%"))
                | (OrderLogistics.pickup_district.ilike(f"%{district}%"))
            )

        orders = query.order_by(Order.created_at.desc()).limit(100).all()
        summaries: List[LogisticsOrderSummary] = []

        for o in orders:
            addr = o.delivery_address_snapshot or {}
            buyer = o.buyer

            # Group items by farmer
            farmers_dict: Dict[str, Dict[str, Any]] = {}
            for item in o.items:
                f_id = item.farmer_profile_id
                if f_id not in farmers_dict:
                    fp = db.query(FarmerProfile).filter(FarmerProfile.id == f_id).first()
                    f_user = db.query(Profile).filter(Profile.id == fp.profile_id).first() if fp else None
                    primary_farm = db.query(Farm).filter(Farm.farmer_profile_id == f_id).first() if fp else None

                    farmers_dict[f_id] = {
                        "farmer_profile_id": f_id,
                        "farmer_name": f_user.full_name if f_user else "Farmer",
                        "farm_name": primary_farm.farm_name if primary_farm else None,
                        "village": primary_farm.village if primary_farm else None,
                        "district": primary_farm.district if primary_farm else None,
                        "phone": f_user.phone if f_user else None,
                        "products": [],
                    }
                farmers_dict[f_id]["products"].append(f"{item.product_name} ({item.quantity} {item.quantity_unit})")

            farmers_list = [
                LogisticsFarmerSummary(
                    farmer_profile_id=f["farmer_profile_id"],
                    farmer_name=f["farmer_name"],
                    farm_name=f["farm_name"],
                    village=f["village"],
                    district=f["district"],
                    phone=f["phone"],
                    products=f["products"],
                )
                for f in farmers_dict.values()
            ]

            summaries.append(
                LogisticsOrderSummary(
                    id=o.id,
                    order_number=o.order_number,
                    status=o.status,
                    total_amount=Decimal(o.total_amount),
                    buyer_name=addr.get("full_name") or (buyer.full_name if buyer else "Buyer"),
                    buyer_phone=addr.get("phone") or (buyer.phone if buyer else None),
                    delivery_city=addr.get("district") or addr.get("village", "India"),
                    delivery_state=addr.get("state", ""),
                    delivery_pincode=addr.get("pincode", ""),
                    farmers=farmers_list,
                    items_count=len(o.items),
                    logistics=self.format_logistics_response(o.logistics),
                    created_at=o.created_at,
                )
            )

        return LogisticsDashboardResponse(
            stats=stats,
            orders=summaries,
            total_orders=len(summaries),
        )

    def book_order_logistics(
        self, db: Session, order_id: str, buyer_user_id: str
    ) -> OrderLogisticsResponse:
        """Buyer books logistics fulfillment for their order."""
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order '{order_id}' not found.",
            )

        if order.buyer_user_id != buyer_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only book logistics for your own orders.",
            )

        logistics = db.query(OrderLogistics).filter(OrderLogistics.order_id == order_id).first()
        if not logistics:
            # Associate with default or first active collection point in the region
            col_point = db.query(CollectionPoint).filter(CollectionPoint.is_active == True).first()
            if not col_point:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No active collection hub available for logistics pickup. Please contact administration.",
                )

            addr = order.delivery_address_snapshot or {}
            logistics = OrderLogistics(
                order_id=order_id,
                collection_type="COLLECTION_POINT",
                collection_point_id=col_point.id,
                pickup_address=col_point.address,
                pickup_village=col_point.village,
                pickup_mandal=col_point.mandal,
                pickup_district=col_point.district,
                pickup_state=col_point.state,
                pickup_pincode=col_point.pincode,
                pickup_latitude=col_point.latitude,
                pickup_longitude=col_point.longitude,
                delivery_address=addr.get("street_address", "Delivery Address"),
                delivery_village=addr.get("village"),
                delivery_mandal=addr.get("mandal"),
                delivery_district=addr.get("district", "Regional District"),
                delivery_state=addr.get("state", "Regional State"),
                delivery_pincode=addr.get("pincode", "500001"),
                delivery_latitude=addr.get("latitude"),
                delivery_longitude=addr.get("longitude"),
                booking_status="BOOKING_REQUESTED",
            )
            db.add(logistics)
        else:
            logistics.booking_status = "BOOKING_REQUESTED"

        db.commit()
        db.refresh(logistics)

        # Notify available logistics users
        logistics_users = db.query(Profile).filter(Profile.role == UserRole.LOGISTICS.value).all()
        for l_user in logistics_users:
            notification_service.create_notification(
                db,
                recipient_user_id=l_user.id,
                type=NotificationType.LOGISTICS,
                title="New Logistics Booking Available",
                message=f"Order #{order.order_number} is ready for transport pickup.",
                entity_type="ORDER",
                entity_id=order.id,
                action_url=f"/logistics/dashboard",
            )
        db.commit()

        return self.format_logistics_response(logistics)

    def list_bookings(
        self, db: Session, logistics_user_id: Optional[str] = None, status_filter: Optional[str] = None
    ) -> List[LogisticsBookingItem]:
        """List logistics bookings for logistics partner view."""
        query = db.query(OrderLogistics).join(Order, OrderLogistics.order_id == Order.id)
        if logistics_user_id:
            query = query.filter(
                (OrderLogistics.logistics_user_id == logistics_user_id)
                | (OrderLogistics.booking_status == "BOOKING_REQUESTED")
            )
        if status_filter:
            query = query.filter(OrderLogistics.booking_status == status_filter)

        records = query.order_by(OrderLogistics.created_at.desc()).all()
        items: List[LogisticsBookingItem] = []

        for log in records:
            o = log.order
            p_name = "Assorted Produce"
            qty = Decimal(0)
            qty_unit = "KG"
            if o.items:
                p_name = o.items[0].product_name
                qty = sum(Decimal(i.quantity) for i in o.items)
                qty_unit = o.items[0].quantity_unit

            hub_name = log.collection_point.name if log.collection_point else "FPO Collection Hub"
            veh_num = log.assigned_vehicle.vehicle_number if log.assigned_vehicle else log.vehicle_number
            veh_type = log.assigned_vehicle.vehicle_type if log.assigned_vehicle else log.vehicle_type

            items.append(
                LogisticsBookingItem(
                    order_id=o.id,
                    order_number=o.order_number,
                    product_name=p_name,
                    quantity=qty,
                    quantity_unit=qty_unit,
                    pickup_hub_name=hub_name,
                    pickup_address=log.pickup_address or "Collection Hub",
                    pickup_latitude=log.pickup_latitude,
                    pickup_longitude=log.pickup_longitude,
                    delivery_address=log.delivery_address or "Buyer Destination",
                    delivery_latitude=log.delivery_latitude,
                    delivery_longitude=log.delivery_longitude,
                    booking_status=log.booking_status or "BOOKING_REQUESTED",
                    assigned_vehicle_id=log.assigned_vehicle_id,
                    vehicle_number=veh_num,
                    vehicle_type=veh_type,
                    current_latitude=log.current_latitude or (log.assigned_vehicle.current_latitude if log.assigned_vehicle else None),
                    current_longitude=log.current_longitude or (log.assigned_vehicle.current_longitude if log.assigned_vehicle else None),
                    created_at=log.created_at,
                )
            )
        return items

    def accept_booking(
        self, db: Session, order_id: str, vehicle_id: str, logistics_user_id: str
    ) -> OrderLogisticsResponse:
        """Logistics user accepts a booking and assigns an available vehicle."""
        logistics = db.query(OrderLogistics).filter(OrderLogistics.order_id == order_id).first()
        if not logistics:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Logistics booking for order '{order_id}' not found.",
            )

        vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
        if not vehicle:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Vehicle '{vehicle_id}' not found.",
            )

        if vehicle.logistics_user_id != logistics_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only assign vehicles from your own fleet.",
            )

        if vehicle.availability_status != "AVAILABLE":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Vehicle '{vehicle.vehicle_number}' is currently '{vehicle.availability_status}' and cannot be assigned.",
            )

        logistics.assigned_vehicle_id = vehicle.id
        logistics.vehicle_number = vehicle.vehicle_number
        logistics.vehicle_type = vehicle.vehicle_type
        logistics.logistics_user_id = logistics_user_id
        logistics.booking_status = "ASSIGNED"

        vehicle.availability_status = "ASSIGNED"

        # Notify buyer
        order = logistics.order
        notification_service.create_notification(
            db,
            recipient_user_id=order.buyer_user_id,
            type=NotificationType.LOGISTICS,
            title="Logistics Assigned",
            message=f"Vehicle {vehicle.vehicle_number} ({vehicle.vehicle_type}) has been assigned to transport your order.",
            entity_type="ORDER",
            entity_id=order.id,
            action_url=f"/buyer/orders/{order.id}",
        )

        db.commit()
        db.refresh(logistics)
        return self.format_logistics_response(logistics)

    def update_booking_status(
        self,
        db: Session,
        order_id: str,
        new_status: str,
        logistics_user_id: str,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        notes: Optional[str] = None,
    ) -> OrderLogisticsResponse:
        """Update logistics milestone: GOING_TO_COLLECTION, AT_COLLECTION, PRODUCT_LOADED, OUT_FOR_DELIVERY, ARRIVED_AT_DELIVERY, DELIVERED"""
        valid_statuses = [
            "GOING_TO_COLLECTION",
            "AT_COLLECTION",
            "PRODUCT_LOADED",
            "OUT_FOR_DELIVERY",
            "ARRIVED_AT_DELIVERY",
            "DELIVERED",
        ]
        status_upper = new_status.strip().upper()
        if status_upper not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status '{new_status}'. Allowed: {', '.join(valid_statuses)}",
            )

        logistics = db.query(OrderLogistics).filter(OrderLogistics.order_id == order_id).first()
        if not logistics:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Logistics record for order '{order_id}' not found.",
            )

        logistics.booking_status = status_upper
        if lat is not None:
            logistics.current_latitude = lat
        if lng is not None:
            logistics.current_longitude = lng
        if notes:
            logistics.delivery_notes = notes

        order = logistics.order

        # Status specific side effects and real notifications
        notification_messages = {
            "AT_COLLECTION": ("Logistics Partner at Hub", f"Your logistics partner has reached the FPO collection hub for order #{order.order_number}."),
            "PRODUCT_LOADED": ("Product Loaded", f"Your produce for order #{order.order_number} has been inspected and loaded onto the vehicle."),
            "OUT_FOR_DELIVERY": ("Delivery On The Way", f"Your order #{order.order_number} is out for delivery."),
            "ARRIVED_AT_DELIVERY": ("Partner Arrived", f"Your delivery partner has arrived at your destination address."),
            "DELIVERED": ("Order Delivered", f"Your order #{order.order_number} has been successfully delivered. Please review your produce."),
        }

        if status_upper in notification_messages:
            title, msg = notification_messages[status_upper]
            notification_service.create_notification(
                db,
                recipient_user_id=order.buyer_user_id,
                type=NotificationType.LOGISTICS,
                title=title,
                message=msg,
                entity_type="ORDER",
                entity_id=order.id,
                action_url=f"/buyer/orders/{order.id}",
            )

        if status_upper == "DELIVERED":
            order.status = OrderStatus.DELIVERED.value
            logistics.delivery_completed_at = datetime.now(timezone.utc)
            if logistics.assigned_vehicle:
                logistics.assigned_vehicle.availability_status = "AVAILABLE"

        db.commit()
        db.refresh(logistics)
        return self.format_logistics_response(logistics)

    def update_booking_location(
        self, db: Session, order_id: str, lat: float, lng: float, logistics_user_id: str
    ) -> Dict[str, Any]:
        """Broadcast live GPS coordinates of vehicle on delivery route."""
        logistics = db.query(OrderLogistics).filter(OrderLogistics.order_id == order_id).first()
        if not logistics:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Logistics for order '{order_id}' not found.",
            )

        logistics.current_latitude = lat
        logistics.current_longitude = lng
        if logistics.assigned_vehicle:
            logistics.assigned_vehicle.current_latitude = lat
            logistics.assigned_vehicle.current_longitude = lng

        db.commit()
        return {
            "order_id": order_id,
            "latitude": lat,
            "longitude": lng,
            "booking_status": logistics.booking_status,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }


collection_point_service = CollectionPointService()
logistics_service = LogisticsService()

