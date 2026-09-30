/**
 * FloodGuard ML Prediction API Service
 * 
 * This service layer abstracts future ML model API integration.
 * SECURITY NOTE: Never put ML API keys in frontend code or environment variables.
 * The frontend calls a secure backend endpoint, which then calls the ML API with its secret key.
 * 
 * Current behavior: Uses baseline prediction API (demo-baseline-v1) when available.
 * Falls back to mock data when API is unavailable.
 */

import { SectorData } from '../types';
import { ASSAM_SECTORS } from '../data/assamData';

// ─────────────────────────────────────────────────────────────────────────────
// API Request & Response Types (matching backend MLPredictionOutput)
// ─────────────────────────────────────────────────────────────────────────────

export interface PredictionRequest {
  regionId: string;
  latitude: number;
  longitude: number;
  /** ISO 8601 timestamp for prediction baseline */
  timestamp?: string;
  /** Forecast horizon in hours (e.g., 24, 48, 72) */
  forecastHours?: number;
}

export interface PredictionResponse {
  regionId: string;
  generatedAt: string;
  forecastValidUntil: string;
  floodProbability: number;        // 0-1
  riskLevel: 'low' | 'moderate' | 'high' | 'severe';
  modelVersion: string;
  
  /** Optional extended fields for UI compatibility */
  confidence?: number;               // 0-100
  inundationAreaKm2?: number;
  peakWaterDepthM?: number;
  populationAtRisk?: number;
  peakWindow?: string;               // e.g., "18-36 Hrs"
  rainfall24hMm?: number;
  riverStageM?: number;
  dangerLevelM?: number;
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';
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
 * Convert backend MLPredictionOutput to frontend PredictionResponse
 * Maps risk levels and probability scales
 */
function backendToFrontend(backend: any): any {
  const riskLevelMap: Record<string, string> = {
    'low': 'LOW',
    'moderate': 'MODERATE', 
    'high': 'HIGH',
    'severe': 'CRITICAL',
  };
  
  return {
    ...backend,
    sectorId: backend.regionId,
    timestamp: backend.generatedAt,
    floodProbability: Math.round(backend.floodProbability * 100), // 0-1 -> 0-100
    riskLevel: riskLevelMap[backend.riskLevel] || 'MODERATE',
    confidence: 85, // Baseline model confidence
    modelVersion: backend.modelVersion,
    dataFreshness: 'real-time',
    lastUpdated: backend.generatedAt,
    // Add computed fields for UI compatibility
    inundationAreaKm2: backend.floodProbability * 50, // Estimate
    peakWaterDepthM: backend.floodProbability * 2,   // Estimate
    populationAtRisk: 1000, // Placeholder
    peakWindow: '6-12 Hrs',
    rainfall24hMm: 0,
    riverStageM: 0,
    dangerLevelM: 0,
  };
}

/**
 * Convert SectorData to PredictionResponse format (fallback)
 */
function sectorToPrediction(sector: any): any {
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
 * Get flood prediction for a specific region
 * 
 * @param request - Prediction request parameters
 * @returns Prediction result with status
 */
export async function getPrediction(
  request: { regionId: string; latitude: number; longitude: number; timestamp?: string; forecastHours?: number }
): Promise<any> {
  // If no API base URL configured, return mock data
  if (!API_BASE_URL || API_BASE_URL === '') {
    const mockSector = ASSAM_SECTORS[request.regionId];
    if (!mockSector) {
      return {
        status: 'error',
        error: {
          error: 'SectorNotFound',
          message: `Sector '${request.regionId}' not found in mock data`,
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
    // Backend uses /api/v1/predict/{regionId} for GET or /api/v1/predict for POST
    const url = `${API_BASE_URL}/api/v1/predict/${request.regionId}`;
    const response = await fetchWithTimeout(
      url,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
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

    const backendData = await response.json();
    const frontendData = backendToFrontend(backendData);

    // Check if data is stale
    if (isDataStale(backendData.generatedAt)) {
      return {
        status: 'stale',
        data: frontendData,
        warning: `Prediction data is older than ${STALE_DATA_THRESHOLD_MS / 60000} minutes. Telemetry may be outdated.`,
      };
    }

    return {
      status: 'success',
      data: frontendData,
    };
  } catch (error) {
    // If API fails, return mock data as fallback
    const mockSector = ASSAM_SECTORS[request.regionId];
    if (mockSector) {
      console.warn('Prediction API unavailable, using mock data:', error);
      return {
        status: 'unavailable',
        fallback: mockSector,
      };
    }

    return {
      status: 'error',
      error: {
        error: 'NetworkError',
        message: error instanceof Error ? error.message : 'Failed to fetch prediction',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Get predictions for all regions (batch)
 */
export async function getAllPredictions(): Promise<any[]> {
  if (!API_BASE_URL || API_BASE_URL === '') {
    return Object.values(ASSAM_SECTORS).map(sector => ({
      status: 'unavailable',
      fallback: sector,
    }));
  }

  try {
    const url = `${API_BASE_URL}/api/v1/predict`;
    const response = await fetchWithTimeout(
      url,
      { method: 'GET' },
      API_TIMEOUT_MS
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const backendResults = await response.json();
    return backendResults.map((backend: any) => ({
      status: 'success',
      data: backendToFrontend(backend),
    }));
  } catch (error) {
    console.warn('Batch prediction API unavailable, using mock data:', error);
    return Object.values(ASSAM_SECTORS).map(sector => ({
      status: 'unavailable',
      fallback: sector,
    }));
  }
}

/**
 * Check API health status
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
      `${API_BASE_URL}/api/v1/health`,
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

/**
 * Get model info
 */
export async function getModelInfo(): Promise<any> {
  if (!API_BASE_URL || API_BASE_URL === '') {
    return {
      modelVersion: 'mock-v1.0',
      predictionMode: 'mock',
    };
  }

  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/api/v1/predict/model/info`,
      { method: 'GET' },
      5000
    );

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn('Model info API unavailable:', error);
  }
  
  return {
    modelVersion: 'unknown',
    predictionMode: 'unknown',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// React Hook (Optional)
// ─────────────────────────────────────────────────────────────────────────────

import * as React from 'react';

/**
 * React hook for fetching predictions with loading states
 * Usage in components:
 * 
 * const { data, loading, error, refetch } = usePrediction({ sectorId: 'dhemaji', ... });
 */
export function usePrediction(request: { regionId: string; latitude: number; longitude: number } | null) {
  const [result, setResult] = React.useState<any>({
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
  }, [request?.regionId, request?.timestamp]);

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