"""Tests for canonical region list endpoint."""

from datetime import datetime, timezone
from decimal import Decimal
from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.models.region import Region
from app.database.connection import get_db

client = TestClient(app)


def _make_region(
    region_id: str = "18-300-00101",
    name: str = "Test Region",
    district: str = "Test District",
    latitude: float = 26.32,
    longitude: float = 91.01,
    elevation_m: Decimal = Decimal("35.0"),
) -> Region:
    return Region(
        region_id=region_id,
        name=name,
        district=district,
        latitude=latitude,
        longitude=longitude,
        elevation_m=elevation_m,
    )


def _make_mock_session() -> MagicMock:
    session = MagicMock(spec=Session)
    return session


@pytest.fixture
def mock_session():
    """Provides a mock database session."""
    return _make_mock_session()


@pytest.fixture
def override_get_db(mock_session):
    """Override FastAPI's get_db dependency with mock session."""
    def _override():
        return mock_session
    app.dependency_overrides[get_db] = _override
    yield
    app.dependency_overrides.clear()


# ==============================================================================
# Region List Endpoint Tests
# ==============================================================================

def test_regions_endpoint_exists(override_get_db, mock_session):
    """GET /api/v1/regions endpoint exists and returns 200."""
    region = _make_region()
    mock_session.scalars.return_value.all.return_value = [region]

    response = client.get("/api/v1/regions")

    assert response.status_code == 200


def test_regions_response_structure(override_get_db, mock_session):
    """Response has correct structure with regions array and total_regions."""
    region = _make_region()
    mock_session.scalars.return_value.all.return_value = [region]

    response = client.get("/api/v1/regions")

    assert response.status_code == 200
    data = response.json()
    assert "regions" in data
    assert "total_regions" in data
    assert isinstance(data["regions"], list)
    assert isinstance(data["total_regions"], int)


def test_regions_contains_required_fields(override_get_db, mock_session):
    """Each region contains all required fields."""
    region = _make_region(
        region_id="18-300-00101",
        name="Kokrajhar East",
        district="Kokrajhar",
        latitude=26.4012,
        longitude=90.1234,
        elevation_m=Decimal("35.0"),
    )
    mock_session.scalars.return_value.all.return_value = [region]

    response = client.get("/api/v1/regions")

    assert response.status_code == 200
    data = response.json()
    region_data = data["regions"][0]
    assert region_data["region_id"] == "18-300-00101"
    assert region_data["name"] == "Kokrajhar East"
    assert region_data["district"] == "Kokrajhar"
    assert region_data["latitude"] == 26.4012
    assert region_data["longitude"] == 90.1234
    assert region_data["elevation_m"] == "35.0"


def test_total_regions_matches_returned_count(override_get_db, mock_session):
    """total_regions matches the number of regions returned."""
    regions = [
        _make_region(region_id="18-300-00101"),
        _make_region(region_id="18-300-00102"),
        _make_region(region_id="18-300-00103"),
    ]
    mock_session.scalars.return_value.all.return_value = regions

    response = client.get("/api/v1/regions")

    assert response.status_code == 200
    data = response.json()
    assert data["total_regions"] == 3
    assert len(data["regions"]) == 3


def test_regions_ordered_deterministically(override_get_db, mock_session):
    """Regions are ordered deterministically by region_id."""
    regions = [
        _make_region(region_id="18-300-00103"),
        _make_region(region_id="18-300-00101"),
        _make_region(region_id="18-300-00102"),
    ]
    mock_session.scalars.return_value.all.return_value = regions

    response = client.get("/api/v1/regions")

    assert response.status_code == 200
    data = response.json()
    # The actual implementation uses order_by(Region.region_id) which would sort by region_id.
    # The mock returns regions in the order provided, but the actual SQL query uses ORDER BY region_id.
    # Verify that the query was constructed with order_by.
    mock_session.scalars.assert_called()
    call_args = mock_session.scalars.call_args[0][0]
    # The statement should have an ORDER BY clause
    compiled = call_args.compile(compile_kwargs={"literal_binds": True})
    assert "ORDER BY regions.region_id" in str(compiled) or "ORDER BY region_id" in str(compiled)


def test_regions_with_none_elevation(override_get_db, mock_session):
    """Regions with None elevation_m are handled correctly."""
    region = _make_region(elevation_m=None)
    mock_session.scalars.return_value.all.return_value = [region]

    response = client.get("/api/v1/regions")

    assert response.status_code == 200
    data = response.json()
    assert data["regions"][0]["elevation_m"] is None


def test_empty_regions_list(override_get_db, mock_session):
    """Empty database returns empty regions list with total_regions = 0."""
    mock_session.scalars.return_value.all.return_value = []

    response = client.get("/api/v1/regions")

    assert response.status_code == 200
    data = response.json()
    assert data["regions"] == []
    assert data["total_regions"] == 0


def test_database_unavailable_returns_503(override_get_db, mock_session):
    """Database query failure returns 503."""
    mock_session.scalars.side_effect = Exception("Database connection failed")

    response = client.get("/api/v1/regions")

    assert response.status_code == 503
    data = response.json()
    assert "unavailable" in data["detail"].lower()


def test_response_schema_validation(override_get_db, mock_session):
    """Response conforms to RegionListResponse schema."""
    from app.schemas.prediction import RegionListResponse
    region = _make_region()
    mock_session.scalars.return_value.all.return_value = [region]

    response = client.get("/api/v1/regions")

    assert response.status_code == 200
    # This will raise if schema validation fails
    RegionListResponse(**response.json())


def test_multiple_regions_all_fields_present(override_get_db, mock_session):
    """Multiple regions all have required fields."""
    regions = [
        _make_region(region_id="18-300-00101", name="Region A", district="District A", latitude=26.0, longitude=90.0),
        _make_region(region_id="18-300-00102", name="Region B", district="District B", latitude=27.0, longitude=91.0),
        _make_region(region_id="18-300-00103", name="Region C", district="District C", latitude=28.0, longitude=92.0),
    ]
    mock_session.scalars.return_value.all.return_value = regions

    response = client.get("/api/v1/regions")

    assert response.status_code == 200
    data = response.json()
    assert data["total_regions"] == 3
    for region_data in data["regions"]:
        assert "region_id" in region_data
        assert "name" in region_data
        assert "district" in region_data
        assert "latitude" in region_data
        assert "longitude" in region_data
        assert "elevation_m" in region_data


def test_region_fields_are_correct_types(override_get_db, mock_session):
    """Region fields have correct types in response."""
    region = _make_region(
        region_id="18-300-00101",
        name="Test Region",
        district="Test District",
        latitude=26.3245,
        longitude=91.0082,
        elevation_m=Decimal("35.0"),
    )
    mock_session.scalars.return_value.all.return_value = [region]

    response = client.get("/api/v1/regions")

    assert response.status_code == 200
    data = response.json()
    region_data = data["regions"][0]
    assert isinstance(region_data["region_id"], str)
    assert isinstance(region_data["name"], str)
    assert isinstance(region_data["district"], str)
    assert isinstance(region_data["latitude"], float)
    assert isinstance(region_data["longitude"], float)
    # elevation_m can be string (Decimal serialized) or null
    assert region_data["elevation_m"] is None or isinstance(region_data["elevation_m"], str)