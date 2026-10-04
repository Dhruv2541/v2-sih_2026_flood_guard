/**
 * FloodGuard History API
 *
 * Provides functions for querying longitudinal historical flood records for specific cities/districts.
 * Endpoint: GET /api/history/{city_name}
 *
 * DATA INTEGRITY RULE:
 * - Only verified historical figures from authoritative government records.
 */

import { request } from './client';
import { BackendHistoryRecord } from '../types';

export type { BackendHistoryRecord };

/**
 * Historical flood event metrics for a single occurrence or annual aggregate.
 */
export interface HistoricalEventRecord {
  year?: number;
  date?: string;
  population_affected_lakh?: number;
  crop_area_affected_lakh_ha?: number;
  human_lives_lost?: number;
  cattle_lost?: number;
  total_damage_crore?: number;
  villages_affected?: number;
  districts_affected?: number;
  peak_water_level_m?: number;
  rainfall_mm?: number;
  flood_probability?: number;
  source?: string;
  key_events?: string;
  [key: string]: unknown;
}

/**
 * Encapsulated city historical archive response.
 */
export interface CityHistoryResponse {
  city?: string;
  city_name?: string;
  location?: string;
  district?: string;
  records?: BackendHistoryRecord[];
  events?: HistoricalEventRecord[];
  summary?: string;
  discrepancy_notes?: string;
  [key: string]: unknown;
}

/**
 * Fetches verified longitudinal flood history for a specific city or district.
 * HTTP GET /api/history/{city_name}
 *
 * @param cityName - The name of the city or district (e.g. "Dhemaji", "Silchar", "Guwahati")
 * @param signal - Optional AbortSignal for request cancellation
 */
export async function getCityHistory(
  cityName: string,
  signal?: AbortSignal,
): Promise<CityHistoryResponse | BackendHistoryRecord[] | HistoricalEventRecord[]> {
  const encodedCity = encodeURIComponent(cityName.trim());
  return request<CityHistoryResponse | BackendHistoryRecord[] | HistoricalEventRecord[]>(
    `/api/history/${encodedCity}`,
    { signal },
  );
}
