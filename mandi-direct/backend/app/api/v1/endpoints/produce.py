from typing import List, Optional
from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_roles
from app.models.enums import UserRole
from app.models.profile import Profile
from app.schemas.produce import (
    ProduceCreate,
    ProduceImageReorderRequest,
    ProduceImageResponse,
    ProduceListResponse,
    ProduceResponse,
    ProduceSummaryStats,
    ProduceUpdate,
)
from app.services.produce import produce_service

router = APIRouter(tags=["Farmer Produce Operations"])


@router.get(
    "/produce/stats",
    response_model=ProduceSummaryStats,
    summary="Get Produce Inventory Stats",
    description="Retrieve listing counts broken down by state machine status.",
)
def get_produce_stats(
    current_user: Profile = Depends(require_roles(UserRole.FARMER)),
    db: Session = Depends(get_db),
) -> ProduceSummaryStats:
    return produce_service.get_summary_stats(db, profile=current_user)


@router.get(
    "/produce",
    response_model=ProduceListResponse,
    summary="List Farmer Produce Lots",
    description="Fetch paginated list of produce with optional filtering by status, category, farm parcel, and keyword search.",
)
def list_produce(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by ProduceStatus"),
    category_filter: Optional[str] = Query(None, alias="category", description="Filter by ProductCategory"),
    farm_id_filter: Optional[str] = Query(None, alias="farm_id", description="Filter by Farm parcel ID"),
    search: Optional[str] = Query(None, description="Search query matching product name, variety, or description"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: Profile = Depends(require_roles(UserRole.FARMER)),
    db: Session = Depends(get_db),
) -> ProduceListResponse:
    return produce_service.list_farmer_produce(
        db,
        profile=current_user,
        status_filter=status_filter,
        category_filter=category_filter,
        farm_id_filter=farm_id_filter,
        search=search,
        page=page,
        page_size=page_size,
    )


@router.post(
    "/produce",
    response_model=ProduceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Produce Listing",
    description="Initialize a new produce harvest lot. Can be published immediately to marketplace with publish=True.",
)
def create_produce(
    payload: ProduceCreate,
    publish: bool = Query(False, description="Whether to publish immediately to buyer marketplace"),
    current_user: Profile = Depends(require_roles(UserRole.FARMER)),
    db: Session = Depends(get_db),
) -> ProduceResponse:
    return produce_service.create_produce(db, profile=current_user, data=payload, publish_immediately=publish)


@router.get(
    "/produce/{produce_id}",
    response_model=ProduceResponse,
    summary="Get Produce Lot Detail",
    description="Retrieve full details, inventory status, and gallery images of a specific produce lot.",
)
def get_produce_detail(
    produce_id: str,
    current_user: Profile = Depends(require_roles(UserRole.FARMER)),
    db: Session = Depends(get_db),
) -> ProduceResponse:
    return produce_service.get_produce_by_id(db, profile=current_user, produce_id=produce_id)


@router.patch(
    "/produce/{produce_id}",
    response_model=ProduceResponse,
    summary="Update Produce Lot",
    description="Update fields on a produce lot. Strictly guarded: Only DRAFT or REJECTED listings can be modified.",
)
def patch_produce(
    produce_id: str,
    payload: ProduceUpdate,
    current_user: Profile = Depends(require_roles(UserRole.FARMER)),
    db: Session = Depends(get_db),
) -> ProduceResponse:
    return produce_service.update_produce(db, profile=current_user, produce_id=produce_id, data=payload)


@router.put(
    "/produce/{produce_id}",
    response_model=ProduceResponse,
    summary="Update Produce Lot (PUT)",
    description="Update fields on a produce lot. Same logic and restrictions as PATCH.",
)
def put_produce(
    produce_id: str,
    payload: ProduceUpdate,
    current_user: Profile = Depends(require_roles(UserRole.FARMER)),
    db: Session = Depends(get_db),
) -> ProduceResponse:
    return produce_service.update_produce(db, profile=current_user, produce_id=produce_id, data=payload)


@router.delete(
    "/produce/{produce_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Produce Lot Draft",
    description="Permanently removes a produce listing. Strictly guarded: Only DRAFT listings can be deleted.",
)
def delete_produce(
    produce_id: str,
    current_user: Profile = Depends(require_roles(UserRole.FARMER)),
    db: Session = Depends(get_db),
) -> dict:
    return produce_service.delete_produce(db, profile=current_user, produce_id=produce_id)


@router.post(
    "/produce/{produce_id}/submit",
    response_model=ProduceResponse,
    summary="Submit Produce Lot for Verification",
    description="Transitions produce lot from DRAFT or REJECTED to PENDING_VERIFICATION. Requires complete lot details and >= 1 photo.",
)
def submit_produce_for_verification(
    produce_id: str,
    current_user: Profile = Depends(require_roles(UserRole.FARMER)),
    db: Session = Depends(get_db),
) -> ProduceResponse:
    return produce_service.submit_for_verification(db, profile=current_user, produce_id=produce_id)


@router.post(
    "/produce/{produce_id}/publish",
    response_model=ProduceResponse,
    summary="Publish Approved Produce to Marketplace",
    description="Transitions produce lot from APPROVED to LISTED. Makes it discoverable on the public marketplace.",
)
@router.post(
    "/produce/{produce_id}/list",
    response_model=ProduceResponse,
    include_in_schema=False,
)
def publish_produce_to_marketplace(
    produce_id: str,
    current_user: Profile = Depends(require_roles(UserRole.FARMER)),
    db: Session = Depends(get_db),
) -> ProduceResponse:
    return produce_service.publish_produce(db, profile=current_user, produce_id=produce_id)



@router.get(
    "/produce/{produce_id}/images",
    response_model=List[ProduceImageResponse],
    summary="List Produce Images",
    description="Retrieve all photos for a produce lot ordered by display_order.",
)
def list_produce_images(
    produce_id: str,
    current_user: Profile = Depends(require_roles(UserRole.FARMER)),
    db: Session = Depends(get_db),
) -> List[ProduceImageResponse]:
    return produce_service.list_images(db, profile=current_user, produce_id=produce_id)


@router.post(
    "/produce/{produce_id}/images",
    response_model=ProduceImageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload Produce Photo",
    description="Upload a photo (JPEG/PNG/WEBP, max 10MB) for a produce lot. Maximum 5 photos allowed per listing.",
)
async def upload_produce_image(
    produce_id: str,
    file: UploadFile = File(...),
    current_user: Profile = Depends(require_roles(UserRole.FARMER)),
    db: Session = Depends(get_db),
) -> ProduceImageResponse:
    file_bytes = await file.read()
    content_type = file.content_type or "image/jpeg"
    return produce_service.upload_image(
        db,
        profile=current_user,
        produce_id=produce_id,
        file_bytes=file_bytes,
        filename=file.filename or "photo.jpg",
        content_type=content_type,
    )


@router.patch(
    "/produce/{produce_id}/images/reorder",
    response_model=List[ProduceImageResponse],
    summary="Reorder Produce Images",
    description="Update display order of photos for a produce lot.",
)
def reorder_produce_images(
    produce_id: str,
    payload: ProduceImageReorderRequest,
    current_user: Profile = Depends(require_roles(UserRole.FARMER)),
    db: Session = Depends(get_db),
) -> List[ProduceImageResponse]:
    return produce_service.reorder_images(
        db, profile=current_user, produce_id=produce_id, image_ids=payload.image_ids
    )


@router.delete(
    "/produce/{produce_id}/images/{image_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Produce Photo",
    description="Delete a photo from a DRAFT or REJECTED produce lot.",
)
def delete_produce_image(
    produce_id: str,
    image_id: str,
    current_user: Profile = Depends(require_roles(UserRole.FARMER)),
    db: Session = Depends(get_db),
) -> dict:
    return produce_service.delete_image(
        db, profile=current_user, produce_id=produce_id, image_id=image_id
    )


@router.post(
    "/produce/{produce_id}/images/{image_id}/primary",
    response_model=ProduceImageResponse,
    summary="Set Primary Photo (POST)",
    description="Designates the selected photo as the primary cover photo for the produce lot.",
)
@router.patch(
    "/produce/{produce_id}/images/{image_id}/primary",
    response_model=ProduceImageResponse,
    summary="Set Primary Photo (PATCH)",
    description="Designates the selected photo as the primary cover photo for the produce lot.",
)
def set_primary_produce_image(
    produce_id: str,
    image_id: str,
    current_user: Profile = Depends(require_roles(UserRole.FARMER)),
    db: Session = Depends(get_db),
) -> ProduceImageResponse:
    return produce_service.set_primary_image(
        db, profile=current_user, produce_id=produce_id, image_id=image_id
    )

