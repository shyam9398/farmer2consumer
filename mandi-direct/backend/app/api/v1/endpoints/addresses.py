from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_active_user, get_db, require_roles
from app.models.enums import UserRole
from app.models.profile import Profile
from app.schemas.address import (
    BuyerAddressCreate,
    BuyerAddressResponse,
    BuyerAddressUpdate,
)
from app.services.address import address_service

router = APIRouter(tags=["Buyer Addresses"])


@router.get(
    "/buyer/addresses",
    response_model=List[BuyerAddressResponse],
    summary="List saved delivery addresses for authenticated buyer",
)
def list_addresses(
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.BUYER.value, UserRole.ADMIN.value)),
):
    return address_service.get_addresses(db, current_user.id)


@router.post(
    "/buyer/addresses",
    response_model=BuyerAddressResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a new delivery address for the buyer",
)
def create_address(
    address_in: BuyerAddressCreate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.BUYER.value, UserRole.ADMIN.value)),
):
    return address_service.create_address(db, current_user.id, address_in)


@router.put(
    "/buyer/addresses/{address_id}",
    response_model=BuyerAddressResponse,
    summary="Update an existing delivery address",
)
def update_address(
    address_id: str,
    address_in: BuyerAddressUpdate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.BUYER.value, UserRole.ADMIN.value)),
):
    return address_service.update_address(db, address_id, current_user.id, address_in)


@router.delete(
    "/buyer/addresses/{address_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a delivery address",
)
def delete_address(
    address_id: str,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.BUYER.value, UserRole.ADMIN.value)),
):
    address_service.delete_address(db, address_id, current_user.id)
    return None


@router.patch(
    "/buyer/addresses/{address_id}/default",
    response_model=BuyerAddressResponse,
    summary="Set address as buyer's default shipping destination",
)
def set_default_address(
    address_id: str,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.BUYER.value, UserRole.ADMIN.value)),
):
    return address_service.set_default_address(db, address_id, current_user.id)
