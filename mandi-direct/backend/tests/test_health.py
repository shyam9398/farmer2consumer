def test_root_health_endpoint(client):
    """
    Test requirement 10:
    GET /health must return:
    {
      "status": "ok",
      "service": "mandi-direct-api"
    }
    """
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data == {
        "status": "ok",
        "service": "mandi-direct-api",
    }


def test_v1_health_endpoint(client):
    """Test /api/v1/health endpoint returns identical contract."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "mandi-direct-api"


def test_root_database_health_endpoint(client):
    """Test /health/db verifies database connectivity."""
    response = client.get("/health/db")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "mandi-direct-api"
    assert data["database"] == "connected"


def test_v1_database_health_endpoint(client):
    """Test /api/v1/health/db verifies database connectivity."""
    response = client.get("/api/v1/health/db")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "mandi-direct-api"
    assert data["database"] == "connected"


def test_cors_production_frontend_origin(client):
    """Verify CORS preflight and request headers for production frontend."""
    # Preflight OPTIONS
    options_res = client.options(
        "/api/v1/health",
        headers={
            "Origin": "https://farmer2consumer.vercel.app",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert options_res.status_code == 200
    assert options_res.headers.get("access-control-allow-origin") == "https://farmer2consumer.vercel.app"
    assert options_res.headers.get("access-control-allow-credentials") == "true"

    # Actual GET request
    get_res = client.get(
        "/api/v1/health",
        headers={"Origin": "https://farmer2consumer.vercel.app"},
    )
    assert get_res.status_code == 200
    assert get_res.headers.get("access-control-allow-origin") == "https://farmer2consumer.vercel.app"


def test_cors_vercel_preview_regex_origin(client):
    """Verify CORS preflight matches Vercel regex pattern."""
    options_res = client.options(
        "/api/v1/health",
        headers={
            "Origin": "https://farmer2consumer-git-feat-test.vercel.app",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert options_res.status_code == 200
    assert options_res.headers.get("access-control-allow-origin") == "https://farmer2consumer-git-feat-test.vercel.app"
