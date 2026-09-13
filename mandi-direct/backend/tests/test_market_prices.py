from datetime import date
from decimal import Decimal
from app.models.price_observation import PriceObservation


def test_get_market_prices_empty(client, db_session):
    """Zero fake data: returns empty list when no observations are recorded."""
    response = client.get("/api/v1/market-prices")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert isinstance(data["items"], list)


def test_get_market_prices_with_observations(client, db_session):
    """Verify market prices endpoint returns real observations correctly formatted."""
    obs1 = PriceObservation(
        product_name="Tomato",
        category="VEGETABLE",
        variety="Hybrid",
        quality_grade="GRADE_A",
        price=Decimal("28.50"),
        currency="INR",
        price_unit="PER_KG",
        market_name="Kolar Mandi",
        district="Kolar",
        state="Karnataka",
        source_type="GOVERNMENT_DATA",
        source_name="Agmarknet",
        observation_date=date.today(),
    )
    obs2 = PriceObservation(
        product_name="Wheat",
        category="GRAIN",
        variety="Sharbati",
        quality_grade="GRADE_A",
        price=Decimal("35.00"),
        currency="INR",
        price_unit="PER_KG",
        market_name="Khanna Mandi",
        district="Ludhiana",
        state="Punjab",
        source_type="GOVERNMENT_DATA",
        source_name="Agmarknet",
        observation_date=date.today(),
    )
    db_session.add(obs1)
    db_session.add(obs2)
    db_session.commit()

    # Query all
    res = client.get("/api/v1/market-prices")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 2

    # Query category filter: vegetables
    res_veg = client.get("/api/v1/market-prices?category=vegetables")
    assert res_veg.status_code == 200
    veg_data = res_veg.json()
    veg_names = [item["commodity"] for item in veg_data["items"]]
    assert "Tomato" in veg_names
    assert "Wheat" not in veg_names

    # Query category filter: grains
    res_grain = client.get("/api/v1/market-prices?category=grains")
    assert res_grain.status_code == 200
    grain_data = res_grain.json()
    grain_names = [item["commodity"] for item in grain_data["items"]]
    assert "Wheat" in grain_names
    assert "Tomato" not in grain_names

    # Query non-matching category
    res_none = client.get("/api/v1/market-prices?category=spices")
    assert res_none.status_code == 200
    assert len(res_none.json()["items"]) == 0
