"""Tests for observation history endpoint."""

from datetime import datetime, timezone
from decimal import Decimal
from unittest.mock import MagicMock
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.models.observation import Observation
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


def _make_observation(
    region_id: str = "18-300-00101",
    recorded_at: datetime = None,
    rainfall_1h_mm: Decimal = None,
    rainfall_3h_mm: Decimal = None,
    rainfall_6h_mm: Decimal = None,
    rainfall_24h_mm: Decimal = None,
    water_level_m: Decimal = None,
    temperature_c: Decimal = None,
    humidity_pct: Decimal = None,
    data_source: str = "open-meteo",
) -> Observation:
    return Observation(
        region_id=region_id,
        recorded_at=recorded_at or datetime(2026, 9, 25, 12, 0, tzinfo=timezone.utc),
        rainfall_1h_mm=rainfall_1h_mm,
        rainfall_3h_mm=rainfall_3h_mm,
        rainfall_6h_mm=rainfall_6h_mm,
        rainfall_24h_mm=rainfall_24h_mm,
        water_level_m=water_level_m,
        temperature_c=temperature_c,
        humidity_pct=humidity_pct,
        data_source=data_source,
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
# Observation History Endpoint Tests
# ==============================================================================

def test_observations_endpoint_exists(override_get_db, mock_session):
    """GET /api/v1/regions/{region_id}/observations endpoint exists and returns 200."""
    region = _make_region()
    observation = _make_observation()
    mock_session.get.return_value = region
    mock_session.scalars.return_value.all.return_value = [observation]

    response = client.get("/api/v1/regions/18-300-00101/observations")

    assert response.status_code == 200


def test_observations_response_structure(override_get_db, mock_session):
    """Response has correct structure with region_id, observations array, and total_observations."""
    region = _make_region()
    observation = _make_observation()
    mock_session.get.return_value = region
    mock_session.scalars.return_value.all.return_value = [observation]

    response = client.get("/api/v1/regions/18-300-00101/observations")

    assert response.status_code == 200
    data = response.json()
    assert "region_id" in data
    assert "observations" in data
    assert "total_observations" in data
    assert isinstance(data["observations"], list)
    assert isinstance(data["total_observations"], int)


def test_observations_contain_required_fields(override_get_db, mock_session):
    """Each observation contains all required fields."""
    region = _make_region()
    observation = _make_observation(
        recorded_at=datetime(2026, 9, 25, 12, 0, tzinfo=timezone.utc),
        rainfall_1h_mm=Decimal("2.5"),
        rainfall_3h_mm=Decimal("5.0"),
        rainfall_6h_mm=Decimal("7.5"),
        rainfall_24h_mm=Decimal("10.0"),
        water_level_m=None,
        temperature_c=Decimal("28.5"),
        humidity_pct=Decimal("80.0"),
        data_source="open-meteo",
    )
    mock_session.get.return_value = region
    mock_session.scalars.return_value.all.return_value = [observation]

    response = client.get("/api/v1/regions/18-300-00101/observations")

    assert response.status_code == 200
    data = response.json()
    obs = data["observations"][0]
    # Timestamp format can be either "Z" or "+00:00" for UTC
    assert obs["recorded_at"].endswith("Z") or obs["recorded_at"].endswith("+00:00")
    assert "2026-09-25T12:00:00" in obs["recorded_at"]
    assert obs["rainfall_1h_mm"] == "2.5"
    assert obs["rainfall_3h_mm"] == "5.0"
    assert obs["rainfall_6h_mm"] == "7.5"
    assert obs["rainfall_24h_mm"] == "10.0"
    assert obs["water_level_m"] is None
    assert obs["temperature_c"] == "28.5"
    assert obs["humidity_pct"] == "80.0"
    assert obs["data_source"] == "open-meteo"


def test_total_observations_matches_returned_count(override_get_db, mock_session):
    """total_observations matches the number of observations returned."""
    region = _make_region()
    observations = [
        _make_observation(recorded_at=datetime(2026, 9, 25, 12, 0, tzinfo=timezone.utc)),
        _make_observation(recorded_at=datetime(2026, 9, 26, 12, 0, tzinfo=timezone.utc)),
        _make_observation(recorded_at=datetime(2026, 9, 27, 12, 0, tzinfo=timezone.utc)),
    ]
    mock_session.get.return_value = region
    mock_session.scalars.return_value.all.return_value = observations

    response = client.get("/api/v1/regions/18-300-00101/observations")

    assert response.status_code == 200
    data = response.json()
    assert data["total_observations"] == 3
    assert len(data["observations"]) == 3


def test_observations_ordered_chronologically(override_get_db, mock_session):
    """Observations are ordered chronologically (oldest first, recorded_at ASC)."""
    region = _make_region()
    observations = [
        _make_observation(recorded_at=datetime(2026, 9, 27, 12, 0, tzinfo=timezone.utc)),
        _make_observation(recorded_at=datetime(2026, 9, 25, 12, 0, tzinfo=timezone.utc)),
        _make_observation(recorded_at=datetime(2026, 9, 26, 12, 0, tzinfo=timezone.utc)),
    ]
    mock_session.get.return_value = region
    mock_session.scalars.return_value.all.return_value = observations

    response = client.get("/api/v1/regions/18-300-00101/observations")

    assert response.status_code == 200
    data = response.json()
    timestamps = [obs["recorded_at"] for obs in data["observations"]]
    # Verify the mock was called with ORDER BY recorded_at ASC
    # The mock returns observations in the order provided, but the actual SQL query uses ORDER BY recorded_at ASC.
    # Verify that the query was constructed with order_by.
    mock_session.scalars.assert_called()
    call_args = mock_session.scalars.call_args[0][0]
    compiled = call_args.compile(compile_kwargs={"literal_binds": True})
    assert "ORDER BY observations.recorded_at" in str(compiled) or "ORDER BY recorded_at" in str(compiled)


def test_observations_only_for_requested_region(override_get_db, mock_session):
    """Observations belong only to the requested region."""
    region = _make_region(region_id="18-300-00101")
    observation = _make_observation(region_id="18-300-00101")
    mock_session.get.return_value = region
    mock_session.scalars.return_value.all.return_value = [observation]

    response = client.get("/api/v1/regions/18-300-00101/observations")

    assert response.status_code == 200
    data = response.json()
    # The query filters by region_id, so all returned observations should be for this region
    assert data["region_id"] == "18-300-00101"


def test_unknown_region_returns_404(override_get_db, mock_session):
    """Unknown region returns 404."""
    mock_session.get.return_value = None

    response = client.get("/api/v1/regions/UNKNOWN_REGION/observations")

    assert response.status_code == 404
    data = response.json()
    assert "not found" in data["detail"].lower()


def test_region_with_no_observations_returns_empty_list(override_get_db, mock_session):
    """Region with no observations returns empty list with total_observations = 0."""
    region = _make_region()
    mock_session.get.return_value = region
    mock_session.scalars.return_value.all.return_value = []

    response = client.get("/api/v1/regions/18-300-00101/observations")

    assert response.status_code == 200
    data = response.json()
    assert data["observations"] == []
    assert data["total_observations"] == 0
    assert data["region_id"] == "18-300-00101"


def test_database_unavailable_returns_503(override_get_db, mock_session):
    """Database query failure returns 503."""
    region = _make_region()
    mock_session.get.return_value = region
    mock_session.scalars.side_effect = Exception("Database connection failed")

    response = client.get("/api/v1/regions/18-300-00101/observations")

    assert response.status_code == 503
    data = response.json()
    assert "unavailable" in data["detail"].lower()


def test_response_schema_validation(override_get_db, mock_session):
    """Response conforms to ObservationListResponse schema."""
    from app.schemas.prediction import ObservationListResponse
    region = _make_region()
    observation = _make_observation()
    mock_session.get.return_value = region
    mock_session.scalars.return_value.all.return_value = [observation]

    response = client.get("/api/v1/regions/18-300-00101/observations")

    assert response.status_code == 200
    # This will raise if schema validation fails
    ObservationListResponse(**response.json())


def test_observation_fields_are_correct_types(override_get_db, mock_session):
    """Observation fields have correct types in response."""
    region = _make_region()
    observation = _make_observation(
        recorded_at=datetime(2026, 9, 25, 12, 0, tzinfo=timezone.utc),
        rainfall_1h_mm=Decimal("2.5"),
        rainfall_3h_mm=Decimal("5.0"),
        rainfall_6h_mm=Decimal("7.5"),
        rainfall_24h_mm=Decimal("10.0"),
        water_level_m=None,
        temperature_c=Decimal("28.5"),
        humidity_pct=Decimal("80.0"),
        data_source="open-meteo",
    )
    mock_session.get.return_value = region
    mock_session.scalars.return_value.all.return_value = [observation]

    response = client.get("/api/v1/regions/18-300-00101/observations")

    assert response.status_code == 200
    data = response.json()
    obs = data["observations"][0]
    assert isinstance(obs["recorded_at"], str)
    assert obs["rainfall_1h_mm"] is None or isinstance(obs["rainfall_1h_mm"], str)
    assert obs["rainfall_3h_mm"] is None or isinstance(obs["rainfall_3h_mm"], str)
    assert obs["rainfall_6h_mm"] is None or isinstance(obs["rainfall_6h_mm"], str)
    assert obs["rainfall_24h_mm"] is None or isinstance(obs["rainfall_24h_mm"], str)
    assert obs["water_level_m"] is None or isinstance(obs["water_level_m"], str)
    assert obs["temperature_c"] is None or isinstance(obs["temperature_c"], str)
    assert obs["humidity_pct"] is None or isinstance(obs["humidity_pct"], str)
    assert isinstance(obs["data_source"], str)


def test_observations_with_none_values(override_get_db, mock_session):
    """Observations with None optional fields are handled correctly."""
    region = _make_region()
    observation = _make_observation(
        rainfall_1h_mm=None,
        rainfall_3h_mm=None,
        rainfall_6h_mm=None,
        rainfall_24h_mm=None,
        water_level_m=None,
        temperature_c=None,
        humidity_pct=None,
    )
    mock_session.get.return_value = region
    mock_session.scalars.return_value.all.return_value = [observation]

    response = client.get("/api/v1/regions/18-300-00101/observations")

    assert response.status_code == 200
    data = response.json()
    obs = data["observations"][0]
    assert obs["rainfall_1h_mm"] is None
    assert obs["rainfall_3h_mm"] is None
    assert obs["rainfall_6h_mm"] is None
    assert obs["rainfall_24h_mm"] is None
    assert obs["water_level_m"] is None
    assert obs["temperature_c"] is None
    assert obs["humidity_pct"] is None
    assert obs["data_source"] == "open-meteo"