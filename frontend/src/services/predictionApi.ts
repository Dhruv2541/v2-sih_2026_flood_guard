/**
 * FloodGuard ML Prediction API Service
 * 
 * @deprecated LEGACY SERVICE - FOR RETENTION ONLY.
 * 
 * ARCHITECTURE RULES:
 * - Production code must use `src/api/predictions.ts` (Component -> API Layer -> Backend).
 * - Development UI testing must use `src/mocks/predictions.mock.ts` or `src/mocks/adapter.ts`.
 * - Never silently substitute mock data when a real backend API call fails.
 */

import { SectorData } from '../types';
import { ASSAM_SECTORS } from '../data/assamData';

// ─────────────────────────────────────────────────────────────────────────────
// API Request & Response Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PredictionRequest {
  sectorId: string;
  latitude: number;
  longitude: number;
  /** ISO 8601 timestamp for prediction baseline */
  timestamp?: string;
  /** Forecast horizon in hours (e.g., 24, 48, 72) */
  forecastHours?: number;
}

export interface PredictionResponse {
  sectorId: string;
  timestamp: string;
  floodProbability: number;        // 0-100
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'SEVERE' | 'RESOLVED';
  confidence: number;               // 0-100
  inundationAreaKm2: number;
  peakWaterDepthM: number;
  populationAtRisk: number;
  peakWindow: string;               // e.g., "18-36 Hrs"
  rainfall24hMm: number;
  riverStageM: number;
  dangerLevelM: number;
  
  /** Model metadata */
  modelVersion: string;
  dataFreshness: 'real-time' | 'recent' | 'stale' | 'unavailable';
  lastUpdated: string;              // ISO 8601
  
  /** Optional forecast timeline */
  timeline?: Array<{
    hour: number;
    floodProbability: number;
    riskLevel: string;
    inundationAreaKm2: number;
    riverStageM: number;
  }>;
}

export interface ApiError {
  error: string;
  message: string;
  code?: string;
  timestamp: string;
}

export type PredictionResult = 
  | { status: 'success'; data: PredictionResponse }
  | { status: 'loading'; data: null }
  | { status: 'error'; error: ApiError }
  | { status: 'stale'; data: PredictionResponse; warning: string }
  | { status: 'unavailable'; fallback: SectorData };

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API_TIMEOUT_MS = 15000;
const STALE_DATA_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if prediction data is stale (older than threshold)
 */
function isDataStale(timestamp: string): boolean {
  const dataTime = new Date(timestamp).getTime();
  const now = Date.now();
  return (now - dataTime) > STALE_DATA_THRESHOLD_MS;
}

/**
 * Convert SectorData to PredictionResponse format
 */
function sectorToPrediction(sector: SectorData): PredictionResponse {
  return {
    sectorId: sector.id,
    timestamp: new Date().toISOString(),
    floodProbability: sector.floodProb,
    riskLevel: sector.hazardLevel,
    confidence: sector.confidence,
    inundationAreaKm2: sector.inundationAreaKm2,
    peakWaterDepthM: sector.waterDepthPeakM,
    populationAtRisk: sector.populationAtRisk,
    peakWindow: sector.peakWindow,
    rainfall24hMm: sector.rainfall.currentRainfall24hMm,
    riverStageM: sector.stageAbsolute,
    dangerLevelM: sector.dangerLevel,
    modelVersion: 'mock-v1.0',
    dataFreshness: 'recent',
    lastUpdated: new Date().toISOString(),
    timeline: sector.timeline?.map(step => ({
      hour: step.hour,
      floodProbability: step.floodProbability,
      riskLevel: step.riskLevel,
      inundationAreaKm2: step.inundationAreaKm2,
      riverStageM: step.riverStageM || sector.stageAbsolute,
    })),
  };
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main API Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get flood prediction for a specific sector
 * 
 * @param request - Prediction request parameters
 * @returns Prediction result with status
 * 
 * @example
 * const result = await getPrediction({ sectorId: 'dhemaji', latitude: 27.4812, longitude: 94.5822 });
 * if (result.status === 'success') {
 *   console.log('Flood probability:', result.data.floodProbability);
 * }
 */
export async function getPrediction(
  request: PredictionRequest
): Promise<PredictionResult> {
  // If no API base URL configured, return mock data
  if (!API_BASE_URL || API_BASE_URL === '') {
    const mockSector = ASSAM_SECTORS[request.sectorId];
    if (!mockSector) {
      return {
        status: 'error',
        error: {
          error: 'SectorNotFound',
          message: `Sector '${request.sectorId}' not found in mock data`,
          timestamp: new Date().toISOString(),
        },
      };
    }
    
    return {
      status: 'unavailable',
      fallback: mockSector,
    };
  }

  try {
    const url = `${API_BASE_URL}/api/predict`;
    const response = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sector_id: request.sectorId,
          latitude: request.latitude,
          longitude: request.longitude,
          timestamp: request.timestamp || new Date().toISOString(),
          forecast_hours: request.forecastHours || 72,
        }),
      },
      API_TIMEOUT_MS
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        status: 'error',
        error: {
          error: `HTTP ${response.status}`,
          message: errorData.message || response.statusText,
          code: errorData.code,
          timestamp: new Date().toISOString(),
        },
      };
    }

    const data: PredictionResponse = await response.json();

    // Check if data is stale
    if (isDataStale(data.lastUpdated)) {
      return {
        status: 'stale',
        data,
        warning: `Prediction data is older than ${STALE_DATA_THRESHOLD_MS / 60000} minutes. Telemetry may be outdated.`,
      };
    }

    return {
      status: 'success',
      data,
    };
  } catch (error) {
    // Architectural rule: Never silently substitute mock data when the real backend API fails
    return {
      status: 'error',
      error: {
        error: 'NetworkError',
        message: error instanceof Error ? error.message : 'Failed to fetch prediction from backend API',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Get predictions for multiple sectors (batch request)
 * 
 * @param requests - Array of prediction requests
 * @returns Array of prediction results
 */
export async function getBatchPredictions(
  requests: PredictionRequest[]
): Promise<PredictionResult[]> {
  // If no API configured, return mock data for all
  if (!API_BASE_URL || API_BASE_URL === '') {
    return requests.map(req => {
      const mockSector = ASSAM_SECTORS[req.sectorId];
      return mockSector
        ? { status: 'unavailable' as const, fallback: mockSector }
        : {
            status: 'error' as const,
            error: {
              error: 'SectorNotFound',
              message: `Sector '${req.sectorId}' not found`,
              timestamp: new Date().toISOString(),
            },
          };
    });
  }

  try {
    const url = `${API_BASE_URL}/api/predict/batch`;
    const response = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: requests.map(req => ({
            sector_id: req.sectorId,
            latitude: req.latitude,
            longitude: req.longitude,
            timestamp: req.timestamp || new Date().toISOString(),
            forecast_hours: req.forecastHours || 72,
          })),
        }),
      },
      API_TIMEOUT_MS
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const { results }: { results: PredictionResponse[] } = await response.json();
    
    return results.map(data => {
      if (isDataStale(data.lastUpdated)) {
        return {
          status: 'stale' as const,
          data,
          warning: 'Prediction data may be outdated',
        };
      }
      return { status: 'success' as const, data };
    });
  } catch (error) {
    console.warn('Batch prediction API unavailable, using mock data:', error);
    return requests.map(req => {
      const mockSector = ASSAM_SECTORS[req.sectorId];
      return mockSector
        ? { status: 'unavailable' as const, fallback: mockSector }
        : {
            status: 'error' as const,
            error: {
              error: 'NetworkError',
              message: 'Batch prediction failed',
              timestamp: new Date().toISOString(),
            },
          };
    });
  }
}

/**
 * Check API health status
 * 
 * @returns API status information
 */
export async function checkApiHealth(): Promise<{
  available: boolean;
  version?: string;
  message?: string;
}> {
  if (!API_BASE_URL || API_BASE_URL === '') {
    return {
      available: false,
      message: 'API base URL not configured. Using mock data.',
    };
  }

  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/api/health`,
      { method: 'GET' },
      5000
    );

    if (response.ok) {
      const data = await response.json();
      return {
        available: true,
        version: data.version,
        message: data.message || 'API is operational',
      };
    }

    return {
      available: false,
      message: `API returned ${response.status}`,
    };
  } catch (error) {
    return {
      available: false,
      message: error instanceof Error ? error.message : 'API unreachable',
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// React Hook (Optional)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * React hook for fetching predictions with loading states
 * Usage in components:
 * 
 * const { data, loading, error, refetch } = usePrediction({ sectorId: 'dhemaji', ... });
 */
export function usePredictionData(request: PredictionRequest | null) {
  const [result, setResult] = React.useState<PredictionResult>({
    status: 'loading',
    data: null,
  });

  React.useEffect(() => {
    if (!request) return;

    let cancelled = false;

    const fetchData = async () => {
      setResult({ status: 'loading', data: null });
      const response = await getPrediction(request);
      if (!cancelled) {
        setResult(response);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [request?.sectorId, request?.timestamp]);

  const refetch = React.useCallback(() => {
    if (request) {
      getPrediction(request).then(setResult);
    }
  }, [request]);

  return {
    result,
    loading: result.status === 'loading',
    error: result.status === 'error' ? result.error : null,
    data:
      result.status === 'success' || result.status === 'stale'
        ? result.data
        : result.status === 'unavailable'
        ? sectorToPrediction(result.fallback)
        : null,
    refetch,
  };
}

// Import React for the hook (only if used)
import * as React from 'react';
