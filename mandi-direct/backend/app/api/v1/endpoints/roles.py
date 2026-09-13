from typing import Any, Dict
from fastapi import APIRouter, Depends
from app.api.deps import require_roles
from app.models.enums import UserRole
from app.models.profile import Profile

router = APIRouter(tags=["Role-Guarded Services"])


@router.get(
    "/farmer/dashboard-stats",
    summary="Farmer Dashboard Overview",
    description="Restricted to users with role FARMER. Unauthorized roles receive 403.",
)
def get_farmer_dashboard(
    current_user: Profile = Depends(require_roles(UserRole.FARMER)),
) -> Dict[str, Any]:
    return {
        "message": f"Welcome Farmer {current_user.full_name}",
        "role": current_user.role,
        "active_crops_listed": 4,
        "open_bids_received": 12,
        "direct_sales_volume_inr": 85400,
        "intermediaries_bypassed": 3,
        "estimated_savings_inr": 18200,
    }


@router.get(
    "/buyer/marketplace-preview",
    summary="Buyer Direct Marketplace",
    description="Restricted to users with role BUYER. Unauthorized roles receive 403.",
)
def get_buyer_marketplace(
    current_user: Profile = Depends(require_roles(UserRole.BUYER)),
) -> Dict[str, Any]:
    return {
        "message": f"Welcome Buyer {current_user.full_name}",
        "role": current_user.role,
        "available_fresh_produce_lots": 38,
        "verified_farmer_clusters": 9,
        "average_wholesale_discount": "22% vs APMC Middlemen",
    }


@router.get(
    "/admin/system-overview",
    summary="Admin System Operations",
    description="Restricted to users with role ADMIN. Unauthorized roles receive 403.",
)
def get_admin_overview(
    current_user: Profile = Depends(require_roles(UserRole.ADMIN)),
) -> Dict[str, Any]:
    return {
        "message": f"Administrator Console: {current_user.full_name}",
        "role": current_user.role,
        "total_farmers": 1420,
        "total_buyers": 380,
        "total_fpos": 45,
        "total_logistics_partners": 28,
        "platform_status": "Healthy",
    }


@router.get(
    "/fpo/portal",
    summary="FPO Aggregation Portal",
    description="Restricted to users with role FPO. Unauthorized roles receive 403.",
)
def get_fpo_portal(
    current_user: Profile = Depends(require_roles(UserRole.FPO)),
) -> Dict[str, Any]:
    return {
        "message": f"FPO Aggregation Portal: {current_user.full_name}",
        "role": current_user.role,
        "farmer_members_registered": 150,
        "collective_crop_bulk_in_tons": 45.5,
    }


@router.get(
    "/logistics/routes",
    summary="Logistics Fleet Dispatch",
    description="Restricted to users with role LOGISTICS. Unauthorized roles receive 403.",
)
def get_logistics_routes(
    current_user: Profile = Depends(require_roles(UserRole.LOGISTICS)),
) -> Dict[str, Any]:
    return {
        "message": f"Logistics Dispatch: {current_user.full_name}",
        "role": current_user.role,
        "scheduled_pickups": 8,
        "cold_chain_trucks_active": 3,
    }
