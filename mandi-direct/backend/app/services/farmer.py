from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.core.logging import get_logger
from app.models.enums import VerificationStatus
from app.models.farmer import Farm, FarmerProfile
from app.models.profile import Profile
from app.repositories.farmer import farm_repository, farmer_profile_repository
from app.schemas.farmer import (
    FarmCreate,
    FarmResponse,
    FarmUpdate,
    FarmerDashboardSummary,
    FarmerProfileCreate,
    FarmerProfileResponse,
    FarmerProfileUpdate,
    ProfileCompletionInfo,
)
from app.services.supabase import supabase_service

logger = get_logger("farmer_service")


class FarmerService:
    """Business logic for Farmer Profiles, Verification, and Farm Management."""

    def calculate_profile_completion(
        self,
        profile: Profile,
        farmer_profile: Optional[FarmerProfile],
        farms: List[Farm],
    ) -> ProfileCompletionInfo:
        """
        Calculates farmer profile completion percentage and readiness for produce listing.
        
        Required Criteria (100% total):
        - Personal / Profile: Full Name (10%), Phone (10%)
        - Address: Address Line (10%), Village (10%), Mandal (10%), District (10%), State (10%), Pincode (10%)
        - Agricultural: At least 1 registered farm (20%)
        """
        missing_fields = []
        score = 0

        # Core profile
        if profile.full_name and len(profile.full_name.strip()) >= 2:
            score += 10
        else:
            missing_fields.append("Full Name")

        if profile.phone and len(profile.phone.strip()) >= 10:
            score += 10
        else:
            missing_fields.append("Phone Number")

        # Farmer profile address
        if farmer_profile:
            if farmer_profile.address_line and len(farmer_profile.address_line.strip()) >= 3:
                score += 10
            else:
                missing_fields.append("Address Line")

            if farmer_profile.village and len(farmer_profile.village.strip()) >= 2:
                score += 10
            else:
                missing_fields.append("Village")

            if farmer_profile.mandal and len(farmer_profile.mandal.strip()) >= 2:
                score += 10
            else:
                missing_fields.append("Mandal")

            if farmer_profile.district and len(farmer_profile.district.strip()) >= 2:
                score += 10
            else:
                missing_fields.append("District")

            if farmer_profile.state and len(farmer_profile.state.strip()) >= 2:
                score += 10
            else:
                missing_fields.append("State")

            if farmer_profile.pincode and len(farmer_profile.pincode.strip()) >= 6:
                score += 10
            else:
                missing_fields.append("Pincode")
        else:
            missing_fields.extend(
                ["Address Line", "Village", "Mandal", "District", "State", "Pincode"]
            )

        # Farm requirement
        has_farms = len(farms) > 0
        if has_farms:
            score += 20
        else:
            missing_fields.append("At least one registered farm")

        is_complete = score >= 100
        message = (
            "✓ Profile ready for produce listing"
            if is_complete
            else "Complete your profile before adding produce."
        )

        return ProfileCompletionInfo(
            completion_percentage=score,
            is_complete=is_complete,
            missing_fields=missing_fields,
            has_profile=farmer_profile is not None,
            has_farms=has_farms,
            message=message,
        )

    def _build_profile_response(
        self,
        db: Session,
        profile: Profile,
        farmer_profile: FarmerProfile,
    ) -> FarmerProfileResponse:
        """Helper to assemble FarmerProfileResponse with computed completion score."""
        farms = farm_repository.list_by_farmer(db, farmer_profile.id)
        completion_info = self.calculate_profile_completion(profile, farmer_profile, farms)

        return FarmerProfileResponse(
            id=farmer_profile.id,
            profile_id=profile.id,
            full_name=profile.full_name,
            email=profile.email,
            phone=profile.phone,
            date_of_birth=farmer_profile.date_of_birth,
            gender=farmer_profile.gender,
            profile_photo_url=farmer_profile.profile_photo_url,
            address_line=farmer_profile.address_line,
            village=farmer_profile.village,
            mandal=farmer_profile.mandal,
            district=farmer_profile.district,
            state=farmer_profile.state,
            pincode=farmer_profile.pincode,
            verification_status=farmer_profile.verification_status,
            verification_notes=farmer_profile.verification_notes,
            created_at=farmer_profile.created_at,
            updated_at=farmer_profile.updated_at,
            profile_completion_pct=completion_info.completion_percentage,
            is_profile_complete=completion_info.is_complete,
        )

    # --------------------------------------------------------------------------
    # Profile Endpoints Logic
    # --------------------------------------------------------------------------

    def get_profile(self, db: Session, current_user: Profile) -> FarmerProfileResponse:
        """Retrieve the authenticated farmer's complete profile."""
        farmer_profile = farmer_profile_repository.get_by_profile_id(db, current_user.id)
        if not farmer_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Farmer profile not found. Please complete initial profile setup.",
            )
        return self._build_profile_response(db, current_user, farmer_profile)

    def create_profile(
        self,
        db: Session,
        current_user: Profile,
        data: FarmerProfileCreate,
    ) -> FarmerProfileResponse:
        """Create farmer-specific profile for the authenticated user."""
        existing = farmer_profile_repository.get_by_profile_id(db, current_user.id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Farmer profile already exists for this user. Use PUT to update.",
            )

        farmer_profile = farmer_profile_repository.create_for_profile(
            db, profile_id=current_user.id, data=data
        )
        logger.info(f"Created farmer profile {farmer_profile.id} for user {current_user.email}")
        return self._build_profile_response(db, current_user, farmer_profile)

    def update_profile(
        self,
        db: Session,
        current_user: Profile,
        data: FarmerProfileUpdate,
    ) -> FarmerProfileResponse:
        """Update authenticated farmer's profile fields."""
        farmer_profile = farmer_profile_repository.get_by_profile_id(db, current_user.id)
        if not farmer_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Farmer profile not found. Please create profile first.",
            )

        # Update core user fields if provided
        user_updated = False
        if data.full_name and data.full_name.strip() != current_user.full_name:
            current_user.full_name = data.full_name.strip()
            user_updated = True
        if data.phone and data.phone.strip() != current_user.phone:
            current_user.phone = data.phone.strip()
            user_updated = True

        if user_updated:
            db.add(current_user)
            db.commit()
            db.refresh(current_user)

        updated_fp = farmer_profile_repository.update_farmer_profile(
            db, db_obj=farmer_profile, data=data
        )
        logger.info(f"Updated farmer profile {updated_fp.id}")
        return self._build_profile_response(db, current_user, updated_fp)

    def upload_photo(
        self,
        db: Session,
        current_user: Profile,
        file_bytes: bytes,
        filename: str,
        content_type: str,
    ) -> FarmerProfileResponse:
        """Upload and associate avatar photo for the farmer."""
        farmer_profile = farmer_profile_repository.get_by_profile_id(db, current_user.id)
        if not farmer_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Farmer profile not found. Please save profile details before uploading photo.",
            )

        photo_url = supabase_service.upload_farmer_profile_photo(
            user_id=current_user.auth_user_id,
            file_bytes=file_bytes,
            filename=filename,
            content_type=content_type,
        )

        farmer_profile.profile_photo_url = photo_url
        db.add(farmer_profile)
        db.commit()
        db.refresh(farmer_profile)

        return self._build_profile_response(db, current_user, farmer_profile)

    # --------------------------------------------------------------------------
    # Farms Management Logic
    # --------------------------------------------------------------------------

    def get_farms(self, db: Session, current_user: Profile) -> List[FarmResponse]:
        """Return all farms belonging strictly to the authenticated farmer."""
        farmer_profile = farmer_profile_repository.get_by_profile_id(db, current_user.id)
        if not farmer_profile:
            return []

        farms = farm_repository.list_by_farmer(db, farmer_profile.id)
        return [self._map_farm_response(f) for f in farms]

    def get_farm_by_id(
        self,
        db: Session,
        current_user: Profile,
        farm_id: str,
    ) -> FarmResponse:
        """
        Return farm details ensuring ownership.
        Returns HTTP 404 if not found or belongs to another farmer to prevent leakage.
        """
        farmer_profile = farmer_profile_repository.get_by_profile_id(db, current_user.id)
        if not farmer_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Farm not found.",
            )

        farm = farm_repository.get_by_id_and_farmer(db, farm_id, farmer_profile.id)
        if not farm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Farm not found.",
            )

        return self._map_farm_response(farm)

    def create_farm(
        self,
        db: Session,
        current_user: Profile,
        data: FarmCreate,
    ) -> FarmResponse:
        """Create a farm for the authenticated farmer."""
        farmer_profile = farmer_profile_repository.get_by_profile_id(db, current_user.id)
        if not farmer_profile:
            from app.schemas.farmer import FarmerProfileCreate
            pincode_val = (
                data.pincode
                if (data.pincode and len(data.pincode) == 6 and data.pincode.isdigit())
                else "500001"
            )
            farmer_profile = farmer_profile_repository.create_for_profile(
                db,
                profile_id=current_user.id,
                data=FarmerProfileCreate(
                    address_line=data.address_line or f"{data.village}, {data.mandal}",
                    village=data.village,
                    mandal=data.mandal,
                    district=data.district,
                    state=data.state,
                    pincode=pincode_val,
                ),
            )

        farm = farm_repository.create_for_farmer(
            db, farmer_profile_id=farmer_profile.id, data=data
        )
        logger.info(f"Registered farm '{farm.farm_name}' ({farm.id}) for farmer {farmer_profile.id}")
        return self._map_farm_response(farm)

    def update_farm(
        self,
        db: Session,
        current_user: Profile,
        farm_id: str,
        data: FarmUpdate,
    ) -> FarmResponse:
        """Update farm details after verifying ownership."""
        farmer_profile = farmer_profile_repository.get_by_profile_id(db, current_user.id)
        if not farmer_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Farm not found.",
            )

        farm = farm_repository.get_by_id_and_farmer(db, farm_id, farmer_profile.id)
        if not farm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Farm not found.",
            )

        updated_farm = farm_repository.update_farm(db, db_obj=farm, data=data)
        logger.info(f"Updated farm {updated_farm.id}")
        return self._map_farm_response(updated_farm)

    def delete_farm(self, db: Session, current_user: Profile, farm_id: str) -> None:
        """Delete farm record after verifying ownership."""
        farmer_profile = farmer_profile_repository.get_by_profile_id(db, current_user.id)
        if not farmer_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Farm not found.",
            )

        farm = farm_repository.get_by_id_and_farmer(db, farm_id, farmer_profile.id)
        if not farm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Farm not found.",
            )

        farm_repository.delete_farm(db, db_obj=farm)
        logger.info(f"Deleted farm {farm_id} for farmer {farmer_profile.id}")

    def get_dashboard_summary(
        self,
        db: Session,
        current_user: Profile,
    ) -> FarmerDashboardSummary:
        """Compute aggregated metrics and readiness for produce listing."""
        farmer_profile = farmer_profile_repository.get_by_profile_id(db, current_user.id)
        farms = (
            farm_repository.list_by_farmer(db, farmer_profile.id) if farmer_profile else []
        )
        completion_info = self.calculate_profile_completion(current_user, farmer_profile, farms)

        if farmer_profile:
            metrics = farm_repository.get_farmer_metrics(db, farmer_profile.id)
            verification_status = farmer_profile.verification_status
            verification_notes = farmer_profile.verification_notes
            try:
                from app.repositories.produce import produce_repository
                produce_stats = produce_repository.get_stats_by_farmer(db, farmer_profile.id)
                total_produce = produce_stats.total_listings
                active_produce = (
                    produce_stats.approved_count
                    + produce_stats.listed_count
                    + produce_stats.partially_sold_count
                )
            except Exception:
                total_produce = 0
                active_produce = 0
        else:
            metrics = {
                "total_farms": 0,
                "total_farm_area_acres": 0.0,
                "primary_crops": [],
            }
            verification_status = VerificationStatus.PENDING.value
            verification_notes = "Farmer profile has not been created yet."
            total_produce = 0
            active_produce = 0

        return FarmerDashboardSummary(
            farmer_name=current_user.full_name,
            email=current_user.email,
            verification_status=verification_status,
            verification_notes=verification_notes,
            profile_completion_pct=completion_info.completion_percentage,
            is_profile_complete=completion_info.is_complete,
            missing_fields=completion_info.missing_fields,
            total_farms=metrics["total_farms"],
            total_farm_area_acres=metrics["total_farm_area_acres"],
            primary_crops=metrics["primary_crops"],
            ready_for_produce=completion_info.is_complete,
            total_produce_listings=total_produce,
            active_produce_listings=active_produce,
        )

    def _map_farm_response(self, farm: Farm) -> FarmResponse:
        """Helper to convert Farm model to FarmResponse schema."""
        return FarmResponse(
            id=farm.id,
            farmer_profile_id=farm.farmer_profile_id,
            farm_name=farm.farm_name,
            total_area=float(farm.total_area),
            area_unit=farm.area_unit,
            ownership_type=farm.ownership_type,
            soil_type=farm.soil_type,
            irrigation_type=farm.irrigation_type,
            primary_crops=farm.primary_crops or [],
            latitude=float(farm.latitude) if farm.latitude is not None else None,
            longitude=float(farm.longitude) if farm.longitude is not None else None,
            address_line=farm.address_line,
            village=farm.village,
            mandal=farm.mandal,
            district=farm.district,
            state=farm.state,
            pincode=farm.pincode,
            created_at=farm.created_at,
            updated_at=farm.updated_at,
        )


farmer_service = FarmerService()
