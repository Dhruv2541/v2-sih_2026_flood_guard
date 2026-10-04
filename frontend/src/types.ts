export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'RESOLVED' | 'SEVERE';

export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "SEVERE";

export interface RegionRisk {
  region_id: string;
  name: string;
  risk_level: RiskLevel;
  flood_probability: number;
  timestamp?: string;
}

/**
 * Backend prediction object consumable by the FloodGuard Risk Map.
 *
 * CRITICAL BUSINESS RULE:
 * The frontend must NOT calculate risk levels (e.g. probability > 0.7 -> HIGH).
 * Risk level will come from the backend. The frontend may only map
 * backend-provided risk_level to presentation styling.
 */
export interface BackendRegionPrediction {
  region_name: string;
  risk_level: string; // Authoritative backend risk level (e.g. "CRITICAL", "HIGH", "MODERATE", "LOW")
  flood_probability: number;
  rainfall_24h?: number;
  timestamp?: string;
  region_id?: string;
  coordinates?: [number, number]; // [longitude, latitude]
  is_mock?: boolean;
  [key: string]: unknown;
}

/**
 * Authoritative location prediction object consumed by the Predictions page.
 *
 * CRITICAL BUSINESS RULES:
 * 1. Backend owns risk classification (risk_level).
 * 2. Frontend only displays risk_level, mapping it to presentation styling.
 * 3. No frontend probability thresholds (e.g. probability > 0.7 -> HIGH).
 * 4. No fabricated prediction values, timestamps, or rainfall values.
 */
export interface BackendLocationPrediction {
  location_name: string;
  flood_probability: number;
  risk_level: string; // Authoritative backend risk level (e.g. "CRITICAL", "HIGH", "MODERATE", "LOW")
  timestamp?: string; // ISO calculation timestamp (when provided)
  district?: string;
  sector_id?: string;
  rainfall_24h?: number;
  confidence?: number;
  peak_water_depth_m?: number;
  water_depth_avg_m?: number;
  inundation_area_km2?: number;
  population_at_risk?: number;
  peak_window?: string;
  river_stage_m?: number;
  danger_level_m?: number;
  river_name?: string;
  station_name?: string;
  status_summary?: string;
  timeline?: ForecastStepData[] | any[];
  factors?: CausalFactor[] | any[];
  is_mock?: boolean;
  [key: string]: unknown;
}

/**
 * Canonical backend alert object consumed by the Alerts page.
 * Corresponds to GET /api/alerts?min_severity=Moderate
 *
 * CRITICAL BUSINESS RULES:
 * 1. Backend owns alert classification and severity.
 * 2. Frontend only displays severity, mapping it to presentation styling.
 * 3. Do not calculate severity (no heuristics or score checks).
 * 4. Do not fabricate alerts.
 */
export interface BackendAlert {
  id: string;
  region: string; // e.g. "Dhemaji District", "Majuli"
  severity: string; // e.g. "Critical", "High", "Moderate", "Resolved"
  message: string; // Primary advisory or directive statement
  timestamp: string; // Calculation / issuance timestamp from backend
  headline?: string;
  summary?: string;
  description?: string;
  action_items?: string[];
  recommended_action?: string;
  issued_by?: string;
  authority?: string;
  affected_population?: number;
  river_basin?: string;
  sector_id?: string;
  is_mock?: boolean;
  [key: string]: unknown;
}

/**
 * Canonical backend historical record from GET /api/history/{city_name}
 *
 * Expected fields:
 * - date: Observation date or timestamp
 * - rainfall_mm: Measured rainfall in mm
 * - flood_probability: Flood probability percentage (0-100)
 *
 * CRITICAL BUSINESS RULES:
 * 1. Do not generate fake historical records to fill charts.
 * 2. Only real backend data or isolated development mock data.
 * 3. Never synthesize random numbers if rainfall_mm or flood_probability is missing.
 */
export interface BackendHistoryRecord {
  date: string;
  rainfall_mm?: number;
  flood_probability?: number;
  city_name?: string;
  is_mock?: boolean;
  [key: string]: unknown;
}

/**
 * Hydrological flood simulation scenario request (POST /api/simulate)
 *
 * CRITICAL BUSINESS RULES:
 * 1. SIMULATION MODE — This is a hypothetical scenario, not an actual observed flood event.
 * 2. Simulation data must NEVER be presented as actual flood observations.
 * 3. Keep simulation state strictly separated from live prediction state.
 */
export interface BackendSimulationRequest {
  severity_multiplier?: number; // 0.5 to 3.0
  use_live_weather?: boolean;
  custom_rainfall_mm?: number;
  city_or_district?: string;
  [key: string]: unknown;
}

export interface BackendSimulationResultItem {
  name: string;
  risk_score?: number;
  risk_level?: string;
  inundation_pct?: number;
  water_depth_m?: number;
  impact?: {
    population_at_risk?: number;
    infrastructure_affected?: number;
    [key: string]: unknown;
  };
  is_simulation?: boolean;
  is_mock?: boolean;
  [key: string]: unknown;
}

export interface BackendSimulationResponse {
  simulation?: BackendSimulationResultItem[];
  status?: string;
  parameters?: BackendSimulationRequest;
  timestamp?: string;
  is_simulation?: boolean;
  is_mock?: boolean;
  [key: string]: unknown;
}
export interface CausalFactor {
  id: string;
  name: string;
  category?: string;
  contributionPercent: number; // e.g. 35%
  observedValue: string; // e.g. "245 mm/24h"
  description?: string;
  direction?: string;
  scientificExplanation?: string;
  status: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'NORMAL' | 'LOW';
}

export interface RainfallForecast {
  currentRainfall24hMm: number;
  forecast24hMm?: number;
  forecast48hMm?: number;
  forecast72hMm?: number;
  expectedRainfall48hMm?: number;
  expectedRainfall72hMm?: number;
  hourlyTimeline?: any[];
  stationSource?: string;
  intensity: string;
  soilMoisturePercent?: number; // 0-100%
  catchmentRunoffIndex?: number; // 0-100
  trend: 'increasing' | 'peaking' | 'decreasing' | 'steady';
}

export interface ForecastStepData {
  hour: number; // 0, 6, 12, 24, 48, 72
  label: string; // "Now", "+6h", "+12h", etc.
  riskScore: number;
  riskLevel: AlertSeverity;
  floodProbability: number;
  inundationAreaKm2: number;
  inundationOpacity: number;
  rainfallAccumulatedMm?: number;
  riverStageM?: number;
  populationAtRisk: number;
}

export interface InfrastructureItem {
  id: string;
  name: string;
  type: 'hospital' | 'school' | 'road' | 'bridge';
  status: string; // "Potentially affected", "Elevated & Open", "Water overtopping", etc.
  distanceFromInundationM: number;
  riskLevel: AlertSeverity;
  capacityOrBeds?: string;
  details: string;
  coordinates: { x?: number; y?: number; lat?: number; lng?: number };
}

export interface SectorData {
  id: string;
  district: string;
  state: string;
  subdivision: string;
  coordinates: { lat: number; lng: number };
  vulnerabilityIndex: number;
  hazardLevel: AlertSeverity;
  statusSummary: string;
  levelBadge: string;
  warningMessage?: string;
  asdmaDirective?: string;
  stationCode: string;
  stationName: string;
  riverName: string;
  floodProb: number;
  confidence: number;
  inundationAreaKm2: number;
  waterDepthAvgM: number;
  waterDepthPeakM: number;
  inundationPathSummary: string;
  affectedNeighborhoods: string[];
  stageAbsolute: number;
  dangerLevel: number;
  highestFloodLevel?: number;
  riverStageDelta: string;
  riverStageDesc: string;
  peakWindow: string;
  peakWindowDesc: string;
  populationAtRisk: number;
  vulnerableDemographics?: {
    childrenUnder5?: number;
    elderlyAbove65?: number;
    elderlyOver65?: number;
    pregnantWomen?: number;
    livestockCount?: number;
    informalDwellings?: number;
  };
  infrastructureCounts: {
    hospitals: number;
    schools: number;
    roads: number;
    bridges: number;
  };
  infrastructureList: InfrastructureItem[];
  rainfall: RainfallForecast;
  factors: CausalFactor[];
  timeline: ForecastStepData[];
  recommendedActions: string[];
  catchmentSummary?: string;
  distanceFromDhemaji?: string;
  direction?: string;
}

export interface GaugeStation {
  id: string;
  name: string;
  river: string;
  currentStage: number; // in meters
  dangerLevel: number; // in meters
  highestFloodLevel: number; // in meters
  trend: 'rising' | 'falling' | 'steady';
  discharge: number; // m3/s
  stationCode: string;
  coordinates: { lat: number; lng: number };
}

export interface ReliefCamp {
  id: string;
  name: string;
  district: string;
  location: string;
  coordinates: string;
  capacity: number;
  currentOccupancy: number;
  elevatedMsl: number;
  contactOfficer: string;
  phone: string;
  hasMedicalPost: boolean;
  hasCleanWater: boolean;
  hasCattleShelter: boolean;
  distanceKm: number;
}

export interface FloodAlert {
  id: string;
  location: string;
  district: string;
  riverBasin?: string;
  riskLevel: AlertSeverity;
  score: number;
  timestamp: string;
  headline: string;
  summary: string;
  description?: string;
  populationAtRisk: number;
  affectedPopulation?: number;
  actionItems?: string[];
  recommendedAction: string;
  issuedBy: string;
  authority?: string;
  sectorId?: string;
  category: 'Critical' | 'High' | 'Moderate' | 'Resolved';
}

export interface HistoricalYearRecord {
  year: number;
  monsoonRainfallMm: number;
  floodInundationAreaKm2: number;
  affectedPopulationTotal: number;
  districtsAffectedCount: number;
  affectedDistrictsCount?: number;
  highestSeverityDistrict: string;
  damagesCrInr: number;
  cwcPeakStageM: number;
  keyEvents: string;
  severityCategory?: string;
  peakMonth?: string;
  embankmentBreachesCount?: number;
  summaryNarrative?: string;
}

export interface FloodEvent {
  year: number;
  population_affected_lakh?: number;
  crop_area_affected_lakh_ha?: number;
  human_lives_lost?: number;
  cattle_lost?: number;
  total_damage_crore?: number;
  villages_affected?: number;
  districts_affected?: number;
  source: string;
}

export interface ProofSource {
  resource: string;
  url: string;
  what_it_proves: string;
}

export interface SatelliteEvidenceItem {
  year: number;
  resource: string;
  url: string;
  what_it_proves: string;
  organization: string;
  sensor?: string;
  acquisition_date?: string;
  description: string;
}

export interface ModelMetric {
  metric?: string;
  metricName?: string;
  category?: string;
  value: string;
  benchmark: string;
  description?: string;
  status?: string;
}

export interface DataSourceItem {
  id?: string;
  source?: string;
  sourceAgency?: string;
  name?: string;
  type?: string;
  category?: string;
  latency?: string;
  updateFrequency?: string;
  spatialResolution?: string;
  parameters?: string;
  params?: string;
  reliability?: string;
  coverage?: string;
  status?: string;
}
