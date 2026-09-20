export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'RESOLVED' | 'SEVERE';

export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "SEVERE";

export interface RegionRisk {
  region_id: string;
  name: string;
  risk_level: RiskLevel;
  flood_probability: number;
  timestamp?: string;
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
