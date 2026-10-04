/**
 * FloodGuard Alert Adapter & Normalizer
 *
 * Normalizes backend alert payloads from GET /api/alerts?min_severity=Moderate
 *
 * CRITICAL BUSINESS RULES:
 * 1. Backend owns alert classification and severity.
 * 2. Frontend only displays severity, mapping it to presentation styling.
 * 3. Do not calculate severity (no heuristics, scores, or thresholds).
 * 4. Do not fabricate alerts.
 * 5. Mock alerts must never masquerade as live emergency directives.
 */

import { CircleAlert, TriangleAlert, Info, ShieldCheck, LucideIcon } from 'lucide-react';
import { BackendAlert } from '../types';
import { ACTIVE_FLOOD_ALERTS } from '../data/assamData';

export interface AlertSeverityPresentation {
  icon: LucideIcon;
  badgeClass: string;
  cardBorder: string;
  label: string;
  normalizedLevel: string;
  isUrgent: boolean;
}

/**
 * Pure presentation styling mapping for backend alert severity strings.
 *
 * NOTE: The frontend DOES NOT calculate severity.
 * This function only maps backend strings to CSS styling tokens.
 */
export function getAlertSeverityPresentation(severity?: string): AlertSeverityPresentation {
  const norm = String(severity || 'MODERATE').toUpperCase().trim();

  if (norm === 'CRITICAL' || norm === 'SEVERE') {
    return {
      icon: CircleAlert,
      badgeClass: 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/70 border-red-300 dark:border-red-900/60',
      cardBorder: 'border-red-300 dark:border-red-900/80 ring-1 ring-red-500/10',
      label: 'CRITICAL FLOOD WARNING',
      normalizedLevel: 'CRITICAL',
      isUrgent: true,
    };
  }

  if (norm === 'HIGH') {
    return {
      icon: TriangleAlert,
      badgeClass: 'text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/70 border-orange-300 dark:border-orange-900/60',
      cardBorder: 'border-orange-300 dark:border-orange-900/80',
      label: 'HIGH FLOOD WARNING',
      normalizedLevel: 'HIGH',
      isUrgent: true,
    };
  }

  if (norm === 'MODERATE') {
    return {
      icon: Info,
      badgeClass: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/70 border-amber-300 dark:border-amber-900/60',
      cardBorder: 'border-slate-200 dark:border-slate-800',
      label: 'MODERATE FLOOD WATCH',
      normalizedLevel: 'MODERATE',
      isUrgent: false,
    };
  }

  // RESOLVED / LOW / Other
  return {
    icon: ShieldCheck,
    badgeClass: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-900/60',
    cardBorder: 'border-slate-200 dark:border-slate-800',
    label: 'ADVISORY RESOLVED',
    normalizedLevel: 'RESOLVED',
    isUrgent: false,
  };
}

/**
 * Normalizes any incoming alert record (from GET /api/alerts or mock layer)
 * into a typed BackendAlert.
 *
 * Expected fields:
 * - id
 * - region
 * - severity
 * - message
 * - timestamp
 */
export function normalizeBackendAlert(raw: Record<string, unknown>): BackendAlert {
  const id = String(raw.id || raw._id || Math.random().toString(36).substring(2));
  const region = String(raw.region || raw.district || raw.location || 'Assam Region').trim();
  const severity = String(raw.severity || raw.risk_level || raw.riskLevel || raw.category || 'Moderate').trim();
  const message = String(
    raw.message || raw.headline || raw.summary || raw.description || 'Emergency flood warning directive'
  ).trim();
  const timestamp = String(raw.timestamp || 'Time not specified');

  const headline = raw.headline ? String(raw.headline) : message;
  const summary = raw.summary ? String(raw.summary) : message;
  const description = raw.description ? String(raw.description) : undefined;

  const action_items = Array.isArray(raw.action_items)
    ? (raw.action_items as string[])
    : Array.isArray(raw.actionItems)
    ? (raw.actionItems as string[])
    : raw.recommended_action
    ? [String(raw.recommended_action)]
    : raw.recommendedAction
    ? [String(raw.recommendedAction)]
    : undefined;

  const recommended_action = raw.recommended_action
    ? String(raw.recommended_action)
    : raw.recommendedAction
    ? String(raw.recommendedAction)
    : undefined;

  const issued_by = raw.issued_by ? String(raw.issued_by) : raw.issuedBy ? String(raw.issuedBy) : undefined;
  const authority = raw.authority ? String(raw.authority) : issued_by || 'ASDMA & Central Water Commission';

  const affected_population =
    raw.affected_population !== undefined
      ? Number(raw.affected_population)
      : raw.affectedPopulation !== undefined
      ? Number(raw.affectedPopulation)
      : raw.populationAtRisk !== undefined
      ? Number(raw.populationAtRisk)
      : undefined;

  const river_basin = raw.river_basin ? String(raw.river_basin) : raw.riverBasin ? String(raw.riverBasin) : undefined;
  const sector_id = raw.sector_id ? String(raw.sector_id) : raw.sectorId ? String(raw.sectorId) : undefined;
  const is_mock = Boolean(raw.is_mock || raw._isDevelopmentMock);

  return {
    id,
    region,
    severity,
    message,
    timestamp,
    headline,
    summary,
    description,
    action_items,
    recommended_action,
    issued_by,
    authority,
    affected_population,
    river_basin,
    sector_id,
    is_mock,
  };
}

/**
 * Isolated development mock alerts mapped directly from existing offline data.
 * Strictly tagged as mock data so they never claim to be live government directives.
 */
export const DEFAULT_MOCK_ALERTS: BackendAlert[] = ACTIVE_FLOOD_ALERTS.map((alert) =>
  normalizeBackendAlert({
    id: alert.id,
    region: alert.location,
    district: alert.district,
    location: alert.location,
    severity: alert.category, // e.g. "Critical", "High", "Moderate"
    riskLevel: alert.riskLevel,
    message: alert.headline,
    headline: alert.headline,
    summary: alert.summary,
    description: alert.description,
    actionItems: alert.actionItems,
    recommendedAction: alert.recommendedAction,
    issuedBy: alert.issuedBy,
    authority: alert.authority,
    timestamp: alert.timestamp,
    affectedPopulation: alert.affectedPopulation || alert.populationAtRisk,
    riverBasin: alert.riverBasin,
    sectorId: alert.sectorId,
    is_mock: true,
  })
);
