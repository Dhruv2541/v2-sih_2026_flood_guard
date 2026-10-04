/**
 * FloodGuard Predictions API
 *
 * Provides functions for live multi-district predictions and targeted location forecasts.
 * Endpoints:
 *  - GET /api/live-prediction
 *  - GET /api/predict/{location_name}?severity=1.0
 *
 * BUSINESS RULE:
 * - Frontend displays data.
 * - Backend calculations and ML inferences are authoritative.
 */

import { request } from './client';

/**
 * Hourly hydrograph step in a forecast timeline.
 */
export interface ForecastTimeStep {
  hour?: number;
  label?: string;
  timestamp?: string;
  flood_probability?: number;
  risk_level?: string;
  risk_score?: number;
  inundation_area_km2?: number;
  inundation_opacity?: number;
  river_stage_m?: number;
  rainfall_accumulated_mm?: number;
  population_at_risk?: number;
  [key: string]: unknown;
}

/**
 * AI/ML explainability feature attribution (e.g. SHAP factor).
 */
export interface ModelExplainabilityFactor {
  id?: string;
  name?: string;
  contribution_percent?: number;
  observed_value?: string;
  status?: string;
  direction?: string;
  description?: string;
  [key: string]: unknown;
}

/**
 * Detailed ML prediction result for a specific location.
 */
export interface LocationPredictionData {
  location?: string;
  district?: string;
  sector_id?: string;
  timestamp?: string;
  flood_probability?: number;
  risk_level?: string; // Authoritative backend risk level (e.g. "CRITICAL", "HIGH", "MODERATE", "LOW")
  confidence?: number;
  inundation_area_km2?: number;
  peak_water_depth_m?: number;
  population_at_risk?: number;
  peak_window?: string;
  river_stage_m?: number;
  danger_level_m?: number;
  rainfall_24h_mm?: number;
  timeline?: ForecastTimeStep[];
  factors?: ModelExplainabilityFactor[];
  model_version?: string;
  data_freshness?: string;
  [key: string]: unknown;
}

/**
 * Response structure for GET /api/live-prediction.
 */
export interface LivePredictionResponse {
  status?: string;
  timestamp?: string;
  predictions?: LocationPredictionData[] | Record<string, LocationPredictionData>;
  [key: string]: unknown;
}

/**
 * Query parameters for GET /api/predict/{location_name}.
 */
export interface PredictLocationParams {
  /** Severity multiplier, defaults to 1.0 */
  severity?: number;
  /** Forecast horizon in hours (e.g. 24, 48, 72) */
  forecast_hours?: number;
  /** Optional cancellation signal */
  signal?: AbortSignal;
}

/**
 * Fetches current live flood prediction overview across all monitored locations.
 * HTTP GET /api/live-prediction
 */
export async function getLivePredictions(signal?: AbortSignal): Promise<LivePredictionResponse> {
  return request<LivePredictionResponse>('/api/live-prediction', { signal });
}

/**
 * Fetches the ML flood prediction for a specific district or location.
 * HTTP GET /api/predict/{location_name}?severity=1.0
 *
 * @param locationName - The name or ID of the location (e.g. "Dhemaji", "Majuli")
 * @param params - Optional severity multiplier and forecast parameters
 */
export async function getPredictionForLocation(
  locationName: string,
  params?: PredictLocationParams,
): Promise<LocationPredictionData> {
  const encodedLocation = encodeURIComponent(locationName.trim());
  return request<LocationPredictionData>(`/api/predict/${encodedLocation}`, {
    signal: params?.signal,
    params: {
      severity: params?.severity ?? 1.0,
      forecast_hours: params?.forecast_hours,
    },
  });
}
