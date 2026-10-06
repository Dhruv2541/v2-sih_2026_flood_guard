import json
import logging
import sys
from decimal import Decimal
from pathlib import Path
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from app.database.connection import get_sessionmaker
from app.models.region import Region

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("seed")

# Explicit development mock regions (NOT the final production Assam grid)
DEV_MOCK_REGIONS = [
    {
        "region_id": "DEV_AS_BAR_01",
        "name": "Barpeta Development Grid Region",
        "district": "Barpeta",
        "latitude": 26.3245,
        "longitude": 91.0082,
        "elevation_m": Decimal("35.0"),
    },
    {
        "region_id": "DEV_AS_DHU_01",
        "name": "Dhubri Development Grid Region",
        "district": "Dhubri",
        "latitude": 26.0207,
        "longitude": 89.9744,
        "elevation_m": Decimal("30.0"),
    },
    {
        "region_id": "DEV_AS_MAJ_01",
        "name": "Majuli Development Grid Region",
        "district": "Majuli",
        "latitude": 26.9602,
        "longitude": 94.2157,
        "elevation_m": Decimal("85.0"),
    },
]


def seed_development_regions() -> bool:
    """Explicitly seeds temporary development grid regions.
    Idempotent: skips records that already exist.
    Never executes automatically on application startup, import, or tests.
    """
    logger.info("Starting development region seed...")
    session_factory = get_sessionmaker()
    if session_factory is None:
        logger.error("Seeding aborted: Database connection is not configured.")
        return False

    session: Session = session_factory()
    try:
        inserted_count = 0
        for reg_data in DEV_MOCK_REGIONS:
            existing = session.get(Region, reg_data["region_id"])
            if existing is None:
                new_region = Region(**reg_data)
                session.add(new_region)
                inserted_count += 1
                logger.info(f"Adding development region: {reg_data['region_id']} ({reg_data['name']})")
            else:
                logger.info(f"Development region already exists, skipping: {reg_data['region_id']}")

        session.commit()
        logger.info(f"Seeding completed. Inserted {inserted_count} new development regions.")
        return True
    except Exception as e:
        session.rollback()
        logger.error(f"Seeding failed: {type(e).__name__} - {e}")
        return False
    finally:
        session.close()


# ==============================================================================
# ASSAM REVENUE CIRCLES SEED
# ==============================================================================

ASSAM_CIRCLES_PATH = Path(__file__).parent.parent.parent / "data" / "assam_circles.json"


class RegionSeedError(Exception):
    """Raised when region seed data validation or insertion fails."""
    pass


def _load_assam_circles() -> List[Dict[str, Any]]:
    """Load and parse the Assam Revenue Circles JSON dataset."""
    if not ASSAM_CIRCLES_PATH.exists():
        raise RegionSeedError(f"Assam circles data file not found: {ASSAM_CIRCLES_PATH}")

    try:
        with open(ASSAM_CIRCLES_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        raise RegionSeedError(f"Failed to parse JSON: {e}") from e

    if not isinstance(data, list):
        raise RegionSeedError("Expected JSON array of region objects")

    return data


def _validate_region_record(record: Dict[str, Any], index: int) -> None:
    """Validate a single region record from the dataset.

    Args:
        record: Region data dictionary
        index: Index in the dataset (for error reporting)

    Raises:
        RegionSeedError: If validation fails
    """
    # Required fields
    required_fields = ("object_id", "name", "district", "lat", "lon")
    for field in required_fields:
        if field not in record:
            raise RegionSeedError(f"Record {index}: missing required field '{field}'")
        if record[field] is None:
            raise RegionSeedError(f"Record {index}: field '{field}' is null")

    # region_id (object_id) must be non-empty string
    region_id = str(record["object_id"]).strip()
    if not region_id:
        raise RegionSeedError(f"Record {index}: object_id is empty")

    # name must be non-empty
    name = str(record["name"]).strip()
    if not name:
        raise RegionSeedError(f"Record {index}: name is empty")

    # district must be non-empty
    district = str(record["district"]).strip()
    if not district:
        raise RegionSeedError(f"Record {index}: district is empty")

    # latitude validation
    try:
        lat = float(record["lat"])
    except (TypeError, ValueError):
        raise RegionSeedError(f"Record {index}: invalid latitude '{record['lat']}'")
    if not (-90.0 <= lat <= 90.0):
        raise RegionSeedError(f"Record {index}: latitude out of bounds [-90, 90]: {lat}")

    # longitude validation
    try:
        lon = float(record["lon"])
    except (TypeError, ValueError):
        raise RegionSeedError(f"Record {index}: invalid longitude '{record['lon']}'")
    if not (-180.0 <= lon <= 180.0):
        raise RegionSeedError(f"Record {index}: longitude out of bounds [-180, 180]: {lon}")

    # elevation_m (optional, nullable)
    if "elevation" in record and record["elevation"] is not None:
        try:
            Decimal(str(record["elevation"]))
        except (TypeError, ValueError, Exception):
            raise RegionSeedError(f"Record {index}: invalid elevation '{record['elevation']}'")


def _map_record_to_region(record: Dict[str, Any]) -> Dict[str, Any]:
    """Map a JSON record to Region model fields.

    Only maps fields that exist in the Region model.
    Additional fields in the JSON are intentionally ignored.
    """
    elevation = None
    if "elevation" in record and record["elevation"] is not None:
        try:
            elevation = Decimal(str(record["elevation"]))
        except (TypeError, ValueError):
            elevation = None  # Will be validated earlier, but defensive

    return {
        "region_id": str(record["object_id"]).strip(),
        "name": str(record["name"]).strip(),
        "district": str(record["district"]).strip(),
        "latitude": float(record["lat"]),
        "longitude": float(record["lon"]),
        "elevation_m": elevation,
    }


def seed_assam_circles() -> Dict[str, int]:
    """Seed the database with Assam Revenue Circles from the JSON dataset.

    Idempotent: on repeated runs, inserts missing regions and updates
    elevation_m for existing regions (other fields are preserved).

    Returns:
        Dict with counts: {"inserted": int, "updated": int, "skipped": int, "total": int}

    Raises:
        RegionSeedError: If validation fails or database error occurs
    """
    logger.info("Starting Assam Revenue Circles seed...")

    # Load and validate dataset
    try:
        records = _load_assam_circles()
    except json.JSONDecodeError as e:
        raise RegionSeedError(f"Failed to parse JSON: {e}") from e

    if not isinstance(records, list):
        raise RegionSeedError("Expected JSON array of region objects")

    logger.info(f"Loaded {len(records)} records from Assam circles dataset")

    # Validate all records first (fail-fast)
    seen_ids = set()
    for i, record in enumerate(records):
        _validate_region_record(record, i)
        region_id = str(record["object_id"]).strip()
        if region_id in seen_ids:
            raise RegionSeedError(f"Duplicate region_id in dataset: {region_id}")
        seen_ids.add(region_id)

    logger.info("All records passed validation")

    session_factory = get_sessionmaker()
    if session_factory is None:
        raise RegionSeedError("Database connection is not configured.")

    session: Session = session_factory()
    inserted_count = 0
    updated_count = 0
    skipped_count = 0

    try:
        for record in records:
            region_data = _map_record_to_region(record)
            region_id = region_data["region_id"]

            existing = session.get(Region, region_id)
            if existing is None:
                # Insert new region
                new_region = Region(**region_data)
                session.add(new_region)
                inserted_count += 1
                logger.info(f"Adding region: {region_id} ({region_data['name']})")
            else:
                # Update elevation_m if present in dataset and different
                # Preserve other fields (name, district, lat, lon) as they are stable identifiers
                if region_data["elevation_m"] is not None:
                    if existing.elevation_m != region_data["elevation_m"]:
                        existing.elevation_m = region_data["elevation_m"]
                        updated_count += 1
                        logger.info(f"Updated elevation for region: {region_id}")
                    else:
                        skipped_count += 1
                        logger.debug(f"Region already exists with same elevation: {region_id}")
                else:
                    skipped_count += 1
                    logger.debug(f"Region already exists (no elevation in dataset): {region_id}")

        session.commit()
        logger.info(
            f"Assam circles seeding completed. "
            f"Inserted: {inserted_count}, Updated: {updated_count}, Skipped: {skipped_count}, Total: {len(records)}"
        )
        return {
            "inserted": inserted_count,
            "updated": updated_count,
            "skipped": skipped_count,
            "total": len(records),
        }

    except RegionSeedError:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f"Assam circles seeding failed: {type(e).__name__} - {e}")
        raise RegionSeedError(f"Seeding failed: {e}") from e
    finally:
        session.close()


if __name__ == "__main__":
    # Support running either seed function via command line
    import argparse

    parser = argparse.ArgumentParser(description="Seed database regions")
    parser.add_argument(
        "--mode",
        choices=["dev", "assam"],
        default="dev",
        help="Which seed to run: 'dev' for development mock regions, 'assam' for Assam Revenue Circles",
    )
    args = parser.parse_args()

    if args.mode == "assam":
        try:
            result = seed_assam_circles()
            print(f"Success: {result}")
            sys.exit(0)
        except RegionSeedError as e:
            print(f"Failed: {e}")
            sys.exit(1)
    else:
        success = seed_development_regions()
        sys.exit(0 if success else 1)
