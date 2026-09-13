import pytest
from datetime import date
from decimal import Decimal
from fastapi import status
from app.models.enums import PriceUnit, ProduceStatus, ProductCategory, QualityGrade, QuantityUnit, UserRole
from app.models.farmer import Farm, FarmerProfile
from app.models.produce import ProduceListing


def test_buyer_decision_helper_ranking(client, db_session, create_test_user):
    # 1. Setup farmer and farm with coordinates
    farmer_user = create_test_user(
        auth_user_id="auth-farmer-dec-1",
        email="farmer.dec@mandidirect.in",
        full_name="Krishna Murthy",
        role=UserRole.FARMER,
    )
    farmer_profile = FarmerProfile(
        profile_id=farmer_user.id,
        address_line="Kankipadu Village",
        village="Kankipadu",
        mandal="Kankipadu",
        district="Krishna",
        state="Andhra Pradesh",
        pincode="521151",
    )
    db_session.add(farmer_profile)
    db_session.flush()

    farm_nearby = Farm(
        farmer_profile_id=farmer_profile.id,
        farm_name="Krishna Paddy Lands",
        total_area=Decimal("10.0"),
        area_unit="ACRE",
        address_line="Main Road",
        village="Kankipadu",
        mandal="Kankipadu",
        district="Krishna",
        state="Andhra Pradesh",
        pincode="521151",
        latitude=16.4800,
        longitude=80.7800,
    )
    db_session.add(farm_nearby)
    db_session.flush()

    # 2. Add listings: Listing A (200 KG Rice @ ₹30), Listing B (50 KG Rice @ ₹28)
    listing_a = ProduceListing(
        farmer_profile_id=farmer_profile.id,
        farm_id=farm_nearby.id,
        category=ProductCategory.GRAIN.value,
        product_name="Sona Masoori Rice",
        variety="BPT 5204",
        quality_grade=QualityGrade.GRADE_A.value,
        total_quantity=Decimal("200.0"),
        available_quantity=Decimal("200.0"),
        quantity_unit=QuantityUnit.KG.value,
        expected_price=Decimal("30.0"),
        price_unit=PriceUnit.PER_KG.value,
        harvest_date=date.today(),
        available_from=date.today(),
        status=ProduceStatus.LISTED.value,
    )
    listing_b = ProduceListing(
        farmer_profile_id=farmer_profile.id,
        farm_id=farm_nearby.id,
        category=ProductCategory.GRAIN.value,
        product_name="Raw Brown Rice",
        variety="Traditional",
        quality_grade=QualityGrade.GRADE_A.value,
        total_quantity=Decimal("50.0"),
        available_quantity=Decimal("50.0"),
        quantity_unit=QuantityUnit.KG.value,
        expected_price=Decimal("28.0"),
        price_unit=PriceUnit.PER_KG.value,
        harvest_date=date.today(),
        available_from=date.today(),
        status=ProduceStatus.LISTED.value,
    )
    db_session.add_all([listing_a, listing_b])
    db_session.commit()

    # 3. Test Decision Helper with query "100 KG Rice" and buyer coordinates nearby
    payload = {
        "query": "I need 100 KG Rice",
        "buyer_lat": 16.5062,
        "buyer_lng": 80.6480,
    }
    res = client.post("/api/v1/marketplace/decision-helper", json=payload)
    assert res.status_code == status.HTTP_200_OK, res.text
    data = res.json()
    assert float(data["parsed_quantity"]) == 100
    assert data["total_matches"] >= 2

    # Listing A should rank first because it satisfies 100 KG requirement (200 KG available vs 50 KG)
    recs = data["recommendations"]
    assert recs[0]["produce_id"] == listing_a.id
    assert "200" in recs[0]["explanation"]
    assert recs[0]["distance_km"] is not None
