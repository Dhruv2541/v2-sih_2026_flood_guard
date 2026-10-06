from datetime import datetime, timezone, timedelta
from decimal import Decimal, ROUND_HALF_UP

from app.ml.base import FloodPredictionModel
from app.ml.exceptions import MLInferenceError
from app.ml.schemas import MLPredictionInput, MLPredictionOutput


MODEL_VERSION = "baseline-v1"


DEFAULT_RAINFALL_1H_WEIGHT = Decimal("0.05")
DEFAULT_RAINFALL_3H_WEIGHT = Decimal("0.15")
DEFAULT_RAINFALL_6H_WEIGHT = Decimal("0.25")
DEFAULT_RAINFALL_24H_WEIGHT = Decimal("0.40")
DEFAULT_ELEVATION_SCALE_FACTOR = Decimal("0.001")
DEFAULT_HUMIDITY_SCALE_FACTOR = Decimal("0.005")


class HydrologicalBaselineModel(FloodPredictionModel):
    """Deterministic baseline flood prediction model for prototype pipeline validation.

    This is a PROTOTYPE BASELINE, NOT a scientifically validated hydrological model.
    Its purpose is to enable the backend prediction pipeline to function before
    the real ML model is ready.

    Formula (prototype, explicitly configurable):
        score = (
            rainfall_1h_mm * W_1H +
            rainfall_3h_mm * W_3H +
            rainfall_6h_mm * W_6H +
            rainfall_24h_mm * W_24H
        )
        If elevation_m is present:
            score -= elevation_m * ELEVATION_SCALE_FACTOR
        If humidity_pct is present:
            score += humidity_pct * HUMIDITY_SCALE_FACTOR
        flood_probability = clamp(score / NORMALIZATION_DIVISOR, 0.0, 1.0)

    Where NORMALIZATION_DIVISOR = 150.0 (prototype assumption)

    All weights and scale factors are explicit module-level constants labeled as
    prototype assumptions. The model uses ONLY data present in MLPredictionInput.
    Missing optional fields (water_level_m, elevation_m, temperature_c, humidity_pct)
    are simply omitted from the calculation, not fabricated.

    Deterministic: Same input always produces same output.
    """

    def __init__(
        self,
        rainfall_1h_weight: Decimal = DEFAULT_RAINFALL_1H_WEIGHT,
        rainfall_3h_weight: Decimal = DEFAULT_RAINFALL_3H_WEIGHT,
        rainfall_6h_weight: Decimal = DEFAULT_RAINFALL_6H_WEIGHT,
        rainfall_24h_weight: Decimal = DEFAULT_RAINFALL_24H_WEIGHT,
        elevation_scale_factor: Decimal = DEFAULT_ELEVATION_SCALE_FACTOR,
        humidity_scale_factor: Decimal = DEFAULT_HUMIDITY_SCALE_FACTOR,
        normalization_divisor: Decimal = Decimal("150.0"),
    ) -> None:
        if normalization_divisor <= Decimal("0"):
            raise MLInferenceError(
                "Normalization divisor must be positive; check baseline model configuration."
            )
        self._rainfall_1h_weight = rainfall_1h_weight
        self._rainfall_3h_weight = rainfall_3h_weight
        self._rainfall_6h_weight = rainfall_6h_weight
        self._rainfall_24h_weight = rainfall_24h_weight
        self._elevation_scale_factor = elevation_scale_factor
        self._humidity_scale_factor = humidity_scale_factor
        self._normalization_divisor = normalization_divisor

    def predict(self, input_data: MLPredictionInput) -> MLPredictionOutput:
        try:
            score = Decimal("0")

            score += input_data.rainfall_1h_mm * self._rainfall_1h_weight
            score += input_data.rainfall_3h_mm * self._rainfall_3h_weight
            score += input_data.rainfall_6h_mm * self._rainfall_6h_weight
            score += input_data.rainfall_24h_mm * self._rainfall_24h_weight

            if input_data.elevation_m is not None:
                score -= input_data.elevation_m * self._elevation_scale_factor

            if input_data.humidity_pct is not None:
                score += input_data.humidity_pct * self._humidity_scale_factor

            raw_probability = (score / self._normalization_divisor).quantize(
                Decimal("0.001"), rounding=ROUND_HALF_UP
            )

            flood_probability = max(Decimal("0.0"), min(Decimal("1.0"), raw_probability))

            generated_at = datetime.now(timezone.utc)
            forecast_valid_until = generated_at + timedelta(hours=6)

            return MLPredictionOutput(
                region_id=input_data.region_id,
                generated_at=generated_at,
                forecast_valid_until=forecast_valid_until,
                flood_probability=flood_probability,
                model_version=MODEL_VERSION,
            )

        except Exception as exc:
            if isinstance(exc, MLInferenceError):
                raise
            raise MLInferenceError(f"Baseline model inference failed: {exc}") from exc