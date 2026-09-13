from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.address import BuyerAddress
from app.schemas.address import BuyerAddressCreate, BuyerAddressUpdate


class AddressService:
    def get_addresses(self, db: Session, buyer_user_id: str) -> List[BuyerAddress]:
        """Fetch all delivery addresses belonging to the authenticated buyer."""
        return (
            db.query(BuyerAddress)
            .filter(BuyerAddress.buyer_user_id == buyer_user_id)
            .order_by(BuyerAddress.is_default.desc(), BuyerAddress.created_at.desc())
            .all()
        )

    def get_address_by_id(
        self, db: Session, address_id: str, buyer_user_id: str
    ) -> BuyerAddress:
        """Fetch a specific delivery address with strict buyer ownership verification."""
        address = (
            db.query(BuyerAddress)
            .filter(
                BuyerAddress.id == address_id,
                BuyerAddress.buyer_user_id == buyer_user_id,
            )
            .first()
        )
        if not address:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Delivery address not found or access unauthorized.",
            )
        return address

    def create_address(
        self, db: Session, buyer_user_id: str, address_in: BuyerAddressCreate
    ) -> BuyerAddress:
        """Create a new delivery address for the buyer. Handles default flag unset."""
        # If this is the buyer's first address, make it default automatically
        count = (
            db.query(BuyerAddress)
            .filter(BuyerAddress.buyer_user_id == buyer_user_id)
            .count()
        )
        should_be_default = address_in.is_default or (count == 0)

        if should_be_default:
            # Clear default on other addresses
            db.query(BuyerAddress).filter(
                BuyerAddress.buyer_user_id == buyer_user_id
            ).update({"is_default": False})

        new_address = BuyerAddress(
            buyer_user_id=buyer_user_id,
            full_name=address_in.full_name.strip(),
            phone=address_in.phone.strip(),
            address_line1=address_in.address_line1.strip(),
            address_line2=address_in.address_line2.strip() if address_in.address_line2 else None,
            village=address_in.village.strip() if address_in.village else None,
            mandal=address_in.mandal.strip() if address_in.mandal else None,
            district=address_in.district.strip(),
            state=address_in.state.strip(),
            pincode=address_in.pincode.strip(),
            landmark=address_in.landmark.strip() if address_in.landmark else None,
            is_default=should_be_default,
        )
        db.add(new_address)
        db.commit()
        db.refresh(new_address)
        return new_address

    def update_address(
        self,
        db: Session,
        address_id: str,
        buyer_user_id: str,
        address_in: BuyerAddressUpdate,
    ) -> BuyerAddress:
        """Update an existing delivery address belonging to the buyer."""
        address = self.get_address_by_id(db, address_id, buyer_user_id)

        update_data = address_in.model_dump(exclude_unset=True)
        if update_data.get("is_default") is True:
            # Clear default on others
            db.query(BuyerAddress).filter(
                BuyerAddress.buyer_user_id == buyer_user_id,
                BuyerAddress.id != address_id,
            ).update({"is_default": False})

        for key, value in update_data.items():
            if value is not None:
                if isinstance(value, str):
                    value = value.strip()
                setattr(address, key, value)

        db.add(address)
        db.commit()
        db.refresh(address)
        return address

    def delete_address(
        self, db: Session, address_id: str, buyer_user_id: str
    ) -> None:
        """Delete an address. If default was deleted, promote latest address if available."""
        address = self.get_address_by_id(db, address_id, buyer_user_id)
        was_default = address.is_default
        db.delete(address)
        db.commit()

        if was_default:
            next_addr = (
                db.query(BuyerAddress)
                .filter(BuyerAddress.buyer_user_id == buyer_user_id)
                .order_by(BuyerAddress.created_at.desc())
                .first()
            )
            if next_addr:
                next_addr.is_default = True
                db.add(next_addr)
                db.commit()

    def set_default_address(
        self, db: Session, address_id: str, buyer_user_id: str
    ) -> BuyerAddress:
        """Designate an address as the buyer's default shipping destination."""
        address = self.get_address_by_id(db, address_id, buyer_user_id)
        db.query(BuyerAddress).filter(
            BuyerAddress.buyer_user_id == buyer_user_id
        ).update({"is_default": False})
        address.is_default = True
        db.add(address)
        db.commit()
        db.refresh(address)
        return address


address_service = AddressService()
