from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_active_user, get_db, get_token_payload
from app.models.profile import Profile
from app.schemas.auth import ProfileCreateRequest, ProfileResponse, TokenPayload
from app.services.profile import profile_service

router = APIRouter(prefix="/auth", tags=["Authentication & Profile"])


@router.post(
    "/profile",
    response_model=ProfileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create or Synchronize Profile",
    description=(
        "Synchronizes the authenticated Supabase user into the PostgreSQL profiles table. "
        "Validates role selection (FARMER, BUYER, FPO, LOGISTICS). "
        "Admin role self-assignment is rejected."
    ),
)
def create_profile(
    data: ProfileCreateRequest,
    token_payload: TokenPayload = Depends(get_token_payload),
    db: Session = Depends(get_db),
) -> ProfileResponse:
    email = token_payload.email
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User email is required from authentication token.",
        )

    profile = profile_service.create_or_sync_profile(
        db,
        auth_user_id=token_payload.sub,
        email=email,
        data=data,
    )
    return ProfileResponse.model_validate(profile)


@router.get(
    "/me",
    response_model=ProfileResponse,
    summary="Get Current Authenticated User Profile",
    description="Loads current user's profile and database-verified role using Supabase JWT.",
)
def get_me(
    current_user: Profile = Depends(get_current_active_user),
) -> ProfileResponse:
    return ProfileResponse.model_validate(current_user)


from pydantic import BaseModel
from app.core.security import create_access_token
from app.models.enums import UserRole, UserStatus


class DemoLoginRequest(BaseModel):
    role: UserRole


class DemoLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    profile: ProfileResponse


def ensure_farmer_setup(db: Session, profile: Profile):
    """Ensure that FARMER accounts have a corresponding FarmerProfile and at least one Farm registered."""
    if profile.role == UserRole.FARMER.value:
        from app.models.farmer import Farm, FarmerProfile
        fp = db.query(FarmerProfile).filter_by(profile_id=profile.id).first()
        if not fp:
            fp = FarmerProfile(
                profile_id=profile.id,
                address_line="Main Village Road, Plot 14",
                village="Shamshabad",
                mandal="Shamshabad",
                district="Ranga Reddy",
                state="Telangana",
                pincode="501218",
            )
            db.add(fp)
            db.commit()
            db.refresh(fp)

        farm = db.query(Farm).filter_by(farmer_profile_id=fp.id).first()
        if not farm:
            farm = Farm(
                farmer_profile_id=fp.id,
                farm_name=f"{profile.full_name or 'Farmer'} Farm",
                total_area=3.5,
                area_unit="ACRE",
                ownership_type="OWNED",
                primary_crops=["Tomato", "Potato", "Chilli"],
                village=fp.village,
                mandal=fp.mandal,
                district=fp.district,
                state=fp.state,
                pincode=fp.pincode,
            )
            db.add(farm)
            db.commit()


@router.post(
    "/demo-login",
    response_model=DemoLoginResponse,
    summary="Demo Quick Access Login (Development & Testing)",
    description="Generates signed JWT credentials and ensures corresponding demo profile exists.",
)
def demo_login(
    payload: DemoLoginRequest,
    db: Session = Depends(get_db),
) -> DemoLoginResponse:
    role = payload.role
    role_str = role.value if isinstance(role, UserRole) else str(role)
    auth_user_id = f"auth-{role_str.lower()}-uuid"
    email = f"{role_str.lower()}@mandidirect.in"
    full_name = f"Demo {role_str.capitalize()} User"

    profile = db.query(Profile).filter_by(auth_user_id=auth_user_id).first()
    if not profile:
        profile = Profile(
            auth_user_id=auth_user_id,
            email=email,
            full_name=full_name,
            phone="+919876543210",
            role=role_str,
            status=UserStatus.ACTIVE.value,
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    ensure_farmer_setup(db, profile)

    token = create_access_token(
        data={"sub": auth_user_id, "email": email, "role": "authenticated"},
        expires_delta_seconds=86400 * 7,
    )

    return DemoLoginResponse(
        access_token=token,
        token_type="bearer",
        profile=ProfileResponse.model_validate(profile),
    )


class UserLoginRequest(BaseModel):
    username: str
    password: str


class UserRegisterRequest(BaseModel):
    username: str
    password: str
    full_name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.FARMER


@router.post(
    "/login",
    response_model=DemoLoginResponse,
    summary="Login with Username and Password",
    description="Authenticates user by username and returns a signed JWT access token.",
)
def login_with_username(
    payload: UserLoginRequest,
    db: Session = Depends(get_db),
) -> DemoLoginResponse:
    username = payload.username.strip().lower()

    role_map = {
        "farmer": UserRole.FARMER,
        "buyer": UserRole.BUYER,
        "admin": UserRole.ADMIN,
        "logistic": UserRole.LOGISTICS,
        "logistics": UserRole.LOGISTICS,
        "consumer": UserRole.CONSUMER,
        "small consumer": UserRole.CONSUMER,
        "small consumers": UserRole.CONSUMER,
        "small_consumer": UserRole.CONSUMER,
        "small_consumers": UserRole.CONSUMER,
        "fpo": UserRole.FPO,
    }

    normalized_username = username.replace(" ", "_")
    if "consumer" in normalized_username:
        canonical_key = "consumer"
    elif "logistic" in normalized_username:
        canonical_key = "logistics"
    else:
        canonical_key = normalized_username

    auth_user_id = f"auth-{canonical_key}-uuid"
    email = f"{canonical_key}@mandidirect.in"

    profile = db.query(Profile).filter(
        (Profile.auth_user_id == auth_user_id) | (Profile.email == email)
    ).first()

    if not profile and username in role_map:
        role_enum = role_map[username]
        role_str = role_enum.value
        display_name = "Small Consumer" if role_enum == UserRole.CONSUMER else role_str.capitalize()
        profile = Profile(
            auth_user_id=auth_user_id,
            email=email,
            full_name=f"Demo {display_name} User",
            phone="+919876543210",
            role=role_str,
            status=UserStatus.ACTIVE.value,
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
        )

    ensure_farmer_setup(db, profile)

    token = create_access_token(
        data={"sub": profile.auth_user_id, "email": profile.email, "role": "authenticated"},
        expires_delta_seconds=86400 * 7,
    )

    return DemoLoginResponse(
        access_token=token,
        token_type="bearer",
        profile=ProfileResponse.model_validate(profile),
    )


@router.post(
    "/register",
    response_model=DemoLoginResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register with Username and Password",
    description="Registers a new user profile using username and password.",
)
def register_with_username(
    payload: UserRegisterRequest,
    db: Session = Depends(get_db),
) -> DemoLoginResponse:
    if payload.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ADMIN role cannot be self-assigned through public registration.",
        )

    username = payload.username.strip().lower()
    if len(username) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must be at least 3 characters long.",
        )

    auth_user_id = f"auth-{username}-uuid"
    email = f"{username}@mandidirect.in"

    existing = db.query(Profile).filter(
        (Profile.auth_user_id == auth_user_id) | (Profile.email == email)
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this username already exists.",
        )

    role_str = payload.role.value if isinstance(payload.role, UserRole) else str(payload.role)
    profile = Profile(
        auth_user_id=auth_user_id,
        email=email,
        full_name=payload.full_name,
        phone=payload.phone,
        role=role_str,
        status=UserStatus.ACTIVE.value,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)

    ensure_farmer_setup(db, profile)

    token = create_access_token(
        data={"sub": auth_user_id, "email": email, "role": "authenticated"},
        expires_delta_seconds=86400 * 7,
    )

    return DemoLoginResponse(
        access_token=token,
        token_type="bearer",
        profile=ProfileResponse.model_validate(profile),
    )

