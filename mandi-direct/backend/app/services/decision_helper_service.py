import math
import re
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.enums import ProduceStatus
from app.models.produce import ProduceListing
from app.models.farmer import Farm, FarmerProfile
from app.models.review import FarmerReview
from app.schemas.decision_helper import (
    DecisionHelperItem,
    DecisionHelperRequest,
    DecisionHelperResponse,
)


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points on Earth in kilometers."""
    R = 6371.0  # Earth radius in kilometers
    f_lat1, f_lon1 = float(lat1), float(lon1)
    f_lat2, f_lon2 = float(lat2), float(lon2)
    dlat = math.radians(f_lat2 - f_lat1)
    dlon = math.radians(f_lon2 - f_lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(f_lat1))
        * math.cos(math.radians(f_lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)


def parse_natural_query(query: str) -> Tuple[str, Optional[Decimal], str]:
    """
    Extract product name and quantity from user queries like:
    '100 KG rice', '50 kg tomato', 'rice 200kg', 'wheat'
    """
    normalized = query.lower().strip()
    qty = None
    unit = "KG"

    # Match patterns like: 100 kg, 100kg, 50 quintal, 2 ton
    match = re.search(r'(\d+(?:\.\d+)?)\s*(kg|quintal|ton|kilo)?', normalized)
    if match:
        try:
            qty = Decimal(match.group(1))
            if match.group(2):
                u = match.group(2).lower()
                if "ton" in u:
                    unit = "TON"
                elif "quintal" in u:
                    unit = "QUINTAL"
                else:
                    unit = "KG"
        except:
            pass

    # Remove the matched quantity from query to get product name
    cleaned = re.sub(r'(\d+(?:\.\d+)?)\s*(kg|quintal|ton|kilo)?', '', normalized)
    # Remove filler words
    cleaned = re.sub(r'\b(i|need|want|buy|looking|for|fresh|best|kisan|fasal|panta|ammali|bechna)\b', '', cleaned)
    product_name = cleaned.strip() or query.strip()

    return product_name, qty, unit


class DecisionHelperService:
    def recommend(
        self, db: Session, req: DecisionHelperRequest
    ) -> DecisionHelperResponse:
        parsed_name, parsed_qty, parsed_unit = parse_natural_query(req.query)
        target_product = (req.product_name or parsed_name).lower().strip()
        target_qty = req.required_quantity or parsed_qty

        # Query all active listed produce
        listings = (
            db.query(ProduceListing)
            .filter(
                ProduceListing.status.in_([ProduceStatus.LISTED.value, ProduceStatus.APPROVED.value]),
                ProduceListing.available_quantity > 0,
            )
            .all()
        )

        recommendations: List[DecisionHelperItem] = []

        for p in listings:
            p_name = p.product_name.lower()
            # 1. Product relevance check
            relevance = 0
            if target_product:
                if target_product in p_name:
                    relevance = 40 if target_product == p_name else 30
                elif any(word in p_name for word in target_product.split()):
                    relevance = 20
                else:
                    # Skip if neither name nor category matches
                    if target_product not in p.category.lower():
                        continue
                    relevance = 10
            else:
                relevance = 20

            # 2. Quantity sufficiency check
            qty_score = 0
            has_enough = True
            if target_qty and target_qty > 0:
                if p.available_quantity >= target_qty:
                    qty_score = 25
                else:
                    has_enough = False
                    qty_score = int(15 * float(p.available_quantity / target_qty))
            else:
                qty_score = 15

            # 3. Location & distance calculation
            distance: Optional[float] = None
            dist_score = 0
            farm_lat = None
            farm_lng = None
            location_str = "Regional Mandi"

            if p.farm:
                farm_lat = p.farm.latitude
                farm_lng = p.farm.longitude
                location_str = f"{p.farm.village or p.farm.district or 'Farm Location'}, {p.farm.state or ''}".strip(", ")
            elif p.farmer_profile and p.farmer_profile.profile:
                location_str = p.farmer_profile.profile.full_name

            if (
                req.buyer_lat is not None
                and req.buyer_lng is not None
                and farm_lat is not None
                and farm_lng is not None
            ):
                distance = haversine_distance_km(req.buyer_lat, req.buyer_lng, farm_lat, farm_lng)
                if req.max_distance_km and distance > req.max_distance_km:
                    continue  # Exceeds requested radius
                if distance <= 25:
                    dist_score = 20
                elif distance <= 50:
                    dist_score = 15
                elif distance <= 100:
                    dist_score = 10
                else:
                    dist_score = 5

            # 4. Harvest Freshness
            freshness_score = 0
            days_since = None
            if p.harvest_date:
                days_since = (date.today() - p.harvest_date).days
                if days_since <= 2:
                    freshness_score = 10
                elif days_since <= 5:
                    freshness_score = 7
                elif days_since <= 10:
                    freshness_score = 4

            # 5. Farmer Verified Rating
            reviews = (
                db.query(FarmerReview)
                .filter(FarmerReview.farmer_profile_id == p.farmer_profile_id)
                .all()
            )
            total_rev = len(reviews)
            rating_score = 0.0
            avg_rating = 0.0
            if total_rev > 0:
                avg_rating = round(sum(r.rating for r in reviews) / total_rev, 1)
                rating_score = avg_rating * 2  # up to 10 points

            # 6. Availability status classification
            avail_status = "AVAILABLE"
            if p.available_quantity <= 0:
                avail_status = "SOLD_OUT"
            elif target_qty and p.available_quantity < (target_qty * Decimal("0.3")):
                avail_status = "LOW_STOCK"

            # Total score
            total_score = relevance + qty_score + dist_score + freshness_score + rating_score

            # Structured factual explanation
            reasons = []
            if has_enough and target_qty:
                reasons.append(f"Has {p.available_quantity} {p.quantity_unit} available (meets your {target_qty} {target_qty_unit if 'target_qty_unit' in locals() else 'KG'} need)")
            else:
                reasons.append(f"{p.available_quantity} {p.quantity_unit} in stock")

            if distance is not None:
                reasons.append(f"Located {distance} KM away")
            reasons.append(f"Priced at ₹{p.expected_price}/{p.price_unit}")
            if days_since is not None and days_since >= 0:
                reasons.append(f"Harvested {days_since} day{'s' if days_since != 1 else ''} ago")
            if avg_rating > 0:
                reasons.append(f"Farmer rated {avg_rating}★ from {total_rev} verified review{'s' if total_rev != 1 else ''}")

            explanation = ". ".join(reasons) + "."

            # Get primary image
            img_url = None
            if p.images and len(p.images) > 0:
                img_url = p.images[0].image_url

            recommendations.append(
                DecisionHelperItem(
                    produce_id=p.id,
                    product_name=p.product_name,
                    category=p.category,
                    expected_price=p.expected_price,
                    price_unit=p.price_unit,
                    available_quantity=p.available_quantity,
                    quantity_unit=p.quantity_unit,
                    harvest_date=p.harvest_date,
                    days_since_harvest=days_since,
                    farmer_profile_id=p.farmer_profile_id,
                    farmer_name=p.farmer_profile.profile.full_name if p.farmer_profile and p.farmer_profile.profile else "Verified Producer",
                    farmer_rating=avg_rating,
                    farmer_total_reviews=total_rev,
                    location=location_str,
                    distance_km=distance,
                    availability_status=avail_status,
                    image_url=img_url,
                    score=float(total_score),
                    explanation=explanation,
                )
            )

        # Sort descending by score
        recommendations.sort(key=lambda item: item.score, reverse=True)

        return DecisionHelperResponse(
            parsed_product=target_product or req.query,
            parsed_quantity=target_qty,
            recommendations=recommendations[:15],
            total_matches=len(recommendations),
        )


decision_helper_service = DecisionHelperService()
