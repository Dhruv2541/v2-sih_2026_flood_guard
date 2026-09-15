from datetime import datetime, timezone
from decimal import Decimal
from typing import Sequence
import pytest
from sqlalchemy import select, text
from sqlalchemy.orm import Session
from unittest.mock import AsyncMock, MagicMock

from app.config import settings
from app.data.exceptions import ProviderTimeoutError
from app.data.providers.base import WeatherProvider
from app.data.schemas import NormalizedObservation
from app.models.base import Base
from app.models.observation import Observation
from app.models.region import Region
from app.services.ingestion import IngestionService
from app.services.observation_persistence import (
    FailedPersistence,
    ObservationPersistenceError,
    ObservationPersistenceService,
    PersistenceResult,
    UnknownRegionError,
    map_to_model,
)


def _make_sample_normalized_obs(
    region_id: str = "DEV_AS_BAR_01",
    recorded_at: datetime = None,
    rainfall_1h: Decimal = Decimal("5.25"),
    water_level: Decimal = None,
    temp: Decimal = Decimal("28.4"),
    humidity: Decimal = Decimal("85.0"),
) -> NormalizedObservation:
    return NormalizedObservation(
        region_id=region_id,
        recorded_at=recorded_at or datetime(2026, 9, 15, 12, 0, tzinfo=timezone.utc),
        rainfall_1h_mm=rainfall_1h,
        rainfall_3h_mm=Decimal("12.50"),
        rainfall_6h_mm=Decimal("25.00"),
        rainfall_24h_mm=Decimal("60.00"),
        water_level_m=water_level,
        temperature_c=temp,
        humidity_pct=humidity,
        data_source="open-meteo",
    )


# ==============================================================================
# 1. UNIT TESTS (Deterministic In-Memory Tests)
# ==============================================================================


def test_map_to_model_complete():
    """Validates complete NormalizedObservation maps accurately to Observation."""
    now = datetime(2026, 9, 15, 12, 0, tzinfo=timezone.utc)
    norm = _make_sample_normalized_obs(
        region_id="DEV_AS_BAR_01",
        recorded_at=now,
        rainfall_1h=Decimal("4.50"),
        water_level=Decimal("35.20"),
        temp=Decimal("29.1"),
        humidity=Decimal("88.0"),
    )
    model_obs = map_to_model(norm)

    assert isinstance(model_obs, Observation)
    assert model_obs.region_id == "DEV_AS_BAR_01"
    assert model_obs.recorded_at == now
    assert model_obs.rainfall_1h_mm == Decimal("4.50")
    assert model_obs.rainfall_3h_mm == Decimal("12.50")
    assert model_obs.rainfall_6h_mm == Decimal("25.00")
    assert model_obs.rainfall_24h_mm == Decimal("60.00")
    assert model_obs.water_level_m == Decimal("35.20")
    assert model_obs.temperature_c == Decimal("29.1")
    assert model_obs.humidity_pct == Decimal("88.0")
    assert model_obs.data_source == "open-meteo"


def test_map_to_model_optional_none_preserved():
    """Validates that None optional fields remain None (SQL NULL), especially water_level_m."""
    norm = _make_sample_normalized_obs(
        water_level=None,
        temp=None,
        humidity=None,
    )
    model_obs = map_to_model(norm)

    assert model_obs.water_level_m is None
    assert model_obs.temperature_c is None
    assert model_obs.humidity_pct is None


def test_map_to_model_rainfall_preserved_exactly():
    """Validates exact Decimal precision for rainfall values."""
    norm = _make_sample_normalized_obs(rainfall_1h=Decimal("123.45"))
    model_obs = map_to_model(norm)

    assert model_obs.rainfall_1h_mm == Decimal("123.45")


def test_region_validation_rejects_unknown_region():
    """Validates persist_observation raises UnknownRegionError when region_id is not found."""
    mock_session = MagicMock(spec=Session)
    mock_session.get.return_value = None  # Region does not exist

    service = ObservationPersistenceService()
    norm = _make_sample_normalized_obs(region_id="UNKNOWN_REG_01")

    with pytest.raises(UnknownRegionError) as exc_info:
        service.persist_observation(session=mock_session, observation=norm)
    assert "UNKNOWN_REG_01" in str(exc_info.value)


def test_empty_observation_sequence_behaves_correctly():
    """Validates persist_batch with empty sequence returns 0 persisted and 0 failures."""
    mock_session = MagicMock(spec=Session)
    service = ObservationPersistenceService()

    result = service.persist_batch(session=mock_session, observations=[])
    assert isinstance(result, PersistenceResult)
    assert result.persisted_count == 0
    assert result.failed_observations == []
    mock_session.commit.assert_not_called()


# ==============================================================================
# 2. INGESTION INTEGRATION UNIT TESTS (Requirement 14)
# ==============================================================================


@pytest.mark.anyio
async def test_ingestion_provider_failure_separation():
    """Verifies that provider failure maps to failed_regions, and persistence_failures is empty."""
    mock_provider = MagicMock(spec=WeatherProvider)
    mock_provider.fetch_current_observation = AsyncMock(
        side_effect=ProviderTimeoutError("Connection timed out", provider="open-meteo")
    )
    mock_session = MagicMock(spec=Session)

    service = IngestionService(provider=mock_provider)
    region = Region(region_id="DEV_AS_BAR_01", name="R", district="D", latitude=26.3, longitude=91.0)

    result = await service.run_live_ingestion(
        regions=[region],
        session=mock_session,
        persist=True,
    )

    assert len(result.failed_regions) == 1
    assert result.failed_regions[0].region_id == "DEV_AS_BAR_01"
    assert result.failed_regions[0].error_type == "ProviderTimeoutError"
    assert len(result.successful_observations) == 0
    assert result.persisted_count == 0
    assert len(result.persistence_failures) == 0


@pytest.mark.anyio
async def test_ingestion_persistence_failure_separation():
    """Verifies that persistence failure maps to persistence_failures, and failed_regions is empty."""
    mock_obs = _make_sample_normalized_obs("DEV_AS_UNKNOWN")
    mock_provider = MagicMock(spec=WeatherProvider)
    mock_provider.fetch_current_observation = AsyncMock(return_value=mock_obs)

    # Session indicates region does not exist
    mock_session = MagicMock(spec=Session)
    mock_session.get.return_value = None

    service = IngestionService(provider=mock_provider)
    region = Region(region_id="DEV_AS_UNKNOWN", name="R", district="D", latitude=26.3, longitude=91.0)

    result = await service.run_live_ingestion(
        regions=[region],
        session=mock_session,
        persist=True,
    )

    # Provider succeeded
    assert len(result.successful_observations) == 1
    assert len(result.failed_regions) == 0
    # Persistence failed
    assert result.persisted_count == 0
    assert len(result.persistence_failures) == 1
    assert result.persistence_failures[0].region_id == "DEV_AS_UNKNOWN"
    assert result.persistence_failures[0].error_type == "UnknownRegionError"


@pytest.mark.anyio
async def test_ingestion_successful_persistence_flow():
    """Verifies that successful retrieval and persistence increments persisted_count."""
    mock_obs = _make_sample_normalized_obs("DEV_AS_BAR_01")
    mock_provider = MagicMock(spec=WeatherProvider)
    mock_provider.fetch_current_observation = AsyncMock(return_value=mock_obs)

    mock_session = MagicMock(spec=Session)
    mock_session.get.return_value = Region(region_id="DEV_AS_BAR_01")  # Region exists
    mock_session.scalar.return_value = 101  # Generated ID

    service = IngestionService(provider=mock_provider)
    region = Region(region_id="DEV_AS_BAR_01", name="R", district="D", latitude=26.3, longitude=91.0)

    result = await service.run_live_ingestion(
        regions=[region],
        session=mock_session,
        persist=True,
    )

    assert len(result.successful_observations) == 1
    assert len(result.failed_regions) == 0
    assert result.persisted_count == 1
    assert len(result.persistence_failures) == 0


# ==============================================================================
# 3. POSTGRESQL INTEGRATION TESTS (Requires Isolated DATABASE_URL_TEST)
# ==============================================================================

SKIP_PG_REASON = (
    "PostgreSQL persistence integration tests were not executed because DATABASE_URL_TEST is not configured. "
    "Set DATABASE_URL_TEST in backend/.env with a valid test PostgreSQL connection string. "
    "Tests must NEVER run against production/development DATABASE_URL."
)


def _is_pg_test_configured() -> bool:
    url = settings.DATABASE_URL_TEST.strip() if settings.DATABASE_URL_TEST else ""
    return bool(url and "USER:PASSWORD" not in url and "TEST_DATABASE" not in url)


@pytest.fixture
def pg_session_fixture():
    """Provides isolated PostgreSQL database session when DATABASE_URL_TEST is configured."""
    if not _is_pg_test_configured():
        pytest.skip(SKIP_PG_REASON)

    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    engine = create_engine(settings.DATABASE_URL_TEST.strip(), pool_pre_ping=True)
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSession()

    try:
        yield session
    finally:
        session.rollback()
        session.execute(text("TRUNCATE TABLE observations, regions CASCADE;"))
        session.commit()
        session.close()
        engine.dispose()


def test_pg_persist_valid_observation_insertion(pg_session_fixture: Session):
    """Valid observation is inserted into real PostgreSQL observations table."""
    session = pg_session_fixture
    # Seed parent region
    reg = Region(region_id="REG_PERSIST_01", name="R1", district="D", latitude=26.3, longitude=91.0)
    session.add(reg)
    session.commit()

    service = ObservationPersistenceService()
    now = datetime(2026, 9, 15, 12, 0, tzinfo=timezone.utc)
    obs = _make_sample_normalized_obs(
        region_id="REG_PERSIST_01",
        recorded_at=now,
        rainfall_1h=Decimal("15.50"),
    )

    result = service.persist_batch(session=session, observations=[obs])

    assert result.persisted_count == 1
    assert len(result.failed_observations) == 0

    saved = session.scalar(select(Observation).where(Observation.region_id == "REG_PERSIST_01"))
    assert saved is not None
    assert saved.recorded_at == now
    assert saved.rainfall_1h_mm == Decimal("15.50")
    assert saved.water_level_m is None


def test_pg_duplicate_observation_upsert_behavior(pg_session_fixture: Session):
    """Verifies that duplicate (region_id, recorded_at) updates values in-place without creating duplicate rows."""
    session = pg_session_fixture
    reg = Region(region_id="REG_UPSERT_01", name="R1", district="D", latitude=26.3, longitude=91.0)
    session.add(reg)
    session.commit()

    service = ObservationPersistenceService()
    now = datetime(2026, 9, 15, 12, 0, tzinfo=timezone.utc)

    obs_initial = _make_sample_normalized_obs(
        region_id="REG_UPSERT_01",
        recorded_at=now,
        rainfall_1h=Decimal("10.00"),
        temp=Decimal("25.0"),
    )

    # First persistence
    res1 = service.persist_batch(session=session, observations=[obs_initial])
    assert res1.persisted_count == 1

    saved1 = session.scalar(select(Observation).where(Observation.region_id == "REG_UPSERT_01"))
    initial_id = saved1.id
    initial_created_at = saved1.created_at

    # Second persistence for exact same (region_id, recorded_at) with updated metrics
    obs_updated = _make_sample_normalized_obs(
        region_id="REG_UPSERT_01",
        recorded_at=now,
        rainfall_1h=Decimal("25.00"),  # Updated rainfall
        temp=Decimal("31.0"),         # Updated temperature
    )
    res2 = service.persist_batch(session=session, observations=[obs_updated])
    assert res2.persisted_count == 1

    # Verify row count is still exactly 1
    all_obs = session.scalars(select(Observation).where(Observation.region_id == "REG_UPSERT_01")).all()
    assert len(all_obs) == 1

    # Verify updated values replaced previous values, while id and created_at were preserved
    saved2 = all_obs[0]
    assert saved2.id == initial_id
    assert saved2.created_at == initial_created_at
    assert saved2.rainfall_1h_mm == Decimal("25.00")
    assert saved2.temperature_c == Decimal("31.0")


def test_pg_actual_transaction_savepoint_isolation(pg_session_fixture: Session):
    """Tests Requirement 13:
    Observation A -> success
    Observation B -> failure (unknown region)
    Observation C -> success

    Results in:
    - Observation A exists
    - Observation B does NOT exist
    - Observation C exists
    - B appears in failed_observations
    """
    session = pg_session_fixture
    # Seed regions A and C only (B is omitted to trigger failure)
    reg_a = Region(region_id="REG_SAVEPOINT_A", name="A", district="D", latitude=26.0, longitude=90.0)
    reg_c = Region(region_id="REG_SAVEPOINT_C", name="C", district="D", latitude=26.2, longitude=90.2)
    session.add_all([reg_a, reg_c])
    session.commit()

    service = ObservationPersistenceService()
    now = datetime(2026, 9, 15, 12, 0, tzinfo=timezone.utc)

    obs_a = _make_sample_normalized_obs(region_id="REG_SAVEPOINT_A", recorded_at=now)
    obs_b = _make_sample_normalized_obs(region_id="REG_SAVEPOINT_B_NONEXISTENT", recorded_at=now)
    obs_c = _make_sample_normalized_obs(region_id="REG_SAVEPOINT_C", recorded_at=now)

    result = service.persist_batch(session=session, observations=[obs_a, obs_b, obs_c])

    assert result.persisted_count == 2
    assert len(result.failed_observations) == 1
    assert result.failed_observations[0].region_id == "REG_SAVEPOINT_B_NONEXISTENT"
    assert result.failed_observations[0].error_type == "UnknownRegionError"

    # Verify database state after transaction commits
    saved_a = session.scalar(select(Observation).where(Observation.region_id == "REG_SAVEPOINT_A"))
    saved_b = session.scalar(select(Observation).where(Observation.region_id == "REG_SAVEPOINT_B_NONEXISTENT"))
    saved_c = session.scalar(select(Observation).where(Observation.region_id == "REG_SAVEPOINT_C"))

    assert saved_a is not None, "Observation A must be successfully committed!"
    assert saved_b is None, "Observation B must not exist in the database!"
    assert saved_c is not None, "Observation C must be successfully committed!"
