from abc import ABC, abstractmethod
from typing import Optional

from app.ml.exceptions import MLOutputValidationError
from app.ml.schemas import MLPredictionInput, MLPredictionOutput


def validate_model_output(
    output: MLPredictionOutput,
    expected_region_id: Optional[str] = None,
) -> MLPredictionOutput:
    """Validates model prediction output against the ML boundary contract.
    
    Verifies that:
    1. The output is an instance of MLPredictionOutput (validating probability bounds,
       timestamps, and non-empty model version via Pydantic).
    2. The output corresponds strictly to the expected region_id without silent replacement.
    
    Args:
        output: The MLPredictionOutput produced by model inference.
        expected_region_id: Optional expected canonical region_id to enforce consistency.
        
    Returns:
        MLPredictionOutput: The validated prediction output.
        
    Raises:
        MLOutputValidationError: If output is not an MLPredictionOutput or region mismatch occurs.
    """
    if not isinstance(output, MLPredictionOutput):
        raise MLOutputValidationError(
            f"Model returned invalid output type: {type(output).__name__}. "
            f"Expected MLPredictionOutput instance."
        )

    if expected_region_id is not None and output.region_id != expected_region_id:
        raise MLOutputValidationError(
            f"Model output region_id '{output.region_id}' does not match "
            f"expected input region_id '{expected_region_id}'. Region inconsistency detected."
        )

    return output


class FloodPredictionModel(ABC):
    """Abstract base class establishing the inference boundary for flood prediction models.
    
    Provides a decoupled interface between backend feature preparation and model execution.
    Concrete implementations are responsible for model architecture, artifact loading,
    and inference computation, returning an MLPredictionOutput matching the input contract.
    """

    @abstractmethod
    def predict(self, input_data: MLPredictionInput) -> MLPredictionOutput:
        """Executes model inference for the given region and input features.
        
        Args:
            input_data: Validated MLPredictionInput containing rainfall and environmental features.
            
        Returns:
            MLPredictionOutput: Validated prediction output containing flood_probability and metadata.
            
        Raises:
            MLInputError: If input data is missing or malformed.
            MLModelUnavailableError: If model weights/runtime cannot be loaded.
            MLInferenceError: If model execution fails during calculation.
            MLOutputValidationError: If model prediction output violates probability bounds or contract.
        """
        pass
