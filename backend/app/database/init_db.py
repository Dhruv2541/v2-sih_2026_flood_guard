import logging
import sys
from app.database.connection import get_engine
from app.models import Base

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("init_db")


def init_database() -> bool:
    """Explicitly initializes the database schema by creating all registered tables.
    Never executes automatically on application startup or module import.
    """
    logger.info("Validating database connection configuration...")
    engine = get_engine()
    if engine is None:
        logger.error(
            "Database initialization aborted: DATABASE_URL is not configured or contains placeholder values. "
            "Please configure a valid PostgreSQL connection string in your .env file."
        )
        return False

    try:
        logger.info("Connecting to PostgreSQL to create tables (regions, observations, predictions)...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database schema initialized successfully.")
        return True
    except Exception as e:
        logger.error(f"Failed to initialize database schema: {type(e).__name__} - {e}")
        return False


if __name__ == "__main__":
    success = init_database()
    sys.exit(0 if success else 1)
