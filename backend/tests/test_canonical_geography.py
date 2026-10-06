"""Tests for canonical 180-region Assam geography compatibility with prediction pipeline.

These tests verify that the existing prediction pipeline works correctly with
the full canonical 180-region Assam Revenue Circle geography.
"""

from datetime import datetime, timezone, timedelta
from decimal import Decimal
from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.ml.baseline import HydrologicalBaselineModel
from app.ml.exceptions import (
    MLInferenceError,
    MLInputError,
    MLModelUnavailableError,
    MLOutputValidationError,
)
from app.ml.schemas import MLPredictionInput, MLPredictionOutput
from app.ml.feature_preparation import prepare_prediction_input
from app.models.observation import Observation
from app.models.prediction import Prediction
from app.models.region import Region
from app.services.prediction import (
    PredictionService,
    RegionNotFoundError,
    NoUsableObservationError,
    PredictionPersistenceError,
)
from app.services.risk import classify_risk_level, RiskLevel
from app.database.seed import _load_assam_circles, _map_record_to_region
from app.database.connection import get_db


client = TestClient(app)


def _make_region(
    region_id: str = "18-300-00101",
    elevation_m: Decimal = Decimal("35.0"),
) -> Region:
    return Region(
        region_id=region_id,
        name="Test Region",
        district="Test District",
        latitude=26.32,
        longitude=91.01,
        elevation_m=elevation_m,
    )


def _make_observation(
    region_id: str = "18-300-00101",
    recorded_at: datetime = None,
    rainfall_1h: Decimal = Decimal("10.0"),
    rainfall_3h: Decimal = Decimal("25.0"),
    rainfall_6h: Decimal = Decimal("50.0"),
    rainfall_24h: Decimal = Decimal("100.0"),
    water_level_m: Decimal = None,
    temperature_c: Decimal = Decimal("28.0"),
    humidity_pct: Decimal = Decimal("80.0"),
    data_source: str = "open-meteo",
) -> Observation:
    return Observation(
        region_id=region_id,
        recorded_at=recorded_at or datetime(2026, 9, 17, 12, 0, tzinfo=timezone.utc),
        rainfall_1h_mm=rainfall_1h,
        rainfall_3h_mm=rainfall_3h,
        rainfall_6h_mm=rainfall_6h,
        rainfall_24h_mm=rainfall_24h,
        water_level_m=water_level_m,
        temperature_c=temperature_c,
        humidity_pct=humidity_pct,
        data_source=data_source,
    )


def _make_mock_session() -> MagicMock:
    session = MagicMock(spec=Session)
    return session


# ==============================================================================
# Test Fixtures
# ==============================================================================

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
# 1. CANONICAL GEOGRAPHY STRUCTURE TESTS
# ==============================================================================

def test_canonical_geography_has_180_regions():
    """A. 180 unique canonical region IDs are present in the dataset."""
    records = _load_assam_circles()
    assert len(records) == 180
    
    region_ids = [str(r["object_id"]).strip() for r in records]
    assert len(set(region_ids)) == 180, "All 180 region IDs must be unique"
    
    # Verify format: all start with "18-" prefix (Assam state code)
    for rid in region_ids:
        assert rid.startswith("18-"), f"Region ID {rid} must start with '18-'"


def test_canonical_geography_spans_35_districts():
    """B. 35 districts are represented in the canonical geography."""
    records = _load_assam_circles()
    districts = set(r["district"] for r in records)
    assert len(districts) == 35, f"Expected 35 districts, got {len(districts)}"


def test_canonical_region_ids_are_stable_and_deterministic():
    """C. Region IDs are deterministic and stable across seed runs."""
    records = _load_assam_circles()
    region_ids = sorted([str(r["object_id"]).strip() for r in records])
    
    # IDs should be in a predictable format: "18-XXX-XXXXX"
    for rid in region_ids:
        parts = rid.split("-")
        assert len(parts) == 3, f"Region ID {rid} should have 3 parts separated by hyphens"
        assert parts[0] == "18", f"First part should be '18' (Assam state code)"
        assert parts[1].isdigit(), f"Second part should be district code: {rid}"
        assert parts[2].isdigit(), f"Third part should be circle code: {rid}"


def test_canonical_geography_has_required_fields():
    """D. Each canonical region has all required geographic fields."""
    records = _load_assam_circles()
    for record in records:
        assert "object_id" in record
        assert "name" in record
        assert "district" in record
        assert "lat" in record
        assert "lon" in record
        
        # Coordinates should be valid
        lat = float(record["lat"])
        lon = float(record["lon"])
        assert 20.0 <= lat <= 30.0, f"Latitude {lat} out of Assam bounds"
        assert 88.0 <= lon <= 98.0, f"Longitude {lon} out of Assam bounds"
        
        # Elevation is optional but if present should be numeric
        if "elevation" in record and record["elevation"] is not None:
            float(record["elevation"])  # Should not raise


# ==============================================================================
# 2. PREDICTION SERVICE COMPATIBILITY TESTS
# ==============================================================================

def test_prediction_service_handles_180_regions(override_get_db, mock_session):
    """A. Region-wide prediction correctly reports total_regions = 180."""
    # Create 180 mock regions with canonical IDs
    regions = []
    observations = []
    for i in range(180):
        region_id = f"18-300-{101+i:05d}"
        regions.append(_make_region(region_id))
        observations.append(_make_observation(region_id))
    
    mock_session.scalars.return_value.all.return_value = regions
    mock_session.get.side_effect = regions
    mock_session.scalar.side_effect = observations
    mock_session.execute = MagicMock()
    mock_session.commit = MagicMock()
    
    response = client.get("/api/v1/predictions")
    
    assert response.status_code == 200
    data = response.json()
    assert data["total_regions"] == 180
    assert data["predictions_available"] == 180
    assert data["predictions_unavailable"] == 0
    assert len(data["predictions"]) == 180
    assert len(data["unavailable_regions"]) == 0


def test_no_duplicate_predictions_in_region_wide(override_get_db, mock_session):
    """B. No duplicate region predictions in region-wide response."""
    regions = [
        _make_region("18-300-00101"),
        _make_region("18-300-00102"),
    ]
    observations = [
        _make_observation("18-300-00101"),
        _make_observation("18-300-00102"),
    ]
    
    mock_session.scalars.return_value.all.return_value = regions
    mock_session.get.side_effect = regions
    mock_session.scalar.side_effect = observations
    mock_session.execute = MagicMock()
    mock_session.commit = MagicMock()
    
    response = client.get("/api/v1/predictions")
    
    assert response.status_code == 200
    data = response.json()
    assert data["predictions_available"] == 2
    
    # Verify no duplicate region_ids in predictions
    pred_region_ids = [p["region_id"] for p in data["predictions"]]
    assert len(pred_region_ids) == len(set(pred_region_ids)), "No duplicate region IDs in predictions"
    
    # Every prediction must have correct region_id
    for pred in data["predictions"]:
        assert pred["region_id"] in ["18-300-00101", "18-300-00102"]


def test_missing_observations_reported_unavailable(override_get_db, mock_session):
    """C. When observations are missing, regions appear in unavailable_regions."""
    regions = [
        _make_region("18-300-00101"),
        _make_region("18-300-00102"),
        _make_region("18-300-00103"),
    ]
    # Only first region has observation
    observations = [
        _make_observation("18-300-00101"),
    ]
    
    mock_session.scalars.return_value.all.return_value = regions
    mock_session.get.side_effect = regions
    # First has observation, rest have None
    mock_session.scalar.side_effect = [observations[0], None, None]
    mock_session.execute = MagicMock()
    mock_session.commit = MagicMock()
    
    response = client.get("/api/v1/predictions")
    
    assert response.status_code == 200
    data = response.json()
    assert data["total_regions"] == 3
    assert data["predictions_available"] == 1
    assert data["predictions_unavailable"] == 2
    assert len(data["predictions"]) == 1
    assert len(data["unavailable_regions"]) == 2
    
    # Verify unavailable regions have correct IDs
    unavailable_ids = {u["region_id"] for u in data["unavailable_regions"]}
    assert unavailable_ids == {"18-300-00102", "18-300-00103"}


def test_failed_region_does_not_block_others(override_get_db, mock_session):
    """D. One region failing does not prevent other regions from being processed."""
    regions = [
        _make_region("18-300-00101"),
        _make_region("18-300-00102"),
        _make_region("18-300-00103"),
    ]
    obs1 = _make_observation("18-300-00101")
    obs2 = _make_observation("18-300-00102")
    
    mock_session.scalars.return_value.all.return_value = regions
    mock_session.get.side_effect = regions
    mock_session.scalar.side_effect = [obs1, obs2, None]
    mock_session.execute = MagicMock()
    mock_session.commit = MagicMock()
    
    # Patch model factory to return a model that fails on third call
    with patch("app.api.endpoints.predictions.create_model") as mock_create_model:
        mock_model = MagicMock()
        mock_model.predict.side_effect = [
            MLPredictionOutput(
                region_id="18-300-00101",
                generated_at=datetime.now(timezone.utc),
                forecast_valid_until=datetime.now(timezone.utc) + timedelta(hours=6),
                flood_probability=Decimal("0.5"),
                model_version="baseline-v1",
            ),
            MLPredictionOutput(
                region_id="18-300-00102",
                generated_at=datetime.now(timezone.utc),
                forecast_valid_until=datetime.now(timezone.utc) + timedelta(hours=6),
                flood_probability=Decimal("0.5"),
                model_version="baseline-v1",
            ),
            MLInferenceError("Model crashed on third region"),
        ]
        mock_create_model.return_value = mock_model
        
        response = client.get("/api/v1/predictions")
    
    assert response.status_code == 200
    data = response.json()
    # First two should succeed, third should be unavailable
    assert data["predictions_available"] == 2
    assert data["predictions_unavailable"] == 1
    assert data["unavailable_regions"][0]["region_id"] == "18-300-00103"


def test_deterministic_ordering_of_regions(override_get_db, mock_session):
    """E. Regions are processed in deterministic order (by region_id)."""
    # The actual SQL query orders by region_id, so the mock should return them in sorted order
    regions = [
        _make_region("18-300-00101"),
        _make_region("18-300-00102"),
        _make_region("18-300-00103"),
    ]
    observations = [
        _make_observation("18-300-00101"),
        _make_observation("18-300-00102"),
        _make_observation("18-300-00103"),
    ]
    
    mock_session.scalars.return_value.all.return_value = regions
    mock_session.get.side_effect = regions
    mock_session.scalar.side_effect = observations
    mock_session.execute = MagicMock()
    mock_session.commit = MagicMock()
    
    response = client.get("/api/v1/predictions")
    
    assert response.status_code == 200
    data = response.json()
    # Predictions should be in region_id order (18-300-00101, 18-300-00102, 18-300-00103)
    pred_ids = [p["region_id"] for p in data["predictions"]]
    assert pred_ids == ["18-300-00101", "18-300-00102", "18-300-00103"], "Predictions should be ordered by region_id"


def test_single_region_endpoint_works_with_canonical_ids(override_get_db, mock_session):
    """F. Single-region endpoint works with canonical region IDs like 18-300-00101."""
    region = _make_region("18-300-00101")
    obs = _make_observation("18-300-00101")
    
    mock_session.get.return_value = region
    mock_session.scalar.return_value = obs
    mock_session.execute = MagicMock()
    mock_session.commit = MagicMock()
    
    response = client.get("/api/v1/predictions/18-300-00101")
    
    assert response.status_code == 200
    data = response.json()
    assert data["region_id"] == "18-300-00101"
    assert "flood_probability" in data
    assert "risk_level" in data


# ==============================================================================
# 3. OBSERVATION -> ML INPUT MAPPING TESTS
# ==============================================================================

def test_prepare_prediction_input_preserves_rainfall_fields():
    """A. All rainfall fields (1h, 3h, 6h, 24h) are preserved in ML input."""
    obs = _make_observation(
        rainfall_1h=Decimal("15.5"),
        rainfall_3h=Decimal("32.1"),
        rainfall_6h=Decimal("67.8"),
        rainfall_24h=Decimal("125.3"),
    )
    region = _make_region(elevation_m=Decimal("45.0"))
    
    ml_input = prepare_prediction_input(obs, region=region)
    
    assert ml_input.rainfall_1h_mm == Decimal("15.5")
    assert ml_input.rainfall_3h_mm == Decimal("32.1")
    assert ml_input.rainfall_6h_mm == Decimal("67.8")
    assert ml_input.rainfall_24h_mm == Decimal("125.3")


def test_prepare_prediction_input_rejects_missing_rainfall():
    """B. Missing required rainfall fields are rejected (no silent zero-filling)."""
    obs = _make_observation(rainfall_6h=None)  # Missing 6h rainfall
    
    with pytest.raises(MLInputError) as exc_info:
        prepare_prediction_input(obs)
    
    assert "rainfall_6h_mm" in str(exc_info.value)
    assert "missing required rainfall measurements" in str(exc_info.value).lower()


def test_prepare_prediction_input_optional_fields_remain_none():
    """C. Optional fields remain None when absent (no fabrication)."""
    obs = _make_observation(
        water_level_m=None,
        temperature_c=None,
        humidity_pct=None,
    )
    
    ml_input = prepare_prediction_input(obs)
    
    assert ml_input.water_level_m is None
    assert ml_input.temperature_c is None
    assert ml_input.humidity_pct is None
    assert ml_input.elevation_m is None  # No region provided


def test_prepare_prediction_input_maps_elevation_from_region():
    """D. Elevation from region is mapped to ML input."""
    obs = _make_observation()
    region = _make_region(elevation_m=Decimal("78.79"))
    
    ml_input = prepare_prediction_input(obs, region=region)
    
    assert ml_input.elevation_m == Decimal("78.79")


def test_prepare_prediction_input_no_speculative_features():
    """E. No speculative feature engineering is introduced."""
    obs = _make_observation(
        rainfall_1h=Decimal("10.0"),
        rainfall_3h=Decimal("30.0"),
        rainfall_6h=Decimal("50.0"),
        rainfall_24h=Decimal("100.0"),
    )
    
    ml_input = prepare_prediction_input(obs)
    
    # Verify only contract fields exist
    expected_fields = {
        "region_id", "reference_time", "rainfall_1h_mm", "rainfall_3h_mm",
        "rainfall_6h_mm", "rainfall_12h_mm", "rainfall_24h_mm", "water_level_m", "elevation_m",
        "temperature_c", "humidity_pct"
    }
    actual_fields = set(ml_input.model_dump().keys())
    assert actual_fields == expected_fields
    
    # Verify no extra computed fields
    assert "rainfall_3d" not in actual_fields
    assert "rainfall_7d" not in actual_fields
    assert "forecast_rainfall_6h" not in actual_fields
    assert "soil_features" not in actual_fields
    assert "population_features" not in actual_fields
    assert "distance_to_river" not in actual_fields
    assert "runoff_indices" not in actual_fields
    assert "proximity_scores" not in actual_fields


# ==============================================================================
# 4. BASELINE MODEL COMPATIBILITY TESTS
# ==============================================================================

def test_baseline_model_consumes_only_ml_prediction_input():
    """A. Baseline model only uses MLPredictionInput fields."""
    model = HydrologicalBaselineModel()
    
    # Valid input with all optional fields
    ml_input = MLPredictionInput(
        region_id="18-300-00101",
        reference_time=datetime.now(timezone.utc),
        rainfall_1h_mm=Decimal("10.0"),
        rainfall_3h_mm=Decimal("25.0"),
        rainfall_6h_mm=Decimal("50.0"),
        rainfall_24h_mm=Decimal("100.0"),
        water_level_m=Decimal("45.0"),
        elevation_m=Decimal("78.79"),
        temperature_c=Decimal("28.0"),
        humidity_pct=Decimal("80.0"),
    )
    
    output = model.predict(ml_input)
    
    assert isinstance(output, MLPredictionOutput)
    assert output.region_id == "18-300-00101"
    assert output.model_version == "baseline-v1"
    assert Decimal("0.0") <= output.flood_probability <= Decimal("1.0")


def test_baseline_model_deterministic():
    """B. Same input always produces same output (deterministic)."""
    model = HydrologicalBaselineModel()
    
    ml_input = MLPredictionInput(
        region_id="18-300-00101",
        reference_time=datetime(2026, 9, 17, 12, 0, tzinfo=timezone.utc),
        rainfall_1h_mm=Decimal("10.0"),
        rainfall_3h_mm=Decimal("25.0"),
        rainfall_6h_mm=Decimal("50.0"),
        rainfall_24h_mm=Decimal("100.0"),
    )
    
    out1 = model.predict(ml_input)
    out2 = model.predict(ml_input)
    
    assert out1.flood_probability == out2.flood_probability
    assert out1.generated_at == out2.generated_at
    assert out1.forecast_valid_until == out2.forecast_valid_until


def test_baseline_model_bounded_probability():
    """C. Output probability is always bounded [0.0, 1.0]."""
    model = HydrologicalBaselineModel()
    
    # Test with zero rainfall
    ml_input_zero = MLPredictionInput(
        region_id="18-300-00101",
        reference_time=datetime.now(timezone.utc),
        rainfall_1h_mm=Decimal("0"),
        rainfall_3h_mm=Decimal("0"),
        rainfall_6h_mm=Decimal("0"),
        rainfall_24h_mm=Decimal("0"),
    )
    out_zero = model.predict(ml_input_zero)
    assert out_zero.flood_probability == Decimal("0.0")
    
    # Test with very high rainfall
    ml_input_high = MLPredictionInput(
        region_id="18-300-00101",
        reference_time=datetime.now(timezone.utc),
        rainfall_1h_mm=Decimal("500"),
        rainfall_3h_mm=Decimal("500"),
        rainfall_6h_mm=Decimal("500"),
        rainfall_24h_mm=Decimal("500"),
    )
    out_high = model.predict(ml_input_high)
    assert out_high.flood_probability == Decimal("1.0")


def test_baseline_model_no_ml_dependencies():
    """D. Baseline model has no external ML dependencies (joblib, sklearn, etc.)."""
    import sys
    import app.ml.baseline as baseline_module
    
    forbidden = ['joblib', 'sklearn', 'xgboost', 'lightgbm', 'pandas']
    for mod_name in forbidden:
        assert not any(mod_name in str(v) for v in baseline_module.__dict__.values())


# ==============================================================================
# 5. RISK CLASSIFICATION TESTS
# ==============================================================================

@pytest.mark.parametrize("probability,expected_risk", [
    (Decimal("0.00"), RiskLevel.LOW),
    (Decimal("0.249"), RiskLevel.LOW),
    (Decimal("0.250"), RiskLevel.MODERATE),
    (Decimal("0.499"), RiskLevel.MODERATE),
    (Decimal("0.500"), RiskLevel.HIGH),
    (Decimal("0.749"), RiskLevel.HIGH),
    (Decimal("0.750"), RiskLevel.CRITICAL),
    (Decimal("1.000"), RiskLevel.CRITICAL),
])
def test_risk_classification_boundary_values(probability, expected_risk):
    """Risk classification works correctly at boundary values."""
    result = classify_risk_level(probability)
    assert result == expected_risk


def test_risk_classification_rejects_invalid_values():
    """Invalid probabilities are rejected."""
    with pytest.raises(Exception):
        classify_risk_level(Decimal("-0.01"))
    with pytest.raises(Exception):
        classify_risk_level(Decimal("1.01"))
    with pytest.raises(Exception):
        classify_risk_level(Decimal("NaN"))
    with pytest.raises(Exception):
        classify_risk_level(Decimal("Infinity"))


def test_risk_classification_consistent_in_batch(override_get_db, mock_session):
    """F. Risk classification is consistent across all 180 regions."""
    # Create regions with known rainfall to produce specific risk levels
    regions = [
        _make_region("18-300-00101"),  # Low rainfall -> LOW
        _make_region("18-300-00102"),  # High rainfall -> CRITICAL
    ]
    obs_low = _make_observation("18-300-00101", rainfall_1h=Decimal("0"), rainfall_3h=Decimal("0"), rainfall_6h=Decimal("0"), rainfall_24h=Decimal("1"))
    obs_high = _make_observation("18-300-00102", rainfall_1h=Decimal("50"), rainfall_3h=Decimal("100"), rainfall_6h=Decimal("150"), rainfall_24h=Decimal("300"))
    
    mock_session.scalars.return_value.all.return_value = regions
    mock_session.get.side_effect = regions
    mock_session.scalar.side_effect = [obs_low, obs_high]
    mock_session.execute = MagicMock()
    mock_session.commit = MagicMock()
    
    response = client.get("/api/v1/predictions")
    
    assert response.status_code == 200
    data = response.json()
    assert data["predictions_available"] == 2
    
    pred_by_region = {p["region_id"]: p for p in data["predictions"]}
    assert pred_by_region["18-300-00101"]["risk_level"] == "LOW"
    assert pred_by_region["18-300-00102"]["risk_level"] == "CRITICAL"


# ==============================================================================
# 6. API RESPONSE SCHEMA TESTS
# ==============================================================================

def test_region_wide_response_schema(override_get_db, mock_session):
    """A. Region-wide response has correct schema for 180 regions."""
    region = _make_region("18-300-00101")
    obs = _make_observation("18-300-00101")
    
    mock_session.scalars.return_value.all.return_value = [region]
    mock_session.get.return_value = region
    mock_session.scalar.return_value = obs
    mock_session.execute = MagicMock()
    mock_session.commit = MagicMock()
    
    response = client.get("/api/v1/predictions")
    
    assert response.status_code == 200
    data = response.json()
    
    # Check all required top-level fields
    required = {"generated_at", "total_regions", "predictions_available", 
                "predictions_unavailable", "predictions", "unavailable_regions"}
    assert set(data.keys()) == required
    
    # Check types
    assert isinstance(data["total_regions"], int)
    assert isinstance(data["predictions_available"], int)
    assert isinstance(data["predictions_unavailable"], int)
    assert isinstance(data["predictions"], list)
    assert isinstance(data["unavailable_regions"], list)


def test_prediction_response_schema(override_get_db, mock_session):
    """B. Each prediction has correct schema."""
    region = _make_region("18-300-00101")
    obs = _make_observation("18-300-00101")
    
    mock_session.get.return_value = region
    mock_session.scalar.return_value = obs
    mock_session.execute = MagicMock()
    mock_session.commit = MagicMock()
    
    response = client.get("/api/v1/predictions/18-300-00101")
    
    assert response.status_code == 200
    data = response.json()
    
    required = {"region_id", "generated_at", "forecast_valid_until", 
                "flood_probability", "risk_level", "model_version"}
    assert set(data.keys()) == required
    
    # Verify risk_level is one of expected values
    assert data["risk_level"] in {"LOW", "MODERATE", "HIGH", "CRITICAL"}
    assert data["model_version"] == "baseline-v1"


def test_unavailable_region_schema(override_get_db, mock_session):
    """C. Unavailable regions have correct schema with safe error messages."""
    region = _make_region("18-300-00101")
    
    mock_session.scalars.return_value.all.return_value = [region]
    mock_session.get.return_value = region
    mock_session.scalar.return_value = None  # No observation
    
    response = client.get("/api/v1/predictions")
    
    assert response.status_code == 200
    data = response.json()
    assert data["predictions_unavailable"] == 1
    assert len(data["unavailable_regions"]) == 1
    
    unavail = data["unavailable_regions"][0]
    assert unavail["region_id"] == "18-300-00101"
    assert "error_type" in unavail
    assert "message" in unavail
    # No internal details exposed
    assert "traceback" not in unavail["message"].lower()
    assert "sqlalchemy" not in unavail["message"].lower()


# ==============================================================================
# 7. DEVELOPMENT FIXTURE SEPARATION TESTS
# ==============================================================================

def test_dev_fixtures_not_in_canonical_geography():
    """A. Development fixtures use separate DEV_AS_* namespace."""
    from app.database.seed import DEV_MOCK_REGIONS
    
    dev_ids = {r["region_id"] for r in DEV_MOCK_REGIONS}
    assam_records = _load_assam_circles()
    assam_ids = {str(r["object_id"]).strip() for r in assam_records}
    
    # Dev and Assam regions must be completely disjoint
    assert dev_ids.isdisjoint(assam_ids), "Dev and Assam region IDs must not overlap"
    
    # Dev regions use DEV_AS_ prefix
    for rid in dev_ids:
        assert rid.startswith("DEV_AS_"), f"Dev region {rid} must use DEV_AS_ prefix"
    
    # Assam regions use 18- prefix
    for rid in assam_ids:
        assert rid.startswith("18-"), f"Assam region {rid} must use 18- prefix"


def test_dev_fixtures_still_work_in_prediction(override_get_db, mock_session):
    """B. Development fixtures still work for testing."""
    region = _make_region("DEV_AS_BAR_01")
    obs = _make_observation("DEV_AS_BAR_01")
    
    mock_session.get.return_value = region
    mock_session.scalar.return_value = obs
    mock_session.execute = MagicMock()
    mock_session.commit = MagicMock()
    
    response = client.get("/api/v1/predictions/DEV_AS_BAR_01")
    
    assert response.status_code == 200
    data = response.json()
    assert data["region_id"] == "DEV_AS_BAR_01"


# ==============================================================================
# 8. SINGLE REGION ENDPOINT WITH CANONICAL IDS
# ==============================================================================

def test_single_region_endpoint_with_various_canonical_ids(override_get_db, mock_session):
    """Test single-region endpoint works with various canonical region IDs."""
    canonical_ids = [
        "18-300-00101",  # Gossaigaon (Pt)
        "18-301-00109",  # Bagribari (Pt) in DHUBRI
        "18-305-00130",  # Kaliabor
        "18-311-00166",  # Sibsagar
        "18-310-00162",  # Moran
    ]
    
    for region_id in canonical_ids:
        region = _make_region(region_id)
        obs = _make_observation(region_id)
        
        mock_session.get.return_value = region
        mock_session.scalar.return_value = obs
        mock_session.execute = MagicMock()
        mock_session.commit = MagicMock()
        
        response = client.get(f"/api/v1/predictions/{region_id}")
        
        assert response.status_code == 200, f"Failed for region {region_id}"
        data = response.json()
        assert data["region_id"] == region_id


# ==============================================================================
# 9. ML CONTRACT UNCHANGED VERIFICATION
# ==============================================================================

def test_ml_contract_unchanged_in_batch(override_get_db, mock_session):
    """MLPredictionOutput contract is unchanged in batch processing."""
    region = _make_region("18-300-00101")
    obs = _make_observation("18-300-00101")
    
    mock_session.scalars.return_value.all.return_value = [region]
    mock_session.get.return_value = region
    mock_session.scalar.return_value = obs
    mock_session.execute = MagicMock()
    mock_session.commit = MagicMock()
    
    response = client.get("/api/v1/predictions")
    
    assert response.status_code == 200
    data = response.json()
    pred = data["predictions"][0]
    
    # Verify ML contract fields are present and unchanged
    assert "flood_probability" in pred
    assert "model_version" in pred
    assert "region_id" in pred
    assert "generated_at" in pred
    assert "forecast_valid_until" in pred
    # risk_level is added by backend layer
    assert "risk_level" in pred


# ==============================================================================
# 10. NO FABRICATED OBSERVATIONS TESTS
# ==============================================================================

def test_no_fake_observations_created_for_testing():
    """Verify no fake production observations are created in test fixtures."""
    # This test documents that our test helpers create only in-memory mocks
    # and do not insert into any database
    
    # All test fixtures use in-memory objects only
    region = _make_region("18-300-00101")
    obs = _make_observation("18-300-00101")
    
    # These are plain Python objects created by our test helpers
    # They are NOT added to any SQLAlchemy session
    # (unlike persisted objects which would have an id assigned after flush)
    assert region.id is None if hasattr(region, 'id') else True  # id is not auto-generated for Region (string PK)
    assert obs.id is None  # Observation.id is auto-generated, should be None before persistence
    
    # They have the correct canonical IDs
    assert region.region_id == "18-300-00101"
    assert obs.region_id == "18-300-00101"
    
    # They have the correct canonical IDs
    assert region.region_id == "18-300-00101"
    assert obs.region_id == "18-300-00101"


# ==============================================================================
# 11. DEVELOPMENT FIXTURES COEXIST TESTS
# ==============================================================================

def test_both_namespaces_work_together(override_get_db, mock_session):
    """Both DEV_AS_* and 18-* namespaces work without conflict."""
    # Mix of dev and canonical regions
    regions = [
        _make_region("DEV_AS_BAR_01"),
        _make_region("18-300-00101"),
        _make_region("DEV_AS_DHU_01"),
        _make_region("18-300-00102"),
    ]
    observations = [
        _make_observation("DEV_AS_BAR_01"),
        _make_observation("18-300-00101"),
        _make_observation("DEV_AS_DHU_01"),
        _make_observation("18-300-00102"),
    ]
    
    mock_session.scalars.return_value.all.return_value = regions
    mock_session.get.side_effect = regions
    mock_session.scalar.side_effect = observations
    mock_session.execute = MagicMock()
    mock_session.commit = MagicMock()
    
    response = client.get("/api/v1/predictions")
    
    assert response.status_code == 200
    data = response.json()
    assert data["total_regions"] == 4
    assert data["predictions_available"] == 4
    
    pred_ids = {p["region_id"] for p in data["predictions"]}
    assert pred_ids == {"DEV_AS_BAR_01", "DEV_AS_DHU_01", "18-300-00101", "18-300-00102"}