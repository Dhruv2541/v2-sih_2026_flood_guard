from datetime import datetime
from decimal import Decimal
from typing import Optional
from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Identity,
    Numeric,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base


class Observation(Base):
    """Periodic environmental and hydrological observations recorded for a region."""

    __tablename__ = "observations"
    __table_args__ = (
        UniqueConstraint("region_id", "recorded_at", name="uq_observation_region_recorded"),
        CheckConstraint("rainfall_1h_mm >= 0", name="chk_rainfall_1h_non_negative"),
        CheckConstraint("rainfall_3h_mm >= 0", name="chk_rainfall_3h_non_negative"),
        CheckConstraint("rainfall_6h_mm >= 0", name="chk_rainfall_6h_non_negative"),
        CheckConstraint("rainfall_24h_mm >= 0", name="chk_rainfall_24h_non_negative"),
        CheckConstraint("humidity_pct BETWEEN 0.0 AND 100.0", name="chk_humidity_range"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(always=True),
        primary_key=True,
    )
    region_id: Mapped[str] = mapped_column(
        Text,
        ForeignKey("regions.region_id", ondelete="CASCADE"),
        nullable=False,
    )
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    rainfall_1h_mm: Mapped[Optional[Decimal]] = mapped_column(Numeric(6, 2), nullable=True)
    rainfall_3h_mm: Mapped[Optional[Decimal]] = mapped_column(Numeric(6, 2), nullable=True)
    rainfall_6h_mm: Mapped[Optional[Decimal]] = mapped_column(Numeric(6, 2), nullable=True)
    rainfall_24h_mm: Mapped[Optional[Decimal]] = mapped_column(Numeric(6, 2), nullable=True)
    water_level_m: Mapped[Optional[Decimal]] = mapped_column(Numeric(6, 2), nullable=True)
    temperature_c: Mapped[Optional[Decimal]] = mapped_column(Numeric(4, 1), nullable=True)
    humidity_pct: Mapped[Optional[Decimal]] = mapped_column(Numeric(4, 1), nullable=True)
    data_source: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    region: Mapped["Region"] = relationship("Region", back_populates="observations")
