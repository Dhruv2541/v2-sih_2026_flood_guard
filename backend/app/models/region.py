from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import CheckConstraint, DateTime, Float, Numeric, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base


class Region(Base):
    """Geographic, administrative, and topographical metadata for a monitored region in Assam."""

    __tablename__ = "regions"
    __table_args__ = (
        CheckConstraint("latitude BETWEEN 20.0 AND 30.0", name="chk_region_latitude_bounds"),
        CheckConstraint("longitude BETWEEN 88.0 AND 98.0", name="chk_region_longitude_bounds"),
        CheckConstraint("elevation_m >= 0", name="chk_region_elevation_non_negative"),
        CheckConstraint("distance_to_river_m >= 0", name="chk_region_distance_river_non_negative"),
        CheckConstraint("soil_clay_pct BETWEEN 0.0 AND 100.0", name="chk_region_soil_clay_range"),
        CheckConstraint("population_density >= 0", name="chk_region_pop_density_non_negative"),
    )

    region_id: Mapped[str] = mapped_column(Text, primary_key=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    district: Mapped[str] = mapped_column(Text, nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    elevation_m: Mapped[Optional[Decimal]] = mapped_column(Numeric(6, 1), nullable=True)
    distance_to_river_m: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 1), nullable=True)
    soil_clay_pct: Mapped[Optional[Decimal]] = mapped_column(Numeric(4, 1), nullable=True)
    population_density: Mapped[Optional[Decimal]] = mapped_column(Numeric(8, 1), nullable=True)
    curve_number: Mapped[Optional[Decimal]] = mapped_column(Numeric(4, 1), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships (passive_deletes=True delegates deletion cascade to PostgreSQL FK constraint)
    observations: Mapped[List["Observation"]] = relationship(
        "Observation",
        back_populates="region",
        passive_deletes=True,
    )
    predictions: Mapped[List["Prediction"]] = relationship(
        "Prediction",
        back_populates="region",
        passive_deletes=True,
    )
