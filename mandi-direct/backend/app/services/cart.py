from decimal import Decimal
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.cart import CartItem, ShoppingCart
from app.models.enums import ProduceStatus
from app.models.farmer import Farm, FarmerProfile
from app.models.produce import ProduceImage, ProduceListing
from app.models.profile import Profile
from app.schemas.cart import (
    CartItemAddRequest,
    CartItemResponse,
    CartProductInfo,
    CartResponse,
)


class CartService:
    def get_or_create_cart(self, db: Session, buyer_user_id: str) -> ShoppingCart:
        """Fetch or automatically initialize a database-backed cart for the buyer."""
        cart = (
            db.query(ShoppingCart)
            .filter(ShoppingCart.buyer_user_id == buyer_user_id)
            .first()
        )
        if not cart:
            cart = ShoppingCart(buyer_user_id=buyer_user_id)
            db.add(cart)
            db.commit()
            db.refresh(cart)
        return cart

    def get_cart_response(self, db: Session, buyer_user_id: str) -> CartResponse:
        """
        Assemble the full cart response with live product data, availability,
        farmer information, and authoritative subtotal calculations.
        """
        cart = self.get_or_create_cart(db, buyer_user_id)
        cart_items = (
            db.query(CartItem)
            .filter(CartItem.cart_id == cart.id)
            .order_by(CartItem.created_at.asc())
            .all()
        )

        item_responses: List[CartItemResponse] = []
        cart_subtotal = Decimal("0.00")

        for item in cart_items:
            produce = db.query(ProduceListing).filter(ProduceListing.id == item.produce_listing_id).first()
            if not produce:
                # Produce was deleted, remove from cart
                db.delete(item)
                db.commit()
                continue

            # Load primary image
            primary_img = (
                db.query(ProduceImage)
                .filter(ProduceImage.produce_listing_id == produce.id, ProduceImage.is_primary == True)
                .first()
            )
            if not primary_img:
                primary_img = (
                    db.query(ProduceImage)
                    .filter(ProduceImage.produce_listing_id == produce.id)
                    .order_by(ProduceImage.display_order.asc())
                    .first()
                )
            img_url = primary_img.public_url or primary_img.image_url if primary_img else None

            # Load farmer details
            farmer_profile = db.query(FarmerProfile).filter(FarmerProfile.id == produce.farmer_profile_id).first()
            farmer_user = db.query(Profile).filter(Profile.id == farmer_profile.profile_id).first() if farmer_profile else None
            farm = db.query(Farm).filter(Farm.id == produce.farm_id).first() if produce.farm_id else None

            farmer_name = farmer_user.full_name if farmer_user else "Verified Farmer"
            farmer_location = (
                f"{farm.district}, {farm.state}" if farm else f"{farmer_profile.district}, {farmer_profile.state}" if farmer_profile else "India"
            )

            product_info = CartProductInfo(
                id=produce.id,
                product_name=produce.product_name,
                category=produce.category,
                variety=produce.variety,
                expected_price=produce.expected_price,
                price_unit=produce.price_unit,
                quantity_unit=produce.quantity_unit,
                available_quantity=produce.available_quantity,
                minimum_order_quantity=produce.minimum_order_quantity,
                primary_image_url=img_url,
                status=produce.status,
                farmer_name=farmer_name,
                farmer_location=farmer_location,
            )

            item_subtotal = Decimal(item.quantity) * Decimal(produce.expected_price)
            cart_subtotal += item_subtotal

            item_responses.append(
                CartItemResponse(
                    id=item.id,
                    cart_id=item.cart_id,
                    produce_listing_id=item.produce_listing_id,
                    quantity=Decimal(item.quantity),
                    product=product_info,
                    subtotal=item_subtotal,
                    created_at=item.created_at,
                    updated_at=item.updated_at,
                )
            )

        delivery_fee = Decimal("0.00")
        total_amount = cart_subtotal + delivery_fee

        return CartResponse(
            id=cart.id,
            buyer_user_id=buyer_user_id,
            items=item_responses,
            item_count=len(item_responses),
            subtotal=cart_subtotal,
            delivery_fee=delivery_fee,
            total_amount=total_amount,
        )

    def add_item(
        self, db: Session, buyer_user_id: str, item_in: CartItemAddRequest
    ) -> CartResponse:
        """
        Add produce to cart with strict status check, positive quantity,
        and stock availability validation. Merges quantities if already in cart.
        """
        produce = db.query(ProduceListing).filter(ProduceListing.id == item_in.produce_listing_id).first()
        if not produce:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Produce listing not found.",
            )

        # Business Rule 1: Produce must be LISTED
        if produce.status != ProduceStatus.LISTED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"This produce cannot be added to cart as it is currently {produce.status}.",
            )

        # Business Rule 2: Stock must be > 0
        if produce.available_quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This product is currently SOLD OUT.",
            )

        if item_in.quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Requested quantity must be greater than zero.",
            )

        cart = self.get_or_create_cart(db, buyer_user_id)

        # Check if already in cart
        existing_item = (
            db.query(CartItem)
            .filter(
                CartItem.cart_id == cart.id,
                CartItem.produce_listing_id == produce.id,
            )
            .first()
        )

        target_quantity = (
            Decimal(existing_item.quantity) + Decimal(item_in.quantity)
            if existing_item
            else Decimal(item_in.quantity)
        )

        # Business Rule 3: Quantity cannot exceed available stock
        if target_quantity > Decimal(produce.available_quantity):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Requested quantity ({target_quantity} {produce.quantity_unit}) exceeds "
                    f"currently available stock ({produce.available_quantity} {produce.quantity_unit})."
                ),
            )

        if existing_item:
            existing_item.quantity = target_quantity
            db.add(existing_item)
        else:
            new_item = CartItem(
                cart_id=cart.id,
                produce_listing_id=produce.id,
                quantity=target_quantity,
            )
            db.add(new_item)

        db.commit()
        return self.get_cart_response(db, buyer_user_id)

    def update_item_quantity(
        self, db: Session, buyer_user_id: str, item_id: str, quantity: Decimal
    ) -> CartResponse:
        """Update quantity of an existing cart item with re-validation against available stock."""
        if quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Quantity must be greater than zero.",
            )

        cart = self.get_or_create_cart(db, buyer_user_id)
        item = (
            db.query(CartItem)
            .filter(CartItem.id == item_id, CartItem.cart_id == cart.id)
            .first()
        )
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cart item not found.",
            )

        produce = db.query(ProduceListing).filter(ProduceListing.id == item.produce_listing_id).first()
        if not produce or produce.status != ProduceStatus.LISTED.value:
            # Listing is no longer active, remove from cart
            db.delete(item)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This produce is no longer listed on the marketplace.",
            )

        if quantity > Decimal(produce.available_quantity):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Requested quantity ({quantity} {produce.quantity_unit}) exceeds "
                    f"currently available stock ({produce.available_quantity} {produce.quantity_unit})."
                ),
            )

        item.quantity = quantity
        db.add(item)
        db.commit()
        return self.get_cart_response(db, buyer_user_id)

    def remove_item(
        self, db: Session, buyer_user_id: str, item_id: str
    ) -> CartResponse:
        """Remove a line item from the buyer's cart."""
        cart = self.get_or_create_cart(db, buyer_user_id)
        item = (
            db.query(CartItem)
            .filter(CartItem.id == item_id, CartItem.cart_id == cart.id)
            .first()
        )
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cart item not found.",
            )
        db.delete(item)
        db.commit()
        return self.get_cart_response(db, buyer_user_id)

    def clear_cart(self, db: Session, buyer_user_id: str) -> None:
        """Remove all items from the buyer's cart."""
        cart = self.get_or_create_cart(db, buyer_user_id)
        db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
        db.commit()


cart_service = CartService()
