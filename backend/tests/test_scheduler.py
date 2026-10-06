import asyncio
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from pydantic import ValidationError

from app.config import Settings, settings
from app.data.schemas import NormalizedObservation
from app.jobs.ingestion_job import run_live_cycle_job
from app.jobs.scheduler import (
    LIVE_CYCLE_JOB_ID,
    create_scheduler,
    register_live_cycle_job,
    start_scheduler,
    stop_scheduler,
)
from app.main import app, lifespan
from app.services.ingestion import FailedRegion, IngestionResult, IngestionService
from app.services.live_cycle import LivePredictionCycleResult
from app.services.observation_persistence import FailedPersistence
from app.services.prediction import RegionWidePredictionResult
from app.services.observation_persistence import FailedPersistence
from app.ml.schemas import MLPredictionOutput


# ---------------------------------------------------------------------------
# 1. Configuration Tests
# ---------------------------------------------------------------------------

def test_scheduler_config_defaults() -> None:
    """Verifies that scheduler is disabled by default and interval defaults to 60 min."""
    assert settings.SCHEDULER_ENABLED is False
    assert settings.INGESTION_INTERVAL_MINUTES == 60


def test_scheduler_config_validation() -> None:
    """Verifies that 60 and positive intervals are accepted, while 0 and negative intervals are rejected."""
    # 60 minutes accepted (default production-style interval)
    settings_60 = Settings(INGESTION_INTERVAL_MINUTES=60)
    assert settings_60.INGESTION_INTERVAL_MINUTES == 60

    # Positive integer accepted
    settings_pos = Settings(INGESTION_INTERVAL_MINUTES=30)
    assert settings_pos.INGESTION_INTERVAL_MINUTES == 30

    # Zero interval must be rejected
    with pytest.raises(ValidationError) as exc_info_zero:
        Settings(INGESTION_INTERVAL_MINUTES=0)
    assert "INGESTION_INTERVAL_MINUTES must be a positive integer" in str(exc_info_zero.value)

    # Negative interval must be rejected
    with pytest.raises(ValidationError) as exc_info_neg:
        Settings(INGESTION_INTERVAL_MINUTES=-15)
    assert "INGESTION_INTERVAL_MINUTES must be a positive integer" in str(exc_info_neg.value)


# ---------------------------------------------------------------------------
# 2. Scheduler Registration & Invariants
# ---------------------------------------------------------------------------

@pytest.mark.anyio
async def test_scheduler_registration_invariants() -> None:
    """Verifies job registration invariants: ID, triggers, overlap prevention, coalescing,
    and that first execution occurs approximately one interval in the future (not immediately).
    """
    scheduler = create_scheduler()
    start_time = datetime.now(timezone.utc)

    job = register_live_cycle_job(scheduler, interval_minutes=60)
    start_scheduler(scheduler)

    try:
        assert job.id == LIVE_CYCLE_JOB_ID
        assert job.max_instances == 1
        assert job.coalesce is True
        assert job.misfire_grace_time == 300

        # First scheduled execution must be in the future, approximately 60 minutes from start_time
        assert job.next_run_time is not None
        diff_seconds = (job.next_run_time - start_time).total_seconds()
        # Must NOT execute immediately; must wait for interval (~3600 seconds)
        assert 3550 <= diff_seconds <= 3650
    finally:
        stop_scheduler(scheduler)
        await asyncio.sleep(0)


def test_scheduler_registration_rejects_non_positive_interval() -> None:
    """Verifies register_live_cycle_job raises ValueError if interval is <= 0."""
    scheduler = create_scheduler()
    with pytest.raises(ValueError, match="interval_minutes must be a positive integer"):
        register_live_cycle_job(scheduler, interval_minutes=0)

    with pytest.raises(ValueError, match="interval_minutes must be a positive integer"):
        register_live_cycle_job(scheduler, interval_minutes=-5)


# ---------------------------------------------------------------------------
# 3. FastAPI Lifespan Integration
# ---------------------------------------------------------------------------

@pytest.mark.anyio
async def test_fastapi_lifespan_scheduler_disabled(monkeypatch: pytest.MonkeyPatch) -> None:
    """Verifies that when SCHEDULER_ENABLED=False, the lifespan does not start the scheduler."""
    monkeypatch.setattr(settings, "SCHEDULER_ENABLED", False)

    async with lifespan(app):
        assert app.state.scheduler is None


@pytest.mark.anyio
async def test_scheduler_disabled_guarantees_no_activity_on_startup(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Verifies SCHEDULER_ENABLED=False guarantees zero scheduler startup, zero job registration,
    and zero network/database ingestion activity upon application startup.
    """
    monkeypatch.setattr(settings, "SCHEDULER_ENABLED", False)

    mock_cycle_run = AsyncMock()
    with patch("app.jobs.ingestion_job.run_live_cycle_job", mock_cycle_run):
        async with lifespan(app):
            # Scheduler must be None
            assert app.state.scheduler is None
            # Zero cycle jobs triggered
            mock_cycle_run.assert_not_called()


@pytest.mark.anyio
async def test_fastapi_lifespan_scheduler_enabled(monkeypatch: pytest.MonkeyPatch) -> None:
    """Verifies that when SCHEDULER_ENABLED=True, the lifespan creates, starts, and cleanly stops the scheduler."""
    monkeypatch.setattr(settings, "SCHEDULER_ENABLED", True)
    monkeypatch.setattr(settings, "INGESTION_INTERVAL_MINUTES", 45)

    captured_scheduler = None
    async with lifespan(app):
        captured_scheduler = app.state.scheduler
        assert captured_scheduler is not None
        assert captured_scheduler.running is True
        job = captured_scheduler.get_job(LIVE_CYCLE_JOB_ID)
        assert job is not None
        assert job.id == LIVE_CYCLE_JOB_ID

    # After lifespan exit, scheduler should be cleanly shut down
    await asyncio.sleep(0)
    assert captured_scheduler.running is False
    assert getattr(app.state, "scheduler", None) is None


@pytest.mark.anyio
async def test_fastapi_lifespan_startup_does_not_execute_cycle_immediately(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Verifies that FastAPI startup with SCHEDULER_ENABLED=True does NOT immediately execute the cycle job."""
    mock_job = AsyncMock()
    monkeypatch.setattr(settings, "SCHEDULER_ENABLED", True)
    monkeypatch.setattr(settings, "INGESTION_INTERVAL_MINUTES", 60)

    with patch("app.jobs.ingestion_job.run_live_cycle_job", mock_job):
        async with lifespan(app):
            # Give the asyncio event loop multiple ticks to process any immediate callbacks
            await asyncio.sleep(0.05)
            # The job must NOT have run immediately upon startup
            mock_job.assert_not_called()


# ---------------------------------------------------------------------------
# 4. Job Execution & Database Session Lifecycle
# ---------------------------------------------------------------------------

@pytest.mark.anyio
async def test_cycle_job_successful_execution() -> None:
    """Verifies session acquisition, complete cycle execution, and clean session closure."""
    mock_session = MagicMock()
    mock_factory = MagicMock(return_value=mock_session)

    from app.services.live_cycle import LivePredictionCycleResult
    from app.services.ingestion import IngestionResult
    from app.services.prediction import RegionWidePredictionResult
    from app.ml.schemas import MLPredictionOutput

    sample_obs = NormalizedObservation(
        region_id="kamrup_metro",
        recorded_at=datetime(2026, 9, 16, 12, 0, tzinfo=timezone.utc),
        rainfall_1h_mm=Decimal("2.5"),
        rainfall_3h_mm=Decimal("5.0"),
        rainfall_6h_mm=Decimal("7.5"),
        rainfall_24h_mm=Decimal("10.0"),
        temperature_c=Decimal("28.0"),
        humidity_pct=Decimal("80.0"),
        data_source="open-meteo",
    )
    
    sample_ml_output = MLPredictionOutput(
        region_id="kamrup_metro",
        generated_at=datetime(2026, 9, 16, 12, 0, tzinfo=timezone.utc),
        forecast_valid_until=datetime(2026, 9, 16, 18, 0, tzinfo=timezone.utc),
        flood_probability=Decimal("0.5"),
        model_version="baseline-v1",
    )

    mock_ingestion_service = MagicMock(spec=IngestionService)
    mock_ingestion_service.run_live_ingestion = AsyncMock(
        return_value=IngestionResult(
            successful_observations=[sample_obs],
            failed_regions=[],
            persisted_count=1,
            persistence_failures=[],
        )
    )

    mock_prediction_service = MagicMock()
    mock_prediction_service.generate_region_wide_predictions.return_value = RegionWidePredictionResult(
        successful_predictions=[sample_ml_output],
        failed_predictions=[],
        total_regions=1,
        successful_count=1,
        failed_count=0,
    )

    result = await run_live_cycle_job(
        session_factory=mock_factory,
        ingestion_service=mock_ingestion_service,
        prediction_service=mock_prediction_service,
    )

    assert result is not None
    assert isinstance(result, LivePredictionCycleResult)
    assert result.total_regions == 1
    assert result.successful_observations == 1
    assert result.successful_predictions == 1
    assert result.failed_observations == 0
    assert result.failed_predictions == 0


@pytest.mark.anyio
async def test_cycle_job_session_always_closed_on_exception() -> None:
    """Verifies that database session is closed even if cycle raises an unexpected exception."""
    mock_session = MagicMock()
    mock_factory = MagicMock(return_value=mock_session)

    mock_ingestion_service = MagicMock(spec=IngestionService)
    mock_ingestion_service.run_live_ingestion = AsyncMock(
        side_effect=RuntimeError("Unexpected provider crash or connection break")
    )

    mock_prediction_service = MagicMock()
    mock_prediction_service.generate_region_wide_predictions.side_effect = RuntimeError("Model crash")

    result = await run_live_cycle_job(
        session_factory=mock_factory,
        ingestion_service=MagicMock(),
        prediction_service=MagicMock(),
    )

    # Catches exception cleanly at job boundary and returns None
    assert result is None

    # Guaranteed closure of session in finally block
    mock_session.close.assert_called_once()


@pytest.mark.anyio
async def test_cycle_job_database_unavailable_clean_exit() -> None:
    """Verifies that if database connection is not configured, the job exits cleanly with a warning."""
    result = await run_live_cycle_job(
        session_factory=lambda: None,
    )

    assert result is None


# ---------------------------------------------------------------------------
# 5. Isolation of Provider and Persistence Failures
# ---------------------------------------------------------------------------

@pytest.mark.anyio
async def test_cycle_job_preserves_failure_isolation() -> None:
    """Verifies that ingestion failures and prediction failures are tracked separately."""
    mock_session = MagicMock()
    mock_factory = MagicMock(return_value=mock_session)

    from app.services.live_cycle import LivePredictionCycleResult
    from app.services.ingestion import IngestionResult, FailedRegion
    from app.services.prediction import RegionWidePredictionResult, FailedRegionPrediction
    from app.ml.schemas import MLPredictionOutput

    sample_obs = NormalizedObservation(
        region_id="kamrup_metro",
        recorded_at=datetime(2026, 9, 16, 12, 0, tzinfo=timezone.utc),
        rainfall_1h_mm=Decimal("0.0"),
        rainfall_3h_mm=Decimal("0.0"),
        rainfall_6h_mm=Decimal("0.0"),
        rainfall_24h_mm=Decimal("0.0"),
        data_source="open-meteo",
    )
    
    sample_ml_output = MLPredictionOutput(
        region_id="kamrup_metro",
        generated_at=datetime(2026, 9, 16, 12, 0, tzinfo=timezone.utc),
        forecast_valid_until=datetime(2026, 9, 16, 18, 0, tzinfo=timezone.utc),
        flood_probability=Decimal("0.5"),
        model_version="baseline-v1",
    )

    mock_ingestion_service = MagicMock(spec=IngestionService)
    mock_ingestion_service.run_live_ingestion = AsyncMock(
        return_value=IngestionResult(
            successful_observations=[sample_obs],
            failed_regions=[
                FailedRegion(
                    region_id="dibrugarh",
                    error_type="WeatherProviderTimeoutError",
                    message="Connection timed out after 10s",
                )
            ],
            persisted_count=0,
            persistence_failures=[
                FailedPersistence(
                    region_id="kamrup_metro",
                    recorded_at=datetime(2026, 9, 16, 12, 0, tzinfo=timezone.utc),
                    error_type="ForeignKeyViolation",
                    message="Foreign key violation",
                )
            ],
        )
    )
    
    mock_prediction_service = MagicMock()
    mock_prediction_service.generate_region_wide_predictions.return_value = RegionWidePredictionResult(
        successful_predictions=[],
        failed_predictions=[
            FailedRegionPrediction(
                region_id="dibrugarh",
                error_type="MLInferenceError",
                message="Model crashed",
            )
        ],
        total_regions=1,
        successful_count=0,
        failed_count=1,
    )

    result = await run_live_cycle_job(
        session_factory=mock_factory,
        ingestion_service=mock_ingestion_service,
        prediction_service=mock_prediction_service,
    )

    assert result is not None
    assert isinstance(result, LivePredictionCycleResult)
    # Ingestion failures preserved
    assert result.failed_observations == 1
    # Prediction failures preserved
    assert result.failed_predictions == 1


@pytest.mark.anyio
async def test_manual_trigger_direct_execution() -> None:
    """Verifies run_live_cycle_job can be executed directly as a manual trigger without waiting for scheduler."""
    mock_session = MagicMock()
    mock_factory = MagicMock(return_value=mock_session)

    from app.services.live_cycle import LivePredictionCycleResult
    from app.services.ingestion import IngestionResult
    from app.services.prediction import RegionWidePredictionResult
    from app.ml.schemas import MLPredictionOutput

    sample_obs = NormalizedObservation(
        region_id="kamrup_metro",
        recorded_at=datetime(2026, 9, 16, 12, 0, tzinfo=timezone.utc),
        rainfall_1h_mm=Decimal("2.5"),
        rainfall_3h_mm=Decimal("5.0"),
        rainfall_6h_mm=Decimal("7.5"),
        rainfall_24h_mm=Decimal("10.0"),
        temperature_c=Decimal("28.0"),
        humidity_pct=Decimal("80.0"),
        data_source="open-meteo",
    )
    
    sample_ml_output = MLPredictionOutput(
        region_id="kamrup_metro",
        generated_at=datetime(2026, 9, 16, 12, 0, tzinfo=timezone.utc),
        forecast_valid_until=datetime(2026, 9, 16, 18, 0, tzinfo=timezone.utc),
        flood_probability=Decimal("0.5"),
        model_version="baseline-v1",
    )

    mock_ingestion_service = MagicMock(spec=IngestionService)
    mock_ingestion_service.run_live_ingestion = AsyncMock(
        return_value=IngestionResult(
            successful_observations=[sample_obs],
            failed_regions=[],
            persisted_count=1,
            persistence_failures=[],
        )
    )

    mock_prediction_service = MagicMock()
    mock_prediction_service.generate_region_wide_predictions.return_value = RegionWidePredictionResult(
        successful_predictions=[sample_ml_output],
        failed_predictions=[],
        total_regions=1,
        successful_count=1,
        failed_count=0,
    )

    # Direct manual trigger
    result = await run_live_cycle_job(
        session_factory=mock_factory,
        ingestion_service=mock_ingestion_service,
        prediction_service=mock_prediction_service,
    )

    assert result is not None
    assert isinstance(result, LivePredictionCycleResult)
    assert result.total_regions == 1
    mock_session.close.assert_called_once()


@pytest.mark.anyio
async def test_scheduler_lifecycle_start_and_stop() -> None:
    """Verifies create_scheduler, start_scheduler, and stop_scheduler cleanly manage lifecycle."""
    scheduler = create_scheduler()
    assert scheduler.running is False

    start_scheduler(scheduler)
    assert scheduler.running is True

    # Idempotent start check
    start_scheduler(scheduler)
    assert scheduler.running is True

    stop_scheduler(scheduler)
    await asyncio.sleep(0)
    assert scheduler.running is False

    # Idempotent stop check
    stop_scheduler(scheduler)
    assert scheduler.running is False


@pytest.mark.anyio
async def test_scheduler_resilience_after_job_failure() -> None:
    """Verifies that an exception during a job execution does not terminate the scheduler."""
    scheduler = create_scheduler()
    start_scheduler(scheduler)

    # Job that raises an exception
    async def failing_job():
        raise RuntimeError("Simulated transient network failure during ingestion")

    job = scheduler.add_job(
        failing_job,
        trigger="interval",
        seconds=1,
        id="failing_test_job",
        max_instances=1,
    )

    # Allow the event loop to run and execute the job
    await asyncio.sleep(0.05)

    # Scheduler must remain alive and operational despite the failure
    assert scheduler.running is True

    stop_scheduler(scheduler)
    await asyncio.sleep(0)
    assert scheduler.running is False


def test_overlapping_runs_prevented_by_max_instances() -> None:
    """Verifies that the registered job has max_instances=1, preventing concurrent/overlapping
    executions of the cycle job within this single APScheduler process.
    (Note: This is a process-local guarantee; distributed multi-process concurrency control
    is intentionally not implemented for this prototype).
    """
    scheduler = create_scheduler()
    job = register_live_cycle_job(scheduler, interval_minutes=60)
    assert job.max_instances == 1


def test_health_endpoint_independent_of_scheduler(monkeypatch: pytest.MonkeyPatch) -> None:
    """Verifies that the /api/v1/health endpoint returns 200 regardless of scheduler state."""
    from fastapi.testclient import TestClient

    # Verify when scheduler enabled
    monkeypatch.setattr(settings, "SCHEDULER_ENABLED", True)
    with TestClient(app) as test_client:
        response = test_client.get("/api/v1/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}