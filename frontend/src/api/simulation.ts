/**
 * FloodGuard Simulation API
 *
 * Provides functions for running or querying hydrological simulation scenarios.
 * Endpoint: POST /api/simulate
 *
 * BUSINESS RULE:
 * - Simulation physics and ML inundation math are performed on the backend.
 * - Frontend purely sends scenario parameters and renders output.
 */

import { request } from './client';

/**
 * Parameters for executing a hydrological flood simulation.
 */
export interface SimulationRequest {
  /** Severity multiplier (e.g. 1.0 = baseline, 1.5 = extreme monsoon surge, 0.5 to 3.0) */
  severity_multiplier?: number;
  /** Whether to fuse near-real-time live weather feeds */
  use_live_weather?: boolean;
  /** Optional custom rainfall threshold in millimeters */
  custom_rainfall_mm?: number;
  /** Target city or district for scenario simulation */
  city_or_district?: string;
  /** Optional target sector/district ID to focus simulation */
  sector_id?: string;
  /** Optional rainfall precipitation multiplier */
  rainfall_multiplier?: number;
  [key: string]: unknown;
}

/**
 * Simulated district output from backend hydraulic routing.
 */
export interface SimulationDistrictResult {
  name: string;
  risk_score?: number; // Backend risk score (e.g. 0 to 3)
  risk_level?: string; // Authoritative backend risk level (e.g. "CRITICAL", "HIGH", "MODERATE", "LOW")
  inundation_pct?: number;
  water_depth_m?: number;
  impact?: {
    population_at_risk?: number;
    infrastructure_affected?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Simulation API response structure.
 */
export interface SimulationResponse {
  simulation?: SimulationDistrictResult[];
  status?: string;
  parameters?: Record<string, unknown>;
  timestamp?: string;
  [key: string]: unknown;
}

/**
 * Executes or fetches a hydrological simulation scenario.
 * HTTP POST /api/simulate
 *
 * @param payload - Scenario parameters (severity multiplier, weather flags)
 * @param signal - Optional AbortSignal for cancellation
 */
export async function simulateFlood(
  payload: SimulationRequest = {},
  signal?: AbortSignal,
): Promise<SimulationResponse> {
  return request<SimulationResponse>('/api/simulate', {
    method: 'POST',
    signal,
    body: {
      severity_multiplier: payload.severity_multiplier ?? 1.0,
      use_live_weather: payload.use_live_weather ?? true,
      ...payload,
    },
  });
}
