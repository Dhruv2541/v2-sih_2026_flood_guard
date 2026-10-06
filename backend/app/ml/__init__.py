"""Machine Learning inference integration package for Assam Flood Guard.

Establishes the boundary contract between backend observation data and model inference.
"""

from app.ml.base import FloodPredictionModel, validate_model_output
from app.ml.baseline import HydrologicalBaselineModel, MODEL_VERSION as BASELINE_MODEL_VERSION
from app.ml.exceptions import (
    MLError,
    MLInferenceError,
    MLInputError,
    MLModelUnavailableError,
    MLOutputValidationError,
)
from app.ml.feature_preparation import prepare_prediction_input
from app.ml.schemas import MLPredictionInput, MLPredictionOutput

__all__ = [
    "MLPredictionInput",
    "MLPredictionOutput",
    "FloodPredictionModel",
    "validate_model_output",
    "prepare_prediction_input",
    "HydrologicalBaselineModel",
    "BASELINE_MODEL_VERSION",
    "MLError",
    "MLInputError",
    "MLModelUnavailableError",
    "MLInferenceError",
    "MLOutputValidationError",
    "create_model",
    "get_model_info",
]


def create_model(mode: str) -> FloodPredictionModel:
    """Factory function to create a prediction model based on the configured mode.

    Args:
        mode: "baseline" or "ml"

    Returns:
        FloodPredictionModel instance

    Raises:
        MLModelUnavailableError: If mode is "ml" but no ML adapter is implemented.
        ValueError: If mode is invalid.
    """
    if mode == "baseline":
        return HydrologicalBaselineModel()
    elif mode == "ml":
        raise MLModelUnavailableError(
            "ML prediction mode selected but no ML model adapter is implemented yet. "
            "Set PREDICTION_MODE=baseline to use the deterministic baseline model."
        )
    else:
        raise ValueError(f"Unknown PREDICTION_MODE: {mode}. Valid values: 'baseline', 'ml'")


def get_model_info(mode: str) -> dict:
    """Get metadata about the configured prediction model without instantiating it for inference.

    Args:
        mode: "baseline" or "ml"

    Returns:
        Dictionary with model metadata

    Raises:
        MLModelUnavailableError: If mode is "ml" but no ML adapter is implemented.
        ValueError: If mode is invalid.
    """
    if mode == "baseline":
        return {
            "prediction_mode": "baseline",
            "model_type": "HydrologicalBaselineModel",
            "model_version": BASELINE_MODEL_VERSION,
            "status": "available",
        }
    elif mode == "ml":
        raise MLModelUnavailableError(
            "ML prediction mode selected but no ML model adapter is implemented yet. "
            "Set PREDICTION_MODE=baseline to use the deterministic baseline model."
        )
    else:
        raise ValueError(f"Unknown PREDICTION_MODE: {mode}. Valid values: 'baseline', 'ml'")