import secrets
import string
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy import case, update
from sqlalchemy.orm import Session
from app.models.address import BuyerAddress
from app.models.cart import CartItem, ShoppingCart
from app.models.enums import NotificationType, OrderStatus, PaymentStatus, ProduceStatus
from app.models.farmer import Farm, FarmerProfile
from app.models.logistics import OrderLogistics
from app.models.order import Order, OrderItem, OrderStatusHistory
from app.models.produce import ProduceImage, ProduceListing
from app.models.profile import Profile
from app.schemas.order import (
    BuyerOrderDetailResponse,
    BuyerOrderSummaryResponse,
    FarmerOrderDetailResponse,
    FarmerOrderItemResponse,
    FarmerOrderStatsResponse,
    FarmerOrderSummaryResponse,
    OrderCancelRequest,
    OrderCreateRequest,
    OrderItemResponse,
    OrderStatusHistoryResponse,
)
from app.services.address import address_service
from app.services.logistics import logistics_service
from app.services.notification_service import notification_service


def generate_order_number() -> str:
    """Generate a human-friendly unique order reference e.g. MD-20260910-8F4K2."""
    date_part = datetime.now(timezone.utc).strftime("%Y%m%d")
    chars = string.ascii_uppercase + string.digits
    rand_part = "".join(secrets.choice(chars) for _ in range(5))
    return f"MD-{date_part}-{rand_part}"


class OrderService:
    # Allowed transitions for Farmer actions
    FARMER_ALLOWED_TRANSITIONS = {
        OrderStatus.PENDING.value: [OrderStatus.ACCEPTED.value, OrderStatus.REJECTED.value],
        OrderStatus.ACCEPTED.value: [OrderStatus.PREPARING.value],
        OrderStatus.PREPARING.value: [OrderStatus.READY_FOR_PICKUP.value],
    }

    def create_order(
        self, db: Session, buyer_user_id: str, order_in: OrderCreateRequest
    ) -> BuyerOrderDetailResponse:
        """
        Atomically create a direct wholesale purchase order from the buyer's cart.
        Applies atomic anti-overselling updates and records permanent historical snapshots.
        """
        # 1. Fetch buyer cart
        cart = (
            db.query(ShoppingCart)
            .filter(ShoppingCart.buyer_user_id == buyer_user_id)
            .first()
        )
        if not cart:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Shopping cart is empty. Please add products before placing an order.",
            )

        cart_items = (
            db.query(CartItem)
            .filter(CartItem.cart_id == cart.id)
            .all()
        )
        if not cart_items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Your cart is empty. Please add produce items before checkout.",
            )

        # 2. Validate and snapshot delivery address
        address = address_service.get_address_by_id(
            db, order_in.delivery_address_id, buyer_user_id
        )
        address_snapshot: Dict[str, Any] = {
            "id": address.id,
            "full_name": address.full_name,
            "phone": address.phone,
            "address_line1": address.address_line1,
            "address_line2": address.address_line2,
            "village": address.village,
            "mandal": address.mandal,
            "district": address.district,
            "state": address.state,
            "pincode": address.pincode,
            "landmark": address.landmark,
        }

        # 3. Process inventory and calculate totals atomically within a savepoint
        order_items: List[OrderItem] = []
        calculated_subtotal = Decimal("0.00")

        savepoint = db.begin_nested()
        try:
            for item in cart_items:
                produce = (
                    db.query(ProduceListing)
                    .filter(ProduceListing.id == item.produce_listing_id)
                    .first()
                )
                if not produce:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="One of the items in your cart is no longer available.",
                    )

                if produce.status != ProduceStatus.LISTED.value:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Product '{produce.product_name}' is no longer active for ordering ({produce.status}).",
                    )

                prod_name = produce.product_name
                item_qty = Decimal(item.quantity)

                # Atomic decrement to prevent concurrent overselling
                stmt = (
                    update(ProduceListing)
                    .where(
                        ProduceListing.id == produce.id,
                        ProduceListing.status == ProduceStatus.LISTED.value,
                        ProduceListing.available_quantity >= item_qty,
                    )
                    .values(
                        available_quantity=ProduceListing.available_quantity - item_qty,
                        sold_quantity=ProduceListing.sold_quantity + item_qty,
                    )
                )
                result = db.execute(stmt)
                if result.rowcount == 0:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=(
                            f"The requested quantity for '{prod_name}' is no longer available. "
                            f"Please review your cart before placing the order."
                        ),
                    )

                # If inventory reached 0, transition status to SOLD_OUT
                db.query(ProduceListing).filter(
                    ProduceListing.id == produce.id,
                    ProduceListing.available_quantity == 0,
                ).update({"status": ProduceStatus.SOLD_OUT.value})

                # Authoritative DB price snapshot
                unit_price = Decimal(produce.expected_price)
                line_subtotal = item_qty * unit_price
                calculated_subtotal += line_subtotal

                order_item = OrderItem(
                    produce_listing_id=produce.id,
                    farmer_profile_id=produce.farmer_profile_id,
                    product_name=produce.product_name,
                    quantity=item_qty,
                    quantity_unit=produce.quantity_unit,
                    unit_price=unit_price,
                    subtotal=line_subtotal,
                )
                order_items.append(order_item)

            # 4. Create Order
            delivery_fee = Decimal("0.00")
            total_amount = calculated_subtotal + delivery_fee
            order_number = generate_order_number()

            order = Order(
                order_number=order_number,
                buyer_user_id=buyer_user_id,
                status=OrderStatus.PENDING.value,
                payment_status=PaymentStatus.PENDING.value,
                subtotal=calculated_subtotal,
                delivery_fee=delivery_fee,
                total_amount=total_amount,
                delivery_address_id=address.id,
                delivery_address_snapshot=address_snapshot,
                buyer_notes=order_in.buyer_notes.strip() if order_in.buyer_notes else None,
                items=order_items,
            )
            db.add(order)
            db.flush()

            # 5. Insert initial status history
            history = OrderStatusHistory(
                order_id=order.id,
                previous_status=None,
                new_status=OrderStatus.PENDING.value,
                changed_by=buyer_user_id,
                reason="Order placed successfully by buyer.",
            )
            db.add(history)

            # Initialize OrderLogistics record with destination details
            logistics = OrderLogistics(
                order_id=order.id,
                collection_type="COLLECTION_POINT",
                delivery_address=address.address_line1 + (f", {address.address_line2}" if address.address_line2 else ""),
                delivery_village=address.village,
                delivery_mandal=address.mandal,
                delivery_district=address.district,
                delivery_state=address.state,
                delivery_pincode=address.pincode,
            )
            db.add(logistics)

            # 6. Clear buyer's cart
            db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()

            savepoint.commit()
            db.commit()
            db.refresh(order)

            # Phase 14: Notify buyer of order creation
            notification_service.create_notification(
                db,
                recipient_user_id=buyer_user_id,
                type=NotificationType.ORDER,
                title="Order Placed",
                message=f"Your order #{order.order_number} has been placed successfully.",
                entity_type="ORDER",
                entity_id=order.id,
                action_url=f"/buyer/orders/{order.id}",
            )

            # Phase 14: Notify selling farmers/producers
            farmer_uids = set()
            for item in order_items:
                fp = db.query(FarmerProfile).filter(FarmerProfile.id == item.farmer_profile_id).first()
                if fp and fp.profile_id:
                    farmer_uids.add(fp.profile_id)

            for f_uid in farmer_uids:
                notification_service.create_notification(
                    db,
                    recipient_user_id=f_uid,
                    type=NotificationType.ORDER,
                    title="New Order Received",
                    message=f"You have received a new order #{order.order_number}.",
                    entity_type="ORDER",
                    entity_id=order.id,
                    action_url=f"/farmer/orders/{order.id}",
                )
            db.commit()
        except Exception:
            savepoint.rollback()
            raise

        return self.get_buyer_order_detail(db, buyer_user_id, order.id)

    def cancel_buyer_order(
        self,
        db: Session,
        buyer_user_id: str,
        order_id: str,
        cancel_in: OrderCancelRequest,
    ) -> BuyerOrderDetailResponse:
        """
        Cancel a PENDING buyer order and atomically restore reserved inventory back to the marketplace.
        """
        order = (
            db.query(Order)
            .filter(Order.id == order_id, Order.buyer_user_id == buyer_user_id)
            .first()
        )
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found or access unauthorized.",
            )

        if order.status != OrderStatus.PENDING.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Order in '{order.status}' status cannot be cancelled. Only PENDING orders can be cancelled.",
            )

        # Restore inventory for each item
        for item in order.items:
            stmt = (
                update(ProduceListing)
                .where(ProduceListing.id == item.produce_listing_id)
                .values(
                    available_quantity=ProduceListing.available_quantity + item.quantity,
                    sold_quantity=case(
                        (
                            ProduceListing.sold_quantity >= item.quantity,
                            ProduceListing.sold_quantity - item.quantity,
                        ),
                        else_=Decimal("0.00"),
                    ),
                    status=case(
                        (
                            ProduceListing.status == ProduceStatus.SOLD_OUT.value,
                            ProduceStatus.LISTED.value,
                        ),
                        else_=ProduceListing.status,
                    ),
                )
            )
            db.execute(stmt)

        previous_status = order.status
        order.status = OrderStatus.CANCELLED.value
        db.add(order)

        # History entry
        history = OrderStatusHistory(
            order_id=order.id,
            previous_status=previous_status,
            new_status=OrderStatus.CANCELLED.value,
            changed_by=buyer_user_id,
            reason=cancel_in.reason or "Cancelled by buyer.",
        )
        db.add(history)

        db.commit()
        db.refresh(order)

        # Phase 14: Notify buyer of cancellation
        notification_service.create_notification(
            db,
            recipient_user_id=buyer_user_id,
            type=NotificationType.ORDER,
            title="Order Cancelled",
            message=f"Your order #{order.order_number} has been cancelled.",
            entity_type="ORDER",
            entity_id=order.id,
            action_url=f"/buyer/orders/{order.id}",
        )

        # Phase 14: Notify farmers of cancellation
        farmer_uids = set()
        for item in order.items:
            fp = db.query(FarmerProfile).filter(FarmerProfile.id == item.farmer_profile_id).first()
            if fp and fp.profile_id:
                farmer_uids.add(fp.profile_id)

        for f_uid in farmer_uids:
            notification_service.create_notification(
                db,
                recipient_user_id=f_uid,
                type=NotificationType.ORDER,
                title="Order Cancelled",
                message=f"Order #{order.order_number} was cancelled by the buyer.",
                entity_type="ORDER",
                entity_id=order.id,
                action_url=f"/farmer/orders/{order.id}",
            )
        db.commit()

        return self.get_buyer_order_detail(db, buyer_user_id, order.id)

    def get_buyer_orders(
        self,
        db: Session,
        buyer_user_id: str,
        status_filter: Optional[str] = None,
    ) -> List[BuyerOrderSummaryResponse]:
        """List past orders placed by the authenticated buyer."""
        query = db.query(Order).filter(Order.buyer_user_id == buyer_user_id)
        if status_filter and status_filter.upper() != "ALL":
            query = query.filter(Order.status == status_filter.upper())

        orders = query.order_by(Order.created_at.desc()).all()
        summaries: List[BuyerOrderSummaryResponse] = []

        for o in orders:
            first_item = o.items[0] if o.items else None
            first_img_url = None
            if first_item:
                primary_img = (
                    db.query(ProduceImage)
                    .filter(ProduceImage.produce_listing_id == first_item.produce_listing_id)
                    .order_by(ProduceImage.is_primary.desc(), ProduceImage.display_order.asc())
                    .first()
                )
                first_img_url = primary_img.public_url or primary_img.image_url if primary_img else None

            summaries.append(
                BuyerOrderSummaryResponse(
                    id=o.id,
                    order_number=o.order_number,
                    status=o.status,
                    payment_status=o.payment_status,
                    subtotal=Decimal(o.subtotal),
                    delivery_fee=Decimal(o.delivery_fee),
                    total_amount=Decimal(o.total_amount),
                    items_count=len(o.items),
                    first_product_name=first_item.product_name if first_item else "Produce Order",
                    first_product_image=first_img_url,
                    created_at=o.created_at,
                )
            )

        return summaries

    def get_buyer_order_detail(
        self, db: Session, buyer_user_id: str, order_id: str
    ) -> BuyerOrderDetailResponse:
        """Get full order details including timeline, logistics, and item snapshots for the buyer."""
        order = (
            db.query(Order)
            .filter(Order.id == order_id, Order.buyer_user_id == buyer_user_id)
            .first()
        )
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found or access unauthorized.",
            )

        item_responses: List[OrderItemResponse] = []
        for item in order.items:
            # Primary photo
            primary_img = (
                db.query(ProduceImage)
                .filter(ProduceImage.produce_listing_id == item.produce_listing_id)
                .order_by(ProduceImage.is_primary.desc(), ProduceImage.display_order.asc())
                .first()
            )
            img_url = primary_img.public_url or primary_img.image_url if primary_img else None

            # Farmer name
            fp = db.query(FarmerProfile).filter(FarmerProfile.id == item.farmer_profile_id).first()
            f_user = db.query(Profile).filter(Profile.id == fp.profile_id).first() if fp else None

            item_responses.append(
                OrderItemResponse(
                    id=item.id,
                    order_id=item.order_id,
                    produce_listing_id=item.produce_listing_id,
                    farmer_profile_id=item.farmer_profile_id,
                    product_name=item.product_name,
                    quantity=Decimal(item.quantity),
                    quantity_unit=item.quantity_unit,
                    unit_price=Decimal(item.unit_price),
                    subtotal=Decimal(item.subtotal),
                    primary_image_url=img_url,
                    farmer_name=f_user.full_name if f_user else "Farmer",
                )
            )

        history_responses = [
            OrderStatusHistoryResponse(
                id=h.id,
                order_id=h.order_id,
                previous_status=h.previous_status,
                new_status=h.new_status,
                changed_by=h.changed_by,
                actor_name=h.actor.full_name if h.actor else "System",
                reason=h.reason,
                created_at=h.created_at,
            )
            for h in order.status_history
        ]

        logistics_resp = logistics_service.format_logistics_response(order.logistics)

        return BuyerOrderDetailResponse(
            id=order.id,
            order_number=order.order_number,
            status=order.status,
            payment_status=order.payment_status,
            subtotal=Decimal(order.subtotal),
            delivery_fee=Decimal(order.delivery_fee),
            total_amount=Decimal(order.total_amount),
            delivery_address_snapshot=order.delivery_address_snapshot,
            buyer_notes=order.buyer_notes,
            items=item_responses,
            status_history=history_responses,
            logistics=logistics_resp,
            created_at=order.created_at,
            updated_at=order.updated_at,
        )

    # -------------------------------------------------------------------------
    # Farmer Order Management Methods (Strictly Isolated to Farmer's Produce)
    # -------------------------------------------------------------------------

    def get_farmer_orders(
        self,
        db: Session,
        farmer_profile_id: str,
        status_filter: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: Optional[str] = "newest",
    ) -> List[FarmerOrderSummaryResponse]:
        """
        List incoming orders containing produce lots belonging to this farmer.
        Excludes financial figures and items of other farmers.
        """
        query = (
            db.query(Order)
            .join(OrderItem, Order.id == OrderItem.order_id)
            .filter(OrderItem.farmer_profile_id == farmer_profile_id)
            .distinct()
        )

        if status_filter and status_filter.upper() != "ALL":
            query = query.filter(Order.status == status_filter.upper())

        if search:
            search_clean = search.strip()
            query = query.filter(
                (Order.order_number.ilike(f"%{search_clean}%"))
                | (OrderItem.product_name.ilike(f"%{search_clean}%"))
            )

        if sort_by == "oldest":
            query = query.order_by(Order.created_at.asc())
        elif sort_by == "status":
            query = query.order_by(Order.status.asc(), Order.created_at.desc())
        else:
            query = query.order_by(Order.created_at.desc())

        orders = query.all()
        summaries: List[FarmerOrderSummaryResponse] = []

        for o in orders:
            farmer_items = [i for i in o.items if i.farmer_profile_id == farmer_profile_id]
            farmer_subtotal = sum(Decimal(i.subtotal) for i in farmer_items)
            prod_names = [f"{i.product_name} ({i.quantity} {i.quantity_unit})" for i in farmer_items]

            addr = o.delivery_address_snapshot or {}
            cp_name = o.logistics.collection_point.name if o.logistics and o.logistics.collection_point else None

            summaries.append(
                FarmerOrderSummaryResponse(
                    id=o.id,
                    order_number=o.order_number,
                    status=o.status,
                    created_at=o.created_at,
                    items_count=len(farmer_items),
                    product_names=prod_names,
                    farmer_subtotal=farmer_subtotal,
                    buyer_name=addr.get("full_name", "Wholesale Buyer"),
                    delivery_district=addr.get("district", "India"),
                    delivery_state=addr.get("state", ""),
                    collection_point_name=cp_name,
                )
            )

        return summaries

    def get_farmer_order_stats(
        self, db: Session, farmer_profile_id: str
    ) -> FarmerOrderStatsResponse:
        """Count orders containing the farmer's produce grouped by order status."""
        query = (
            db.query(Order.status, func.count(Order.id.distinct()))
            .join(OrderItem, Order.id == OrderItem.order_id)
            .filter(OrderItem.farmer_profile_id == farmer_profile_id)
            .group_by(Order.status)
            .all()
        )

        counts = {status: count for status, count in query}
        pending = counts.get(OrderStatus.PENDING.value, 0)
        accepted = counts.get(OrderStatus.ACCEPTED.value, 0)
        preparing = counts.get(OrderStatus.PREPARING.value, 0)
        ready = counts.get(OrderStatus.READY_FOR_PICKUP.value, 0)
        picked = counts.get(OrderStatus.PICKED_UP.value, 0)
        out = counts.get(OrderStatus.OUT_FOR_DELIVERY.value, 0)
        delivered = counts.get(OrderStatus.DELIVERED.value, 0)
        rejected = counts.get(OrderStatus.REJECTED.value, 0)
        cancelled = counts.get(OrderStatus.CANCELLED.value, 0)

        total_action = pending + ready + accepted

        return FarmerOrderStatsResponse(
            pending=pending,
            accepted=accepted,
            preparing=preparing,
            ready_for_pickup=ready,
            picked_up=picked,
            out_for_delivery=out,
            delivered=delivered,
            rejected=rejected,
            cancelled=cancelled,
            total_requiring_action=total_action,
        )

    def get_farmer_order_detail(
        self, db: Session, farmer_profile_id: str, order_id: str
    ) -> FarmerOrderDetailResponse:
        """
        Fetch details of an order containing the farmer's produce.
        Filters out any products belonging to other farmers.
        """
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found.",
            )

        farmer_items = [i for i in order.items if i.farmer_profile_id == farmer_profile_id]
        if not farmer_items:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access unauthorized: This order does not contain produce from your farm.",
            )

        farmer_subtotal = sum(Decimal(i.subtotal) for i in farmer_items)
        addr = order.delivery_address_snapshot or {}

        items_resp: List[FarmerOrderItemResponse] = []
        for i in farmer_items:
            produce = db.query(ProduceListing).filter(ProduceListing.id == i.produce_listing_id).first()
            items_resp.append(
                FarmerOrderItemResponse(
                    id=i.id,
                    produce_listing_id=i.produce_listing_id,
                    product_name=i.product_name,
                    variety=produce.variety if produce else None,
                    quality_grade=produce.quality_grade if produce else None,
                    quantity=Decimal(i.quantity),
                    quantity_unit=i.quantity_unit,
                    unit_price=Decimal(i.unit_price),
                    subtotal=Decimal(i.subtotal),
                )
            )

        history_resp = [
            OrderStatusHistoryResponse(
                id=h.id,
                order_id=h.order_id,
                previous_status=h.previous_status,
                new_status=h.new_status,
                changed_by=h.changed_by,
                actor_name=h.actor.full_name if h.actor else "System",
                reason=h.reason,
                created_at=h.created_at,
            )
            for h in order.status_history
        ]

        logistics_resp = logistics_service.format_logistics_response(order.logistics)

        return FarmerOrderDetailResponse(
            id=order.id,
            order_number=order.order_number,
            status=order.status,
            created_at=order.created_at,
            buyer_name=addr.get("full_name", "Wholesale Buyer"),
            buyer_phone=addr.get("phone", ""),
            delivery_address=addr,
            buyer_notes=order.buyer_notes,
            items=items_resp,
            farmer_subtotal=farmer_subtotal,
            status_history=history_resp,
            logistics=logistics_resp,
        )

    def update_farmer_order_status(
        self,
        db: Session,
        farmer_profile_id: str,
        user_profile_id: str,
        order_id: str,
        target_status: OrderStatus,
        reason: Optional[str] = None,
    ) -> FarmerOrderDetailResponse:
        """
        Update the status of an order containing the farmer's produce.
        Enforces allowed transitions (e.g. PENDING -> ACCEPTED, PREPARING, READY_FOR_PICKUP, REJECTED).
        If REJECTED, requires a non-empty reason and restores inventory for this farmer's produce items.
        """
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found.",
            )

        farmer_items = [i for i in order.items if i.farmer_profile_id == farmer_profile_id]
        if not farmer_items:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access unauthorized: This order does not contain produce from your farm.",
            )

        current_status = order.status
        allowed = self.FARMER_ALLOWED_TRANSITIONS.get(current_status, [])

        if target_status.value not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Cannot transition order from '{current_status}' to '{target_status.value}'. "
                    f"Allowed farmer transitions: {', '.join(allowed) if allowed else 'None'}."
                ),
            )

        # Requirement: Rejection MUST require a non-empty reason
        if target_status == OrderStatus.REJECTED:
            if not reason or not reason.strip():
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="A rejection reason is mandatory when rejecting an order.",
                )

            # Restore inventory safely
            for item in farmer_items:
                stmt = (
                    update(ProduceListing)
                    .where(ProduceListing.id == item.produce_listing_id)
                    .values(
                        available_quantity=ProduceListing.available_quantity + item.quantity,
                        sold_quantity=case(
                            (
                                ProduceListing.sold_quantity >= item.quantity,
                                ProduceListing.sold_quantity - item.quantity,
                            ),
                            else_=Decimal("0.00"),
                        ),
                        status=case(
                            (
                                ProduceListing.status == ProduceStatus.SOLD_OUT.value,
                                ProduceStatus.LISTED.value,
                            ),
                            else_=ProduceListing.status,
                        ),
                    )
                )
                db.execute(stmt)

        order.status = target_status.value
        db.add(order)

        history = OrderStatusHistory(
            order_id=order.id,
            previous_status=current_status,
            new_status=target_status.value,
            changed_by=user_profile_id,
            reason=reason.strip() if reason else f"Status updated to {target_status.value} by farmer.",
        )
        db.add(history)

        db.commit()
        db.refresh(order)

        # Phase 14: Dispatch status-specific business notifications
        if target_status == OrderStatus.ACCEPTED:
            notification_service.create_notification(
                db,
                recipient_user_id=order.buyer_user_id,
                type=NotificationType.ORDER,
                title="Order Accepted",
                message=f"Order #{order.order_number} has been accepted by the producer.",
                entity_type="ORDER",
                entity_id=order.id,
                action_url=f"/buyer/orders/{order.id}",
            )
            notification_service.create_notification(
                db,
                recipient_user_id=user_profile_id,
                type=NotificationType.ORDER,
                title="Order Accepted",
                message=f"You accepted order #{order.order_number}.",
                entity_type="ORDER",
                entity_id=order.id,
                action_url=f"/farmer/orders/{order.id}",
            )
        elif target_status == OrderStatus.REJECTED:
            notification_service.create_notification(
                db,
                recipient_user_id=order.buyer_user_id,
                type=NotificationType.ORDER,
                title="Order Rejected",
                message=f"Order #{order.order_number} was rejected by the producer. Reason: {reason}",
                entity_type="ORDER",
                entity_id=order.id,
                action_url=f"/buyer/orders/{order.id}",
            )
            notification_service.create_notification(
                db,
                recipient_user_id=user_profile_id,
                type=NotificationType.ORDER,
                title="Order Rejected",
                message=f"You rejected order #{order.order_number}.",
                entity_type="ORDER",
                entity_id=order.id,
                action_url=f"/farmer/orders/{order.id}",
            )
        elif target_status == OrderStatus.PREPARING:
            notification_service.create_notification(
                db,
                recipient_user_id=order.buyer_user_id,
                type=NotificationType.ORDER,
                title="Order Preparing",
                message=f"Order #{order.order_number} is now being prepared for fulfillment.",
                entity_type="ORDER",
                entity_id=order.id,
                action_url=f"/buyer/orders/{order.id}",
            )
        elif target_status == OrderStatus.READY_FOR_PICKUP:
            notification_service.create_notification(
                db,
                recipient_user_id=order.buyer_user_id,
                type=NotificationType.ORDER,
                title="Order Ready for Pickup",
                message=f"Order #{order.order_number} is packaged and ready for pickup.",
                entity_type="ORDER",
                entity_id=order.id,
                action_url=f"/buyer/orders/{order.id}",
            )
            notification_service.create_notification(
                db,
                recipient_user_id=user_profile_id,
                type=NotificationType.ORDER,
                title="Ready for Pickup",
                message=f"Order #{order.order_number} marked ready for pickup.",
                entity_type="ORDER",
                entity_id=order.id,
                action_url=f"/farmer/orders/{order.id}",
            )
        db.commit()

        return self.get_farmer_order_detail(db, farmer_profile_id, order.id)


order_service = OrderService()
