/**
 * ============================================================================
 * FloodGuard Development Mock Layer - Regional State Overview
 * ============================================================================
 *
 * CAUTION: DEVELOPMENT MOCK DATA ONLY.
 *
 * This dataset provides simulated regional flood telemetry and basin state
 * overviews STRICTLY for local UI testing and component styling while the
 * FastAPI backend is under development.
 *
 * RULES & CONSTRAINTS:
 * 1. NEVER present these values as live, authoritative flood intelligence.
 * 2. NEVER silently substitute this mock data when the real backend API fails.
 * 3. Components should eventually transition from this mock adapter to
 *    `src/api/state.ts` when the backend endpoint `GET /api/state` is active.
 *
 * @module mocks/state.mock
 */

import { RegionStateSummary, StateResponse } from '../api/state';
import { RegionRisk } from '../types';
import { ASSAM_SECTORS } from '../data/assamData';
import { mockRegionRiskData as originalMockRiskData } from '../data/mockRiskData';

/** Explicit flag identifying mock origin */
export const IS_DEVELOPMENT_MOCK = true as const;

/**
 * Notice banner attached to mock responses to prevent accidental misuse.
 */
export const MOCK_DISCLAIMER_NOTICE =
  'DEVELOPMENT MOCK DATA ONLY: Simulated telemetry for UI layout. Not verified live flood intelligence.';

/**
 * Isolated mock regional state summaries mapped from Assam sector profiles.
 */
export const mockRegionStateSummaries: RegionStateSummary[] = Object.values(ASSAM_SECTORS).map(
  (sector) => ({
    id: sector.id,
    name: sector.district,
    district: sector.district,
    state: sector.state,
    risk_level: sector.hazardLevel,
    risk_score: sector.vulnerabilityIndex,
    flood_probability: sector.floodProb,
    water_depth_m: sector.waterDepthAvgM,
    water_depth_peak_m: sector.waterDepthPeakM,
    inundation_area_km2: sector.inundationAreaKm2,
    river_stage_m: sector.stageAbsolute,
    danger_level_m: sector.dangerLevel,
    river_name: sector.riverName,
    station_code: sector.stationCode,
    population_at_risk: sector.populationAtRisk,
    timestamp: new Date().toISOString(),
    _isDevelopmentMock: true,
    _mockDisclaimer: MOCK_DISCLAIMER_NOTICE
  })
);

/**
 * Isolated mock response matching backend endpoint `GET /api/state`.
 */
export const mockStateResponse: StateResponse = {
  status: 'development_mock',
  timestamp: new Date().toISOString(),
  regions: mockRegionStateSummaries,
  active_alerts_count: 5,
  high_risk_districts_count: 3,
  total_population_at_risk: 1845000,
  total_inundation_area_km2: 642.5,
  monitoring_stations_count: 114,
  _isDevelopmentMock: true,
  _mockNotice: MOCK_DISCLAIMER_NOTICE
};

/**
 * Spatial risk map mock data (isolated from `mockRiskData.ts`).
 */
export const mockRegionRiskData: RegionRisk[] = originalMockRiskData.map((item) => ({
  ...item,
  timestamp: new Date().toISOString()
}));

/**
 * Development helper to fetch isolated mock state overview.
 */
export function getMockState(): StateResponse {
  return {
    ...mockStateResponse,
    timestamp: new Date().toISOString()
  };
}
