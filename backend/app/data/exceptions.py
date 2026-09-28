"""Structured error taxonomy for weather provider integrations.
Provides clean, typed exception handling without leaking internal URLs or credentials.
"""


class WeatherProviderError(Exception):
    """Base exception for all weather provider errors."""

    def __init__(self, message: str, provider: str = "unknown") -> None:
        super().__init__(message)
        self.message = message
        self.provider = provider

    def __str__(self) -> str:
        return f"[{self.provider}] {self.message}"


class ProviderUnavailableError(WeatherProviderError):
    """Raised when the provider endpoint is unreachable or returned a 5xx server error."""
    pass


class ProviderTimeoutError(WeatherProviderError):
    """Raised when an HTTP connection or read times out."""
    pass


class ProviderResponseError(WeatherProviderError):
    """Raised when the provider response is malformed, not valid JSON, or missing root structures."""
    pass


class ProviderPartialDataError(WeatherProviderError):
    """Raised when the provider returned a syntactically valid response,
    but one or more fields required to construct a usable normalized observation
    are missing, malformed, or unusable (e.g. incomplete precipitation history).
    """
    pass


class ProviderNoDataError(WeatherProviderError):
    """Raised when the provider returned no data for the requested region/coordinates."""
    pass


class ProviderRateLimitError(WeatherProviderError):
    """Raised when provider rate limits are exceeded (e.g. HTTP 429 Too Many Requests)."""
    pass
