"""Canonical region list API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.region import Region
from app.schemas.prediction import RegionListResponse, RegionResponse

router = APIRouter()


@router.get(
    "/regions",
    response_model=RegionListResponse,
    summary="Get Canonical Region List",
    description=(
        "Returns the authoritative list of all monitored Assam Revenue Circle regions. "
        "This is the canonical source for region metadata including coordinates, "
        "district, and elevation. Used for map initialization, region selection, "
        "and region identity throughout the application."
    ),
    responses={
        status.HTTP_200_OK: {
            "description": "Successful region list retrieval",
            "content": {
                "application/json": {
                    "example": {
                        "total_regions": 180,
                        "regions": [
                            {
                                "region_id": "18-300-00101",
                                "name": "Kokrajhar East",
                                "district": "Kokrajhar",
                                "latitude": 26.4012,
                                "longitude": 90.1234,
                                "elevation_m": "35.0",
                            },
                            {
                                "region_id": "18-300-00102",
                                "name": "Kokrajhar West",
                                "district": "Kokrajhar",
                                "latitude": 26.3987,
                                "longitude": 90.1156,
                                "elevation_m": "33.5",
                            },
                        ],
                    }
                }
            },
        },
        status.HTTP_503_SERVICE_UNAVAILABLE: {
            "description": "Database unavailable",
        },
    },
)
def get_regions(
    session: Session = Depends(get_db),
) -> RegionListResponse:
    """Get the authoritative list of all monitored Assam Revenue Circle regions.

    Returns all regions from the database ordered deterministically by region_id.
    This is the canonical source for region metadata.

    Args:
        session: Database session (injected)

    Returns:
        RegionListResponse: List of all regions with metadata and total count

    Raises:
        HTTPException: 503 if database is unavailable
    """
    try:
        stmt = select(Region).order_by(Region.region_id)
        regions = session.scalars(stmt).all()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable",
        ) from exc

    region_responses = [
        RegionResponse(
            region_id=region.region_id,
            name=region.name,
            district=region.district,
            latitude=region.latitude,
            longitude=region.longitude,
            elevation_m=region.elevation_m,
        )
        for region in regions
    ]

    return RegionListResponse(
        regions=region_responses,
        total_regions=len(region_responses),
    )