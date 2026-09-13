from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app.models.buyer_preference import BuyerPreference
from app.models.enums import UserRole, UserStatus
from app.models.profile import Profile
from app.schemas.buyer_preference import BuyerPreferenceUpdate


class BuyerPreferenceRepository:
    """Repository for managing buyer procurement preferences."""

    def get_by_buyer_id(self, db: Session, buyer_user_id: str) -> Optional[BuyerPreference]:
        """Fetch buyer preferences by buyer_user_id with joined buyer profile."""
        return (
            db.query(BuyerPreference)
            .options(joinedload(BuyerPreference.buyer))
            .filter(BuyerPreference.buyer_user_id == buyer_user_id)
            .first()
        )

    def upsert_preferences(
        self, db: Session, buyer_user_id: str, data: BuyerPreferenceUpdate
    ) -> BuyerPreference:
        """Create or update preferences for the given buyer."""
        pref = self.get_by_buyer_id(db, buyer_user_id)
        now = datetime.now(timezone.utc)

        if not pref:
            pref = BuyerPreference(
                buyer_user_id=buyer_user_id,
                preferred_categories=data.preferred_categories or [],
                preferred_products=data.preferred_products or [],
                preferred_varieties=data.preferred_varieties or [],
                preferred_quality_grades=data.preferred_quality_grades or [],
                preferred_districts=data.preferred_districts or [],
                preferred_states=data.preferred_states or [],
                minimum_quantity=data.minimum_quantity,
                maximum_quantity=data.maximum_quantity,
                minimum_price=data.minimum_price,
                maximum_price=data.maximum_price,
            )
            db.add(pref)
        else:
            pref.preferred_categories = data.preferred_categories or []
            pref.preferred_products = data.preferred_products or []
            pref.preferred_varieties = data.preferred_varieties or []
            pref.preferred_quality_grades = data.preferred_quality_grades or []
            pref.preferred_districts = data.preferred_districts or []
            pref.preferred_states = data.preferred_states or []
            pref.minimum_quantity = data.minimum_quantity
            pref.maximum_quantity = data.maximum_quantity
            pref.minimum_price = data.minimum_price
            pref.maximum_price = data.maximum_price
            pref.updated_at = now

        db.commit()
        db.refresh(pref)
        return pref

    def get_all_active_buyers_with_preferences(
        self, db: Session
    ) -> List[BuyerPreference]:
        """
        Fetch all active buyer profiles that have configured preferences.
        """
        return (
            db.query(BuyerPreference)
            .join(Profile, BuyerPreference.buyer_user_id == Profile.id)
            .filter(
                Profile.role == UserRole.BUYER.value,
                Profile.status == UserStatus.ACTIVE.value,
            )
            .options(joinedload(BuyerPreference.buyer))
            .all()
        )

    def get_active_buyers_without_preferences(
        self, db: Session, limit: int = 50
    ) -> List[Profile]:
        """
        Fetch active buyers who haven't explicitly set preferences yet,
        allowing fallback matching based on verified order history or cart activity.
        """
        subquery = db.query(BuyerPreference.buyer_user_id)
        return (
            db.query(Profile)
            .filter(
                Profile.role == UserRole.BUYER.value,
                Profile.status == UserStatus.ACTIVE.value,
                ~Profile.id.in_(subquery),
            )
            .limit(limit)
            .all()
        )


buyer_preference_repository = BuyerPreferenceRepository()
