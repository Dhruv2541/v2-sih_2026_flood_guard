/**
 * FloodGuard Prediction Adapter & Normalizer
 *
 * Normalizes backend prediction objects for the Predictions page without
 * calculating risk levels or fabricating values.
 *
 * CRITICAL BUSINESS RULES:
 * 1. Backend owns risk classification (risk_level).
 * 2. Frontend only displays risk_level, mapping it to presentation styling.
 * 3. No frontend probability thresholds (e.g. probability > 0.7 -> HIGH).
 * 4. No fabricated prediction values, timestamps, or rainfall values.
 * 5. Mock values must never masquerade as live data.
 */

import { BackendLocationPrediction, SectorData } from '../types';

/**
 * Normalizes any incoming prediction payload (from FastAPI or mock layer)
 * into a typed BackendLocationPrediction.
 */
export function normalizeBackendLocationPrediction(
  raw: Record<string, unknown> | null | undefined
): BackendLocationPrediction | null {
  if (!raw) return null;

  const location_name = String(
    raw.location_name || raw.location || raw.district || raw.name || 'Unknown Location'
  ).trim();

  // Authoritative risk level straight from backend (never calculated from probability)
  const risk_level = String(
    raw.risk_level || raw.hazard_level || raw.hazardLevel || 'LOW'
  ).toUpperCase().trim();

  const rawProb = raw.flood_probability ?? raw.flood_prob ?? raw.floodProb ?? 0;
  let flood_probability = Number(rawProb);
  if (flood_probability <= 1 && flood_probability > 0) {
    // Backend returned 0-1 ratio instead of percentage
    flood_probability = Math.round(flood_probability * 100);
  }

  // Timestamp: only keep if explicitly provided by backend (DO NOT invent fake date)
  const timestamp = raw.timestamp ? String(raw.timestamp) : undefined;

  // Rainfall: only keep if provided by backend
  const rainfall_24h =
    raw.rainfall_24h !== undefined
      ? Number(raw.rainfall_24h)
      : raw.rainfall_24h_mm !== undefined
      ? Number(raw.rainfall_24h_mm)
      : (raw.rainfall as any)?.currentRainfall24hMm !== undefined
      ? Number((raw.rainfall as any).currentRainfall24hMm)
      : undefined;

  // Confidence: only keep if provided by backend (no fake confidence percentage)
  const confidence = raw.confidence !== undefined ? Number(raw.confidence) : undefined;

  const peak_water_depth_m =
    raw.peak_water_depth_m !== undefined
      ? Number(raw.peak_water_depth_m)
      : raw.waterDepthPeakM !== undefined
      ? Number(raw.waterDepthPeakM)
      : undefined;

  const water_depth_avg_m =
    raw.water_depth_avg_m !== undefined
      ? Number(raw.water_depth_avg_m)
      : raw.waterDepthAvgM !== undefined
      ? Number(raw.waterDepthAvgM)
      : undefined;

  const inundation_area_km2 =
    raw.inundation_area_km2 !== undefined
      ? Number(raw.inundation_area_km2)
      : raw.inundationAreaKm2 !== undefined
      ? Number(raw.inundationAreaKm2)
      : undefined;

  const population_at_risk =
    raw.population_at_risk !== undefined
      ? Number(raw.population_at_risk)
      : raw.populationAtRisk !== undefined
      ? Number(raw.populationAtRisk)
      : undefined;

  const river_stage_m =
    raw.river_stage_m !== undefined
      ? Number(raw.river_stage_m)
      : raw.stageAbsolute !== undefined
      ? Number(raw.stageAbsolute)
      : undefined;

  const danger_level_m =
    raw.danger_level_m !== undefined
      ? Number(raw.danger_level_m)
      : raw.dangerLevel !== undefined
      ? Number(raw.dangerLevel)
      : undefined;

  const is_mock = Boolean(raw.is_mock || raw._isDevelopmentMock);

  return {
    location_name,
    district: String(raw.district || location_name),
    sector_id: String(raw.sector_id || raw.id || location_name.toLowerCase()),
    flood_probability,
    risk_level,
    timestamp,
    rainfall_24h,
    confidence,
    peak_water_depth_m,
    water_depth_avg_m,
    inundation_area_km2,
    population_at_risk,
    peak_window: raw.peak_window ? String(raw.peak_window) : raw.peakWindow ? String(raw.peakWindow) : undefined,
    river_stage_m,
    danger_level_m,
    river_name: raw.river_name ? String(raw.river_name) : raw.riverName ? String(raw.riverName) : undefined,
    station_name: raw.station_name ? String(raw.station_name) : raw.stationName ? String(raw.stationName) : undefined,
    status_summary: raw.status_summary ? String(raw.status_summary) : raw.statusSummary ? String(raw.statusSummary) : undefined,
    timeline: Array.isArray(raw.timeline) ? (raw.timeline as any[]) : undefined,
    factors: Array.isArray(raw.factors) ? (raw.factors as any[]) : undefined,
    is_mock,
  };
}

/**
 * Development bridge: converts local SectorData into a BackendLocationPrediction
 * during offline development, clearly marking it as mock data.
 */
export function adaptSectorToPrediction(sector: SectorData): BackendLocationPrediction {
  return {
    location_name: sector.district,
    district: sector.district,
    sector_id: sector.id,
    flood_probability: sector.floodProb,
    risk_level: sector.hazardLevel, // Authoritative from sector profile
    timestamp: undefined, // No live timestamp - not fabricated!
    rainfall_24h: sector.rainfall?.currentRainfall24hMm,
    confidence: sector.confidence,
    peak_water_depth_m: sector.waterDepthPeakM,
    water_depth_avg_m: sector.waterDepthAvgM,
    inundation_area_km2: sector.inundationAreaKm2,
    population_at_risk: sector.populationAtRisk,
    peak_window: sector.peakWindow,
    river_stage_m: sector.stageAbsolute,
    danger_level_m: sector.dangerLevel,
    river_name: sector.riverName,
    station_name: sector.stationName,
    status_summary: sector.statusSummary,
    timeline: sector.timeline,
    factors: sector.factors,
    is_mock: true, // Strictly identified as development mock
  };
}

/**
 * Safe timestamp display generator.
 * Does NOT generate fake dates if missing.
 */
export function formatPredictionTimestamp(timestamp?: string): {
  display: string;
  isProvided: boolean;
} {
  if (!timestamp) {
    return {
      display: 'Timestamp not provided by backend',
      isProvided: false,
    };
  }

  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) {
      return { display: timestamp, isProvided: true };
    }
    const formatted = d.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }) + ' IST';
    return { display: formatted, isProvided: true };
  } catch {
    return { display: timestamp, isProvided: true };
  }
}
