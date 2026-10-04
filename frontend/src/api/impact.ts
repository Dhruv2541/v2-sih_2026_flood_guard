/**
 * FloodGuard Impact API
 *
 * Provides functions for querying human vulnerability and critical infrastructure exposure.
 * Endpoint: GET /api/impact/{location_name}
 *
 * BUSINESS RULE:
 * - Exposure assessment and demographic vulnerability metrics are calculated server-side.
 */

import { request } from './client';

/**
 * Monitored critical infrastructure asset (hospital, school, bridge, road).
 */
export interface InfrastructureAsset {
  id?: string;
  name?: string;
  type?: 'hospital' | 'school' | 'road' | 'bridge' | string;
  status?: string;
  risk_level?: string;
  distance_from_inundation_m?: number;
  capacity?: string;
  details?: string;
  coordinates?: { lat?: number; lng?: number; [key: string]: unknown };
  [key: string]: unknown;
}

/**
 * Vulnerable demographic groups in the inundation path.
 */
export interface DemographicVulnerability {
  children_under_5?: number;
  elderly_above_65?: number;
  pregnant_women?: number;
  livestock_count?: number;
  informal_dwellings?: number;
  total_population_at_risk?: number;
  [key: string]: unknown;
}

/**
 * Summary counts of infrastructure types in the affected sector.
 */
export interface InfrastructureCounts {
  hospitals?: number;
  schools?: number;
  roads?: number;
  bridges?: number;
  [key: string]: unknown;
}

/**
 * Response structure for GET /api/impact/{location_name}.
 */
export interface SectorImpactResponse {
  location?: string;
  district?: string;
  population_at_risk?: number;
  demographics?: DemographicVulnerability;
  infrastructure_counts?: InfrastructureCounts;
  infrastructure_list?: InfrastructureAsset[];
  [key: string]: unknown;
}

/**
 * Fetches human vulnerability and critical infrastructure exposure for a location.
 * HTTP GET /api/impact/{location_name}
 *
 * @param locationName - The name or ID of the location (e.g. "Dhemaji", "Majuli")
 * @param signal - Optional AbortSignal for cancellation
 */
export async function getSectorImpact(
  locationName: string,
  signal?: AbortSignal,
): Promise<SectorImpactResponse> {
  const encodedLocation = encodeURIComponent(locationName.trim());
  return request<SectorImpactResponse>(`/api/impact/${encodedLocation}`, { signal });
}
