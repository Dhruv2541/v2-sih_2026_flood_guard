/**
 * FloodGuard Historical Data Adapter & Normalizer
 *
 * Normalizes backend records from GET /api/history/{city_name}
 *
 * CRITICAL BUSINESS RULES:
 * 1. Do not generate fake historical records to fill charts.
 * 2. Only real backend records or isolated development mock data.
 * 3. Never invent synthetic rainfall or probability numbers when missing.
 * 4. Keep mock data isolated behind the development mock layer.
 */

import { BackendHistoryRecord } from '../types';

export interface NormalizedCityHistory {
  cityName: string;
  records: BackendHistoryRecord[];
  isMock: boolean;
  summary?: string;
}

/**
 * Normalizes a single raw record from GET /api/history/{city_name}
 *
 * Expected fields:
 * - date (required for X-axis)
 * - rainfall_mm (optional, strictly undefined if missing)
 * - flood_probability (optional, strictly undefined if missing)
 */
export function normalizeBackendHistoryRecord(raw: Record<string, unknown>): BackendHistoryRecord {
  const date = String(raw.date || raw.timestamp || raw.year || 'Unknown Date').trim();

  // Strictly preserve numbers or leave as undefined (no fabricated defaults)
  const rainfall_mm =
    raw.rainfall_mm !== undefined && raw.rainfall_mm !== null
      ? Number(raw.rainfall_mm)
      : raw.rainfallMm !== undefined && raw.rainfallMm !== null
      ? Number(raw.rainfallMm)
      : raw.precipitation_mm !== undefined && raw.precipitation_mm !== null
      ? Number(raw.precipitation_mm)
      : undefined;

  const flood_probability =
    raw.flood_probability !== undefined && raw.flood_probability !== null
      ? Number(raw.flood_probability)
      : raw.floodProbability !== undefined && raw.floodProbability !== null
      ? Number(raw.floodProbability)
      : raw.probability !== undefined && raw.probability !== null
      ? Number(raw.probability)
      : undefined;

  const cityName =
    raw.city_name ? String(raw.city_name) : raw.cityName ? String(raw.cityName) : raw.city ? String(raw.city) : undefined;
  const is_mock = Boolean(raw.is_mock || raw._isDevelopmentMock);

  return {
    date,
    rainfall_mm: Number.isFinite(rainfall_mm) ? rainfall_mm : undefined,
    flood_probability: Number.isFinite(flood_probability) ? flood_probability : undefined,
    city_name: cityName,
    is_mock,
  };
}

/**
 * Normalizes any backend response format into a typed NormalizedCityHistory.
 * Handles array of records or wrapped object payload.
 */
export function normalizeCityHistoryResponse(
  raw: unknown,
  fallbackCity = 'Dhemaji'
): NormalizedCityHistory {
  if (!raw) {
    return {
      cityName: fallbackCity,
      records: [],
      isMock: false,
    };
  }

  // If payload is directly an array of records
  if (Array.isArray(raw)) {
    const records = raw.map((item) => normalizeBackendHistoryRecord(item as Record<string, unknown>));
    const isMock = records.some((r) => r.is_mock);
    return {
      cityName: fallbackCity,
      records,
      isMock,
    };
  }

  // If payload is wrapped in an object
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>;
    const cityName = String(obj.city_name || obj.city || obj.location || obj.district || fallbackCity);
    const summary = obj.summary ? String(obj.summary) : undefined;

    const rawList = Array.isArray(obj.records)
      ? obj.records
      : Array.isArray(obj.events)
      ? obj.events
      : Array.isArray(obj.data)
      ? obj.data
      : [];

    const records = rawList.map((item) => normalizeBackendHistoryRecord(item as Record<string, unknown>));
    const isMock = Boolean(obj.is_mock || obj._isDevelopmentMock || records.some((r) => r.is_mock));

    return {
      cityName,
      records,
      isMock,
      summary,
    };
  }

  return {
    cityName: fallbackCity,
    records: [],
    isMock: false,
  };
}

/**
 * Known locations across Assam for the location selector.
 */
export const AVAILABLE_HISTORY_LOCATIONS = [
  'Dhemaji',
  'Silchar',
  'Majuli',
  'Lakhimpur',
  'Dibrugarh',
  'Barpeta',
  'Guwahati',
] as const;

/**
 * Isolated development mock historical telemetry records.
 * STRICT RULE: Only provided for explicit testing locations.
 * Unlisted locations will produce an EMPTY state, NEVER fabricated records.
 */
export const ISOLATED_CITY_MOCK_HISTORY: Record<string, BackendHistoryRecord[]> = {
  Dhemaji: [
    { date: '15 Jun', rainfall_mm: 85.4, flood_probability: 42, is_mock: true },
    { date: '22 Jun', rainfall_mm: 142.0, flood_probability: 68, is_mock: true },
    { date: '01 Jul', rainfall_mm: 210.5, flood_probability: 88, is_mock: true },
    { date: '07 Jul', rainfall_mm: 175.2, flood_probability: 91, is_mock: true },
    { date: '14 Jul', rainfall_mm: 98.6, flood_probability: 74, is_mock: true },
    { date: '21 Jul', rainfall_mm: 64.0, flood_probability: 52, is_mock: true },
    { date: '28 Jul', rainfall_mm: 45.1, flood_probability: 38, is_mock: true },
    { date: '05 Aug', rainfall_mm: 110.8, flood_probability: 63, is_mock: true },
    { date: '12 Aug', rainfall_mm: 52.3, flood_probability: 30, is_mock: true },
  ],
  Silchar: [
    { date: '10 Jun', rainfall_mm: 120.5, flood_probability: 55, is_mock: true },
    { date: '16 Jun', rainfall_mm: 260.0, flood_probability: 92, is_mock: true },
    { date: '20 Jun', rainfall_mm: 310.2, flood_probability: 97, is_mock: true },
    { date: '24 Jun', rainfall_mm: 185.0, flood_probability: 89, is_mock: true },
    { date: '30 Jun', rainfall_mm: 95.4, flood_probability: 65, is_mock: true },
    { date: '08 Jul', rainfall_mm: 40.2, flood_probability: 35, is_mock: true },
  ],
  Majuli: [
    { date: '18 Jun', rainfall_mm: 68.2, flood_probability: 48, is_mock: true },
    { date: '25 Jun', rainfall_mm: 135.6, flood_probability: 76, is_mock: true },
    { date: '03 Jul', rainfall_mm: 180.4, flood_probability: 84, is_mock: true },
    { date: '10 Jul', rainfall_mm: 155.0, flood_probability: 82, is_mock: true },
    { date: '17 Jul', rainfall_mm: 72.1, flood_probability: 50, is_mock: true },
    { date: '24 Jul', rainfall_mm: 38.5, flood_probability: 28, is_mock: true },
  ],
};
