/**
 * ============================================================================
 * FloodGuard Development Mock Layer - ML Predictions & Hydrographs
 * ============================================================================
 *
 * CAUTION: DEVELOPMENT MOCK DATA ONLY.
 *
 * This dataset provides simulated machine-learning flood probability curves,
 * 48-hour hydrograph forecasts, and SHAP explainability attributions.
 * It is STRICTLY for local UI testing and graph rendering while the
 * FastAPI prediction model endpoints are under development.
 *
 * RULES & CONSTRAINTS:
 * 1. NEVER present these values as live, authoritative ML flood predictions.
 * 2. NEVER silently substitute this mock data when the real backend API fails.
 * 3. Components should eventually transition from this mock adapter to
 *    `src/api/predictions.ts` when `GET /api/live-prediction` and
 *    `GET /api/predict/{location}` are active.
 *
 * @module mocks/predictions.mock
 */

import {
  LocationPredictionData,
  LivePredictionResponse,
  ForecastTimeStep,
  ModelExplainabilityFactor,
  PredictLocationParams
} from '../api/predictions';
import { ASSAM_SECTORS } from '../data/assamData';

/** Explicit flag identifying mock origin */
export const IS_DEVELOPMENT_MOCK = true as const;

export const MOCK_DISCLAIMER_NOTICE =
  'DEVELOPMENT MOCK DATA ONLY: Simulated ML prediction timeline. Not verified live flood intelligence.';

/**
 * Builds isolated mock location prediction records keyed by sector ID.
 */
export const mockLocationPredictions: Record<string, LocationPredictionData> = Object.fromEntries(
  Object.entries(ASSAM_SECTORS).map(([key, sector]) => {
    const timeline: ForecastTimeStep[] = (sector.timeline || []).map((step) => ({
      hour: step.hour,
      label: step.label,
      timestamp: new Date(Date.now() + step.hour * 3600 * 1000).toISOString(),
      flood_probability: step.floodProbability,
      risk_level: step.riskLevel,
      risk_score: step.riskScore,
      inundation_area_km2: step.inundationAreaKm2,
      inundation_opacity: step.inundationOpacity,
      river_stage_m: step.riverStageM || sector.stageAbsolute,
      rainfall_accumulated_mm: step.rainfallAccumulatedMm,
      population_at_risk: step.populationAtRisk,
      _isDevelopmentMock: true
    }));

    const factors: ModelExplainabilityFactor[] = (sector.factors || []).map((f) => ({
      id: f.id,
      name: f.name,
      contribution_percent: f.contributionPercent,
      observed_value: f.observedValue,
      status: f.status,
      direction: f.direction,
      description: f.description || f.scientificExplanation,
      _isDevelopmentMock: true
    }));

    const predictionData: LocationPredictionData = {
      location: sector.district,
      district: sector.district,
      sector_id: sector.id,
      timestamp: new Date().toISOString(),
      flood_probability: sector.floodProb,
      risk_level: sector.hazardLevel,
      confidence: sector.confidence,
      inundation_area_km2: sector.inundationAreaKm2,
      peak_water_depth_m: sector.waterDepthPeakM,
      population_at_risk: sector.populationAtRisk,
      peak_window: sector.peakWindow,
      river_stage_m: sector.stageAbsolute,
      danger_level_m: sector.dangerLevel,
      rainfall_24h_mm: sector.rainfall?.currentRainfall24hMm,
      timeline,
      factors,
      model_version: 'DEV-MOCK-v1.0-SYNTHETIC',
      data_freshness: 'development-simulated',
      _isDevelopmentMock: true,
      _mockDisclaimer: MOCK_DISCLAIMER_NOTICE
    };

    return [key, predictionData];
  })
);

/**
 * Isolated mock response matching backend endpoint `GET /api/live-prediction`.
 */
export const mockLivePredictionResponse: LivePredictionResponse = {
  status: 'development_mock',
  timestamp: new Date().toISOString(),
  predictions: Object.values(mockLocationPredictions),
  _isDevelopmentMock: true,
  _mockNotice: MOCK_DISCLAIMER_NOTICE
};

/**
 * Development helper to retrieve mock prediction for a location.
 *
 * @param locationName - Location or sector identifier (case-insensitive)
 * @param params - Optional severity multiplier and forecast parameters
 */
export function getMockLocationPrediction(
  locationName: string,
  params?: PredictLocationParams
): LocationPredictionData {
  const normalized = locationName.toLowerCase().trim();
  const matched =
    mockLocationPredictions[normalized] ||
    Object.values(mockLocationPredictions).find(
      (p) => p.district?.toLowerCase() === normalized || p.location?.toLowerCase() === normalized
    ) ||
    mockLocationPredictions['dhemaji'];

  // Apply optional severity multiplier for UI simulation testing
  if (params?.severity && params.severity !== 1.0) {
    const mult = Math.min(Math.max(params.severity, 0.5), 2.0);
    return {
      ...matched,
      flood_probability: Math.min(100, Math.round((matched.flood_probability ?? 80) * mult)),
      inundation_area_km2: Number(((matched.inundation_area_km2 ?? 100) * mult).toFixed(1)),
      timestamp: new Date().toISOString(),
      _mockParamsApplied: { severity: mult }
    };
  }

  return {
    ...matched,
    timestamp: new Date().toISOString()
  };
}
