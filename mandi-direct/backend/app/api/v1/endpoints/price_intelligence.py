from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_optional_current_user
from app.models.profile import Profile
from app.schemas.price_intelligence import (
    PriceHistoryResponse,
    PriceIntelligenceSummary,
    PriceRecommendationRequest,
    PriceRecommendationResponse,
    RegionalPriceResponse,
)
from app.services.price_intelligence import price_intelligence_service
from app.services.price_recommendation import price_recommendation_service

router = APIRouter()


@router.get("/summary", response_model=PriceIntelligenceSummary)
def get_price_summary(
    product_name: str = Query(..., min_length=2, example="Tomato"),
    variety: Optional[str] = Query(None, example="Hybrid"),
    quality_grade: Optional[str] = Query(None, example="GRADE_A"),
    db: Session = Depends(get_db),
    current_user: Optional[Profile] = Depends(get_optional_current_user),
):
    """
    Retrieves statistical price intelligence summary (latest price, min, max, simple & weighted average, 7d/30d/90d averages, trend, confidence).
    """
    return price_intelligence_service.get_summary(
        db, product_name=product_name, variety=variety, quality_grade=quality_grade
    )


@router.get("/history", response_model=PriceHistoryResponse)
def get_price_history(
    product_name: str = Query(..., min_length=2, example="Tomato"),
    variety: Optional[str] = Query(None, example="Hybrid"),
    quality_grade: Optional[str] = Query(None, example="GRADE_A"),
    days_back: int = Query(30, ge=7, le=180),
    db: Session = Depends(get_db),
    current_user: Optional[Profile] = Depends(get_optional_current_user),
):
    """
    Retrieves aggregated daily historical price data points for charting.
    """
    return price_intelligence_service.get_history(
        db,
        product_name=product_name,
        variety=variety,
        quality_grade=quality_grade,
        days_back=days_back,
    )


@router.get("/regional", response_model=RegionalPriceResponse)
def get_regional_prices(
    product_name: str = Query(..., min_length=2, example="Tomato"),
    variety: Optional[str] = Query(None),
    quality_grade: Optional[str] = Query(None),
    district: Optional[str] = Query(None, example="Kolar"),
    state: Optional[str] = Query(None, example="Karnataka"),
    db: Session = Depends(get_db),
    current_user: Optional[Profile] = Depends(get_optional_current_user),
):
    """
    Retrieves comparative regional breakdown: Local District vs State vs Mandi Direct platform orders.
    """
    return price_intelligence_service.get_regional_prices(
        db,
        product_name=product_name,
        variety=variety,
        quality_grade=quality_grade,
        district=district,
        state=state,
    )


@router.post("/recommendation", response_model=PriceRecommendationResponse)
def get_price_recommendation(
    req: PriceRecommendationRequest,
    db: Session = Depends(get_db),
    current_user: Optional[Profile] = Depends(get_optional_current_user),
):
    """
    Generates transparent statistical price recommendation (fair range, suggested target, trend, confidence, expected price comparison).
    """
    return price_recommendation_service.generate_recommendation(db, req)
