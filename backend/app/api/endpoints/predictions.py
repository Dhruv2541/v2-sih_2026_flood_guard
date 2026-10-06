"""Flood prediction API endpoints."""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.endpoints.health import router as health_router  # For reference pattern
from app.config import settings
from app.database.connection import get_db
from app.ml import create_model, get_model_info
from app.ml.exceptions import (
    MLInferenceError,
    MLInputError,
    MLModelUnavailableError,
    MLOutputValidationError,
)
from app.schemas.prediction import (
    PredictionResponse,
    FailedRegionPrediction,
    RegionWidePredictionResponse,
    ModelInfoResponse,
)
from app.services.prediction import (
    PredictionService,
    RegionNotFoundError,
    NoUsableObservationError,
    PredictionPersistenceError,
)
from app.services.risk import (
    RiskLevel,
    InvalidProbabilityError,
    classify_risk_level,
)

router = APIRouter()


def get_prediction_service(session: Session = Depends(get_db)) -> PredictionService:
    """FastAPI dependency providing a PredictionService with the configured model."""
    model = create_model(settings.PREDICTION_MODE)
    return PredictionService(model=model, session=session)


@router.get(
    "/predict/model/info",
    response_model=ModelInfoResponse,
    summary="Get Prediction Model Information",
    description=(
        "Returns metadata about the currently configured prediction model, including "
        "the prediction mode, model type, version, and availability status."
    ),
    responses={
        status.HTTP_200_OK: {
            "description": "Model information retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "prediction_mode": "baseline",
                        "model_type": "HydrologicalBaselineModel",
                        "model_version": "baseline-v1",
                        "status": "available",
                    }
                }
            },
        },
        status.HTTP_503_SERVICE_UNAVAILABLE: {
            "description": "ML model unavailable (when PREDICTION_MODE=ml but no adapter implemented)",
        },
    },
)
def get_model_info_endpoint() -> ModelInfoResponse:
    """Get information about the currently configured prediction model.

    Returns metadata including prediction mode, model type, version, and status.
    When PREDICTION_MODE=ml but no ML adapter is implemented, returns 503.

    Returns:
        ModelInfoResponse: Model metadata

    Raises:
        HTTPException: 503 if ML mode is selected but no adapter is implemented
    """
    try:
        info = get_model_info(settings.PREDICTION_MODE)
    except MLModelUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Prediction model is currently unavailable",
        ) from exc

    return ModelInfoResponse(**info)


@router.get(
    "/predictions",
    response_model=RegionWidePredictionResponse,
    summary="Get Flood Predictions for All Monitored Regions",
    description=(
        "Generates flood risk predictions for all configured regions using the latest "
        "available observation data. Returns successful predictions and explicit "
        "unavailable reasons for regions that could not be processed."
    ),
    responses={
        status.HTTP_200_OK: {
            "description": "Successful region-wide prediction",
            "content": {
                "application/json": {
                    "example": {
                        "generated_at": "2026-09-26T10:00:00Z",
                        "total_regions": 3,
                        "predictions_available": 2,
                        "predictions_unavailable": 1,
                        "predictions": [
                            {
                                "region_id": "DEV_AS_BAR_01",
                                "generated_at": "2026-09-26T10:00:00Z",
                                "forecast_valid_until": "2026-09-26T16:00:00Z",
                                "flood_probability": 0.683,
                                "risk_level": "HIGH",
                                "model_version": "baseline-v1",
                            },
                            {
                                "region_id": "DEV_AS_DHU_01",
                                "generated_at": "2026-09-26T10:00:00Z",
                                "forecast_valid_until": "2026-09-26T16:00:00Z",
                                "flood_probability": 0.421,
                                "risk_level": "MODERATE",
                                "model_version": "baseline-v1",
                            },
                        ],
                        "unavailable_regions": [
                            {
                                "region_id": "DEV_AS_MAJ_01",
                                "reason": "No usable observation available",
                            },
                        ],
                    }
                }
            },
        },
        status.HTTP_503_SERVICE_UNAVAILABLE: {
            "description": "ML model unavailable",
        },
        status.HTTP_500_INTERNAL_SERVER_ERROR: {
            "description": "Model inference failure",
        },
    },
)
def get_region_wide_predictions(
    service: PredictionService = Depends(get_prediction_service),
) -> RegionWidePredictionResponse:
    """Get flood predictions for all monitored regions.

    Iterates through all configured regions and generates predictions.
    Failures for individual regions are isolated and reported explicitly.

    Returns:
        RegionWidePredictionResponse: Structured response with successful
        predictions and unavailable regions with safe reasons.

    Raises:
        HTTPException: Mapped from domain exceptions to appropriate HTTP status codes
    """
    try:
        result = service.generate_region_wide_predictions()
    except MLModelUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Prediction model is currently unavailable",
        ) from exc
    except MLInferenceError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Prediction model inference failed",
        ) from exc

    # Convert MLPredictionOutput to PredictionResponse with risk classification
    successful_predictions = []
    for ml_output in result.successful_predictions:
        try:
            risk_level = classify_risk_level(ml_output.flood_probability)
        except InvalidProbabilityError as exc:
            # This should not happen if ML output validation passes, but defensive
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Invalid flood probability from model: {exc}",
            ) from exc

        successful_predictions.append(
            PredictionResponse(
                region_id=ml_output.region_id,
                generated_at=ml_output.generated_at,
                forecast_valid_until=ml_output.forecast_valid_until,
                flood_probability=ml_output.flood_probability,
                risk_level=risk_level.value,
                model_version=ml_output.model_version,
            )
        )

    # Convert failed predictions to FailedRegionPrediction
    unavailable_regions = [
        FailedRegionPrediction(
            region_id=fp.region_id,
            error_type=fp.error_type,
            message=fp.message,
        )
        for fp in result.failed_predictions
    ]

    # Use the generated_at from the first successful prediction, or current time
    batch_generated_at = (
        successful_predictions[0].generated_at
        if successful_predictions
        else datetime.now(timezone.utc)
    )

    return RegionWidePredictionResponse(
        generated_at=batch_generated_at,
        total_regions=result.total_regions,
        predictions_available=result.successful_count,
        predictions_unavailable=result.failed_count,
        predictions=successful_predictions,
        unavailable_regions=unavailable_regions,
    )


@router.get(
    "/predictions/{region_id}",
    response_model=PredictionResponse,
    summary="Get Flood Prediction for a Region",
    description=(
        "Generates a flood risk prediction for the specified region using the latest "
        "available observation data. Returns flood probability and classified risk level."
    ),
    responses={
        status.HTTP_200_OK: {
            "description": "Successful prediction",
            "content": {
                "application/json": {
                    "example": {
                        "region_id": "majuli",
                        "generated_at": "2026-09-26T10:00:00Z",
                        "forecast_valid_until": "2026-09-26T16:00:00Z",
                        "flood_probability": 0.683,
                        "risk_level": "HIGH",
                        "model_version": "baseline-v1",
                    }
                }
            },
        },
        status.HTTP_404_NOT_FOUND: {
            "description": "Region not found or no usable observation available",
        },
        status.HTTP_422_UNPROCESSABLE_CONTENT: {
            "description": "Invalid input data (e.g., missing required rainfall measurements)",
        },
        status.HTTP_503_SERVICE_UNAVAILABLE: {
            "description": "ML model unavailable",
        },
        status.HTTP_500_INTERNAL_SERVER_ERROR: {
            "description": "Model inference or persistence failure",
        },
    },
)
def get_prediction(
    region_id: str,
    service: PredictionService = Depends(get_prediction_service),
) -> PredictionResponse:
    """Get flood prediction for a single region.

    Args:
        region_id: Canonical region identifier (e.g., "DEV_AS_BAR_01")
        service: PredictionService instance (injected)

    Returns:
        PredictionResponse: Flood probability, risk level, and metadata

    Raises:
        HTTPException: Mapped from domain exceptions to appropriate HTTP status codes
    """
    try:
        ml_output = service.generate_prediction(region_id)
    except RegionNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Region '{exc.region_id}' not found",
        ) from exc
    except NoUsableObservationError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No usable observation found for region '{exc.region_id}'",
        ) from exc
    except MLInputError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc
    except MLModelUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Prediction model is currently unavailable",
        ) from exc
    except MLInferenceError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Prediction model inference failed",
        ) from exc
    except MLOutputValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Prediction model returned invalid output",
        ) from exc
    except PredictionPersistenceError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to persist prediction",
        ) from exc

    # Classify flood probability into risk level (backend layer)
    try:
        risk_level = classify_risk_level(ml_output.flood_probability)
    except InvalidProbabilityError as exc:
        # This should not happen if ML output validation passes, but defensive
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Invalid flood probability from model: {exc}",
        ) from exc

    return PredictionResponse(
        region_id=ml_output.region_id,
        generated_at=ml_output.generated_at,
        forecast_valid_until=ml_output.forecast_valid_until,
        flood_probability=ml_output.flood_probability,
        risk_level=risk_level.value,
        model_version=ml_output.model_version,
    )