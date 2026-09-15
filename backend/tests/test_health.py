from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint_returns_ok():
    """Confirms that GET /api/v1/health returns HTTP 200 with {'status': 'ok'}.
    This test runs completely independent of database connectivity.
    """
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_database_health_endpoint_graceful_response():
    """Confirms that GET /api/v1/health/db responds gracefully.
    If database credentials are missing or unconfigured, it returns 503 without crashing.
    If connected, it returns 200. Sensitive credentials must never be leaked.
    """
    response = client.get("/api/v1/health/db")
    assert response.status_code in [200, 503]
    data = response.json()
    assert "status" in data
    assert "database" in data
    assert data["database"] in ["connected", "disconnected"]

    # Security check: ensure no credentials or raw connection strings are exposed
    body_text = response.text.lower()
    assert "password" not in body_text
    assert "postgresql://" not in body_text
    assert "psycopg://" not in body_text


def test_openapi_docs_accessible():
    """Confirms that automatic FastAPI Swagger documentation is accessible."""
    response = client.get("/docs")
    assert response.status_code == 200


def test_redoc_accessible():
    """Confirms that ReDoc documentation is accessible."""
    response = client.get("/redoc")
    assert response.status_code == 200


def test_root_welcome_endpoint_does_not_exist():
    """Confirms that no custom root endpoint was added (must return 404)."""
    response = client.get("/")
    assert response.status_code == 404
