/**
 * FloodGuard Alerts API
 *
 * Provides functions for querying active emergency flood alerts and directives.
 * Endpoint: GET /api/alerts?min_severity=Moderate
 *
 * BUSINESS RULE:
 * - Frontend displays data.
 * - Backend alert severity and directives are the authoritative source of truth.
 */

import { request } from './client';

/**
 * Individual public flood warning or emergency directive.
 */
export interface AlertItem {
  id?: string;
  region?: string;
  location?: string;
  district?: string;
  severity?: string; // e.g. "Critical", "High", "Moderate", "Resolved"
  risk_level?: string;
  message?: string;
  headline?: string;
  summary?: string;
  description?: string;
  action_items?: string[];
  recommended_action?: string;
  issued_by?: string;
  authority?: string;
  timestamp?: string;
  affected_population?: number;
  population_at_risk?: number;
  category?: string;
  sector_id?: string;
  [key: string]: unknown;
}

/**
 * Encapsulated response if backend returns an object wrapper.
 */
export interface AlertsResponse {
  alerts?: AlertItem[];
  total?: number;
  timestamp?: string;
  [key: string]: unknown;
}

/**
 * Query parameters for filtering alerts.
 */
export interface AlertsQueryParams {
  /** Minimum severity threshold (e.g. "Moderate", "High", "Critical") */
  min_severity?: string;
  /** Filter to a specific district */
  district?: string;
  /** Pagination limit */
  limit?: number;
  /** Optional cancellation signal */
  signal?: AbortSignal;
}

/**
 * Fetches active public flood warnings and emergency directives.
 * HTTP GET /api/alerts?min_severity=Moderate
 *
 * @param params - Optional severity filter and district query
 */
export async function getAlerts(
  params: AlertsQueryParams = {},
): Promise<AlertItem[] | AlertsResponse> {
  return request<AlertItem[] | AlertsResponse>('/api/alerts', {
    signal: params.signal,
    params: {
      min_severity: params.min_severity ?? 'Moderate',
      district: params.district,
      limit: params.limit,
    },
  });
}
