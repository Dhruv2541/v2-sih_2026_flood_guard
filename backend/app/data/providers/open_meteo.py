from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
import logging
from typing import Any, Dict, List, Optional
import httpx

from app.config import settings
from app.data.exceptions import (
    ProviderNoDataError,
    ProviderPartialDataError,
    ProviderRateLimitError,
    ProviderResponseError,
    ProviderTimeoutError,
    ProviderUnavailableError,
)
from app.data.providers.base import WeatherProvider
from app.data.schemas import NormalizedObservation

logger = logging.getLogger("open_meteo_provider")


class OpenMeteoProvider(WeatherProvider):
    """Open-Meteo weather provider implementation.
    
    Responsible for:
    - Open-Meteo asynchronous HTTP communication
    - Completed hourly interval alignment and rolling rainfall accumulation
    - Normalization into provider-independent NormalizedObservation
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        timeout_seconds: Optional[float] = None,
        client: Optional[httpx.AsyncClient] = None,
    ) -> None:
        self.base_url = base_url or settings.OPEN_METEO_BASE_URL
        self.timeout_seconds = (
            timeout_seconds
            if timeout_seconds is not None
            else settings.OPEN_METEO_TIMEOUT_SECONDS
        )
        self._client = client

    async def fetch_current_observation(
        self, region_id: str, latitude: float, longitude: float
    ) -> NormalizedObservation:
        """Asynchronously fetches and normalizes the current observation from Open-Meteo.
        
        Args:
            region_id: Non-empty region identifier (e.g. DEV_AS_BAR_01)
            latitude: Numeric latitude coordinate
            longitude: Numeric longitude coordinate

        Returns:
            NormalizedObservation: Validated, provider-independent observation object.

        Raises:
            ValueError: If region_id or coordinates are invalid.
            ProviderTimeoutError: If the HTTP request times out.
            ProviderUnavailableError: If connection fails or server returns 5xx.
            ProviderRateLimitError: If HTTP 429 Too Many Requests is returned.
            ProviderResponseError: If response JSON is malformed or missing hourly structure.
            ProviderNoDataError: If provider returns error flag or empty hourly arrays.
            ProviderPartialDataError: If required 24-hour rainfall history cannot be assembled.
        """
        # Input validation
        if not region_id or not isinstance(region_id, str) or not region_id.strip():
            raise ValueError("region_id must be a non-empty string.")
        if not isinstance(latitude, (int, float)) or not isinstance(longitude, (int, float)):
            raise ValueError("latitude and longitude must be numeric coordinates.")

        params = {
            "latitude": latitude,
            "longitude": longitude,
            "hourly": "temperature_2m,relative_humidity_2m,precipitation",
            "past_hours": 24,
            "timezone": "UTC",
        }

        # Perform asynchronous HTTP request
        try:
            if self._client is not None:
                response = await self._client.get(
                    self.base_url,
                    params=params,
                    timeout=self.timeout_seconds,
                )
            else:
                async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                    response = await client.get(
                        self.base_url,
                        params=params,
                    )
        except httpx.TimeoutException as exc:
            logger.warning(f"Timeout querying Open-Meteo for region '{region_id}': {exc}")
            raise ProviderTimeoutError(
                f"Request to Open-Meteo timed out after {self.timeout_seconds}s for region '{region_id}'.",
                provider="open-meteo",
            ) from exc
        except (httpx.NetworkError, httpx.ConnectError, httpx.ConnectTimeout) as exc:
            logger.warning(f"Network error querying Open-Meteo for region '{region_id}': {exc}")
            raise ProviderUnavailableError(
                f"Open-Meteo service is unreachable for region '{region_id}'.",
                provider="open-meteo",
            ) from exc
        except httpx.HTTPError as exc:
            logger.warning(f"HTTP communication error querying Open-Meteo for region '{region_id}': {exc}")
            raise ProviderUnavailableError(
                f"HTTP communication failure with Open-Meteo for region '{region_id}'.",
                provider="open-meteo",
            ) from exc

        # Handle HTTP status codes
        status_code = response.status_code
        if status_code == 429:
            logger.warning(f"Open-Meteo rate limit reached (HTTP 429) for region '{region_id}'.")
            raise ProviderRateLimitError(
                f"Open-Meteo rate limit exceeded for region '{region_id}'.",
                provider="open-meteo",
            )
        elif 500 <= status_code < 600:
            logger.warning(f"Open-Meteo server error (HTTP {status_code}) for region '{region_id}'.")
            raise ProviderUnavailableError(
                f"Open-Meteo returned server error {status_code} for region '{region_id}'.",
                provider="open-meteo",
            )
        elif status_code != 200:
            logger.warning(f"Open-Meteo returned unexpected status {status_code} for region '{region_id}'.")
            raise ProviderUnavailableError(
                f"Open-Meteo returned unsuccessful status {status_code} for region '{region_id}'.",
                provider="open-meteo",
            )

        # Parse JSON response
        try:
            payload = response.json()
        except Exception as exc:
            logger.warning(f"Failed to decode JSON from Open-Meteo for region '{region_id}': {exc}")
            raise ProviderResponseError(
                f"Failed to parse JSON response from Open-Meteo for region '{region_id}'.",
                provider="open-meteo",
            ) from exc

        if not isinstance(payload, dict):
            raise ProviderResponseError(
                f"Open-Meteo response is not a valid JSON object for region '{region_id}'.",
                provider="open-meteo",
            )

        # Check for provider-level error flags
        if payload.get("error") is True:
            reason = payload.get("reason", "No data available")
            logger.warning(f"Open-Meteo reported error for region '{region_id}': {reason}")
            raise ProviderNoDataError(
                f"No data returned by Open-Meteo for region '{region_id}': {reason}",
                provider="open-meteo",
            )

        # Verify hourly structure exists and is non-empty
        hourly = payload.get("hourly")
        if hourly is None or not isinstance(hourly, dict):
            raise ProviderResponseError(
                f"Missing 'hourly' data object in Open-Meteo response for region '{region_id}'.",
                provider="open-meteo",
            )

        times = hourly.get("time")
        precip_list = hourly.get("precipitation")
        if times is None or precip_list is None or len(times) == 0:
            raise ProviderNoDataError(
                f"No hourly weather data available for region '{region_id}' at ({latitude}, {longitude}).",
                provider="open-meteo",
            )

        # Normalization and completed hourly interval calculation
        return self.parse_and_normalize(region_id=region_id, payload=payload)

    def parse_and_normalize(
        self,
        region_id: str,
        payload: Dict[str, Any],
        observation_time: Optional[datetime] = None,
    ) -> NormalizedObservation:
        """Parses and normalizes Open-Meteo forecast JSON response into a NormalizedObservation.
        
        Semantics & Alignment:
        1. Open-Meteo precipitation represents precipitation accumulated over the preceding 1 hour.
        2. Filter only completed intervals: timestamps where interval_ts <= observation_time.
        3. Identifies the latest completed interval for observation timestamp.
        4. Calculates rolling accumulations over the latest completed intervals:
           - rainfall_1h: latest completed 1 interval
           - rainfall_3h: sum of latest 3 completed intervals
           - rainfall_6h: sum of latest 6 completed intervals
           - rainfall_24h: sum of latest 24 completed intervals
        5. Core fields: All 4 rolling rainfall values are required. If fewer than 24 completed intervals
           exist, or if required precipitation values are missing/null, raises ProviderPartialDataError.
        6. Optional fields: temperature and humidity at the latest completed interval are nullable.
        7. Water level: Explicitly None (no water level provider for prototype).

        Args:
            region_id: Region identifier
            payload: Raw JSON response dict from Open-Meteo
            observation_time: Reference timestamp to assess interval completion (default: current UTC)

        Returns:
            NormalizedObservation: Validated, provider-independent observation.

        Raises:
            ProviderResponseError: If response JSON structure is malformed or invalid.
            ProviderPartialDataError: If required 24-hour completed precipitation intervals are incomplete.
        """
        if not isinstance(payload, dict):
            raise ProviderResponseError("Payload must be a dictionary", provider="open-meteo")

        hourly = payload.get("hourly")
        if not isinstance(hourly, dict):
            raise ProviderResponseError("Missing or invalid 'hourly' object in payload", provider="open-meteo")

        times = hourly.get("time")
        precip_list = hourly.get("precipitation")
        temp_list = hourly.get("temperature_2m")
        humidity_list = hourly.get("relative_humidity_2m")

        if not isinstance(times, list) or not isinstance(precip_list, list):
            raise ProviderResponseError("Hourly 'time' and 'precipitation' arrays are required", provider="open-meteo")

        if len(times) == 0 or len(times) != len(precip_list):
            raise ProviderResponseError(
                f"Hourly array length mismatch: {len(times)} times vs {len(precip_list)} precipitation entries",
                provider="open-meteo",
            )

        # Establish reference observation time in UTC
        ref_time = observation_time or datetime.now(timezone.utc)
        if ref_time.tzinfo is None:
            ref_time = ref_time.replace(tzinfo=timezone.utc)
        else:
            ref_time = ref_time.astimezone(timezone.utc)

        # Parse and filter completed intervals (interval_ts <= ref_time)
        completed_intervals: List[Dict[str, Any]] = []
        for i, raw_ts in enumerate(times):
            if not isinstance(raw_ts, str):
                raise ProviderResponseError(f"Timestamp at index {i} must be a string", provider="open-meteo")

            try:
                dt = datetime.fromisoformat(raw_ts)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                else:
                    dt = dt.astimezone(timezone.utc)
            except Exception as e:
                raise ProviderResponseError(f"Malformed timestamp '{raw_ts}': {e}", provider="open-meteo")

            # Completed interval rule: interval must end at or before reference time
            if dt <= ref_time:
                completed_intervals.append({
                    "timestamp": dt,
                    "precipitation": precip_list[i],
                    "temperature": temp_list[i] if temp_list and i < len(temp_list) else None,
                    "humidity": humidity_list[i] if humidity_list and i < len(humidity_list) else None,
                })

        # Ensure intervals are in chronological order
        completed_intervals.sort(key=lambda x: x["timestamp"])

        # Core rainfall check: exactly 24 completed hourly intervals are required for 24h accumulation
        if len(completed_intervals) < 24:
            raise ProviderPartialDataError(
                f"Insufficient completed hourly intervals: required at least 24, found {len(completed_intervals)}",
                provider="open-meteo",
            )

        # Inspect latest 24 completed intervals
        recent_24 = completed_intervals[-24:]

        # Validate that precipitation values are present and valid
        decimal_precips: List[Decimal] = []
        for interval in recent_24:
            p_val = interval["precipitation"]
            if p_val is None:
                raise ProviderPartialDataError(
                    f"Precipitation value is missing (null) for interval ending at {interval['timestamp'].isoformat()}",
                    provider="open-meteo",
                )
            try:
                dec = Decimal(str(p_val))
                if dec < Decimal("0"):
                    raise ProviderPartialDataError(
                        f"Precipitation value is negative ({dec}) at {interval['timestamp'].isoformat()}",
                        provider="open-meteo",
                    )
                decimal_precips.append(dec)
            except (InvalidOperation, ValueError):
                raise ProviderPartialDataError(
                    f"Precipitation value '{p_val}' could not be parsed as Decimal at {interval['timestamp'].isoformat()}",
                    provider="open-meteo",
                )

        # Calculate rolling accumulations from completed intervals
        rainfall_1h_mm = decimal_precips[-1]
        rainfall_3h_mm = sum(decimal_precips[-3:])
        rainfall_6h_mm = sum(decimal_precips[-6:])
        rainfall_24h_mm = sum(decimal_precips)

        latest_interval = recent_24[-1]
        latest_ts = latest_interval["timestamp"]

        # Parse optional environmental fields
        temp_c: Optional[Decimal] = None
        if latest_interval["temperature"] is not None:
            try:
                temp_c = Decimal(str(latest_interval["temperature"]))
            except (InvalidOperation, ValueError):
                temp_c = None

        humidity_pct: Optional[Decimal] = None
        if latest_interval["humidity"] is not None:
            try:
                h_val = Decimal(str(latest_interval["humidity"]))
                if Decimal("0.0") <= h_val <= Decimal("100.0"):
                    humidity_pct = h_val
            except (InvalidOperation, ValueError):
                humidity_pct = None

        return NormalizedObservation(
            region_id=region_id,
            recorded_at=latest_ts,
            rainfall_1h_mm=rainfall_1h_mm,
            rainfall_3h_mm=rainfall_3h_mm,
            rainfall_6h_mm=rainfall_6h_mm,
            rainfall_24h_mm=rainfall_24h_mm,
            water_level_m=None,
            temperature_c=temp_c,
            humidity_pct=humidity_pct,
            data_source="open-meteo",
        )
