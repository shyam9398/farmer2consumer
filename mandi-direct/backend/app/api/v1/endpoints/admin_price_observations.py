import csv
import io
from datetime import datetime
from decimal import Decimal, InvalidOperation
from typing import List, Optional
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_roles
from app.models.enums import UserRole
from app.models.price_observation import PriceObservation
from app.models.profile import Profile
from app.schemas.price_intelligence import (
    CSVImportResponse,
    CSVImportRowError,
    PriceObservationCreate,
    PriceObservationListResponse,
    PriceObservationResponse,
    PriceObservationUpdate,
    PriceSourceType,
)
from app.services.price_intelligence import price_intelligence_service

router = APIRouter()


@router.get("", response_model=PriceObservationListResponse)
def list_price_observations(
    product_name: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    source_type: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin_user: Profile = Depends(require_roles(UserRole.ADMIN.value)),
):
    """
    Admin search & pagination of price observations.
    Guarded by ADMIN role.
    """
    query = db.query(PriceObservation)

    if product_name:
        query = query.filter(func.lower(PriceObservation.product_name) == product_name.lower().strip())
    if category:
        query = query.filter(func.lower(PriceObservation.category) == category.lower().strip())
    if source_type:
        query = query.filter(PriceObservation.source_type == source_type)
    if state:
        query = query.filter(func.lower(PriceObservation.state) == state.lower().strip())
    if district:
        query = query.filter(func.lower(PriceObservation.district) == district.lower().strip())
    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(
            (PriceObservation.product_name.ilike(pattern))
            | (PriceObservation.market_name.ilike(pattern))
            | (PriceObservation.source_name.ilike(pattern))
        )

    total = query.count()
    pages = (total + size - 1) // size if total > 0 else 1

    records = (
        query.order_by(PriceObservation.observation_date.desc(), PriceObservation.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )

    items = []
    for r in records:
        price_kg = price_intelligence_service.normalize_price_to_per_kg(r.price, r.price_unit)
        item_dict = {
            "id": r.id,
            "product_name": r.product_name,
            "category": r.category,
            "variety": r.variety,
            "quality_grade": r.quality_grade,
            "price": r.price,
            "currency": r.currency,
            "price_unit": r.price_unit,
            "market_name": r.market_name,
            "district": r.district,
            "state": r.state,
            "source_type": r.source_type,
            "source_name": r.source_name,
            "source_reference": r.source_reference,
            "observation_date": r.observation_date,
            "price_per_kg": price_kg,
            "created_at": r.created_at,
            "updated_at": r.updated_at,
        }
        items.append(PriceObservationResponse(**item_dict))

    return PriceObservationListResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.post("", response_model=PriceObservationResponse, status_code=status.HTTP_201_CREATED)
def create_price_observation(
    obs_in: PriceObservationCreate,
    db: Session = Depends(get_db),
    admin_user: Profile = Depends(require_roles(UserRole.ADMIN.value)),
):
    """
    Creates a single market price observation.
    Guarded by ADMIN role.
    """
    db_obj = PriceObservation(
        product_name=obs_in.product_name.strip(),
        category=obs_in.category.strip(),
        variety=obs_in.variety.strip() if obs_in.variety else None,
        quality_grade=obs_in.quality_grade.strip() if obs_in.quality_grade else "UNGRADED",
        price=obs_in.price,
        currency=obs_in.currency.strip().upper(),
        price_unit=obs_in.price_unit.strip().upper(),
        market_name=obs_in.market_name.strip() if obs_in.market_name else None,
        district=obs_in.district.strip() if obs_in.district else None,
        state=obs_in.state.strip() if obs_in.state else None,
        source_type=obs_in.source_type.value,
        source_name=obs_in.source_name.strip(),
        source_reference=obs_in.source_reference.strip() if obs_in.source_reference else None,
        observation_date=obs_in.observation_date,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)

    price_kg = price_intelligence_service.normalize_price_to_per_kg(db_obj.price, db_obj.price_unit)
    res_dict = {**db_obj.__dict__, "price_per_kg": price_kg}
    return PriceObservationResponse(**res_dict)


@router.patch("/{id}", response_model=PriceObservationResponse)
def update_price_observation(
    id: str,
    obs_in: PriceObservationUpdate,
    db: Session = Depends(get_db),
    admin_user: Profile = Depends(require_roles(UserRole.ADMIN.value)),
):
    """
    Updates an existing market price observation.
    Guarded by ADMIN role.
    """
    db_obj = db.query(PriceObservation).filter(PriceObservation.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Price observation not found")

    update_data = obs_in.dict(exclude_unset=True)
    for field, val in update_data.items():
        if val is not None:
            if field == "source_type" and isinstance(val, PriceSourceType):
                setattr(db_obj, field, val.value)
            else:
                setattr(db_obj, field, val)

    db.commit()
    db.refresh(db_obj)

    price_kg = price_intelligence_service.normalize_price_to_per_kg(db_obj.price, db_obj.price_unit)
    res_dict = {**db_obj.__dict__, "price_per_kg": price_kg}
    return PriceObservationResponse(**res_dict)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_price_observation(
    id: str,
    db: Session = Depends(get_db),
    admin_user: Profile = Depends(require_roles(UserRole.ADMIN.value)),
):
    """
    Deletes an invalid price observation.
    Guarded by ADMIN role.
    """
    db_obj = db.query(PriceObservation).filter(PriceObservation.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Price observation not found")

    db.delete(db_obj)
    db.commit()
    return None


@router.post("/import", response_model=CSVImportResponse)
async def import_price_observations_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin_user: Profile = Depends(require_roles(UserRole.ADMIN.value)),
):
    """
    Bulk imports market price observations from CSV with line-by-line validation.
    Malformed rows are logged with error reasons and skipped without aborting valid rows.
    Guarded by ADMIN role.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only .csv files are supported")

    content = await file.read()
    try:
        text_stream = io.StringIO(content.decode("utf-8-sig"))
    except UnicodeDecodeError:
        text_stream = io.StringIO(content.decode("latin-1"))

    reader = csv.DictReader(text_stream)

    valid_source_types = {e.value for e in PriceSourceType}
    errors: List[CSVImportRowError] = []
    imported_count = 0
    total_rows = 0

    for row_idx, row in enumerate(reader, start=2):  # Row 1 is header
        total_rows += 1
        row_clean = {k.strip(): (v.strip() if v else None) for k, v in row.items() if k}

        # 1. Product Name check
        product_name = row_clean.get("product_name")
        if not product_name:
            errors.append(CSVImportRowError(row_number=row_idx, error="Missing product_name", raw_data=row_clean))
            continue

        # 2. Price check
        price_str = row_clean.get("price")
        if not price_str:
            errors.append(CSVImportRowError(row_number=row_idx, error="Missing price", raw_data=row_clean))
            continue
        try:
            price_val = Decimal(price_str)
            if price_val <= 0:
                errors.append(CSVImportRowError(row_number=row_idx, error="Invalid price: must be > 0", raw_data=row_clean))
                continue
        except (InvalidOperation, TypeError):
            errors.append(CSVImportRowError(row_number=row_idx, error=f"Invalid price value: '{price_str}'", raw_data=row_clean))
            continue

        # 3. Price unit check
        price_unit_val = row_clean.get("price_unit", "PER_KG").upper()
        if not price_unit_val.startswith("PER_"):
            price_unit_val = f"PER_{price_unit_val}"

        # 4. Source type check
        source_type_val = row_clean.get("source_type", "ADMIN_IMPORT").upper()
        if source_type_val not in valid_source_types:
            errors.append(
                CSVImportRowError(
                    row_number=row_idx,
                    error=f"Invalid source_type: '{source_type_val}'. Allowed: {sorted(list(valid_source_types))}",
                    raw_data=row_clean,
                )
            )
            continue

        # 5. Source name check
        source_name_val = row_clean.get("source_name", "CSV Import")

        # 6. Date check
        date_str = row_clean.get("observation_date")
        if not date_str:
            errors.append(CSVImportRowError(row_number=row_idx, error="Missing observation_date", raw_data=row_clean))
            continue
        try:
            obs_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            errors.append(
                CSVImportRowError(
                    row_number=row_idx,
                    error=f"Invalid observation_date format: '{date_str}'. Expected YYYY-MM-DD",
                    raw_data=row_clean,
                )
            )
            continue

        # Row is valid -> create object
        db_obj = PriceObservation(
            product_name=product_name,
            category=row_clean.get("category", "VEGETABLE"),
            variety=row_clean.get("variety"),
            quality_grade=row_clean.get("quality_grade", "UNGRADED"),
            price=price_val.quantize(Decimal("0.01")),
            currency=row_clean.get("currency", "INR").upper(),
            price_unit=price_unit_val,
            market_name=row_clean.get("market_name"),
            district=row_clean.get("district"),
            state=row_clean.get("state"),
            source_type=source_type_val,
            source_name=source_name_val,
            source_reference=row_clean.get("source_reference"),
            observation_date=obs_date,
        )
        db.add(db_obj)
        imported_count += 1

    db.commit()

    return CSVImportResponse(
        total_rows=total_rows,
        imported_count=imported_count,
        error_count=len(errors),
        errors=errors,
    )
