import logging
from typing import Callable, Optional
from sqlalchemy.orm import Session

from app.database.connection import get_sessionmaker
from app.services.ingestion import IngestionService
from app.services.live_cycle import LivePredictionCycleResult, run_live_prediction_cycle
from app.services.prediction import PredictionService

logger = logging.getLogger("scheduled_live_cycle_job")


async def run_live_cycle_job(
    session_factory: Optional[Callable[[], Optional[Session]]] = None,
    ingestion_service: Optional["IngestionService"] = None,
    prediction_service: Optional["PredictionService"] = None,
) -> Optional[LivePredictionCycleResult]:
    """Executes a single run of the complete live prediction cycle.

    This function:
    1. Obtains a fresh database Session using the existing session infrastructure.
    2. Runs the complete live prediction cycle:
       a. Live weather ingestion (fetch Open-Meteo observations)
       b. Observation persistence (atomic UPSERT)
       c. Region-wide prediction (using latest observations)
       d. Risk classification (backend layer)
       e. Prediction persistence (atomic UPSERT)
    3. Emits structured log metrics for all phases.
    4. Guarantees session closure in a `finally` block regardless of outcome.
    5. Isolates unexpected runtime exceptions at the job boundary to keep the scheduler alive.

    Args:
        session_factory: Optional custom factory returning a SQLAlchemy Session (defaults to get_sessionmaker()).
        ingestion_service: Optional custom IngestionService instance.
        prediction_service: Optional custom PredictionService instance.

    Returns:
        Optional[LivePredictionCycleResult]: Cycle result if successful or partially failed,
                                             None if database unconfigured or unexpected fatal error.
    """
    logger.info("Live prediction cycle job started.")

    factory = session_factory if session_factory is not None else get_sessionmaker()
    if factory is None:
        logger.warning(
            "Database connection is not configured or engine unavailable. "
            "Live prediction cycle job skipped."
        )
        return None

    session: Optional[Session] = factory()
    if session is None:
        logger.warning(
            "Database session factory returned None. "
            "Live prediction cycle job skipped."
        )
        return None

    try:
        result: Optional[LivePredictionCycleResult] = await run_live_prediction_cycle(
            session_factory=lambda: session,
            ingestion_service=ingestion_service,
            prediction_service=prediction_service,
        )

        if result is None:
            logger.warning("Live prediction cycle returned no result (database unavailable).")
            return None

        logger.info(
            f"Live prediction cycle job completed. "
            f"Total regions: {result.total_regions}, "
            f"Successful observations: {result.successful_observations}, "
            f"Successful predictions: {result.successful_predictions}, "
            f"Failed observations: {result.failed_observations}, "
            f"Failed predictions: {result.failed_predictions}."
        )
        return result
    except Exception as exc:
        logger.exception(
            f"Unexpected exception during scheduled live prediction cycle job: {exc}"
        )
        return None
    finally:
        if session is not None:
            session.close()
