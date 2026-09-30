"""Production region seeding from assam_circles.json (canonical 180 regions).

Seeds the regions table with the canonical Assam Revenue Circles using
the authoritative 18-XXX-XXXXX region_id format.
"""

import json
import logging
import sys
from decimal import Decimal
from pathlib import Path
from sqlalchemy.orm import Session

from app.database.connection import get_sessionmaker
from app.models.region import Region

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("seed_production_regions")

CIRCLES_PATH = Path(__file__).parent.parent.parent / "data" / "assam_circles.json"


def load_circles() -> list:
    """Load canonical Assam circles from JSON."""
    with open(CIRCLES_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def map_circle_to_region(circle: dict) -> dict:
    """Map assam_circles.json fields to Region model columns."""
    return {
        "region_id": circle["object_id"],
        "name": circle["name"],
        "district": circle["district"],
        "latitude": circle["lat"],
        "longitude": circle["lon"],
        "elevation_m": Decimal(str(circle.get("elevation", 0.0))) if circle.get("elevation") is not None else None,
        "distance_to_river_m": Decimal(str(circle.get("distance_from_river_m", 0.0))) if circle.get("distance_from_river_m") is not None else None,
        "soil_clay_pct": Decimal(str(circle.get("soil_clay_pct", 0.0))) if circle.get("soil_clay_pct") is not None else None,
        "population_density": Decimal(str(circle.get("population_density", 0.0))) if circle.get("population_density") is not None else None,
        "curve_number": Decimal(str(circle.get("curve_number", 0.0))) if circle.get("curve_number") is not None else None,
    }


def seed_production_regions() -> bool:
    """Seeds production Assam Revenue Circles (180 regions).

    Idempotent: skips records that already exist.
    Never executes automatically on application startup, import, or tests.
    """
    logger.info("Starting production region seed from assam_circles.json...")
    session_factory = get_sessionmaker()
    if session_factory is None:
        logger.error("Seeding aborted: Database connection is not configured.")
        return False

    circles = load_circles()
    logger.info(f"Loaded {len(circles)} circles from assam_circles.json")

    session: Session = session_factory()
    try:
        inserted_count = 0
        skipped_count = 0
        for circle in circles:
            region_data = map_circle_to_region(circle)
            existing = session.get(Region, region_data["region_id"])
            if existing is None:
                new_region = Region(**region_data)
                session.add(new_region)
                inserted_count += 1
                logger.debug(f"Adding region: {region_data['region_id']} ({region_data['name']})")
            else:
                skipped_count += 1

        session.commit()
        logger.info(f"Seeding completed. Inserted {inserted_count} new regions, skipped {skipped_count} existing.")
        return True
    except Exception as e:
        session.rollback()
        logger.error(f"Seeding failed: {type(e).__name__} - {e}")
        return False
    finally:
        session.close()


if __name__ == "__main__":
    success = seed_production_regions()
    sys.exit(0 if success else 1)