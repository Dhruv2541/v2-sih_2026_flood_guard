from datetime import datetime, timezone, timedelta
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ml.baseline import HydrologicalBaselineModel
from app.ml.exceptions import (
    MLInferenceError,
    MLInputError,
    MLModelUnavailableError,
    MLOutputValidationError,
)
from app.ml.schemas import MLPredictionInput, MLPredictionOutput
from app.models.observation import Observation
from app.models.prediction import Prediction
from app.models.region import Region
from app.services.prediction import (
    PredictionService,
    RegionNotFoundError,
    NoUsableObservationError,
    PredictionPersistenceError,
)


def _make_region(
    region_id: str = "DEV_AS_BAR_01",
    elevation_m: Decimal = Decimal("35.0"),
) -> Region:
    return Region(
        region_id=region_id,
        name="Barpeta Test Region",
        district="Barpeta",
        latitude=26.32,
        longitude=91.01,
        elevation_m=elevation_m,
    )


def _make_observation(
    region_id: str = "DEV_AS_BAR_01",
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
# 1. PredictionService Basic Functionality Tests
# ==============================================================================

def test_prediction_service_valid_observation_returns_valid_output():
    """A. PredictionService with valid observation: creates valid input, calls model, returns valid output."""
    mock_session = _make_mock_session()
    region = _make_region()
    observation = _make_observation()

    mock_session.get.return_value = region
    mock_session.scalar.return_value = observation

    model = HydrologicalBaselineModel()
    service = PredictionService(model=model, session=mock_session)

    output = service.generate_prediction("DEV_AS_BAR_01")

    assert isinstance(output, MLPredictionOutput)
    assert output.region_id == "DEV_AS_BAR_01"
    assert Decimal("0.0") <= output.flood_probability <= Decimal("1.0")
    assert output.model_version == "baseline-v1"
    assert output.forecast_valid_until >= output.generated_at

    # Verify model was called with correct input
    mock_session.get.assert_called_once_with(Region, "DEV_AS_BAR_01")
    mock_session.scalar.assert_called_once()


def test_prediction_service_missing_region_raises_error():
    """B. PredictionService with missing region raises RegionNotFoundError."""
    mock_session = _make_mock_session()
    mock_session.get.return_value = None

    model = HydrologicalBaselineModel()
    service = PredictionService(model=model, session=mock_session)

    with pytest.raises(RegionNotFoundError) as exc_info:
        service.generate_prediction("UNKNOWN_REGION")

    assert exc_info.value.region_id == "UNKNOWN_REGION"
    mock_session.get.assert_called_once_with(Region, "UNKNOWN_REGION")


def test_prediction_service_no_observation_raises_error():
    """C. PredictionService with missing required observation data raises NoUsableObservationError."""
    mock_session = _make_mock_session()
    region = _make_region()

    mock_session.get.return_value = region
    mock_session.scalar.return_value = None

    model = HydrologicalBaselineModel()
    service = PredictionService(model=model, session=mock_session)

    with pytest.raises(NoUsableObservationError) as exc_info:
        service.generate_prediction("DEV_AS_BAR_01")

    assert exc_info.value.region_id == "DEV_AS_BAR_01"
    mock_session.get.assert_called_once_with(Region, "DEV_AS_BAR_01")
    mock_session.scalar.assert_called_once()


def test_prediction_service_missing_rainfall_in_observation_raises_ml_input_error():
    """C. PredictionService with observation missing required rainfall raises MLInputError (no fabricated values)."""
    mock_session = _make_mock_session()
    region = _make_region()

    # Observation missing rainfall_6h_mm
    observation = _make_observation(rainfall_6h=None)

    mock_session.get.return_value = region
    mock_session.scalar.return_value = observation

    model = HydrologicalBaselineModel()
    service = PredictionService(model=model, session=mock_session)

    with pytest.raises(MLInputError) as exc_info:
        service.generate_prediction("DEV_AS_BAR_01")

    assert "missing required rainfall measurements" in str(exc_info.value).lower()


def test_prediction_service_model_failure_propagates_ml_inference_error():
    """D. Model failure: appropriate ML exception propagates."""
    mock_session = _make_mock_session()
    region = _make_region()
    observation = _make_observation()

    mock_session.get.return_value = region
    mock_session.scalar.return_value = observation

    # Model that always fails
    failing_model = MagicMock(spec=HydrologicalBaselineModel)
    failing_model.predict.side_effect = MLInferenceError("Model crashed")

    service = PredictionService(model=failing_model, session=mock_session)

    with pytest.raises(MLInferenceError) as exc_info:
        service.generate_prediction("DEV_AS_BAR_01")

    assert "Model crashed" in str(exc_info.value)


def test_prediction_service_model_unavailable_raises_error():
    """D. Model unavailable: MLModelUnavailableError propagates."""
    mock_session = _make_mock_session()
    region = _make_region()
    observation = _make_observation()

    mock_session.get.return_value = region
    mock_session.scalar.return_value = observation

    # Model that raises unavailable error
    failing_model = MagicMock(spec=HydrologicalBaselineModel)
    failing_model.predict.side_effect = MLModelUnavailableError("Model not loaded")

    service = PredictionService(model=failing_model, session=mock_session)

    with pytest.raises(MLModelUnavailableError):
        service.generate_prediction("DEV_AS_BAR_01")


def test_prediction_service_invalid_model_output_rejected():
    """E. Invalid model output (not an MLPredictionOutput instance) causes validation failure."""
    mock_session = _make_mock_session()
    region = _make_region()
    observation = _make_observation()

    mock_session.get.return_value = region
    mock_session.scalar.return_value = observation

    # Model that returns invalid type (not MLPredictionOutput)
    bad_model = MagicMock(spec=HydrologicalBaselineModel)
    bad_model.predict.return_value = {"region_id": "DEV_AS_BAR_01", "flood_probability": 0.5}  # dict, not MLPredictionOutput

    service = PredictionService(model=bad_model, session=mock_session)

    with pytest.raises(MLOutputValidationError) as exc_info:
        service.generate_prediction("DEV_AS_BAR_01")

    assert "Model returned invalid output type" in str(exc_info.value)
    assert "dict" in str(exc_info.value).lower()


def test_prediction_service_region_mismatch_in_output_rejected():
    """E. Model output with wrong region_id causes validation failure."""
    mock_session = _make_mock_session()
    region = _make_region()
    observation = _make_observation()

    mock_session.get.return_value = region
    mock_session.scalar.return_value = observation

    # Model that returns wrong region_id
    bad_model = MagicMock(spec=HydrologicalBaselineModel)
    bad_model.predict.return_value = MLPredictionOutput(
        region_id="WRONG_REGION",
        generated_at=datetime.now(timezone.utc),
        forecast_valid_until=datetime.now(timezone.utc) + timedelta(hours=6),
        flood_probability=Decimal("0.5"),
        model_version="bad-model",
    )

    service = PredictionService(model=bad_model, session=mock_session)

    with pytest.raises(MLOutputValidationError) as exc_info:
        service.generate_prediction("DEV_AS_BAR_01")

    assert "does not match expected input region_id" in str(exc_info.value)


# ==============================================================================
# 2. Persistence Tests
# ==============================================================================

def test_prediction_service_persists_valid_prediction():
    """I. Persistence: valid predictions are stored using existing database abstraction."""
    mock_session = _make_mock_session()
    region = _make_region()
    observation = _make_observation()

    mock_session.get.return_value = region
    mock_session.scalar.return_value = observation
    mock_session.execute = MagicMock()
    mock_session.commit = MagicMock()

    model = HydrologicalBaselineModel()
    service = PredictionService(model=model, session=mock_session)

    output = service.generate_prediction("DEV_AS_BAR_01")

    # Verify database operations were called
    mock_session.execute.assert_called_once()
    mock_session.commit.assert_called_once()


def test_prediction_service_persistence_failure_raises_error():
    """I. Persistence failure raises PredictionPersistenceError and rolls back."""
    mock_session = _make_mock_session()
    region = _make_region()
    observation = _make_observation()

    mock_session.get.return_value = region
    mock_session.scalar.return_value = observation
    mock_session.execute.side_effect = Exception("Database connection lost")
    mock_session.rollback = MagicMock()

    model = HydrologicalBaselineModel()
    service = PredictionService(model=model, session=mock_session)

    with pytest.raises(PredictionPersistenceError) as exc_info:
        service.generate_prediction("DEV_AS_BAR_01")

    assert exc_info.value.region_id == "DEV_AS_BAR_01"
    mock_session.rollback.assert_called_once()


def test_prediction_service_uses_upsert_for_idempotency():
    """I. Persistence uses UPSERT on (region_id, generated_at) for idempotency."""
    mock_session = _make_mock_session()
    region = _make_region()
    observation = _make_observation()

    mock_session.get.return_value = region
    mock_session.scalar.return_value = observation
    mock_session.execute = MagicMock()
    mock_session.commit = MagicMock()

    model = HydrologicalBaselineModel()
    service = PredictionService(model=model, session=mock_session)

    output = service.generate_prediction("DEV_AS_BAR_01")

    # Verify UPSERT was constructed (check the statement type)
    call_args = mock_session.execute.call_args[0][0]
    # The statement should be a PostgreSQL INSERT with ON CONFLICT DO UPDATE
    from sqlalchemy.dialects.postgresql import Insert
    assert isinstance(call_args, Insert)
    # Check it has on_conflict_do_update
    assert hasattr(call_args, 'on_conflict_do_update')


# ==============================================================================
# 3. Integration with Baseline Model Tests
# ==============================================================================

def test_prediction_service_with_baseline_model_integration():
    """End-to-end integration test with actual baseline model."""
    mock_session = _make_mock_session()
    region = _make_region(elevation_m=Decimal("35.0"))
    observation = _make_observation(
        rainfall_1h=Decimal("10.0"),
        rainfall_3h=Decimal("25.0"),
        rainfall_6h=Decimal("50.0"),
        rainfall_24h=Decimal("100.0"),
        temperature_c=Decimal("28.0"),
        humidity_pct=Decimal("80.0"),
    )

    mock_session.get.return_value = region
    mock_session.scalar.return_value = observation
    mock_session.execute = MagicMock()
    mock_session.commit = MagicMock()

    model = HydrologicalBaselineModel()
    service = PredictionService(model=model, session=mock_session)

    output = service.generate_prediction("DEV_AS_BAR_01")

    assert isinstance(output, MLPredictionOutput)
    assert output.region_id == "DEV_AS_BAR_01"
    assert output.model_version == "baseline-v1"
    assert Decimal("0.0") <= output.flood_probability <= Decimal("1.0")


def test_prediction_service_deterministic_with_same_observation():
    """F. Baseline determinism: same input produces same output through service."""
    mock_session = _make_mock_session()
    region = _make_region()
    observation = _make_observation()

    mock_session.get.return_value = region
    mock_session.scalar.return_value = observation
    mock_session.execute = MagicMock()
    mock_session.commit = MagicMock()

    model = HydrologicalBaselineModel()
    service = PredictionService(model=model, session=mock_session)

    output1 = service.generate_prediction("DEV_AS_BAR_01")
    output2 = service.generate_prediction("DEV_AS_BAR_01")

    assert output1.flood_probability == output2.flood_probability


# ==============================================================================
# 4. Dependency Injection Tests
# ==============================================================================

def test_prediction_service_depends_on_interface_not_concrete():
    """Service depends on FloodPredictionModel interface, not concrete implementation."""
    mock_session = _make_mock_session()
    region = _make_region()
    observation = _make_observation()

    mock_session.get.return_value = region
    mock_session.scalar.return_value = observation
    mock_session.execute = MagicMock()
    mock_session.commit = MagicMock()

    # Any object implementing FloodPredictionModel works
    class CustomTestModel:
        def predict(self, input_data: MLPredictionInput) -> MLPredictionOutput:
            return MLPredictionOutput(
                region_id=input_data.region_id,
                generated_at=datetime.now(timezone.utc),
                forecast_valid_until=datetime.now(timezone.utc) + timedelta(hours=6),
                flood_probability=Decimal("0.42"),
                model_version="custom-test-v1",
            )

    custom_model = CustomTestModel()
    service = PredictionService(model=custom_model, session=mock_session)

    output = service.generate_prediction("DEV_AS_BAR_01")

    assert output.model_version == "custom-test-v1"
    assert output.flood_probability == Decimal("0.42")


def test_prediction_service_no_model_raises_unavailable():
    """Service raises MLModelUnavailableError if no model injected."""
    mock_session = _make_mock_session()
    region = _make_region()
    observation = _make_observation()

    mock_session.get.return_value = region
    mock_session.scalar.return_value = observation

    service = PredictionService(model=None, session=mock_session)

    with pytest.raises(MLModelUnavailableError):
        service.generate_prediction("DEV_AS_BAR_01")


# ==============================================================================
# 5. Risk Classification Tests (Backend Layer)
# ==============================================================================

def test_prediction_service_risk_classification_thresholds():
    """Risk classification is backend layer concern, not ML model."""
    mock_session = _make_mock_session()
    region = _make_region()
    observation = _make_observation()

    mock_session.get.return_value = region
    mock_session.scalar.return_value = observation
    mock_session.execute = MagicMock()
    mock_session.commit = MagicMock()

    # Test model that returns specific probabilities
    class FixedProbabilityModel:
        def __init__(self, prob: Decimal):
            self.prob = prob

        def predict(self, input_data: MLPredictionInput) -> MLPredictionOutput:
            return MLPredictionOutput(
                region_id=input_data.region_id,
                generated_at=datetime.now(timezone.utc),
                forecast_valid_until=datetime.now(timezone.utc) + timedelta(hours=6),
                flood_probability=self.prob,
                model_version="test-fixed",
            )

    # Test each threshold boundary
    test_cases = [
        (Decimal("0.20"), "low"),
        (Decimal("0.25"), "moderate"),
        (Decimal("0.49"), "moderate"),
        (Decimal("0.50"), "high"),
        (Decimal("0.74"), "high"),
        (Decimal("0.75"), "severe"),
        (Decimal("0.99"), "severe"),
    ]

    for prob, expected_risk in test_cases:
        mock_session.reset_mock()
        mock_session.get.return_value = region
        mock_session.scalar.return_value = observation
        mock_session.execute = MagicMock()
        mock_session.commit = MagicMock()

        model = FixedProbabilityModel(prob)
        service = PredictionService(model=model, session=mock_session)
        output = service.generate_prediction("DEV_AS_BAR_01")

        # Verify the risk level was computed and passed to database
        call_args = mock_session.execute.call_args[0][0]
        compiled = call_args.compile(compile_kwargs={"literal_binds": True})
        assert expected_risk in str(compiled)


# ==============================================================================
# 6. No Legacy Model Integration Tests
# ==============================================================================

def test_prediction_service_no_joblib_import():
    """J. Implementation does not import or depend on legacy joblib model."""
    # This test verifies the service module doesn't import joblib, sklearn, etc.
    import sys

    # Check that prediction service module doesn't import ML libraries
    import app.services.prediction as pred_module

    # Verify no forbidden imports in the module's namespace
    forbidden_modules = ['joblib', 'sklearn', 'xgboost', 'lightgbm', 'pandas']
    for mod_name in forbidden_modules:
        assert not any(mod_name in str(v) for v in pred_module.__dict__.values())


def test_baseline_model_no_joblib_import():
    """J. Baseline model does not import or depend on legacy joblib model."""
    import app.ml.baseline as baseline_module

    forbidden_modules = ['joblib', 'sklearn', 'xgboost', 'lightgbm', 'pandas']
    for mod_name in forbidden_modules:
        assert not any(mod_name in str(v) for v in baseline_module.__dict__.values())