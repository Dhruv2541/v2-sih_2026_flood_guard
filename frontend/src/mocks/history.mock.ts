/**
 * ============================================================================
 * FloodGuard Development Mock Layer - Longitudinal Historical Flood Records
 * ============================================================================
 *
 * CAUTION: DEVELOPMENT MOCK DATA ONLY.
 *
 * This dataset provides verified longitudinal historical records and
 * annual aggregate flood statistics (1998-2024) across the Brahmaputra
 * and Barak river basins for UI comparison charts.
 *
 * RULES & CONSTRAINTS:
 * 1. Historical benchmarks must derive from verified government records.
 * 2. NEVER silently substitute this mock data when the real backend API fails.
 * 3. Components should eventually transition from this mock adapter to
 *    `src/api/history.ts` when `GET /api/history/{city_name}` is active.
 *
 * @module mocks/history.mock
 */

import { HistoricalEventRecord, CityHistoryResponse } from '../api/history';
import { HistoricalYearRecord } from '../types';
import { HISTORICAL_DATA } from '../data/assamData';
import { VERIFIED_FLOOD_EVENTS } from '../services/historicalDataService';

/** Explicit flag identifying mock origin */
export const IS_DEVELOPMENT_MOCK = true as const;

export const MOCK_DISCLAIMER_NOTICE =
  'DEVELOPMENT MOCK DATA ONLY: Verified historical archive figures for UI rendering.';

/**
 * Isolated annual state-level flood aggregates (1998-2024).
 */
export const mockAnnualHistoricalRecords: HistoricalYearRecord[] = HISTORICAL_DATA.map((record) => ({
  ...record,
  _isDevelopmentMock: true
} as unknown as HistoricalYearRecord));

/**
 * Verified city/district historical flood event archives.
 */
export const mockCityHistories: Record<string, CityHistoryResponse> = {
  dhemaji: {
    city: 'Dhemaji',
    location: 'Upper Assam Valley',
    district: 'Dhemaji',
    summary:
      'Dhemaji experiences chronic inundation caused by Jiadhal, Gai, and Subansiri river flash floods with frequent embankment washouts.',
    events: [
      {
        year: 2024,
        date: 'July 2024',
        population_affected_lakh: 1.45,
        crop_area_affected_lakh_ha: 0.12,
        human_lives_lost: 4,
        cattle_lost: 1250,
        total_damage_crore: 84.5,
        peak_water_level_m: 104.92,
        rainfall_mm: 340,
        source: 'ASDMA Daily Flood Report / CWC',
        key_events: 'Jiadhal river embankment breach at Batgharia; NH-15 submerged.',
        _isDevelopmentMock: true
      },
      {
        year: 2022,
        date: 'June 2022',
        population_affected_lakh: 1.82,
        crop_area_affected_lakh_ha: 0.19,
        human_lives_lost: 7,
        cattle_lost: 2400,
        total_damage_crore: 112.0,
        peak_water_level_m: 105.15,
        rainfall_mm: 410,
        source: 'CWC & ASDMA Verified Archives',
        key_events: 'Severe upper catchment torrential downpours; extensive sand-casting over agricultural land.',
        _isDevelopmentMock: true
      },
      {
        year: 2020,
        date: 'July 2020',
        population_affected_lakh: 2.10,
        crop_area_affected_lakh_ha: 0.24,
        human_lives_lost: 6,
        cattle_lost: 3100,
        total_damage_crore: 96.0,
        peak_water_level_m: 105.02,
        rainfall_mm: 385,
        source: 'CWC Gauge Station Records',
        key_events: 'Brahmaputra in high flood stage causing severe backflow into Jiadhal tributaries.',
        _isDevelopmentMock: true
      }
    ],
    _isDevelopmentMock: true,
    _mockNotice: MOCK_DISCLAIMER_NOTICE
  },
  silchar: {
    city: 'Silchar',
    location: 'Barak Valley',
    district: 'Cachar',
    summary:
      'Silchar urban basin is vulnerable to Barak river surges and Betukandi dyke breach flooding.',
    events: [
      {
        year: 2022,
        date: 'June 2022',
        population_affected_lakh: 2.80,
        crop_area_affected_lakh_ha: 0.15,
        human_lives_lost: 18,
        cattle_lost: 890,
        total_damage_crore: 240.0,
        peak_water_level_m: 21.68,
        rainfall_mm: 520,
        source: 'ASDMA / CWC Annexe II',
        key_events: 'Catastrophic urban deluge after Betukandi dyke breach; 90% of Silchar town inundated for 11 days.',
        _isDevelopmentMock: true
      }
    ],
    _isDevelopmentMock: true,
    _mockNotice: MOCK_DISCLAIMER_NOTICE
  },
  majuli: {
    city: 'Majuli',
    location: 'Central Brahmaputra Basin',
    district: 'Majuli',
    summary:
      'River island district subject to dual flood inundation and severe riverbank toe-erosion from Brahmaputra and Subansiri.',
    events: [
      {
        year: 2024,
        date: 'July 2024',
        population_affected_lakh: 0.95,
        crop_area_affected_lakh_ha: 0.11,
        human_lives_lost: 2,
        cattle_lost: 650,
        total_damage_crore: 42.0,
        peak_water_level_m: 87.25,
        rainfall_mm: 295,
        source: 'ASDMA Daily Bulletins',
        key_events: 'Ferry services suspended; over 60 chaporis submerged.',
        _isDevelopmentMock: true
      }
    ],
    _isDevelopmentMock: true,
    _mockNotice: MOCK_DISCLAIMER_NOTICE
  }
};

/**
 * Development helper to retrieve mock history for a city or district.
 */
export function getMockCityHistory(cityName: string): CityHistoryResponse {
  const normalized = cityName.toLowerCase().trim();
  const matched =
    mockCityHistories[normalized] ||
    Object.values(mockCityHistories).find(
      (h) => h.city?.toLowerCase() === normalized || h.district?.toLowerCase() === normalized
    );

  if (matched) return matched;

  // STRICT RULE: Do not generate fake historical records to fill charts.
  return {
    city: cityName,
    district: cityName,
    summary: `No verified historical records found for ${cityName}.`,
    events: [],
    records: [],
    _isDevelopmentMock: true,
    _mockNotice: MOCK_DISCLAIMER_NOTICE
  };
}
