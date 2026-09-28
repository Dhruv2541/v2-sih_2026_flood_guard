import logging
from typing import List, Optional, Sequence
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.data.exceptions import WeatherProviderError
from app.data.providers.base import WeatherProvider
from app.data.providers.open_meteo import OpenMeteoProvider
from app.data.schemas import NormalizedObservation
from app.models.region import Region
from app.services.observation_persistence import (
    FailedPersistence,
    ObservationPersistenceService,
)

logger = logging.getLogger("ingestion_service")


class FailedRegion(BaseModel):
    """Structured, safe summary of a failed region ingestion."""

    model_config = ConfigDict(extra="forbid")

    region_id: str
    error_type: str
    message: str


class IngestionResult(BaseModel):
    """Result of a region-based live weather ingestion run.
    
    Contains successfully retrieved normalized observations, isolated provider failures,
    persisted row count, and isolated persistence failures.
    """

    model_config = ConfigDict(extra="forbid")

    successful_observations: List[NormalizedObservation]
    failed_regions: List[FailedRegion]
    persisted_count: int = 0
    persistence_failures: List[FailedPersistence] = []


def get_monitored_regions(session: Session) -> Sequence[Region]:
    """Retrieves all monitored geographic regions from the PostgreSQL regions table.
    
    Read-only query ordered deterministically by region_id.
    """
    stmt = select(Region).order_by(Region.region_id)
    return session.scalars(stmt).all()


class IngestionService:
    """Orchestrates region-based live weather data ingestion.
    
    Coordinates:
    1. Reading regions from PostgreSQL (or in-memory sequence)
    2. Calling WeatherProvider (OpenMeteoProvider by default) for each region
    3. Collecting successful NormalizedObservation objects
    4. Isolating per-region provider failures without terminating the entire ingestion run
    5. Optionally persisting successful observations to PostgreSQL via ObservationPersistenceService
    """

    def __init__(
        self,
        provider: Optional[WeatherProvider] = None,
        persistence_service: Optional[ObservationPersistenceService] = None,
    ) -> None:
        self.provider = provider or OpenMeteoProvider()
        self.persistence_service = persistence_service or ObservationPersistenceService()

    async def run_live_ingestion(
        self,
        regions: Optional[Sequence[Region]] = None,
        session: Optional[Session] = None,
        persist: bool = False,
    ) -> IngestionResult:
        """Executes a live weather ingestion run across target regions.
        
        Args:
            regions: Optional explicit sequence of Region objects.
            session: Optional database Session used to query regions (if `regions` is None)
                     and/or to persist observations (if `persist=True`).
            persist: When True, persists successful observations to the database using atomic UPSERT.
                     Defaults to False (in-memory mode, zero database writes).

        Returns:
            IngestionResult: Structured collection of successful observations, provider failures,
                             persisted count, and persistence failures.

        Raises:
            ValueError: If neither `regions` nor `session` is provided, or if `persist=True` without a session.
        """
        if persist and session is None:
            raise ValueError("A database session must be provided when persist=True.")

        if regions is None:
            if session is None:
                raise ValueError("Either an explicit 'regions' list or a database 'session' must be provided.")
            logger.info("Querying monitored regions from PostgreSQL database...")
            target_regions = get_monitored_regions(session)
        else:
            target_regions = regions

        if len(target_regions) == 0:
            logger.info("Zero regions provided for ingestion. Returning empty result.")
            return IngestionResult(
                successful_observations=[],
                failed_regions=[],
                persisted_count=0,
                persistence_failures=[],
            )

        successful_observations: List[NormalizedObservation] = []
        failed_regions: List[FailedRegion] = []

        logger.info(f"Starting sequential live weather ingestion for {len(target_regions)} regions...")

        # Process regions sequentially for deterministic ordering and clear diagnostics
        for region in target_regions:
            reg_id = getattr(region, "region_id", str(region))
            lat = getattr(region, "latitude", None)
            lon = getattr(region, "longitude", None)

            try:
                logger.debug(f"Fetching live weather observation for region '{reg_id}' ({lat}, {lon})...")
                obs = await self.provider.fetch_current_observation(
                    region_id=reg_id,
                    latitude=lat,
                    longitude=lon,
                )
                successful_observations.append(obs)
                logger.debug(f"Successfully obtained observation for region '{reg_id}'.")
            except WeatherProviderError as exc:
                # Handle expected domain provider failures with isolation
                err_type = type(exc).__name__
                logger.warning(
                    f"Weather provider failure for region '{reg_id}': [{err_type}] {exc.message}"
                )
                failed_regions.append(
                    FailedRegion(
                        region_id=reg_id,
                        error_type=err_type,
                        message=exc.message,
                    )
                )
            except Exception as exc:
                # Handle unexpected runtime errors: isolate failure, log traceback, safe user message
                logger.exception(
                    f"Unexpected runtime error processing region '{reg_id}': {exc}"
                )
                failed_regions.append(
                    FailedRegion(
                        region_id=reg_id,
                        error_type="UnexpectedError",
                        message=f"An unexpected error occurred while processing region '{reg_id}'.",
                    )
                )

        logger.info(
            f"Retrieval phase complete. {len(successful_observations)} succeeded, "
            f"{len(failed_regions)} failed."
        )

        # Optional persistence phase
        persisted_count = 0
        persistence_failures: List[FailedPersistence] = []

        if persist and len(successful_observations) > 0 and session is not None:
            logger.info(f"Persisting {len(successful_observations)} observations to PostgreSQL...")
            persist_result = self.persistence_service.persist_batch(
                session=session,
                observations=successful_observations,
            )
            persisted_count = persist_result.persisted_count
            persistence_failures = persist_result.failed_observations
            logger.info(
                f"Persistence phase complete. {persisted_count} rows persisted, "
                f"{len(persistence_failures)} persistence failures."
            )

        return IngestionResult(
            successful_observations=successful_observations,
            failed_regions=failed_regions,
            persisted_count=persisted_count,
            persistence_failures=persistence_failures,
        )
