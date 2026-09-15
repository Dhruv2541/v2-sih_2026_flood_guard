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
    )

    region_id: Mapped[str] = mapped_column(Text, primary_key=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    district: Mapped[str] = mapped_column(Text, nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    elevation_m: Mapped[Optional[Decimal]] = mapped_column(Numeric(6, 1), nullable=True)
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
