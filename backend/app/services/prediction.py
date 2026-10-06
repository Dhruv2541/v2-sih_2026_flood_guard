from datetime import datetime, timezone, timedelta
from decimal import Decimal
import logging
from typing import List, Optional, Sequence
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ml.base import FloodPredictionModel, validate_model_output
from app.ml.exceptions import (
    MLInferenceError,
    MLInputError,
    MLModelUnavailableError,
    MLOutputValidationError,
)
from app.ml.feature_preparation import prepare_prediction_input
from app.ml.schemas import MLPredictionInput, MLPredictionOutput
from app.models.observation import Observation
from app.models.prediction import Prediction
from app.models.region import Region

logger = logging.getLogger("prediction_service")


class RegionNotFoundError(Exception):
    """Raised when a requested region does not exist in the database."""

    def __init__(self, region_id: str) -> None:
        super().__init__(f"Region '{region_id}' not found")
        self.region_id = region_id


class NoUsableObservationError(Exception):
    """Raised when no valid observation exists for a region to construct prediction input."""

    def __init__(self, region_id: str) -> None:
        super().__init__(f"No usable observation found for region '{region_id}'")
        self.region_id = region_id


class PredictionPersistenceError(Exception):
    """Raised when prediction persistence to the database fails."""

    def __init__(self, message: str, region_id: Optional[str] = None) -> None:
        super().__init__(message)
        self.message = message
        self.region_id = region_id


class FailedRegionPrediction(BaseModel):
    """Structured summary of a failed region prediction in a batch operation."""

    model_config = ConfigDict(extra="forbid")

    region_id: str
    error_type: str
    message: str


class RegionWidePredictionResult(BaseModel):
    """Result of a region-wide prediction operation."""

    model_config = ConfigDict(extra="forbid")

    successful_predictions: Sequence[MLPredictionOutput]
    failed_predictions: List[FailedRegionPrediction]
    total_regions: int
    successful_count: int
    failed_count: int


class PredictionService:
    """Orchestrates the operational flood prediction pipeline.

    Responsibilities:
    1. Accept a region identifier.
    2. Retrieve the latest usable observation(s) required to construct prediction input.
    3. Use feature_preparation to construct a valid MLPredictionInput.
    4. Call an injected FloodPredictionModel.
    5. Validate the returned MLPredictionOutput.
    6. Persist the prediction through the database.
    7. Return the validated prediction.

    The service depends on the FloodPredictionModel interface (dependency injection),
    not on any concrete ML implementation.
    """

    def __init__(
        self,
        model: FloodPredictionModel,
        session: Session,
    ) -> None:
        self._model = model
        self._session = session

    def generate_prediction(self, region_id: str) -> MLPredictionOutput:
        """Generates a flood prediction for the specified region.

        Args:
            region_id: Canonical region identifier.

        Returns:
            MLPredictionOutput: Validated prediction result.

        Raises:
            RegionNotFoundError: If the region does not exist.
            NoUsableObservationError: If no valid observation exists for the region.
            MLInputError: If feature preparation fails due to missing required data.
            MLModelUnavailableError: If the model is unavailable.
            MLInferenceError: If model inference fails.
            MLOutputValidationError: If model output validation fails.
            PredictionPersistenceError: If database persistence fails.
        """
        region = self._get_region(region_id)
        observation = self._get_latest_observation(region_id)

        ml_input = self._prepare_ml_input(observation, region)
        ml_output = self._invoke_model(ml_input)
        validated_output = self._validate_output(ml_output, region_id)
        self._persist_prediction(validated_output)

        return validated_output

    def generate_region_wide_predictions(self) -> RegionWidePredictionResult:
        """Generates flood predictions for all monitored regions.

        Retrieves all regions from the database and attempts to generate
        a prediction for each. Failures for individual regions are isolated
        and do not stop the entire operation.

        Returns:
            RegionWidePredictionResult: Contains successful predictions and
            structured failures for regions that could not be processed.

        Raises:
            MLModelUnavailableError: If the model is unavailable.
            MLInferenceError: If model inference fails catastrophically.
        """
        # Get all monitored regions
        stmt = select(Region).order_by(Region.region_id)
        regions = self._session.scalars(stmt).all()

        if not regions:
            logger.info("No monitored regions found in database.")
            return RegionWidePredictionResult(
                successful_predictions=[],
                failed_predictions=[],
                total_regions=0,
                successful_count=0,
                failed_count=0,
            )

        logger.info(f"Starting region-wide prediction for {len(regions)} regions...")

        successful_predictions: List[MLPredictionOutput] = []
        failed_predictions: List[FailedRegionPrediction] = []

        for region in regions:
            reg_id = region.region_id
            try:
                logger.debug(f"Generating prediction for region '{reg_id}'...")
                ml_output = self.generate_prediction(reg_id)
                successful_predictions.append(ml_output)
                logger.debug(f"Successfully generated prediction for region '{reg_id}'.")
            except RegionNotFoundError as exc:
                logger.warning(f"Region not found during batch prediction: {exc}")
                failed_predictions.append(
                    FailedRegionPrediction(
                        region_id=reg_id,
                        error_type="RegionNotFoundError",
                        message=str(exc),
                    )
                )
            except NoUsableObservationError as exc:
                logger.warning(f"No usable observation for region '{reg_id}': {exc}")
                failed_predictions.append(
                    FailedRegionPrediction(
                        region_id=reg_id,
                        error_type="NoUsableObservationError",
                        message=str(exc),
                    )
                )
            except MLInputError as exc:
                logger.warning(f"Invalid input for region '{reg_id}': {exc}")
                failed_predictions.append(
                    FailedRegionPrediction(
                        region_id=reg_id,
                        error_type="MLInputError",
                        message=str(exc),
                    )
                )
            except MLModelUnavailableError as exc:
                # Model unavailable is a systemic failure - re-raise to stop the batch
                logger.error(f"Model unavailable during batch prediction: {exc}")
                raise
            except MLInferenceError as exc:
                logger.error(f"Model inference failed for region '{reg_id}': {exc}")
                failed_predictions.append(
                    FailedRegionPrediction(
                        region_id=reg_id,
                        error_type="MLInferenceError",
                        message=str(exc),
                    )
                )
            except MLOutputValidationError as exc:
                logger.error(f"Model output validation failed for region '{reg_id}': {exc}")
                failed_predictions.append(
                    FailedRegionPrediction(
                        region_id=reg_id,
                        error_type="MLOutputValidationError",
                        message=str(exc),
                    )
                )
            except PredictionPersistenceError as exc:
                logger.error(f"Persistence failed for region '{reg_id}': {exc.message}")
                failed_predictions.append(
                    FailedRegionPrediction(
                        region_id=reg_id,
                        error_type="PredictionPersistenceError",
                        message=exc.message,
                    )
                )
            except Exception as exc:
                logger.exception(f"Unexpected error for region '{reg_id}': {exc}")
                failed_predictions.append(
                    FailedRegionPrediction(
                        region_id=reg_id,
                        error_type="UnexpectedError",
                        message=f"An unexpected error occurred while processing region '{reg_id}'.",
                    )
                )

        logger.info(
            f"Region-wide prediction complete. {len(successful_predictions)} succeeded, "
            f"{len(failed_predictions)} failed."
        )

        return RegionWidePredictionResult(
            successful_predictions=successful_predictions,
            failed_predictions=failed_predictions,
            total_regions=len(regions),
            successful_count=len(successful_predictions),
            failed_count=len(failed_predictions),
        )

    def _get_region(self, region_id: str) -> Region:
        region = self._session.get(Region, region_id)
        if region is None:
            raise RegionNotFoundError(region_id)
        return region

    def _get_latest_observation(self, region_id: str) -> Observation:
        stmt = (
            select(Observation)
            .where(Observation.region_id == region_id)
            .order_by(Observation.recorded_at.desc())
            .limit(1)
        )
        observation = self._session.scalar(stmt)
        if observation is None:
            raise NoUsableObservationError(region_id)
        return observation

    def _prepare_ml_input(
        self,
        observation: Observation,
        region: Region,
    ) -> MLPredictionInput:
        try:
            return prepare_prediction_input(observation, region=region)
        except Exception as exc:
            raise MLInputError(f"Failed to prepare ML prediction input: {exc}") from exc

    def _invoke_model(self, input_data: MLPredictionInput) -> MLPredictionOutput:
        if self._model is None:
            raise MLModelUnavailableError("No prediction model injected into PredictionService.")

        try:
            return self._model.predict(input_data)
        except (MLInferenceError, MLModelUnavailableError):
            raise
        except Exception as exc:
            raise MLInferenceError(f"Model inference execution failed: {exc}") from exc

    def _validate_output(
        self,
        output: MLPredictionOutput,
        expected_region_id: str,
    ) -> MLPredictionOutput:
        try:
            return validate_model_output(output, expected_region_id=expected_region_id)
        except MLOutputValidationError:
            raise
        except Exception as exc:
            raise MLOutputValidationError(
                f"Model output validation failed unexpectedly: {exc}"
            ) from exc

    def _persist_prediction(self, output: MLPredictionOutput) -> None:
        """Persists the validated prediction to the database.

        Uses atomic PostgreSQL UPSERT on UNIQUE(region_id, generated_at)
        to handle idempotency (same region + same generated_at = update in place).
        """
        try:
            from sqlalchemy.dialects.postgresql import insert as pg_insert

            stmt = pg_insert(Prediction).values(
                region_id=output.region_id,
                generated_at=output.generated_at,
                forecast_valid_until=output.forecast_valid_until,
                flood_probability=output.flood_probability,
                risk_level=self._classify_risk_level(output.flood_probability),
                model_version=output.model_version,
                is_fallback=False,
                fallback_reason=None,
            )

            stmt = stmt.on_conflict_do_update(
                index_elements=["region_id", "generated_at"],
                set_={
                    "forecast_valid_until": stmt.excluded.forecast_valid_until,
                    "flood_probability": stmt.excluded.flood_probability,
                    "risk_level": stmt.excluded.risk_level,
                    "model_version": stmt.excluded.model_version,
                    "is_fallback": stmt.excluded.is_fallback,
                    "fallback_reason": stmt.excluded.fallback_reason,
                },
            )

            self._session.execute(stmt)
            self._session.commit()

        except Exception as exc:
            self._session.rollback()
            raise PredictionPersistenceError(
                f"Failed to persist prediction for region '{output.region_id}': {exc}",
                region_id=output.region_id,
            ) from exc

    def _classify_risk_level(self, flood_probability: Decimal) -> str:
        """Classifies flood probability into risk level.

        This is a backend/application layer concern, separate from the ML model contract.
        Thresholds are prototype placeholders and will be replaced by the risk engine in a later phase.

        Args:
            flood_probability: Model output probability (0.0 to 1.0)

        Returns:
            Risk level string: 'low', 'moderate', 'high', or 'severe'
        """
        prob = float(flood_probability)
        if prob < 0.25:
            return "low"
        elif prob < 0.50:
            return "moderate"
        elif prob < 0.75:
            return "high"
        else:
            return "severe"