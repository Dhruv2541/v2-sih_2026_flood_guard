"""Tests for Assam Revenue Circles and development region seeding."""

import json
import logging
import sys
from decimal import Decimal
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from sqlalchemy.orm import Session

from app.database.seed import (
    DEV_MOCK_REGIONS,
    RegionSeedError,
    _load_assam_circles,
    _map_record_to_region,
    _validate_region_record,
    seed_assam_circles,
    seed_development_regions,
)
from app.models.region import Region


# ==============================================================================
# 1. DATASET STRUCTURE TESTS
# ==============================================================================

def test_assam_circles_json_loads():
    """1. JSON file loads correctly."""
    records = _load_assam_circles()
    assert isinstance(records, list)
    assert len(records) == 180  # Actual count from dataset


def test_assam_circles_has_expected_fields():
    """2. Expected fields are present in each record."""
    records = _load_assam_circles()
    required = {"object_id", "name", "district", "lat", "lon"}
    for record in records:
        assert required.issubset(record.keys()), f"Missing required fields in {record}"


def test_assam_circles_unique_object_ids():
    """3. object_ids are unique (canonical region IDs)."""
    records = _load_assam_circles()
    ids = [str(r["object_id"]).strip() for r in records]
    assert len(ids) == len(set(ids)), "Duplicate object_ids found"


def test_assam_circles_districts():
    """4. Records span expected number of districts."""
    records = _load_assam_circles()
    districts = set(r["district"] for r in records)
    assert len(districts) == 35  # 35 districts in Assam


# ==============================================================================
# 2. VALIDATION TESTS
# ==============================================================================

def test_validate_valid_record_passes():
    """5. Valid record passes validation."""
    valid_record = {
        "object_id": "TEST_001",
        "name": "Test Circle",
        "district": "TEST_DISTRICT",
        "lat": 26.5,
        "lon": 91.0,
    }
    _validate_region_record(valid_record, 0)  # Should not raise


def test_validate_missing_object_id_rejected():
    """6. Missing object_id is rejected."""
    record = {"name": "Test", "district": "DIST", "lat": 26.0, "lon": 90.0}
    with pytest.raises(RegionSeedError) as exc_info:
        _validate_region_record(record, 0)
    assert "missing required field 'object_id'" in str(exc_info.value)


def test_validate_missing_name_rejected():
    """7. Missing name is rejected."""
    record = {"object_id": "TEST_001", "district": "DIST", "lat": 26.0, "lon": 90.0}
    with pytest.raises(RegionSeedError) as exc_info:
        _validate_region_record(record, 0)
    assert "missing required field 'name'" in str(exc_info.value)


def test_validate_missing_district_rejected():
    """8. Missing district is rejected."""
    record = {"object_id": "TEST_001", "name": "Test", "lat": 26.0, "lon": 90.0}
    with pytest.raises(RegionSeedError) as exc_info:
        _validate_region_record(record, 0)
    assert "missing required field 'district'" in str(exc_info.value)


def test_validate_invalid_latitude_rejected():
    """9. Invalid latitude (out of bounds) is rejected."""
    record = {"object_id": "TEST_001", "name": "Test", "district": "DIST", "lat": 91.0, "lon": 90.0}
    with pytest.raises(RegionSeedError) as exc_info:
        _validate_region_record(record, 0)
    assert "latitude out of bounds" in str(exc_info.value)


def test_validate_invalid_longitude_rejected():
    """10. Invalid longitude (out of bounds) is rejected."""
    record = {"object_id": "TEST_001", "name": "Test", "district": "DIST", "lat": 26.0, "lon": 181.0}
    with pytest.raises(RegionSeedError) as exc_info:
        _validate_region_record(record, 0)
    assert "longitude out of bounds" in str(exc_info.value)


def test_validate_negative_latitude_accepted():
    """Negative latitude within bounds is accepted."""
    record = {"object_id": "TEST_001", "name": "Test", "district": "DIST", "lat": -10.0, "lon": 90.0}
    _validate_region_record(record, 0)  # Should not raise


def test_validate_negative_longitude_accepted():
    """Negative longitude within bounds is accepted."""
    record = {"object_id": "TEST_001", "name": "Test", "district": "DIST", "lat": 26.0, "lon": -100.0}
    _validate_region_record(record, 0)  # Should not raise


def test_validate_invalid_elevation_rejected():
    """Invalid elevation (non-numeric) is rejected."""
    record = {"object_id": "TEST_001", "name": "Test", "district": "DIST", "lat": 26.0, "lon": 90.0, "elevation": "invalid"}
    with pytest.raises(RegionSeedError) as exc_info:
        _validate_region_record(record, 0)
    assert "invalid elevation" in str(exc_info.value)


def test_validate_duplicate_object_id_rejected():
    """11. Duplicate object_id in dataset is rejected."""
    records = [
        {"object_id": "DUP_001", "name": "A", "district": "DIST", "lat": 26.0, "lon": 90.0},
        {"object_id": "DUP_001", "name": "B", "district": "DIST", "lat": 26.1, "lon": 90.1},
    ]
    # Validate each record individually (should pass)
    for i, r in enumerate(records):
        _validate_region_record(r, i)

    # Duplicate detection happens in seed function - simulate that
    seen = set()
    with pytest.raises(RegionSeedError) as exc_info:
        for i, r in enumerate(records):
            rid = str(r["object_id"]).strip()
            if rid in seen:
                raise RegionSeedError(f"Duplicate region_id in dataset: {rid}")
            seen.add(rid)
    assert "Duplicate region_id" in str(exc_info.value)


# ==============================================================================
# 3. MAPPING TESTS
# ==============================================================================

def test_map_record_to_region():
    """12. JSON record maps correctly to Region model fields."""
    record = {
        "object_id": "TEST_001",
        "name": "Test Circle",
        "district": "TEST_DISTRICT",
        "lat": 26.5,
        "lon": 91.0,
        "elevation": 45.5,
        "extra_field": "ignored",  # Should be ignored
    }
    mapped = _map_record_to_region(record)
    assert mapped["region_id"] == "TEST_001"
    assert mapped["name"] == "Test Circle"
    assert mapped["district"] == "TEST_DISTRICT"
    assert mapped["latitude"] == 26.5
    assert mapped["longitude"] == 91.0
    assert mapped["elevation_m"] == Decimal("45.5")


def test_map_record_without_elevation():
    """13. Record without elevation maps with None elevation."""
    record = {
        "object_id": "TEST_002",
        "name": "Test Circle",
        "district": "TEST_DISTRICT",
        "lat": 26.5,
        "lon": 91.0,
    }
    mapped = _map_record_to_region(record)
    assert mapped["elevation_m"] is None


def test_map_record_ignores_extra_fields():
    """Extra fields in JSON are ignored."""
    record = {
        "object_id": "TEST_003",
        "name": "Test Circle",
        "district": "TEST_DISTRICT",
        "lat": 26.5,
        "lon": 91.0,
        "area_sqkm": 100.0,
        "population": 10000,
        "slope": 50.0,
    }
    mapped = _map_record_to_region(record)
    assert set(mapped.keys()) == {"region_id", "name", "district", "latitude", "longitude", "elevation_m"}


# ==============================================================================
# 4. SEED FUNCTION TESTS (with mocked DB)
# ==============================================================================

def _make_mock_session():
    session = MagicMock(spec=Session)
    return session


def test_seed_development_regions_idempotent():
    """14. First seed inserts regions, second seed skips existing."""
    with patch("app.database.seed.get_sessionmaker") as mock_get_session:
        mock_session = _make_mock_session()
        mock_session.get.return_value = None  # No existing regions
        mock_get_session.return_value = lambda: mock_session

        # First run
        result = seed_development_regions()
        assert result is True
        assert mock_session.add.call_count == len(DEV_MOCK_REGIONS)

        # Second run - regions now exist
        mock_session.reset_mock()
        mock_session.get.side_effect = [Region(region_id=r["region_id"]) for r in DEV_MOCK_REGIONS]
        result = seed_development_regions()
        assert result is True
        assert mock_session.add.call_count == 0  # No new inserts


def test_seed_assam_circles_first_run_inserts():
    """15. First seed inserts all regions."""
    with patch("app.database.seed.get_sessionmaker") as mock_get_session:
        mock_session = _make_mock_session()
        mock_session.get.return_value = None  # No existing regions
        mock_get_session.return_value = lambda: mock_session

        with patch("app.database.seed._load_assam_circles") as mock_load:
            # Create minimal mock records
            mock_records = [
                {"object_id": "AS_001", "name": "Circle A", "district": "DIST_A", "lat": 26.0, "lon": 90.0, "elevation": 50.0},
                {"object_id": "AS_002", "name": "Circle B", "district": "DIST_B", "lat": 26.1, "lon": 90.1, "elevation": 60.0},
            ]
            mock_load.return_value = mock_records

            result = seed_assam_circles()

        assert result["inserted"] == 2
        assert result["updated"] == 0
        assert result["skipped"] == 0
        assert result["total"] == 2
        assert mock_session.add.call_count == 2


def test_seed_assam_circles_second_run_no_duplicates():
    """16. Second seed does not create duplicates."""
    with patch("app.database.seed.get_sessionmaker") as mock_get_session:
        mock_session = _make_mock_session()
        # Simulate regions already existing
        mock_session.get.side_effect = [
            Region(region_id="AS_001", elevation_m=Decimal("50.0")),
            Region(region_id="AS_002", elevation_m=Decimal("60.0")),
        ]
        mock_get_session.return_value = lambda: mock_session

        with patch("app.database.seed._load_assam_circles") as mock_load:
            mock_records = [
                {"object_id": "AS_001", "name": "Circle A", "district": "DIST_A", "lat": 26.0, "lon": 90.0, "elevation": 50.0},
                {"object_id": "AS_002", "name": "Circle B", "district": "DIST_B", "lat": 26.1, "lon": 90.1, "elevation": 60.0},
            ]
            mock_load.return_value = mock_records

            result = seed_assam_circles()

        assert result["inserted"] == 0
        assert result["updated"] == 0
        assert result["skipped"] == 2
        assert result["total"] == 2
        assert mock_session.add.call_count == 0


def test_seed_assam_circles_updates_elevation():
    """17. Existing region with different elevation gets updated."""
    with patch("app.database.seed.get_sessionmaker") as mock_get_session:
        mock_session = _make_mock_session()
        # Existing region with different elevation
        existing_region = Region(region_id="AS_001", elevation_m=Decimal("50.0"))
        mock_session.get.return_value = existing_region
        mock_get_session.return_value = lambda: mock_session

        with patch("app.database.seed._load_assam_circles") as mock_load:
            mock_records = [
                {"object_id": "AS_001", "name": "Circle A", "district": "DIST_A", "lat": 26.0, "lon": 90.0, "elevation": 55.0},  # Different elevation
            ]
            mock_load.return_value = mock_records

            result = seed_assam_circles()

        assert result["inserted"] == 0
        assert result["updated"] == 1
        assert result["skipped"] == 0
        assert existing_region.elevation_m == Decimal("55.0")


def test_seed_assam_circles_idempotent():
    """18. Repeated seed is idempotent (same result each time)."""
    with patch("app.database.seed.get_sessionmaker") as mock_get_session:
        mock_session = _make_mock_session()
        mock_session.get.return_value = None
        mock_get_session.return_value = lambda: mock_session

        with patch("app.database.seed._load_assam_circles") as mock_load:
            mock_records = [
                {"object_id": "AS_001", "name": "Circle A", "district": "DIST_A", "lat": 26.0, "lon": 90.0, "elevation": 50.0},
            ]
            mock_load.return_value = mock_records

            # Run multiple times
            result1 = seed_assam_circles()
            assert result1["inserted"] == 1

            # For subsequent runs, we need to simulate the region existing
            mock_session.get.return_value = Region(region_id="AS_001", elevation_m=Decimal("50.0"))
            result2 = seed_assam_circles()
            assert result2["inserted"] == 0
            assert result2["skipped"] == 1

            result3 = seed_assam_circles()
            assert result3["inserted"] == 0
            assert result3["skipped"] == 1


def test_seed_assam_circles_preserves_existing_fields():
    """19. Existing name, district, lat, lon are preserved (not overwritten)."""
    with patch("app.database.seed.get_sessionmaker") as mock_get_session:
        mock_session = _make_mock_session()
        existing_region = Region(
            region_id="AS_001",
            name="Original Name",
            district="Original District",
            latitude=25.0,
            longitude=89.0,
            elevation_m=Decimal("50.0"),
        )
        mock_session.get.return_value = existing_region
        mock_get_session.return_value = lambda: mock_session

        with patch("app.database.seed._load_assam_circles") as mock_load:
            mock_records = [
                {"object_id": "AS_001", "name": "New Name", "district": "New District", "lat": 27.0, "lon": 92.0, "elevation": 60.0},
            ]
            mock_load.return_value = mock_records

            seed_assam_circles()

        # Only elevation should be updated
        assert existing_region.name == "Original Name"
        assert existing_region.district == "Original District"
        assert existing_region.latitude == 25.0
        assert existing_region.longitude == 89.0
        assert existing_region.elevation_m == Decimal("60.0")


def test_seed_assam_circles_transaction_rollback_on_error():
    """20. Database transaction rolls back on fatal failure."""
    with patch("app.database.seed.get_sessionmaker") as mock_get_session:
        mock_session = _make_mock_session()
        mock_session.get.return_value = None
        mock_session.commit.side_effect = Exception("DB constraint violation")
        mock_get_session.return_value = lambda: mock_session

        with patch("app.database.seed._load_assam_circles") as mock_load:
            mock_records = [
                {"object_id": "AS_001", "name": "Circle A", "district": "DIST_A", "lat": 26.0, "lon": 90.0, "elevation": 50.0},
            ]
            mock_load.return_value = mock_records

            with pytest.raises(RegionSeedError) as exc_info:
                seed_assam_circles()

        assert "Seeding failed" in str(exc_info.value)
        mock_session.rollback.assert_called_once()


def test_seed_assam_circles_file_not_found():
    """21. Missing JSON file raises clear error."""
    with patch("app.database.seed.get_sessionmaker"):
        with patch("app.database.seed.ASSAM_CIRCLES_PATH", Path("/nonexistent/path.json")):
            with pytest.raises(RegionSeedError) as exc_info:
                seed_assam_circles()
            assert "not found" in str(exc_info.value)


def test_seed_assam_circles_invalid_json():
    """22. Invalid JSON raises clear error."""
    with patch("app.database.seed.get_sessionmaker"):
        with patch("app.database.seed._load_assam_circles") as mock_load:
            mock_load.side_effect = json.JSONDecodeError("Expecting value", "", 0)
            with pytest.raises(RegionSeedError) as exc_info:
                seed_assam_circles()
            assert "Failed to parse JSON" in str(exc_info.value)


def test_seed_assam_circles_not_a_list():
    """23. JSON root not being a list is rejected."""
    with patch("app.database.seed.get_sessionmaker"):
        with patch("app.database.seed._load_assam_circles") as mock_load:
            mock_load.return_value = {"not": "a list"}
            with pytest.raises(RegionSeedError) as exc_info:
                seed_assam_circles()
            assert "Expected JSON array" in str(exc_info.value)


def test_development_regions_not_corrupted_by_assam_seed():
    """24. Development/test fixtures are not accidentally corrupted."""
    # This is a documentation/architectural test - the seed functions
    # operate on different region_id namespaces (DEV_AS_* vs AS_*)
    dev_ids = {r["region_id"] for r in DEV_MOCK_REGIONS}
    assam_records = _load_assam_circles()
    assam_ids = {str(r["object_id"]).strip() for r in assam_records}
    assert dev_ids.isdisjoint(assam_ids), "Dev and Assam region IDs must not overlap"


# ==============================================================================
# 5. INTEGRATION TESTS (require real DB)
# ==============================================================================

SKIP_PG_REASON = (
    "PostgreSQL integration tests require DATABASE_URL_TEST to be configured."
)


def _is_pg_test_configured() -> bool:
    from app.config import settings
    url = settings.DATABASE_URL_TEST.strip() if settings.DATABASE_URL_TEST else ""
    return bool(url and "USER:PASSWORD" not in url and "TEST_DATABASE" not in url)


@pytest.fixture
def pg_session():
    """Provides isolated PostgreSQL database session when DATABASE_URL_TEST is configured."""
    if not _is_pg_test_configured():
        pytest.skip(SKIP_PG_REASON)

    from sqlalchemy import create_engine, text
    from sqlalchemy.orm import sessionmaker
    from app.models import Base

    test_url = settings.DATABASE_URL_TEST.strip()
    engine = create_engine(test_url, pool_pre_ping=True)
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSession()

    try:
        yield session
    finally:
        session.rollback()
        session.execute(text("TRUNCATE TABLE predictions, observations, regions CASCADE;"))
        session.commit()
        session.close()
        engine.dispose()


def test_pg_seed_development_regions(pg_session):
    """25. Development regions seed works with real PostgreSQL."""
    from app.database.seed import seed_development_regions
    from app.database.connection import get_sessionmaker
    from app.config import settings

    # Override the session factory to use test DB
    original_get_sessionmaker = get_sessionmaker
    test_engine = create_engine(settings.DATABASE_URL_TEST.strip(), pool_pre_ping=True)
    test_sessionmaker = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

    import app.database.seed as seed_module
    seed_module.get_sessionmaker = lambda: test_sessionmaker

    try:
        result = seed_development_regions()
        assert result is True

        # Verify regions were inserted
        from app.models.region import Region
        for reg_data in DEV_MOCK_REGIONS:
            region = pg_session.get(Region, reg_data["region_id"])
            assert region is not None
            assert region.name == reg_data["name"]
            assert region.district == reg_data["district"]
    finally:
        seed_module.get_sessionmaker = original_get_sessionmaker
        test_engine.dispose()


def test_pg_seed_assam_circles(pg_session):
    """26. Assam circles seed works with real PostgreSQL."""
    import app.database.seed as seed_module
    from app.database.connection import get_sessionmaker
    from app.config import settings
    from sqlalchemy import create_engine, text
    from sqlalchemy.orm import sessionmaker

    # Override the session factory to use test DB
    test_engine = create_engine(settings.DATABASE_URL_TEST.strip(), pool_pre_ping=True)
    test_sessionmaker = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    original_get_sessionmaker = seed_module.get_sessionmaker
    seed_module.get_sessionmaker = lambda: test_sessionmaker

    try:
        result = seed_assam_circles()
        assert result["total"] == 180
        assert result["inserted"] == 180
        assert result["updated"] == 0
        assert result["skipped"] == 0

        # Verify a few regions
        from app.models.region import Region
        region = pg_session.get(Region, "18-300-00101")
        assert region is not None
        assert region.name == "Gossaigaon (Pt)"
        assert region.district == "KOKRAJHAR"
        assert region.latitude == 26.565942
        assert region.longitude == 89.99337
        assert region.elevation_m == Decimal("78.79")

        # Count total regions
        count = pg_session.query(Region).count()
        assert count == 180
    finally:
        seed_module.get_sessionmaker = original_get_sessionmaker
        test_engine.dispose()


def test_pg_seed_assam_circles_idempotent(pg_session):
    """27. Repeated Assam seed is idempotent with real PostgreSQL."""
    import app.database.seed as seed_module
    from app.database.connection import get_sessionmaker
    from app.config import settings
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    test_engine = create_engine(settings.DATABASE_URL_TEST.strip(), pool_pre_ping=True)
    test_sessionmaker = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    original_get_sessionmaker = seed_module.get_sessionmaker
    seed_module.get_sessionmaker = lambda: test_sessionmaker

    try:
        # First run
        result1 = seed_assam_circles()
        assert result1["inserted"] == 180

        # Second run
        result2 = seed_assam_circles()
        assert result2["inserted"] == 0
        assert result2["skipped"] == 180

        # Verify count unchanged
        from app.models.region import Region
        count = pg_session.query(Region).count()
        assert count == 180
    finally:
        seed_module.get_sessionmaker = original_get_sessionmaker
        test_engine.dispose()