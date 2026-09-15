import logging
import sys
from decimal import Decimal
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


if __name__ == "__main__":
    success = seed_development_regions()
    sys.exit(0 if success else 1)
