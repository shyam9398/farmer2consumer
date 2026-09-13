from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_active_user, get_db, require_roles
from app.models.enums import UserRole
from app.models.profile import Profile
from app.schemas.cart import (
    CartItemAddRequest,
    CartItemUpdateRequest,
    CartResponse,
)
from app.services.cart import cart_service

router = APIRouter(tags=["Shopping Cart"])


@router.get(
    "/buyer/cart",
    response_model=CartResponse,
    summary="Retrieve current buyer shopping cart and active product totals",
)
def get_cart(
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.BUYER.value, UserRole.ADMIN.value)),
):
    return cart_service.get_cart_response(db, current_user.id)


@router.post(
    "/buyer/cart/items",
    response_model=CartResponse,
    status_code=status.HTTP_200_OK,
    summary="Add produce to shopping cart with availability validation",
)
def add_cart_item(
    item_in: CartItemAddRequest,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.BUYER.value, UserRole.ADMIN.value)),
):
    return cart_service.add_item(db, current_user.id, item_in)


@router.patch(
    "/buyer/cart/items/{item_id}",
    response_model=CartResponse,
    summary="Update quantity of an item in the shopping cart",
)
def update_cart_item(
    item_id: str,
    item_in: CartItemUpdateRequest,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.BUYER.value, UserRole.ADMIN.value)),
):
    return cart_service.update_item_quantity(db, current_user.id, item_id, item_in.quantity)


@router.delete(
    "/buyer/cart/items/{item_id}",
    response_model=CartResponse,
    summary="Remove an item from the shopping cart",
)
def remove_cart_item(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.BUYER.value, UserRole.ADMIN.value)),
):
    return cart_service.remove_item(db, current_user.id, item_id)


@router.delete(
    "/buyer/cart",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Clear all items from the shopping cart",
)
def clear_cart(
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.BUYER.value, UserRole.ADMIN.value)),
):
    cart_service.clear_cart(db, current_user.id)
    return None
