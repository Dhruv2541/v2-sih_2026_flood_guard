"""
Prediction API Endpoints — Flood risk prediction for Assam regions.

Provides ML-compatible prediction endpoints that work with both
baseline (demo) and ML (future) providers based on PREDICTION_MODE.
"""

import logging
from datetime import datetime, timezone
from decimal import Decimal
from typing import Generator, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database.connection import get_db, get_sessionmaker
from app.ml.schemas import MLPredictionInput, MLPredictionOutput
from app.ml.exceptions import MLInputError
from app.services.region_features import RegionFeatureService, RegionMetadataMissingError
from app.services.derived_features import (
    compute_runoff_potential_index,
    compute_proximity_risk_score,
)
from app.data.providers.open_meteo import OpenMeteoProvider
from app.data.exceptions import WeatherProviderError
from app.ml.baseline_provider import BaselineProvider, BaselinePredictionError
from app.models.prediction import Prediction

router = APIRouter()
logger = logging.getLogger(__name__)


def get_optional_db() -> Generator[Optional[Session], None, None]:
    """FastAPI dependency for obtaining an optional database session."""
    session_factory = None
    try:
        session_factory = get_sessionmaker()
    except Exception:
        pass

    if session_factory is None:
        yield None
        return

    db = session_factory()
    try:
        yield db
    finally:
        db.close()


# Dependency to get region service (works with or without DB)
def get_region_service(db: Optional[Session] = Depends(get_optional_db)) -> RegionFeatureService:
    if db is None:
        # In baseline mode without DB, use file-based region service
        return RegionFeatureService(None)
    return RegionFeatureService(db)


# Dependency to get weather provider
def get_weather_provider() -> OpenMeteoProvider:
    return OpenMeteoProvider()


# Dependency to get baseline provider (does not depend on DB)
def get_baseline_provider(
    region_service: RegionFeatureService = Depends(get_region_service),
    weather_provider: OpenMeteoProvider = Depends(get_weather_provider),
) -> "BaselineProvider":
    from app.ml.baseline_provider import BaselineProvider
    return BaselineProvider(region_service, weather_provider)


def get_db_optional() -> Optional[Session]:
    """Get DB session if configured, otherwise return None."""
    try:
        return next(get_db())
    except (RuntimeError, StopIteration):
        return None


@router.post(
    "/predict",
    response_model=MLPredictionOutput,
    summary="Generate flood risk prediction for a region",
    description="Generates a flood risk prediction using the configured provider (baseline or ML).",
)
async def create_prediction(
    ml_input: MLPredictionInput,
    baseline_provider: "BaselineProvider" = Depends(get_baseline_provider),
) -> MLPredictionOutput:
    """
    Generate a flood risk prediction for the given region and reference time.
    
    Uses the provider configured via PREDICTION_MODE:
    - baseline: Deterministic hydrological model (demo mode)
    - ml: Full ML model (requires trained artifacts)
    """
    if settings.PREDICTION_MODE == "baseline":
        try:
            return await baseline_provider.predict(ml_input)
        except BaselinePredictionError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(exc),
            )
        except Exception as exc:
            logger.error(f"Baseline prediction failed for {ml_input.region_id}: {exc}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Prediction service temporarily unavailable",
            )
    else:
        # Future: ML provider
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="ML prediction mode not yet implemented for submission",
        )


@router.get(
    "/predict/model/info",
    summary="Get model information (predict prefix alias)",
    description="Returns information about the currently active prediction model.",
)
@router.get(
    "/model/info",
    summary="Get model information",
    description="Returns information about the currently active prediction model.",
)
def get_model_info() -> dict:
    """Return information about the active prediction model."""
    return {
        "model_version": settings.BASELINE_MODEL_VERSION if settings.PREDICTION_MODE == "baseline" else "ml-v1",
        "prediction_mode": settings.PREDICTION_MODE,
        "features": [
            "rainfall_1h",
            "rainfall_3h", 
            "rainfall_6h",
            "rainfall_12h",
            "rainfall_24h",
            "forecast_rainfall_6h",
            "elevation",
            "distance_to_river_m",
            "soil_clay_pct",
            "population_density",
            "runoff_potential_index",
            "proximity_risk_score",
        ],
        "risk_levels": ["low", "moderate", "high", "severe"],
        "probability_range": [0.0, 1.0],
    }


@router.get(
    "/predict/region/{region_id}",
    response_model=MLPredictionOutput,
    summary="Get latest prediction for a region (alias)",
)
@router.get(
    "/predict/{region_id}",
    response_model=MLPredictionOutput,
    summary="Get latest prediction for a region",
    description="Returns the most recent prediction for the specified region.",
)
async def get_latest_prediction(
    region_id: str,
) -> MLPredictionOutput:
    """Get the most recent prediction for a region (uses baseline provider if no DB)."""
    if settings.PREDICTION_MODE == "baseline":
        from app.ml.baseline_provider import BaselineProvider, BaselinePredictionError
        from app.services.region_features import RegionFeatureService
        from app.data.providers.open_meteo import OpenMeteoProvider
        from app.database.connection import get_db as get_db_session
        from datetime import datetime, timezone
        from decimal import Decimal
        
        # Try to get a DB session, but don't fail if not available
        db_session = None
        try:
            db_session = next(get_db())
        except (RuntimeError, StopIteration):
            pass
        
        baseline_provider = BaselineProvider(
            RegionFeatureService(db_session),
            OpenMeteoProvider(),
        )
        
        ml_input = MLPredictionInput(
            region_id=region_id,
            reference_time=datetime.now(timezone.utc),
            rainfall_1h_mm=Decimal("0"),
            rainfall_3h_mm=Decimal("0"),
            rainfall_6h_mm=Decimal("0"),
            rainfall_12h_mm=Decimal("0"),
            rainfall_24h_mm=Decimal("0"),
        )
        
        try:
            return await baseline_provider.predict(ml_input)
        except BaselinePredictionError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(exc),
            )
        except Exception as exc:
            logger.error(f"Baseline prediction failed for {region_id}: {exc}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Prediction service temporarily unavailable",
            )
    
    # If ML mode and no DB, we can't serve stored predictions
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"No prediction found for region {region_id}",
    )


@router.get(
    "/predict",
    response_model=List[MLPredictionOutput],
    summary="Get predictions for all regions",
    description="Returns predictions for all regions (uses baseline provider in demo mode).",
)
async def get_all_predictions(
    limit: int = Query(200, ge=1, le=500),
) -> List[MLPredictionOutput]:
    """
    Generate predictions for all regions (or up to limit).
    
    In baseline mode, this generates deterministic predictions for all regions.
    """
    if settings.PREDICTION_MODE != "baseline":
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Bulk predictions only available in baseline mode for submission",
        )
    
    db_session = None
    try:
        db_session = next(get_db())
    except (RuntimeError, StopIteration):
        pass
    
    region_service = RegionFeatureService(db_session)
    weather_provider = OpenMeteoProvider()
    baseline_provider = BaselineProvider(region_service, weather_provider)
    
    # Get all regions
    regions = region_service.get_all_regions()
    if not regions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No regions configured",
        )
    
    predictions = []
    reference_time = datetime.now(timezone.utc)
    
    for region in regions[:limit]:
        # Build input with default observations (no recent data in DB)
        ml_input = MLPredictionInput(
            region_id=region.region_id,
            reference_time=datetime.now(timezone.utc),
            rainfall_1h_mm=Decimal("0"),
            rainfall_3h_mm=Decimal("0"),
            rainfall_6h_mm=Decimal("0"),
            rainfall_12h_mm=Decimal("0"),
            rainfall_24h_mm=Decimal("0"),
        )
        
        try:
            prediction = await baseline_provider.predict(ml_input)
            predictions.append(prediction)
        except BaselinePredictionError as exc:
            logger.warning(f"Skipping region {region.region_id}: {exc}")
            continue
    
    return predictions