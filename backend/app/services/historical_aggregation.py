"""Historical rainfall aggregation service for ML feature preparation.

Computes multi-day cumulative rainfall from persisted observations.
Strictly prevents future-data leakage by only using observations <= reference_time.
"""

from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional

from sqlalchemy import select, func, and_
from sqlalchemy.orm import Session

from app.models.observation import Observation
from app.ml.exceptions import MLInputError


class HistoricalDataInsufficientError(MLInputError):
    """Raised when insufficient historical observations exist for required window."""
    pass


class HistoricalRainfallAggregationService:
    """Service for computing historical cumulative rainfall features.

    Queries the observations table and computes rolling sums over 3-day and 7-day
    windows strictly using data available at or before the reference timestamp.
    """

    def __init__(self, session: Session):
        self.session = session

    def get_rainfall_3d_cumulative(
        self,
        region_id: str,
        reference_time: datetime,
    ) -> Decimal:
        """Calculate 3-day cumulative rainfall up to and including reference_time.

        Args:
            region_id: Canonical region identifier
            reference_time: UTC timestamp (timezone-aware) for the prediction reference

        Returns:
            Decimal: Sum of rainfall_24h_mm over the 3-day window

        Raises:
            HistoricalDataInsufficientError: If zero observations exist in the window
        """
        return self._get_cumulative_rainfall(region_id, reference_time, days=3)

    def get_rainfall_7d_cumulative(
        self,
        region_id: str,
        reference_time: datetime,
    ) -> Decimal:
        """Calculate 7-day cumulative rainfall up to and including reference_time.

        Args:
            region_id: Canonical region identifier
            reference_time: UTC timestamp (timezone-aware) for the prediction reference

        Returns:
            Decimal: Sum of rainfall_24h_mm over the 7-day window

        Raises:
            HistoricalDataInsufficientError: If zero observations exist in the window
        """
        return self._get_cumulative_rainfall(region_id, reference_time, days=7)

    def _get_cumulative_rainfall(
        self,
        region_id: str,
        reference_time: datetime,
        days: int,
    ) -> Decimal:
        """Internal method to compute N-day cumulative rainfall.

        Window: (reference_time - N days, reference_time]  -- inclusive of reference_time day

        Args:
            region_id: Canonical region identifier
            reference_time: UTC timestamp (timezone-aware)
            days: Window size in days (3 or 7)

        Returns:
            Decimal: Sum of rainfall_24h_mm

        Raises:
            HistoricalDataInsufficientError: If no observations in window
        """
        if reference_time.tzinfo is None or reference_time.tzinfo.utcoffset(reference_time) is None:
            raise ValueError("reference_time must be timezone-aware UTC")

        window_start = reference_time - timedelta(days=days)

        # Query: sum of rainfall_24h_mm where recorded_at in (window_start, reference_time]
        # Note: reference_time is inclusive because it represents the current day's 24h accumulation
        stmt = select(func.sum(Observation.rainfall_24h_mm)).where(
            and_(
                Observation.region_id == region_id,
                Observation.recorded_at > window_start,
                Observation.recorded_at <= reference_time,
                Observation.rainfall_24h_mm.is_not(None),
            )
        )

        result = self.session.scalar(stmt)

        if result is None:
            # No observations with non-null rainfall_24h in window
            raise HistoricalDataInsufficientError(
                f"No historical rainfall observations for region '{region_id}' "
                f"in {days}-day window ending {reference_time.isoformat()}"
            )

        return Decimal(str(result))

    def get_rainfall_12h_from_hourly(
        self,
        region_id: str,
        reference_time: datetime,
    ) -> Optional[Decimal]:
        """Get 12-hour rainfall from persisted observations if available.

        Since observations only store pre-computed 1h, 3h, 6h, 24h accumulations,
        this method attempts to reconstruct 12h from the latest observation's
        rainfall_24h_mm if we have sufficient temporal granularity.
        
        For the current schema, 12h is NOT directly stored. This is a placeholder
        for future enhancement where hourly precipitation might be stored.
        
        Returns:
            None (not computable from current schema)
        """
        # Current observation schema only stores 1h, 3h, 6h, 24h rolling accumulations
        # computed at ingestion time. 12h is not persisted.
        # The ML model expects this feature; we must either:
        # 1. Add 12h column to observations table, or
        # 2. Compute from hourly data if we store it, or
        # 3. Have the ML model not require 12h
        # 
        # For now, return None to signal unavailable
        return None