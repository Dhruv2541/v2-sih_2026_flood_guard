/**
 * FloodGuard Map Region Adapter & Presentation Layer
 *
 * Prepares backend prediction payloads for Mapbox GIS visualization.
 *
 * CRITICAL BUSINESS RULES:
 * 1. The frontend must NOT calculate risk levels (e.g. probability > 0.7 -> HIGH).
 * 2. Risk level comes authoritatively from the backend (risk_level field).
 * 3. The frontend only maps backend-provided risk_level to presentation styling (colors, badges, markers).
 * 4. Never claim mock values are live values.
 */

import { BackendRegionPrediction } from '../types';

/**
 * Standard reference coordinates [lng, lat] for Assam districts and monitoring basins.
 * Used exclusively for GIS spatial placement when the backend payload provides region_name
 * without explicit coordinates.
 */
export const ASSAM_DISTRICT_COORDINATES: Record<string, [number, number]> = {
  dhemaji: [94.5822, 27.4812],
  majuli: [94.2238, 26.9634],
  lakhimpur: [94.1044, 27.2346],
  dibrugarh: [94.912, 27.4728],
  tinsukia: [95.3468, 27.4922],
  barpeta: [91.0044, 26.3216],
  cachar: [92.7789, 24.8333],
  kamrup: [91.7362, 26.1445],
  'kamrup metropolitan': [91.7362, 26.1445],
  morigaon: [92.3432, 26.2574],
  nagaon: [92.6841, 26.3464],
  goalpara: [90.6247, 26.1772],
  dhubri: [89.9723, 26.0207],
  sivasagar: [94.6318, 26.9826],
  jorhat: [94.2167, 26.7509],
  golaghat: [93.9667, 26.5167],
  sonitpur: [92.7936, 26.6528],
  biswanath: [93.1539, 26.7323],
  nalbari: [91.4429, 26.4445],
  baksa: [91.3547, 26.6432],
  chirang: [90.4853, 26.5417],
  kokrajhar: [90.2714, 26.4014],
  bongaigaon: [90.5562, 26.4788],
  darrang: [92.0289, 26.4526],
  udalguri: [92.0967, 26.7452],
  hojai: [92.8622, 26.0022],
  'karbi anglong': [93.3667, 26.0],
  'west karbi anglong': [92.5186, 25.8647],
  'dima hasao': [93.0333, 25.1667],
  karimganj: [92.3592, 24.8649],
  hailakandi: [92.5647, 24.6833],
  'south salmara-mankachar': [89.8732, 25.6881],
  charaideo: [94.8622, 26.9389],
  bajali: [91.1738, 26.5878],
  tamulpur: [91.5647, 26.6342],
};

/**
 * Resolves standard coordinates for an Assam region name or identifier.
 */
export function resolveRegionCoordinates(nameOrId?: string): [number, number] {
  if (!nameOrId) return [92.94, 26.2]; // Assam state geometric center fallback
  const normalized = nameOrId.toLowerCase().trim().replace(/district|island/gi, '').trim();

  for (const [key, coords] of Object.entries(ASSAM_DISTRICT_COORDINATES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return coords;
    }
  }

  return [92.94, 26.2];
}

export interface MapRiskPresentation {
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  dotColor: string;
  label: string;
  hasPulse: boolean;
}

/**
 * Pure presentation styling map for backend risk levels.
 *
 * NOTE: The frontend DOES NOT calculate risk levels.
 * This function only translates the backend's authoritative risk_level string
 * into CSS color tokens and badges.
 */
export function getMapRiskPresentation(riskLevel?: string): MapRiskPresentation {
  const norm = String(riskLevel || 'LOW').toUpperCase().trim();

  if (norm === 'CRITICAL' || norm === 'SEVERE') {
    return {
      color: '#dc2626', // red-600
      badgeBg: 'rgba(239, 68, 68, 0.15)',
      badgeBorder: 'rgba(239, 68, 68, 0.4)',
      badgeText: '#f87171',
      dotColor: '#ef4444',
      label: 'CRITICAL',
      hasPulse: true,
    };
  }

  if (norm === 'HIGH') {
    return {
      color: '#ea580c', // orange-600
      badgeBg: 'rgba(249, 115, 22, 0.15)',
      badgeBorder: 'rgba(249, 115, 22, 0.4)',
      badgeText: '#fb923c',
      dotColor: '#f97316',
      label: 'HIGH',
      hasPulse: true,
    };
  }

  if (norm === 'MODERATE') {
    return {
      color: '#f59e0b', // amber-500
      badgeBg: 'rgba(245, 158, 11, 0.15)',
      badgeBorder: 'rgba(245, 158, 11, 0.4)',
      badgeText: '#fbbf24',
      dotColor: '#f59e0b',
      label: 'MODERATE',
      hasPulse: false,
    };
  }

  // Default to LOW
  return {
    color: '#10b981', // emerald-500
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    badgeBorder: 'rgba(16, 185, 129, 0.4)',
    badgeText: '#34d399',
    dotColor: '#10b981',
    label: 'LOW',
    hasPulse: false,
  };
}

/**
 * Normalizes an incoming raw backend prediction record into a validated BackendRegionPrediction.
 * Does NOT calculate or alter the risk_level.
 */
export function normalizeBackendPrediction(raw: Record<string, unknown>): BackendRegionPrediction {
  const region_name = String(
    raw.region_name || raw.name || raw.district || raw.location || 'Unknown Region'
  ).trim();

  // Authoritative risk level straight from backend:
  const risk_level = String(raw.risk_level || raw.hazard_level || raw.hazardLevel || 'LOW').toUpperCase();

  const flood_prob_raw = raw.flood_probability ?? raw.flood_prob ?? raw.floodProb ?? 0;
  let flood_probability = Number(flood_prob_raw);
  if (flood_probability <= 1 && flood_probability > 0) {
    // Backend returned normalized 0-1 ratio instead of percentage
    flood_probability = Math.round(flood_probability * 100);
  }

  const rainfall_24h =
    raw.rainfall_24h !== undefined
      ? Number(raw.rainfall_24h)
      : raw.rainfall_24h_mm !== undefined
      ? Number(raw.rainfall_24h_mm)
      : undefined;

  const timestamp = raw.timestamp ? String(raw.timestamp) : undefined;
  const region_id = String(raw.region_id || raw.id || raw.sector_id || region_name.toLowerCase()).trim();

  let coordinates: [number, number] | undefined = undefined;
  if (Array.isArray(raw.coordinates) && raw.coordinates.length >= 2) {
    coordinates = [Number(raw.coordinates[0]), Number(raw.coordinates[1])];
  } else if (
    raw.coordinates &&
    typeof raw.coordinates === 'object' &&
    'lng' in raw.coordinates &&
    'lat' in raw.coordinates
  ) {
    const c = raw.coordinates as { lng: number; lat: number };
    coordinates = [Number(c.lng), Number(c.lat)];
  } else {
    coordinates = resolveRegionCoordinates(region_name || region_id);
  }

  return {
    region_id,
    region_name,
    risk_level,
    flood_probability,
    rainfall_24h,
    timestamp,
    coordinates,
    is_mock: Boolean(raw.is_mock || raw._isDevelopmentMock),
  };
}

/**
 * Isolated development mock prediction data for offline UI testing.
 * Strictly tagged as mock data; never claimed as live predictions.
 */
export const DEFAULT_MOCK_MAP_PREDICTIONS: BackendRegionPrediction[] = [
  {
    region_id: 'dhemaji',
    region_name: 'Dhemaji',
    risk_level: 'HIGH', // Authoritative backend risk level (simulated mock)
    flood_probability: 87.6,
    rainfall_24h: 142.5,
    timestamp: new Date().toISOString(),
    coordinates: [94.5822, 27.4812],
    is_mock: true,
  },
  {
    region_id: 'majuli',
    region_name: 'Majuli Island',
    risk_level: 'HIGH',
    flood_probability: 81.2,
    rainfall_24h: 118.0,
    timestamp: new Date().toISOString(),
    coordinates: [94.2238, 26.9634],
    is_mock: true,
  },
  {
    region_id: 'lakhimpur',
    region_name: 'Lakhimpur',
    risk_level: 'MODERATE',
    flood_probability: 64.8,
    rainfall_24h: 88.5,
    timestamp: new Date().toISOString(),
    coordinates: [94.1044, 27.2346],
    is_mock: true,
  },
  {
    region_id: 'dibrugarh',
    region_name: 'Dibrugarh',
    risk_level: 'MODERATE',
    flood_probability: 52.4,
    rainfall_24h: 64.2,
    timestamp: new Date().toISOString(),
    coordinates: [94.912, 27.4728],
    is_mock: true,
  },
  {
    region_id: 'tinsukia',
    region_name: 'Tinsukia',
    risk_level: 'LOW',
    flood_probability: 24.1,
    rainfall_24h: 32.0,
    timestamp: new Date().toISOString(),
    coordinates: [95.3468, 27.4922],
    is_mock: true,
  },
  {
    region_id: 'barpeta',
    region_name: 'Barpeta',
    risk_level: 'CRITICAL',
    flood_probability: 94.2,
    rainfall_24h: 185.0,
    timestamp: new Date().toISOString(),
    coordinates: [91.0044, 26.3216],
    is_mock: true,
  },
  {
    region_id: 'cachar',
    region_name: 'Cachar',
    risk_level: 'LOW',
    flood_probability: 18.5,
    rainfall_24h: 22.4,
    timestamp: new Date().toISOString(),
    coordinates: [92.7789, 24.8333],
    is_mock: true,
  },
];
