"""Machine Learning inference integration package for Assam Flood Guard.

Establishes the boundary contract between backend observation data and model inference.
"""

from app.ml.base import FloodPredictionModel, validate_model_output
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
    "MLError",
    "MLInputError",
    "MLModelUnavailableError",
    "MLInferenceError",
    "MLOutputValidationError",
]
