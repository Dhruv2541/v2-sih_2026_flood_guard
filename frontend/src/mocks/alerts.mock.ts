/**
 * ============================================================================
 * FloodGuard Development Mock Layer - Emergency Alerts & Directives
 * ============================================================================
 *
 * CAUTION: DEVELOPMENT MOCK DATA ONLY.
 *
 * This dataset provides simulated emergency alerts, evacuation directives,
 * and siren dispatch records STRICTLY for local UI testing and styling
 * while the FastAPI alert service is under development.
 *
 * RULES & CONSTRAINTS:
 * 1. NEVER present these alerts as actual live emergency orders to the public.
 * 2. NEVER silently substitute this mock data when the real backend API fails.
 * 3. Components should eventually transition from this mock adapter to
 *    `src/api/alerts.ts` when `GET /api/alerts` is active.
 *
 * @module mocks/alerts.mock
 */

import { AlertItem, AlertsResponse, AlertsQueryParams } from '../api/alerts';
import { FloodAlert } from '../types';
import { ACTIVE_FLOOD_ALERTS } from '../data/assamData';

/** Explicit flag identifying mock origin */
export const IS_DEVELOPMENT_MOCK = true as const;

export const MOCK_DISCLAIMER_NOTICE =
  'DEVELOPMENT MOCK DATA ONLY: Simulated flood warnings for UI testing. Not official ASDMA/CWC alerts.';

/**
 * Isolated active flood alerts typed for frontend component rendering.
 */
export const mockActiveAlerts: FloodAlert[] = ACTIVE_FLOOD_ALERTS.map((alert) => ({
  ...alert,
  _isDevelopmentMock: true
} as unknown as FloodAlert));

/**
 * Isolated mock alert items formatted to match backend `GET /api/alerts` schema.
 */
export const mockAlertItems: AlertItem[] = ACTIVE_FLOOD_ALERTS.map((alert) => ({
  id: alert.id,
  location: alert.location,
  district: alert.district,
  severity: alert.category, // e.g. "Critical", "High", "Moderate", "Resolved"
  risk_level: alert.riskLevel,
  headline: alert.headline,
  summary: alert.summary,
  description: alert.description || alert.summary,
  action_items: alert.actionItems || [alert.recommendedAction],
  recommended_action: alert.recommendedAction,
  issued_by: alert.issuedBy,
  authority: alert.authority || 'Assam State Disaster Management Authority (ASDMA)',
  timestamp: alert.timestamp,
  affected_population: alert.affectedPopulation || alert.populationAtRisk,
  population_at_risk: alert.populationAtRisk,
  category: alert.category,
  sector_id: alert.sectorId,
  _isDevelopmentMock: true,
  _mockDisclaimer: MOCK_DISCLAIMER_NOTICE
}));

/**
 * Isolated mock response matching backend endpoint `GET /api/alerts`.
 */
export const mockAlertsResponse: AlertsResponse = {
  alerts: mockAlertItems,
  total: mockAlertItems.length,
  timestamp: new Date().toISOString(),
  _isDevelopmentMock: true,
  _mockNotice: MOCK_DISCLAIMER_NOTICE
};

/**
 * Development helper to retrieve mock alerts with optional severity and district filters.
 */
export function getMockAlerts(params: AlertsQueryParams = {}): AlertItem[] {
  let filtered = [...mockAlertItems];

  if (params.district) {
    const d = params.district.toLowerCase();
    filtered = filtered.filter((a) => a.district?.toLowerCase().includes(d));
  }

  if (params.min_severity) {
    const severityOrder = ['Moderate', 'High', 'Critical'];
    const minIndex = severityOrder.indexOf(params.min_severity);
    if (minIndex !== -1) {
      filtered = filtered.filter((a) => {
        const itemIndex = severityOrder.indexOf(a.severity || 'Moderate');
        return itemIndex >= minIndex;
      });
    }
  }

  if (params.limit && params.limit > 0) {
    filtered = filtered.slice(0, params.limit);
  }

  return filtered;
}
