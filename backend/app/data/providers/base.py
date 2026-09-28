from abc import ABC, abstractmethod
from app.data.schemas import NormalizedObservation


class WeatherProvider(ABC):
    """Abstract interface for external weather data providers.
    
    Prevents coupling the backend domain and ML layers to any specific external API.
    All implementations must return provider-independent NormalizedObservation objects.
    """

    @abstractmethod
    async def fetch_current_observation(
        self, region_id: str, latitude: float, longitude: float
    ) -> NormalizedObservation:
        """Fetches and normalizes the current observation for a specified region and coordinates.
        
        Args:
            region_id: Canonical region identifier (e.g. DEV_AS_BAR_01)
            latitude: Geographic latitude in decimal degrees
            longitude: Geographic longitude in decimal degrees

        Returns:
            NormalizedObservation: Validated, provider-independent observation object.

        Raises:
            WeatherProviderError: Structured subclass corresponding to the failure mode.
        """
        raise NotImplementedError
