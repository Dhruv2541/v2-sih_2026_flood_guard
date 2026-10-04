/**
 * ============================================================================
 * FloodGuard Development-Only Mock Adapter
 * ============================================================================
 *
 * ARCHITECTURAL CONTRACT:
 * 1. This adapter is STRICTLY for local UI development and component styling.
 * 2. It must NEVER be used to silently mask or fall back from real backend API failures.
 * 3. Never present mock values as actual live flood predictions to end users.
 *
 * PRODUCTION FLOW:
 *    Component ──▶ src/api/* ──▶ FastAPI Backend
 *
 * TEMPORARY DEVELOPMENT FLOW:
 *    Component ──▶ src/mocks/adapter.ts ──▶ src/mocks/*.mock.ts
 *
 * When the backend is ready, components simply swap their import from
 * `../mocks/adapter` to `../api`, or use the feature flag below.
 *
 * @module mocks/adapter
 */

import { StateResponse } from '../api/state';
import {
  LocationPredictionData,
  LivePredictionResponse,
  PredictLocationParams
} from '../api/predictions';
import { AlertItem, AlertsResponse, AlertsQueryParams } from '../api/alerts';
import { CityHistoryResponse } from '../api/history';
import { SimulationRequest, SimulationResponse } from '../api/simulation';
import { SectorData, GaugeStation, ReliefCamp } from '../types';

import { getMockState, mockRegionRiskData } from './state.mock';
import {
  getMockLocationPrediction,
  mockLivePredictionResponse,
  mockLocationPredictions
} from './predictions.mock';
import { getMockAlerts, mockAlertsResponse, mockActiveAlerts } from './alerts.mock';
import { getMockCityHistory, mockAnnualHistoricalRecords } from './history.mock';
import { getMockSimulation } from './simulation.mock';

import {
  ASSAM_SECTORS,
  CWC_GAUGE_STATIONS,
  RELIEF_CAMPS
} from '../data/assamData';

// ---------------------------------------------------------------------------
// Configuration & Kill Switch
// ---------------------------------------------------------------------------

let mockAdapterEnabled =
  typeof import.meta !== 'undefined' &&
  import.meta.env &&
  import.meta.env.VITE_USE_MOCKS === 'false'
    ? false
    : true;

let loggingEnabled = true;

/**
 * Checks whether the development mock adapter is active.
 */
export function isMockAdapterEnabled(): boolean {
  return mockAdapterEnabled;
}

/**
 * Programmatically enable or disable the development mock adapter.
 * Useful for automated tests or switching to live backend verification.
 */
export function setMockAdapterEnabled(enabled: boolean): void {
  mockAdapterEnabled = enabled;
  if (!enabled) {
    console.info(
      '🔒 [FloodGuard Mock Adapter] Mock adapter DISABLED. Direct API calls required.'
    );
  } else {
    console.warn(
      '⚠️ [FloodGuard Mock Adapter] Mock adapter ENABLED for local UI development.'
    );
  }
}

/**
 * Toggle development console warnings.
 */
export function setMockLogging(enabled: boolean): void {
  loggingEnabled = enabled;
}

function warnMockUsage(feature: string): void {
  if (loggingEnabled && typeof console !== 'undefined' && console.warn) {
    console.warn(
      `⚠️ [FloodGuard Dev Mock Adapter] Returning simulated mock data for [${feature}]. ` +
        `This is strictly for UI development; never use as live flood intelligence.`
    );
  }
}

function assertAdapterActive(feature: string): void {
  if (!mockAdapterEnabled) {
    throw new Error(
      `[FloodGuard Mock Adapter] Access denied for [${feature}]: Mock adapter has been disabled. ` +
        `Direct backend API integration via 'src/api' is required.`
    );
  }
}

// ---------------------------------------------------------------------------
// Mock Adapter Interface
// ---------------------------------------------------------------------------

export interface FloodGuardMockAdapter {
  isMock: true;
  getState: (delayMs?: number) => Promise<StateResponse>;
  getLivePredictions: (delayMs?: number) => Promise<LivePredictionResponse>;
  getPredictionForLocation: (
    locationName: string,
    params?: PredictLocationParams,
    delayMs?: number
  ) => Promise<LocationPredictionData>;
  getAlerts: (
    params?: AlertsQueryParams,
    delayMs?: number
  ) => Promise<AlertItem[] | AlertsResponse>;
  getCityHistory: (
    cityName: string,
    delayMs?: number
  ) => Promise<CityHistoryResponse>;
  runSimulation: (
    request?: SimulationRequest,
    delayMs?: number
  ) => Promise<SimulationResponse>;

  // Development helpers for existing UI components
  getSectors: () => Record<string, SectorData>;
  getSectorById: (id: string) => SectorData | undefined;
  getGaugeStations: () => GaugeStation[];
  getReliefCamps: () => ReliefCamp[];
  getActiveAlertsFormatted: () => typeof mockActiveAlerts;
  getRegionRiskData: () => typeof mockRegionRiskData;
}

/**
 * Authoritative Development-Only Mock Adapter instance.
 */
export const mockAdapter: FloodGuardMockAdapter = {
  isMock: true,

  async getState(delayMs = 150): Promise<StateResponse> {
    assertAdapterActive('getState');
    warnMockUsage('Regional State Overview');
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
    return getMockState();
  },

  async getLivePredictions(delayMs = 150): Promise<LivePredictionResponse> {
    assertAdapterActive('getLivePredictions');
    warnMockUsage('Live Predictions Overview');
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
    return { ...mockLivePredictionResponse, timestamp: new Date().toISOString() };
  },

  async getPredictionForLocation(
    locationName: string,
    params?: PredictLocationParams,
    delayMs = 150
  ): Promise<LocationPredictionData> {
    assertAdapterActive(`getPredictionForLocation:${locationName}`);
    warnMockUsage(`Location Prediction (${locationName})`);
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
    return getMockLocationPrediction(locationName, params);
  },

  async getAlerts(
    params?: AlertsQueryParams,
    delayMs = 150
  ): Promise<AlertItem[] | AlertsResponse> {
    assertAdapterActive('getAlerts');
    warnMockUsage('Emergency Alerts');
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
    const items = getMockAlerts(params);
    return {
      alerts: items,
      total: items.length,
      timestamp: new Date().toISOString(),
      _isDevelopmentMock: true
    };
  },

  async getCityHistory(
    cityName: string,
    delayMs = 150
  ): Promise<CityHistoryResponse> {
    assertAdapterActive(`getCityHistory:${cityName}`);
    warnMockUsage(`City History (${cityName})`);
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
    return getMockCityHistory(cityName);
  },

  async runSimulation(
    request?: SimulationRequest,
    delayMs = 250
  ): Promise<SimulationResponse> {
    assertAdapterActive('runSimulation');
    warnMockUsage('Hydrological Simulation');
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
    return getMockSimulation(request);
  },

  getSectors(): Record<string, SectorData> {
    warnMockUsage('ASSAM_SECTORS');
    return ASSAM_SECTORS;
  },

  getSectorById(id: string): SectorData | undefined {
    warnMockUsage(`Sector (${id})`);
    return ASSAM_SECTORS[id];
  },

  getGaugeStations(): GaugeStation[] {
    warnMockUsage('CWC_GAUGE_STATIONS');
    return CWC_GAUGE_STATIONS;
  },

  getReliefCamps(): ReliefCamp[] {
    warnMockUsage('RELIEF_CAMPS');
    return RELIEF_CAMPS;
  },

  getActiveAlertsFormatted() {
    warnMockUsage('ACTIVE_FLOOD_ALERTS');
    return mockActiveAlerts;
  },

  getRegionRiskData() {
    warnMockUsage('mockRegionRiskData');
    return mockRegionRiskData;
  }
};
