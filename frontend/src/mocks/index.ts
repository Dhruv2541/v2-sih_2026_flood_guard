/**
 * ============================================================================
 * FloodGuard Development Mock Layer - Central Index
 * ============================================================================
 *
 * This barrel module re-exports all isolated development mocks and the
 * development-only mock adapter.
 *
 * ARCHITECTURAL CONTRACT:
 * - Mocks are ONLY for local UI development.
 * - Never present mock values as actual live flood predictions.
 * - Never silently substitute mock data when the real backend API fails.
 *
 * @module mocks
 */

export {
  mockRegionStateSummaries,
  mockStateResponse,
  mockRegionRiskData,
  getMockState
} from './state.mock';

export {
  mockLocationPredictions,
  mockLivePredictionResponse,
  getMockLocationPrediction
} from './predictions.mock';

export {
  mockActiveAlerts,
  mockAlertItems,
  mockAlertsResponse,
  getMockAlerts
} from './alerts.mock';

export {
  mockAnnualHistoricalRecords,
  mockCityHistories,
  getMockCityHistory
} from './history.mock';

export {
  getMockSimulation
} from './simulation.mock';

export * from './adapter';
