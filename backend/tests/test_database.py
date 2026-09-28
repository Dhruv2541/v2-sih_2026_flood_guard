from datetime import datetime, timezone, timedelta
from decimal import Decimal
import pytest
from sqlalchemy import create_engine, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker, Session
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app
from app.models import Base, Region, Observation, Prediction


# ==============================================================================
# 1. MODEL ARCHITECTURE, INVARIANT & STARTUP NON-CREATION TESTS (No DB required)
# ==============================================================================


def test_schema_model_structure_invariants():
    """Verifies that all models conform strictly to the authoritative contract:
    - regions.region_id is the primary key (no regions.id)
    - is_stale is NOT a persisted database column
    - data_source has no database default
    - model_version has no database default
    - predictions has no standalone index on forecast_valid_until
    """
    # 1. Region table invariants
    assert "region_id" in Region.__table__.columns
    assert Region.__table__.columns["region_id"].primary_key is True
    assert "id" not in Region.__table__.columns  # canonical region_id only

    # 2. Observation table invariants
    obs_cols = Observation.__table__.columns
    assert "id" in obs_cols
    assert "region_id" in obs_cols
    assert "recorded_at" in obs_cols
    assert "rainfall_1h_mm" in obs_cols
    assert "rainfall_3h_mm" in obs_cols
    assert "rainfall_6h_mm" in obs_cols
    assert "rainfall_24h_mm" in obs_cols
    assert "water_level_m" in obs_cols
    assert "temperature_c" in obs_cols
    assert "humidity_pct" in obs_cols
    assert "data_source" in obs_cols
    assert "is_stale" not in obs_cols  # Must NOT be a persistent column!
    assert obs_cols["data_source"].server_default is None  # No database default

    # 3. Prediction table invariants
    pred_cols = Prediction.__table__.columns
    assert "id" in pred_cols
    assert "region_id" in pred_cols
    assert "generated_at" in pred_cols
    assert "forecast_valid_until" in pred_cols
    assert "flood_probability" in pred_cols
    assert "risk_level" in pred_cols
    assert "model_version" in pred_cols
    assert pred_cols["model_version"].server_default is None  # No database default

    # 4. Standalone forecast_valid_until index must NOT exist
    pred_index_names = [idx.name for idx in Prediction.__table__.indexes]
    assert "idx_predictions_valid_until" not in pred_index_names


def test_startup_does_not_create_tables(monkeypatch):
    """Verifies that importing and starting FastAPI never calls Base.metadata.create_all().
    Database schema creation must remain strictly an explicit developer operation.
    """
    create_all_called = False

    def mock_create_all(*args, **kwargs):
        nonlocal create_all_called
        create_all_called = True

    monkeypatch.setattr(Base.metadata, "create_all", mock_create_all)

    # Trigger FastAPI test client startup / lifespan
    with TestClient(app) as client:
        res = client.get("/api/v1/health")
        assert res.status_code == 200

    assert create_all_called is False, "FastAPI startup must NOT create database tables!"


def test_health_independent_of_database():
    """Confirms /api/v1/health responds HTTP 200 OK regardless of database state."""
    client = TestClient(app)
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


# ==============================================================================
# 2. POSTGRESQL DATABASE INTEGRATION TESTS (Requires DATABASE_URL_TEST)
# ==============================================================================

SKIP_PG_REASON = (
    "PostgreSQL integration tests were not executed because DATABASE_URL_TEST is not configured. "
    "Set DATABASE_URL_TEST in backend/.env with a valid test PostgreSQL connection string "
    "(e.g., dedicated Supabase test database or local PostgreSQL instance). "
    "Tests must NEVER run against production/development DATABASE_URL."
)


def is_pg_test_db_configured() -> bool:
    test_url = settings.DATABASE_URL_TEST.strip() if settings.DATABASE_URL_TEST else ""
    if not test_url or "USER:PASSWORD" in test_url or "TEST_DATABASE" in test_url:
        return False
    return True


@pytest.fixture(scope="module")
def pg_engine():
    """Connects strictly to DATABASE_URL_TEST.
    Never falls back to production DATABASE_URL.
    """
    if not is_pg_test_db_configured():
        pytest.skip(SKIP_PG_REASON)

    test_url = settings.DATABASE_URL_TEST.strip()
    try:
        engine = create_engine(test_url, pool_pre_ping=True)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as e:
        pytest.fail(
            f"Unable to connect to dedicated test PostgreSQL database: {type(e).__name__} - {e}. "
            f"Please ensure the test database is running and accessible."
        )

    # Initialize tables on test database
    Base.metadata.create_all(bind=engine)
    yield engine
    # Clean up tables on teardown
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture
def pg_session(pg_engine):
    """Provides an isolated database session cleaned up after each test."""
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=pg_engine)
    session: Session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.execute(text("TRUNCATE TABLE predictions, observations, regions CASCADE;"))
        session.commit()
        session.close()


# ------------------------------------------------------------------------------
# REGIONS Table Constraint Tests (1 - 4)
# ------------------------------------------------------------------------------


def test_pg_1_valid_region_insertion_succeeds(pg_session: Session):
    """1. Valid region insertion succeeds."""
    region = Region(
        region_id="TEST_REG_01",
        name="Test Barpeta Region",
        district="Barpeta",
        latitude=26.32,
        longitude=91.01,
        elevation_m=Decimal("35.0"),
    )
    pg_session.add(region)
    pg_session.commit()

    saved = pg_session.get(Region, "TEST_REG_01")
    assert saved is not None
    assert saved.region_id == "TEST_REG_01"
    assert saved.name == "Test Barpeta Region"


def test_pg_2_duplicate_region_id_fails(pg_session: Session):
    """2. Duplicate region_id fails primary key uniqueness."""
    r1 = Region(region_id="DUP_REG", name="R1", district="D", latitude=26.0, longitude=90.0)
    r2 = Region(region_id="DUP_REG", name="R2", district="D", latitude=26.1, longitude=90.1)
    pg_session.add(r1)
    pg_session.commit()

    pg_session.add(r2)
    with pytest.raises(IntegrityError):
        pg_session.commit()


def test_pg_3_invalid_latitude_fails(pg_session: Session):
    """3. Invalid latitude (< 20.0 or > 30.0) fails CHECK constraint."""
    reg_low = Region(region_id="LAT_LOW", name="R", district="D", latitude=19.9, longitude=90.0)
    pg_session.add(reg_low)
    with pytest.raises(IntegrityError):
        pg_session.commit()
    pg_session.rollback()

    reg_high = Region(region_id="LAT_HIGH", name="R", district="D", latitude=30.1, longitude=90.0)
    pg_session.add(reg_high)
    with pytest.raises(IntegrityError):
        pg_session.commit()


def test_pg_4_invalid_longitude_fails(pg_session: Session):
    """4. Invalid longitude (< 88.0 or > 98.0) fails CHECK constraint."""
    reg_low = Region(region_id="LON_LOW", name="R", district="D", latitude=26.0, longitude=87.9)
    pg_session.add(reg_low)
    with pytest.raises(IntegrityError):
        pg_session.commit()
    pg_session.rollback()

    reg_high = Region(region_id="LON_HIGH", name="R", district="D", latitude=26.0, longitude=98.1)
    pg_session.add(reg_high)
    with pytest.raises(IntegrityError):
        pg_session.commit()


# ------------------------------------------------------------------------------
# OBSERVATIONS Table Constraint Tests (5 - 12)
# ------------------------------------------------------------------------------


def test_pg_5_valid_observation_insertion_succeeds(pg_session: Session):
    """5. Valid observation insertion succeeds."""
    reg = Region(region_id="REG_OBS_01", name="R", district="D", latitude=26.0, longitude=90.0)
    pg_session.add(reg)
    pg_session.commit()

    now = datetime.now(timezone.utc)
    obs = Observation(
        region_id="REG_OBS_01",
        recorded_at=now,
        rainfall_1h_mm=Decimal("12.50"),
        rainfall_3h_mm=Decimal("35.00"),
        rainfall_6h_mm=Decimal("70.00"),
        rainfall_24h_mm=Decimal("120.00"),
        water_level_m=Decimal("45.20"),
        temperature_c=Decimal("28.5"),
        humidity_pct=Decimal("82.0"),
        data_source="test_provider",
    )
    pg_session.add(obs)
    pg_session.commit()

    saved = pg_session.get(Observation, obs.id)
    assert saved is not None
    assert saved.region_id == "REG_OBS_01"
    assert saved.rainfall_1h_mm == Decimal("12.50")


def test_pg_6_invalid_region_id_fails_foreign_key(pg_session: Session):
    """6. Invalid/nonexistent region_id fails foreign key constraint."""
    now = datetime.now(timezone.utc)
    obs = Observation(
        region_id="NON_EXISTENT_FK",
        recorded_at=now,
        data_source="test",
    )
    pg_session.add(obs)
    with pytest.raises(IntegrityError):
        pg_session.commit()


def test_pg_7_negative_rainfall_fails(pg_session: Session):
    """7. Negative rainfall fails CHECK constraint."""
    reg = Region(region_id="REG_NEG_RAIN", name="R", district="D", latitude=26.0, longitude=90.0)
    pg_session.add(reg)
    pg_session.commit()

    now = datetime.now(timezone.utc)
    obs = Observation(
        region_id="REG_NEG_RAIN",
        recorded_at=now,
        rainfall_1h_mm=Decimal("-0.01"),  # Negative
        data_source="test",
    )
    pg_session.add(obs)
    with pytest.raises(IntegrityError):
        pg_session.commit()


def test_pg_8_humidity_below_zero_fails(pg_session: Session):
    """8. Humidity below 0 fails CHECK constraint."""
    reg = Region(region_id="REG_HUM_LOW", name="R", district="D", latitude=26.0, longitude=90.0)
    pg_session.add(reg)
    pg_session.commit()

    now = datetime.now(timezone.utc)
    obs = Observation(
        region_id="REG_HUM_LOW",
        recorded_at=now,
        humidity_pct=Decimal("-1.0"),  # Below 0
        data_source="test",
    )
    pg_session.add(obs)
    with pytest.raises(IntegrityError):
        pg_session.commit()


def test_pg_9_humidity_above_100_fails(pg_session: Session):
    """9. Humidity above 100 fails CHECK constraint."""
    reg = Region(region_id="REG_HUM_HIGH", name="R", district="D", latitude=26.0, longitude=90.0)
    pg_session.add(reg)
    pg_session.commit()

    now = datetime.now(timezone.utc)
    obs = Observation(
        region_id="REG_HUM_HIGH",
        recorded_at=now,
        humidity_pct=Decimal("100.1"),  # Above 100
        data_source="test",
    )
    pg_session.add(obs)
    with pytest.raises(IntegrityError):
        pg_session.commit()


def test_pg_10_duplicate_observation_fails(pg_session: Session):
    """10. Duplicate (region_id, recorded_at) fails UNIQUE constraint."""
    reg = Region(region_id="REG_DUP_OBS", name="R", district="D", latitude=26.0, longitude=90.0)
    pg_session.add(reg)
    pg_session.commit()

    now = datetime.now(timezone.utc)
    obs1 = Observation(region_id="REG_DUP_OBS", recorded_at=now, data_source="test")
    obs2 = Observation(region_id="REG_DUP_OBS", recorded_at=now, data_source="test")
    pg_session.add(obs1)
    pg_session.commit()

    pg_session.add(obs2)
    with pytest.raises(IntegrityError):
        pg_session.commit()


def test_pg_11_null_optional_observation_fields_accepted(pg_session: Session):
    """11. NULL optional observation fields (rainfall, water level, temp, humidity) are accepted."""
    reg = Region(region_id="REG_NULL_OBS", name="R", district="D", latitude=26.0, longitude=90.0)
    pg_session.add(reg)
    pg_session.commit()

    now = datetime.now(timezone.utc)
    obs = Observation(
        region_id="REG_NULL_OBS",
        recorded_at=now,
        rainfall_1h_mm=None,
        rainfall_3h_mm=None,
        rainfall_6h_mm=None,
        rainfall_24h_mm=None,
        water_level_m=None,
        temperature_c=None,
        humidity_pct=None,
        data_source="test",
    )
    pg_session.add(obs)
    pg_session.commit()

    saved = pg_session.get(Observation, obs.id)
    assert saved is not None
    assert saved.water_level_m is None
    assert saved.temperature_c is None
    assert saved.humidity_pct is None


def test_pg_12_data_source_cannot_be_null(pg_session: Session):
    """12. data_source cannot be NULL (NOT NULL constraint)."""
    reg = Region(region_id="REG_NOT_NULL_DS", name="R", district="D", latitude=26.0, longitude=90.0)
    pg_session.add(reg)
    pg_session.commit()

    now = datetime.now(timezone.utc)
    obs = Observation(
        region_id="REG_NOT_NULL_DS",
        recorded_at=now,
        data_source=None,  # Invalid NULL
    )
    pg_session.add(obs)
    with pytest.raises(IntegrityError):
        pg_session.commit()


# ------------------------------------------------------------------------------
# PREDICTIONS Table Constraint Tests (13 - 20)
# ------------------------------------------------------------------------------


def test_pg_13_valid_prediction_insertion_succeeds(pg_session: Session):
    """13. Valid prediction insertion succeeds."""
    reg = Region(region_id="REG_PRED_01", name="R", district="D", latitude=26.0, longitude=90.0)
    pg_session.add(reg)
    pg_session.commit()

    now = datetime.now(timezone.utc)
    pred = Prediction(
        region_id="REG_PRED_01",
        generated_at=now,
        forecast_valid_until=now + timedelta(hours=6),
        flood_probability=Decimal("0.750"),
        risk_level="high",
        model_version="v1.0",
        is_fallback=False,
    )
    pg_session.add(pred)
    pg_session.commit()

    saved = pg_session.get(Prediction, pred.id)
    assert saved is not None
    assert saved.flood_probability == Decimal("0.750")
    assert saved.risk_level == "high"


def test_pg_14_invalid_region_id_prediction_fails(pg_session: Session):
    """14. Invalid/nonexistent region_id fails foreign key constraint."""
    now = datetime.now(timezone.utc)
    pred = Prediction(
        region_id="NON_EXISTENT_REG",
        generated_at=now,
        forecast_valid_until=now + timedelta(hours=6),
        flood_probability=Decimal("0.5"),
        risk_level="moderate",
        model_version="v1.0",
    )
    pg_session.add(pred)
    with pytest.raises(IntegrityError):
        pg_session.commit()


def test_pg_15_flood_probability_below_zero_fails(pg_session: Session):
    """15. flood_probability < 0 fails CHECK constraint."""
    reg = Region(region_id="REG_PROB_LOW", name="R", district="D", latitude=26.0, longitude=90.0)
    pg_session.add(reg)
    pg_session.commit()

    now = datetime.now(timezone.utc)
    pred = Prediction(
        region_id="REG_PROB_LOW",
        generated_at=now,
        forecast_valid_until=now + timedelta(hours=6),
        flood_probability=Decimal("-0.001"),  # Invalid < 0
        risk_level="low",
        model_version="v1.0",
    )
    pg_session.add(pred)
    with pytest.raises(IntegrityError):
        pg_session.commit()


def test_pg_16_flood_probability_above_one_fails(pg_session: Session):
    """16. flood_probability > 1 fails CHECK constraint."""
    reg = Region(region_id="REG_PROB_HIGH", name="R", district="D", latitude=26.0, longitude=90.0)
    pg_session.add(reg)
    pg_session.commit()

    now = datetime.now(timezone.utc)
    pred = Prediction(
        region_id="REG_PROB_HIGH",
        generated_at=now,
        forecast_valid_until=now + timedelta(hours=6),
        flood_probability=Decimal("1.001"),  # Invalid > 1
        risk_level="high",
        model_version="v1.0",
    )
    pg_session.add(pred)
    with pytest.raises(IntegrityError):
        pg_session.commit()


def test_pg_17_invalid_risk_level_fails(pg_session: Session):
    """17. Invalid risk_level outside (low, moderate, high, severe) fails CHECK constraint."""
    reg = Region(region_id="REG_RISK_INV", name="R", district="D", latitude=26.0, longitude=90.0)
    pg_session.add(reg)
    pg_session.commit()

    now = datetime.now(timezone.utc)
    pred = Prediction(
        region_id="REG_RISK_INV",
        generated_at=now,
        forecast_valid_until=now + timedelta(hours=6),
        flood_probability=Decimal("0.5"),
        risk_level="extreme_danger",  # Invalid risk level
        model_version="v1.0",
    )
    pg_session.add(pred)
    with pytest.raises(IntegrityError):
        pg_session.commit()


def test_pg_18_forecast_valid_until_earlier_fails(pg_session: Session):
    """18. forecast_valid_until < generated_at fails CHECK constraint."""
    reg = Region(region_id="REG_HORIZON_INV", name="R", district="D", latitude=26.0, longitude=90.0)
    pg_session.add(reg)
    pg_session.commit()

    now = datetime.now(timezone.utc)
    pred = Prediction(
        region_id="REG_HORIZON_INV",
        generated_at=now,
        forecast_valid_until=now - timedelta(seconds=1),  # Invalid earlier
        flood_probability=Decimal("0.5"),
        risk_level="moderate",
        model_version="v1.0",
    )
    pg_session.add(pred)
    with pytest.raises(IntegrityError):
        pg_session.commit()


def test_pg_19_model_version_cannot_be_null(pg_session: Session):
    """19. model_version cannot be NULL (NOT NULL constraint)."""
    reg = Region(region_id="REG_NO_VER", name="R", district="D", latitude=26.0, longitude=90.0)
    pg_session.add(reg)
    pg_session.commit()

    now = datetime.now(timezone.utc)
    pred = Prediction(
        region_id="REG_NO_VER",
        generated_at=now,
        forecast_valid_until=now + timedelta(hours=6),
        flood_probability=Decimal("0.5"),
        risk_level="moderate",
        model_version=None,  # Invalid NULL
    )
    pg_session.add(pred)
    with pytest.raises(IntegrityError):
        pg_session.commit()


def test_pg_20_duplicate_prediction_fails(pg_session: Session):
    """20. Duplicate (region_id, generated_at) fails UNIQUE constraint."""
    reg = Region(region_id="REG_DUP_PRED", name="R", district="D", latitude=26.0, longitude=90.0)
    pg_session.add(reg)
    pg_session.commit()

    now = datetime.now(timezone.utc)
    p1 = Prediction(
        region_id="REG_DUP_PRED",
        generated_at=now,
        forecast_valid_until=now + timedelta(hours=6),
        flood_probability=Decimal("0.4"),
        risk_level="moderate",
        model_version="v1.0",
    )
    p2 = Prediction(
        region_id="REG_DUP_PRED",
        generated_at=now,
        forecast_valid_until=now + timedelta(hours=6),
        flood_probability=Decimal("0.4"),
        risk_level="moderate",
        model_version="v1.0",
    )
    pg_session.add(p1)
    pg_session.commit()

    pg_session.add(p2)
    with pytest.raises(IntegrityError):
        pg_session.commit()


# ------------------------------------------------------------------------------
# CASCADE DELETE Verification against PostgreSQL Engine (21)
# ------------------------------------------------------------------------------


def test_pg_21_cascade_delete_database_enforced(pg_session: Session):
    """21. Explicitly verifies PostgreSQL database-level foreign-key ON DELETE CASCADE:
    - Creates Region R1
    - Creates Observation belonging to R1
    - Creates Prediction belonging to R1
    - Deletes R1 directly via SQL statement (bypassing ORM cascade)
    - Verifies PostgreSQL engine automatically deletes child observation and prediction.
    """
    reg = Region(region_id="REG_CASCADE_TEST", name="Cascade Region", district="D", latitude=26.0, longitude=90.0)
    pg_session.add(reg)
    pg_session.commit()

    now = datetime.now(timezone.utc)
    obs = Observation(region_id="REG_CASCADE_TEST", recorded_at=now, data_source="test")
    pred = Prediction(
        region_id="REG_CASCADE_TEST",
        generated_at=now,
        forecast_valid_until=now + timedelta(hours=6),
        flood_probability=Decimal("0.75"),
        risk_level="high",
        model_version="v1.0",
    )
    pg_session.add_all([obs, pred])
    pg_session.commit()

    # Confirm rows exist
    assert pg_session.scalar(select(Observation).where(Observation.region_id == "REG_CASCADE_TEST")) is not None
    assert pg_session.scalar(select(Prediction).where(Prediction.region_id == "REG_CASCADE_TEST")) is not None

    # Execute direct SQL DELETE on region to prove database-level cascade
    pg_session.execute(text("DELETE FROM regions WHERE region_id = 'REG_CASCADE_TEST'"))
    pg_session.commit()

    # Verify PostgreSQL FK engine automatically removed child records
    assert pg_session.scalar(select(Observation).where(Observation.region_id == "REG_CASCADE_TEST")) is None
    assert pg_session.scalar(select(Prediction).where(Prediction.region_id == "REG_CASCADE_TEST")) is None
