"""Static region metadata feature service.

Provides centralized access to static region features from the regions table.
Falls back to file-based lookups from assam_circles.json when no DB session.
"""

from decimal import Decimal
from typing import Optional
import json
import logging
from pathlib import Path

from sqlalchemy.orm import Session

from app.models.region import Region
from app.ml.exceptions import MLInputError

logger = logging.getLogger(__name__)

# Path to canonical circles data
CIRCLES_PATH = Path(__file__).parent.parent.parent / "data" / "assam_circles.json"


class RegionMetadataMissingError(MLInputError):
    """Raised when required static region metadata is missing for a region_id."""
    pass


class RegionFeatureService:
    """Service for retrieving static region metadata for ML feature preparation.

    All metadata is sourced from the `regions` table, which is seeded from
    `assam_circles.json` (canonical source).
    
    When no DB session is provided (baseline/demo mode), falls back to
    file-based lookups from assam_circles.json.
    """

    def __init__(self, session: Optional[Session] = None):
        self.session = session
        self._file_circles = None  # Cache for file-based fallback

    def _load_file_circles(self):
        """Load circles from JSON file (fallback when no DB)."""
        if self._file_circles is not None:
            return self._file_circles
        
        try:
            if CIRCLES_PATH.exists():
                with open(CIRCLES_PATH, "r", encoding="utf-8") as f:
                    self._file_circles = json.load(f)
                logger.info(f"Loaded {len(self._file_circles)} regions from file")
            else:
                self._file_circles = []
                logger.warning(f"Circles file not found: {CIRCLES_PATH}")
        except Exception as e:
            logger.error(f"Failed to load circles file: {e}")
            self._file_circles = []
        
        return self._file_circles

    def _get_region_from_file(self, region_id: str) -> Optional[dict]:
        """Get region data from file (fallback)."""
        circles = self._load_file_circles()
        for circle in circles:
            if circle.get("object_id") == region_id:
                return circle
        return None

    def get_elevation(self, region_id: str) -> Decimal:
        """Get elevation in meters for a region.

        Args:
            region_id: Canonical region identifier

        Returns:
            Decimal: Elevation in meters

        Raises:
            RegionMetadataMissingError: If region not found or elevation is NULL
        """
        return self._get_required_decimal(region_id, "elevation_m", "elevation")

    def get_distance_to_river(self, region_id: str) -> Decimal:
        """Get distance to nearest major river in meters.

        Args:
            region_id: Canonical region identifier

        Returns:
            Decimal: Distance in meters

        Raises:
            RegionMetadataMissingError: If region not found or distance is NULL
        """
        return self._get_required_decimal(region_id, "distance_to_river_m", "distance_to_river_m")

    def get_soil_clay_pct(self, region_id: str) -> Decimal:
        """Get soil clay percentage for a region.

        Args:
            region_id: Canonical region identifier

        Returns:
            Decimal: Clay percentage (0-100)

        Raises:
            RegionMetadataMissingError: If region not found or clay_pct is NULL
        """
        return self._get_required_decimal(region_id, "soil_clay_pct", "soil_clay_pct")

    def get_population_density(self, region_id: str) -> Decimal:
        """Get population density (persons per sq km) for a region.

        Args:
            region_id: Canonical region identifier

        Returns:
            Decimal: Population density

        Raises:
            RegionMetadataMissingError: If region not found or density is NULL
        """
        return self._get_required_decimal(region_id, "population_density", "population_density")

    def get_curve_number(self, region_id: str) -> Decimal:
        """Get SCS Curve Number for a region (used in runoff index).

        Args:
            region_id: Canonical region identifier

        Returns:
            Decimal: Curve number

        Raises:
            RegionMetadataMissingError: If region not found or curve_number is NULL
        """
        return self._get_required_decimal(region_id, "curve_number", "curve_number")

    def get_all_static_features(self, region_id: str) -> dict:
        """Get all static features in a single query.

        Args:
            region_id: Canonical region identifier

        Returns:
            dict: All static features

        Raises:
            RegionMetadataMissingError: If region not found or any required field is NULL
        """
        # First try DB
        if self.session is not None:
            region = self.session.get(Region, region_id)
            if region is None:
                raise RegionMetadataMissingError(f"Region '{region_id}' not found in database")
            
            missing = []
            for field in ["elevation_m", "distance_to_river_m", "soil_clay_pct", "population_density", "curve_number"]:
                if getattr(region, field) is None:
                    missing.append(field)
            
            if missing:
                raise RegionMetadataMissingError(
                    f"Region '{region_id}' missing required static fields: {', '.join(missing)}"
                )
            
            return {
                "elevation": region.elevation_m,
                "distance_to_river_m": region.distance_to_river_m,
                "soil_clay_pct": region.soil_clay_pct,
                "population_density": region.population_density,
                "curve_number": region.curve_number,
            }
        
        # Fall back to file
        circle = self._get_region_from_file(region_id)
        if circle is None:
            raise RegionMetadataMissingError(f"Region '{region_id}' not found in file")
        
        # Map file fields to expected feature names
        return {
            "elevation": Decimal(str(circle.get("elevation", 0.0))),
            "distance_to_river_m": Decimal(str(circle.get("distance_from_river_m", 1000.0))),
            "soil_clay_pct": Decimal(str(circle.get("soil_clay_pct", 25.0))),
            "population_density": Decimal(str(circle.get("population_density", 300.0))),
            "curve_number": Decimal(str(circle.get("curve_number", 75.0))),
        }

    def _get_required_decimal(self, region_id: str, column_name: str, feature_name: str) -> Decimal:
        """Internal helper to get a required Decimal field."""
        # First try DB
        if self.session is not None:
            region = self.session.get(Region, region_id)
            if region is None:
                raise RegionMetadataMissingError(f"Region '{region_id}' not found in database")
            
            value = getattr(region, column_name)
            if value is None:
                raise RegionMetadataMissingError(
                    f"Region '{region_id}' missing required static feature: {feature_name}"
                )
            
            return value
        
        # Fall back to file
        circle = self._get_region_from_file(region_id)
        if circle is None:
            raise RegionMetadataMissingError(f"Region '{region_id}' not found in file")
        
        # Map column names to file field names
        field_mapping = {
            "elevation_m": "elevation",
            "distance_to_river_m": "distance_from_river_m",
            "soil_clay_pct": "soil_clay_pct",
            "population_density": "population_density",
            "curve_number": "curve_number",
        }
        
        file_field = field_mapping.get(column_name, column_name)
        value = circle.get(file_field)
        if value is None:
            raise RegionMetadataMissingError(
                f"Region '{region_id}' missing required static feature: {feature_name}"
            )
        
        return Decimal(str(value))

    def get_all_regions(self) -> list:
        """Get all regions from DB or file."""
        if self.session is not None:
            try:
                return self.session.query(Region).all()
            except Exception as e:
                logger.error(f"Failed to get regions from DB: {e}")
                return []
        
        # Fall back to file
        circles = self._load_file_circles()
        return circles