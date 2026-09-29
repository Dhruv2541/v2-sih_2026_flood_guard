"""Operational live prediction cycle orchestration.

Coordinates the end-to-end backend flow:
Canonical Assam Regions → Live Weather Ingestion → Observation Persistence
→ Region-Wide Prediction → Risk Classification → Prediction Persistence
→ Existing Prediction APIs
"""

import logging
from dataclasses import dataclass
from typing import Callable, Optional
from sqlalchemy.orm import Session

from app.database.connection import get_sessionmaker
from app.ml.baseline import HydrologicalBaselineModel
from app.ml.exceptions import MLModelUnavailableError, MLInferenceError
from app.services.ingestion import IngestionResult, IngestionService
from app.services.prediction import (
    PredictionService,
    RegionWidePredictionResult,
)
from app.services.observation_persistence import ObservationPersistenceService

logger = logging.getLogger("live_prediction_cycle")


@dataclass(frozen=True)
class LivePredictionCycleResult:
    """Result of a complete live prediction cycle execution.

    Attributes:
        ingestion_result: Result of the live weather ingestion phase.
        prediction_result: Result of the region-wide prediction phase.
        total_regions: Total number of configured regions.
        successful_observations: Number of regions with successful ingestion.
        successful_predictions: Number of regions with successful predictions.
        failed_observations: Number of regions with ingestion failures.
        failed_predictions: Number of regions with prediction failures.
    """
    ingestion_result: "IngestionResult"
    prediction_result: "RegionWidePredictionResult"
    total_regions: int
    successful_observations: int
    successful_predictions: int
    failed_observations: int
    failed_predictions: int


class LivePredictionCycleError(Exception):
    """Base exception for live prediction cycle errors."""
    pass


class LivePredictionCycleService:
    """Orchestrates the complete operational live prediction cycle.

    Coordinates the flow:
    1. Retrieve configured Assam regions from database
    2. Execute live weather ingestion (fetch + persist observations)
    3. Execute region-wide prediction using latest observations
    4. Return structured result for logging/monitoring

    Uses existing services via dependency injection:
    - IngestionService (ingestion + observation persistence)
    - PredictionService (prediction + risk classification + prediction persistence)
    """

    def __init__(
        self,
        ingestion_service: Optional[IngestionService] = None,
        prediction_service: Optional[PredictionService] = None,
        session_factory: Optional[Callable[[], Optional[Session]]] = None,
    ) -> None:
        self._ingestion_service = ingestion_service or IngestionService()
        self._prediction_service = prediction_service
        self._session_factory = session_factory or get_sessionmaker

    def _get_prediction_service(self, session: Session) -> PredictionService:
        """Get or create PredictionService with the baseline model."""
        if self._prediction_service is not None:
            return self._prediction_service
        model = HydrologicalBaselineModel()
        return PredictionService(model=model, session=session)

    async def run_complete_cycle(self) -> Optional[LivePredictionCycleResult]:
        """Executes the complete operational live prediction cycle.

        Flow:
        1. Get database session
        2. Run live weather ingestion (fetch + persist observations)
        4. Run region-wide prediction using latest persisted observations
        5. Return structured result

        Returns:
            LivePredictionCycleResult: Complete cycle result, or None if DB unavailable.

        Raises:
            LivePredictionCycleError: On systemic failures (DB unavailable, model unavailable).
        """
        logger.info("Starting live prediction cycle...")

        factory = self._session_factory()
        if factory is None:
            logger.warning(
                "Database connection is not configured or engine unavailable. "
                "Live prediction cycle skipped."
            )
            return None

        session: Optional[Session] = factory()
        if session is None:
            logger.warning(
                "Database session factory returned None. "
                "Live prediction cycle skipped."
            )
            return None

        try:
            # Phase 1: Live Weather Ingestion + Observation Persistence
            logger.info("Phase 1: Starting live weather ingestion...")
            ingestion_service = self._ingestion_service or IngestionService()
            ingestion_result: "IngestionResult" = await ingestion_service.run_live_ingestion(
                session=session,
                persist=True,
            )

            regions_processed = len(ingestion_result.successful_observations) + len(ingestion_result.failed_regions)
            logger.info(
                f"Phase 1 complete. Regions processed: {regions_processed}, "
                f"Successful: {len(ingestion_result.successful_observations)}, "
                f"Provider failures: {len(ingestion_result.failed_regions)}, "
                f"Persisted: {ingestion_result.persisted_count}, "
                f"Persistence failures: {len(ingestion_result.persistence_failures)}."
            )

            # Phase 2: Region-Wide Prediction
            logger.info("Phase 2: Starting region-wide prediction...")
            prediction_service = self._get_prediction_service(session)

            try:
                prediction_result: "RegionWidePredictionResult" = (
                    prediction_service.generate_region_wide_predictions()
                )
            except MLModelUnavailableError as exc:
                logger.error(f"Model unavailable during prediction: {exc}")
                raise LivePredictionCycleError("Prediction model unavailable") from exc
            except MLInferenceError as exc:
                logger.error(f"Model inference error during prediction: {exc}")
                raise LivePredictionCycleError("Model inference failed") from exc

            logger.info(
                f"Phase 2 complete. Total regions: {prediction_result.total_regions}, "
                f"Successful predictions: {prediction_result.successful_count}, "
                f"Failed predictions: {prediction_result.failed_count}."
            )

            # Compile final result
            result = LivePredictionCycleResult(
                ingestion_result=ingestion_result,
                prediction_result=prediction_result,
                total_regions=prediction_result.total_regions,
                successful_observations=len(ingestion_result.successful_observations),
                successful_predictions=prediction_result.successful_count,
                failed_observations=len(ingestion_result.failed_regions),
                failed_predictions=prediction_result.failed_count,
            )

            logger.info(
                f"Live prediction cycle completed. "
                f"Total regions: {result.total_regions}, "
                f"Successful observations: {result.successful_observations}, "
                f"Successful predictions: {result.successful_predictions}, "
                f"Failed observations: {result.failed_observations}, "
                f"Failed predictions: {result.failed_predictions}."
            )

            return result

        except LivePredictionCycleError:
            raise
        except Exception as exc:
            logger.exception(f"Unexpected exception during live prediction cycle: {exc}")
            raise LivePredictionCycleError(f"Cycle failed: {exc}") from exc
        finally:
            if session is not None:
                session.close()


# Convenience function for scheduler integration
async def run_live_prediction_cycle(
    session_factory: Optional[Callable[[], Optional[Session]]] = None,
    ingestion_service: Optional[IngestionService] = None,
    prediction_service: Optional[PredictionService] = None,
) -> Optional[LivePredictionCycleResult]:
    """Convenience function to run the complete live prediction cycle.

    Used by the scheduler job. Creates services with defaults if not provided.

    Args:
        session_factory: Optional custom session factory.
        ingestion_service: Optional custom IngestionService.
        prediction_service: Optional custom PredictionService.

    Returns:
        Optional[LivePredictionCycleResult]: Cycle result or None if DB unavailable.
    """
    cycle_service = LivePredictionCycleService(
        ingestion_service=ingestion_service,
        prediction_service=prediction_service,
        session_factory=session_factory,
    )
    return await cycle_service.run_complete_cycle()