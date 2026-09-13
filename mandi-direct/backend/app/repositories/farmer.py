from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.enums import AreaUnit, VerificationStatus
from app.models.farmer import Farm, FarmerProfile
from app.repositories.base import BaseRepository
from app.schemas.farmer import (
    FarmCreate,
    FarmUpdate,
    FarmerProfileCreate,
    FarmerProfileUpdate,
)


class FarmerProfileRepository(BaseRepository[FarmerProfile, FarmerProfileCreate, FarmerProfileUpdate]):
    """Repository for FarmerProfile data operations."""

    def __init__(self):
        super().__init__(FarmerProfile)

    def get_by_profile_id(self, db: Session, profile_id: str) -> Optional[FarmerProfile]:
        """Fetch farmer profile linked to core profile_id."""
        return db.query(FarmerProfile).filter(FarmerProfile.profile_id == profile_id).first()

    def create_for_profile(
        self,
        db: Session,
        *,
        profile_id: str,
        data: FarmerProfileCreate,
    ) -> FarmerProfile:
        """Create a new farmer profile linked to the user's core profile."""
        db_obj = FarmerProfile(
            profile_id=profile_id,
            date_of_birth=data.date_of_birth,
            gender=data.gender.value if data.gender else None,
            profile_photo_url=data.profile_photo_url,
            address_line=data.address_line.strip(),
            village=data.village.strip(),
            mandal=data.mandal.strip(),
            district=data.district.strip(),
            state=data.state.strip(),
            pincode=data.pincode.strip(),
            verification_status=VerificationStatus.PENDING.value,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update_farmer_profile(
        self,
        db: Session,
        *,
        db_obj: FarmerProfile,
        data: FarmerProfileUpdate,
    ) -> FarmerProfile:
        """Update farmer profile attributes."""
        update_data = data.model_dump(exclude_unset=True)
        # Handle special fields
        if "gender" in update_data and update_data["gender"] is not None:
            update_data["gender"] = (
                update_data["gender"].value
                if hasattr(update_data["gender"], "value")
                else str(update_data["gender"])
            )
        # Strip string values
        for key in ["address_line", "village", "mandal", "district", "state", "pincode"]:
            if key in update_data and update_data[key]:
                update_data[key] = update_data[key].strip()

        # Exclude core personal fields like full_name and phone handled by Profile model
        update_data.pop("full_name", None)
        update_data.pop("phone", None)

        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def list_for_admin_verification(
        self,
        db: Session,
        *,
        status: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[FarmerProfile], int]:
        """Paginated list of farmer profiles for admin verification review."""
        from sqlalchemy import or_, desc
        from sqlalchemy.orm import joinedload
        from app.models.profile import Profile

        query = (
            db.query(FarmerProfile)
            .join(Profile, FarmerProfile.profile_id == Profile.id)
            .options(joinedload(FarmerProfile.profile), joinedload(FarmerProfile.farms))
        )

        if status and status.upper() != "ALL":
            query = query.filter(FarmerProfile.verification_status == status.upper())

        if search and search.strip():
            term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Profile.full_name.ilike(term),
                    Profile.email.ilike(term),
                    Profile.phone.ilike(term),
                    FarmerProfile.village.ilike(term),
                    FarmerProfile.mandal.ilike(term),
                    FarmerProfile.district.ilike(term),
                    FarmerProfile.state.ilike(term),
                )
            )

        total = query.count()
        offset = (max(1, page) - 1) * page_size
        items = query.order_by(desc(FarmerProfile.created_at)).offset(offset).limit(page_size).all()
        return items, total

    def get_verification_counts(self, db: Session) -> Dict[str, int]:
        """Aggregate counts of farmers by verification status."""
        from sqlalchemy import func

        rows = (
            db.query(FarmerProfile.verification_status, func.count(FarmerProfile.id))
            .group_by(FarmerProfile.verification_status)
            .all()
        )
        counts = {"PENDING": 0, "VERIFIED": 0, "REJECTED": 0}
        total = 0
        for status_val, count in rows:
            if status_val in counts:
                counts[status_val] = count
            total += count
        counts["TOTAL"] = total
        return counts


class FarmRepository(BaseRepository[Farm, FarmCreate, FarmUpdate]):
    """Repository for Farm parcel operations."""

    def __init__(self):
        super().__init__(Farm)

    def get_by_id_and_farmer(
        self,
        db: Session,
        farm_id: str,
        farmer_profile_id: str,
    ) -> Optional[Farm]:
        """Fetch a specific farm ensuring it strictly belongs to the requesting farmer."""
        return (
            db.query(Farm)
            .filter(Farm.id == farm_id, Farm.farmer_profile_id == farmer_profile_id)
            .first()
        )

    def list_by_farmer(
        self,
        db: Session,
        farmer_profile_id: str,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Farm]:
        """List all farms belonging to a specific farmer, sorted by creation date."""
        return (
            db.query(Farm)
            .filter(Farm.farmer_profile_id == farmer_profile_id)
            .order_by(Farm.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def create_for_farmer(
        self,
        db: Session,
        *,
        farmer_profile_id: str,
        data: FarmCreate,
    ) -> Farm:
        """Create a new farm parcel for the verified farmer."""
        crops = [c.strip() for c in data.primary_crops if c.strip()] if data.primary_crops else []
        db_obj = Farm(
            farmer_profile_id=farmer_profile_id,
            farm_name=data.farm_name.strip(),
            total_area=data.total_area,
            area_unit=data.area_unit.value if hasattr(data.area_unit, "value") else str(data.area_unit),
            ownership_type=(
                data.ownership_type.value
                if hasattr(data.ownership_type, "value")
                else str(data.ownership_type)
            ),
            soil_type=data.soil_type.value if data.soil_type else None,
            irrigation_type=data.irrigation_type.value if data.irrigation_type else None,
            primary_crops=crops,
            latitude=data.latitude,
            longitude=data.longitude,
            address_line=data.address_line.strip() if data.address_line else None,
            village=data.village.strip(),
            mandal=data.mandal.strip(),
            district=data.district.strip(),
            state=data.state.strip(),
            pincode=data.pincode.strip(),
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update_farm(
        self,
        db: Session,
        *,
        db_obj: Farm,
        data: FarmUpdate,
    ) -> Farm:
        """Update farm details."""
        update_data = data.model_dump(exclude_unset=True)

        if "area_unit" in update_data and update_data["area_unit"]:
            val = update_data["area_unit"]
            update_data["area_unit"] = val.value if hasattr(val, "value") else str(val)

        if "ownership_type" in update_data and update_data["ownership_type"]:
            val = update_data["ownership_type"]
            update_data["ownership_type"] = val.value if hasattr(val, "value") else str(val)

        if "soil_type" in update_data:
            val = update_data["soil_type"]
            update_data["soil_type"] = val.value if val and hasattr(val, "value") else val

        if "irrigation_type" in update_data:
            val = update_data["irrigation_type"]
            update_data["irrigation_type"] = val.value if val and hasattr(val, "value") else val

        if "primary_crops" in update_data and update_data["primary_crops"] is not None:
            update_data["primary_crops"] = [
                c.strip() for c in update_data["primary_crops"] if c.strip()
            ]

        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete_farm(self, db: Session, *, db_obj: Farm) -> None:
        """Delete farm record."""
        db.delete(db_obj)
        db.commit()

    def get_farmer_metrics(self, db: Session, farmer_profile_id: str) -> Dict[str, Any]:
        """Aggregate total farms, acreage, and crops for the farmer."""
        farms = db.query(Farm).filter(Farm.farmer_profile_id == farmer_profile_id).all()
        total_farms = len(farms)
        total_acres = 0.0
        unique_crops = set()

        for farm in farms:
            area = float(farm.total_area)
            if farm.area_unit == AreaUnit.HECTARE.value:
                # 1 Hectare = 2.47105 Acres
                area *= 2.47105
            total_acres += area

            if farm.primary_crops:
                for crop in farm.primary_crops:
                    if crop:
                        unique_crops.add(crop)

        return {
            "total_farms": total_farms,
            "total_farm_area_acres": round(total_acres, 2),
            "primary_crops": sorted(list(unique_crops)),
        }


farmer_profile_repository = FarmerProfileRepository()
farm_repository = FarmRepository()
