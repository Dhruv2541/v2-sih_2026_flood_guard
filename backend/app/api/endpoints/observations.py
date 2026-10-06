"""Observation history API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.observation import Observation
from app.models.region import Region
from app.schemas.prediction import ObservationListResponse, ObservationResponse

router = APIRouter()


@router.get(
    "/regions/{region_id}/observations",
    response_model=ObservationListResponse,
    summary="Get Region Observation History",
    description=(
        "Returns the complete observation history for a specific Assam Revenue Circle region. "
        "Observations include rainfall accumulations, water level, temperature, humidity, "
        "and metadata, ordered chronologically from oldest to newest."
    ),
    responses={
        status.HTTP_200_OK: {
            "description": "Successful observation history retrieval",
            "content": {
                "application/json": {
                    "example": {
                        "region_id": "18-300-00101",
                        "total_observations": 2,
                        "observations": [
                            {
                                "recorded_at": "2026-09-25T12:00:00Z",
                                "rainfall_1h_mm": "2.5",
                                "rainfall_3h_mm": "5.0",
                                "rainfall_6h_mm": "7.5",
                                "rainfall_24h_mm": "10.0",
                                "water_level_m": None,
                                "temperature_c": "28.5",
                                "humidity_pct": "80.0",
                                "data_source": "open-meteo",
                            },
                            {
                                "recorded_at": "2026-09-26T12:00:00Z",
                                "rainfall_1h_mm": "5.0",
                                "rainfall_3h_mm": "10.0",
                                "rainfall_6h_mm": "15.0",
                                "rainfall_24h_mm": "25.0",
                                "water_level_m": None,
                                "temperature_c": "27.0",
                                "humidity_pct": "85.0",
                                "data_source": "open-meteo",
                            },
                        ],
                    }
                }
            },
        },
        status.HTTP_404_NOT_FOUND: {
            "description": "Region not found",
        },
        status.HTTP_503_SERVICE_UNAVAILABLE: {
            "description": "Database unavailable",
        },
    },
)
def get_region_observations(
    region_id: str,
    session: Session = Depends(get_db),
) -> ObservationListResponse:
    """Get the complete observation history for a specific region.

    Returns all observations for the requested region ordered chronologically
    from oldest to newest (recorded_at ASC).

    Args:
        region_id: Canonical region identifier (e.g., "18-300-00101")
        session: Database session (injected)

    Returns:
        ObservationListResponse: Region ID, list of observations, and total count

    Raises:
        HTTPException: 404 if region not found, 503 if database unavailable
    """
    try:
        # Verify region exists
        region = session.get(Region, region_id)
        if region is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Region '{region_id}' not found",
            )

        # Query observations ordered chronologically (oldest first)
        stmt = (
            select(Observation)
            .where(Observation.region_id == region_id)
            .order_by(Observation.recorded_at.asc())
        )
        observations = session.scalars(stmt).all()
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable",
        ) from exc

    observation_responses = [
        ObservationResponse(
            recorded_at=obs.recorded_at,
            rainfall_1h_mm=obs.rainfall_1h_mm,
            rainfall_3h_mm=obs.rainfall_3h_mm,
            rainfall_6h_mm=obs.rainfall_6h_mm,
            rainfall_24h_mm=obs.rainfall_24h_mm,
            water_level_m=obs.water_level_m,
            temperature_c=obs.temperature_c,
            humidity_pct=obs.humidity_pct,
            data_source=obs.data_source,
        )
        for obs in observations
    ]

    return ObservationListResponse(
        region_id=region_id,
        observations=observation_responses,
        total_observations=len(observation_responses),
    )