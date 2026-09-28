import logging
from typing import Callable, Optional
from sqlalchemy.orm import Session

from app.database.connection import get_sessionmaker
from app.services.ingestion import IngestionResult, IngestionService

logger = logging.getLogger("scheduled_ingestion_job")


async def run_ingestion_job(
    session_factory: Optional[Callable[[], Optional[Session]]] = None,
    ingestion_service: Optional[IngestionService] = None,
) -> Optional[IngestionResult]:
    """Executes a single run of the live weather data ingestion pipeline.
    
    This function:
    1. Obtains a fresh database Session using the existing session infrastructure.
    2. Runs IngestionService to query monitored regions, fetch Open-Meteo observations,
       and persist normalized records with atomic UPSERT (persist=True).
    3. Emits structured log metrics (regions processed, successful, provider failures,
       persisted count, persistence failures).
    4. Guarantees session closure in a `finally` block regardless of outcome.
    5. Isolates unexpected runtime exceptions at the job boundary to keep the scheduler alive.

    Args:
        session_factory: Optional custom factory returning a SQLAlchemy Session (defaults to get_sessionmaker()).
        ingestion_service: Optional custom IngestionService instance (defaults to IngestionService()).

    Returns:
        Optional[IngestionResult]: IngestionResult if successful or partially failed,
                                   None if database unconfigured or unexpected fatal error.
    """
    logger.info("Live weather ingestion job started.")

    factory = session_factory if session_factory is not None else get_sessionmaker()
    if factory is None:
        logger.warning(
            "Database connection is not configured or engine unavailable. "
            "Live weather ingestion job skipped."
        )
        return None

    session: Optional[Session] = factory()
    if session is None:
        logger.warning(
            "Database session factory returned None. "
            "Live weather ingestion job skipped."
        )
        return None

    try:
        service = ingestion_service or IngestionService()
        result: IngestionResult = await service.run_live_ingestion(
            session=session,
            persist=True,
        )

        regions_processed = len(result.successful_observations) + len(result.failed_regions)
        provider_failures = len(result.failed_regions)
        persistence_failures = len(result.persistence_failures)

        logger.info(
            f"Live weather ingestion job completed. "
            f"Regions processed: {regions_processed}, "
            f"Successful observations: {len(result.successful_observations)}, "
            f"Provider failures: {provider_failures}, "
            f"Persisted count: {result.persisted_count}, "
            f"Persistence failures: {persistence_failures}."
        )
        return result
    except Exception as exc:
        logger.exception(
            f"Unexpected exception during scheduled live weather ingestion job: {exc}"
        )
        return None
    finally:
        if session is not None:
            session.close()
