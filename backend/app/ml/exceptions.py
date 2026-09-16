"""Machine learning exception taxonomy for Assam Flood Guard.

Provides typed, domain-specific exceptions for the ML prediction and inference boundary.
These exceptions are strictly decoupled from WeatherProviderError and ObservationPersistenceError.
"""


class MLError(Exception):
    """Base exception for all machine learning contract, preparation, and inference errors."""

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message

    def __str__(self) -> str:
        return self.message


class MLInputError(MLError):
    """Raised when input features to the ML model are missing, malformed, or invalid."""
    pass


class MLModelUnavailableError(MLError):
    """Raised when the ML model artifact or inference runtime is unavailable or cannot be loaded."""
    pass


class MLInferenceError(MLError):
    """Raised when an unexpected error occurs during model inference execution."""
    pass


class MLOutputValidationError(MLError):
    """Raised when model prediction output violates probability bounds, region consistency, or contract rules."""
    pass
