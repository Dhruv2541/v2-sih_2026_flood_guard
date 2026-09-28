from datetime import datetime
from decimal import Decimal
from typing import Optional
from sqlalchemy import (
    BigInteger,
    Boolean,
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


class Prediction(Base):
    """Model-generated flood risk prediction for a region over a 6-hour validity window."""

    __tablename__ = "predictions"
    __table_args__ = (
        UniqueConstraint("region_id", "generated_at", name="uq_prediction_region_generated"),
        CheckConstraint(
            "flood_probability BETWEEN 0.0 AND 1.0",
            name="chk_flood_probability_range",
        ),
        CheckConstraint(
            "risk_level IN ('low', 'moderate', 'high', 'severe')",
            name="chk_risk_level_values",
        ),
        CheckConstraint(
            "forecast_valid_until >= generated_at",
            name="chk_forecast_horizon_valid",
        ),
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
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    forecast_valid_until: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    flood_probability: Mapped[Decimal] = mapped_column(Numeric(4, 3), nullable=False)
    risk_level: Mapped[str] = mapped_column(Text, nullable=False)
    is_fallback: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default="false",
        nullable=False,
    )
    fallback_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    model_version: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    region: Mapped["Region"] = relationship("Region", back_populates="predictions")
