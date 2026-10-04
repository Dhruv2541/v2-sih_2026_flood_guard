/**
 * FloodGuard State API
 *
 * Provides functions for retrieving current flood state and regional telemetry overview.
 * Endpoint: GET /api/state
 *
 * BUSINESS RULE:
 * - Frontend displays data.
 * - Backend risk_level is the authoritative source of truth.
 */

import { request } from './client';

/**
 * Summary for a monitored district or region within the state payload.
 * Optional fields accommodate schema variations without making assumptions.
 */
export interface RegionStateSummary {
  id?: string;
  name?: string;
  district?: string;
  state?: string;
  risk_level?: string; // Authoritative backend risk level (e.g. "CRITICAL", "HIGH", "MODERATE", "LOW")
  risk_score?: number; // Backend calculated score (e.g. 0-100 or 0-3)
  flood_probability?: number;
  water_depth_m?: number;
  water_depth_peak_m?: number;
  inundation_area_km2?: number;
  river_stage_m?: number;
  danger_level_m?: number;
  river_name?: string;
  station_code?: string;
  population_at_risk?: number;
  timestamp?: string;
  [key: string]: unknown;
}

/**
 * Response structure for GET /api/state.
 */
export interface StateResponse {
  status?: string;
  timestamp?: string;
  regions?: RegionStateSummary[];
  active_alerts_count?: number;
  high_risk_districts_count?: number;
  total_population_at_risk?: number;
  total_inundation_area_km2?: number;
  monitoring_stations_count?: number;
  [key: string]: unknown;
}

/**
 * Fetches the authoritative regional flood state overview from the FastAPI backend.
 * HTTP GET /api/state
 *
 * @param signal - Optional AbortSignal for cancellation
 */
export async function getState(signal?: AbortSignal): Promise<StateResponse> {
  return request<StateResponse>('/api/state', { signal });
}
