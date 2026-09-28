from datetime import datetime
import logging
from typing import List, Optional, Sequence
from pydantic import BaseModel, ConfigDict
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.data.schemas import NormalizedObservation
from app.models.observation import Observation
from app.models.region import Region

logger = logging.getLogger("observation_persistence")


# ==============================================================================
# EXCEPTIONS
# ==============================================================================


class ObservationPersistenceError(Exception):
    """Base exception for observation persistence operations."""

    def __init__(self, message: str, region_id: Optional[str] = None) -> None:
        super().__init__(message)
        self.message = message
        self.region_id = region_id

    def __str__(self) -> str:
        return self.message


class UnknownRegionError(ObservationPersistenceError):
    """Raised when an observation references a region_id that does not exist in regions table."""
    pass


# ==============================================================================
# SCHEMAS
# ==============================================================================


class FailedPersistence(BaseModel):
    """Structured, safe summary of a failed observation persistence."""

    model_config = ConfigDict(extra="forbid")

    region_id: str
    recorded_at: datetime
    error_type: str
    message: str


class PersistenceResult(BaseModel):
    """Result of an observation persistence batch operation."""

    model_config = ConfigDict(extra="forbid")

    persisted_count: int
    failed_observations: List[FailedPersistence]


# ==============================================================================
# MODEL MAPPING
# ==============================================================================


def map_to_model(normalized: NormalizedObservation) -> Observation:
    """Explicitly converts a NormalizedObservation into an Observation SQLAlchemy model.
    
    Guarantees:
    - Exact field mapping without business logic
    - None optional fields remain None (SQL NULL), especially water_level_m
    - Never fabricates missing values or converts None to 0
    - Exact Decimal precision preserved for rainfall, temperature, and humidity
    """
    return Observation(
        region_id=normalized.region_id,
        recorded_at=normalized.recorded_at,
        rainfall_1h_mm=normalized.rainfall_1h_mm,
        rainfall_3h_mm=normalized.rainfall_3h_mm,
        rainfall_6h_mm=normalized.rainfall_6h_mm,
        rainfall_24h_mm=normalized.rainfall_24h_mm,
        water_level_m=normalized.water_level_m,
        temperature_c=normalized.temperature_c,
        humidity_pct=normalized.humidity_pct,
        data_source=normalized.data_source,
    )


# ==============================================================================
# PERSISTENCE SERVICE
# ==============================================================================


class ObservationPersistenceService:
    """Dedicated service for persisting NormalizedObservation objects into PostgreSQL.
    
    Responsibilities:
    - Map normalized observations to the SQLAlchemy Observation model
    - Verify region integrity before database insertion
    - Execute atomic PostgreSQL UPSERT on UNIQUE(region_id, recorded_at)
    - Enforce outer transaction with nested savepoints per observation
    - Maintain strict separation: no Open-Meteo HTTP logic, no ML logic
    """

    def persist_observation(
        self,
        session: Session,
        observation: NormalizedObservation,
    ) -> Optional[int]:
        """Persists a single observation using atomic PostgreSQL UPSERT.
        
        Does NOT commit the session; transaction boundary is managed by the caller/batch.
        
        Args:
            session: Active SQLAlchemy session
            observation: NormalizedObservation object to persist

        Returns:
            Optional[int]: The database generated row ID.

        Raises:
            UnknownRegionError: If the region_id does not exist in the regions table.
            SQLAlchemyError: On database constraint or execution failure.
        """
        # Application-level existence check for clean diagnostic error
        region = session.get(Region, observation.region_id)
        if region is None:
            raise UnknownRegionError(
                f"Region '{observation.region_id}' is not a registered monitored region.",
                region_id=observation.region_id,
            )

        # Atomic PostgreSQL UPSERT on UNIQUE(region_id, recorded_at)
        stmt = pg_insert(Observation).values(
            region_id=observation.region_id,
            recorded_at=observation.recorded_at,
            rainfall_1h_mm=observation.rainfall_1h_mm,
            rainfall_3h_mm=observation.rainfall_3h_mm,
            rainfall_6h_mm=observation.rainfall_6h_mm,
            rainfall_24h_mm=observation.rainfall_24h_mm,
            water_level_m=observation.water_level_m,
            temperature_c=observation.temperature_c,
            humidity_pct=observation.humidity_pct,
            data_source=observation.data_source,
        )

        # On conflict on unique constraint, update observation values in-place (id and created_at preserved)
        stmt = stmt.on_conflict_do_update(
            index_elements=["region_id", "recorded_at"],
            set_={
                "rainfall_1h_mm": stmt.excluded.rainfall_1h_mm,
                "rainfall_3h_mm": stmt.excluded.rainfall_3h_mm,
                "rainfall_6h_mm": stmt.excluded.rainfall_6h_mm,
                "rainfall_24h_mm": stmt.excluded.rainfall_24h_mm,
                "water_level_m": stmt.excluded.water_level_m,
                "temperature_c": stmt.excluded.temperature_c,
                "humidity_pct": stmt.excluded.humidity_pct,
                "data_source": stmt.excluded.data_source,
            },
        ).returning(Observation.id)

        row_id = session.scalar(stmt)
        return row_id

    def persist_batch(
        self,
        session: Session,
        observations: Sequence[NormalizedObservation],
    ) -> PersistenceResult:
        """Persists a batch of normalized observations using an outer transaction with nested savepoints.
        
        Transaction Flow:
        1. Outer transaction wraps the batch.
        2. Each observation runs in its own nested savepoint (`session.begin_nested()`).
        3. If an observation fails, only that savepoint is rolled back; valid sibling observations survive.
        4. Outer transaction commits all successfully persisted observations.
        
        Args:
            session: Active SQLAlchemy session
            observations: Sequence of NormalizedObservation objects

        Returns:
            PersistenceResult: Count of persisted rows and list of isolated failures.
        """
        if not observations:
            return PersistenceResult(persisted_count=0, failed_observations=[])

        persisted_count = 0
        failed_observations: List[FailedPersistence] = []

        try:
            for obs in observations:
                try:
                    with session.begin_nested():
                        self.persist_observation(session=session, observation=obs)
                        persisted_count += 1
                except UnknownRegionError as exc:
                    logger.warning(
                        f"Persistence rejected for region '{obs.region_id}': [UnknownRegionError] {exc.message}"
                    )
                    failed_observations.append(
                        FailedPersistence(
                            region_id=obs.region_id,
                            recorded_at=obs.recorded_at,
                            error_type="UnknownRegionError",
                            message=exc.message,
                        )
                    )
                except SQLAlchemyError as exc:
                    err_type = type(exc).__name__
                    logger.warning(
                        f"Database error persisting observation for region '{obs.region_id}': [{err_type}] {exc}"
                    )
                    failed_observations.append(
                        FailedPersistence(
                            region_id=obs.region_id,
                            recorded_at=obs.recorded_at,
                            error_type=err_type,
                            message=f"Database persistence failure for region '{obs.region_id}'.",
                        )
                    )
                except Exception as exc:
                    logger.exception(
                        f"Unexpected error persisting observation for region '{obs.region_id}': {exc}"
                    )
                    failed_observations.append(
                        FailedPersistence(
                            region_id=obs.region_id,
                            recorded_at=obs.recorded_at,
                            error_type="UnexpectedPersistenceError",
                            message=f"An unexpected error occurred while persisting observation for region '{obs.region_id}'.",
                        )
                    )

            # Commit outer transaction once the batch is processed
            session.commit()
        except Exception as exc:
            session.rollback()
            logger.exception(f"Outer transaction commit failed for observation batch: {exc}")
            raise ObservationPersistenceError(
                f"Failed to commit observation batch transaction: {exc}"
            ) from exc

        return PersistenceResult(
            persisted_count=persisted_count,
            failed_observations=failed_observations,
        )
