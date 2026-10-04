/**
 * FloodGuard Simulation Adapter & Validator
 *
 * Normalizes, validates, and simulates scenario parameters for POST /api/simulate.
 *
 * CRITICAL BUSINESS RULES:
 * 1. "SIMULATION MODE — This is a hypothetical scenario, not an actual observed flood event."
 * 2. Simulation data must NEVER be presented as actual flood observations.
 * 3. Keep simulation state strictly separated from live prediction state.
 * 4. Do not fabricate a simulation result. Use an isolated development mock only for UI testing, clearly marked as mock.
 */

import {
  BackendSimulationRequest,
  BackendSimulationResponse,
  BackendSimulationResultItem,
} from '../types';

export const SIMULATION_WARNING_BANNER =
  'SIMULATION MODE — This is a hypothetical scenario, not an actual observed flood event.';

export const SIMULATION_AVAILABLE_LOCATIONS = [
  'Dhemaji',
  'Majuli',
  'Lakhimpur',
  'Barpeta',
  'Silchar',
  'Dibrugarh',
  'Guwahati',
  'Dhubri',
  'Morigaon',
] as const;

export interface SimulationFormState {
  severity_multiplier: number;
  use_live_weather: boolean;
  custom_rainfall_mm: string | number;
  city_or_district: string;
}

export interface SimulationValidationResult {
  isValid: boolean;
  errors: {
    severity_multiplier?: string;
    custom_rainfall_mm?: string;
    city_or_district?: string;
  };
}

/**
 * Validates simulation input parameters prior to dispatch.
 */
export function validateSimulationInputs(inputs: SimulationFormState): SimulationValidationResult {
  const errors: SimulationValidationResult['errors'] = {};

  if (!inputs.city_or_district || !inputs.city_or_district.trim()) {
    errors.city_or_district = 'Please select a target city or district for the scenario.';
  }

  const mult = Number(inputs.severity_multiplier);
  if (isNaN(mult) || mult < 0.5 || mult > 3.0) {
    errors.severity_multiplier = 'Severity multiplier must be between 0.5× and 3.0×.';
  }

  if (
    inputs.custom_rainfall_mm !== '' &&
    inputs.custom_rainfall_mm !== undefined &&
    inputs.custom_rainfall_mm !== null
  ) {
    const rain = Number(inputs.custom_rainfall_mm);
    if (isNaN(rain) || rain < 0) {
      errors.custom_rainfall_mm = 'Custom rainfall must be a non-negative number (≥ 0 mm).';
    } else if (rain > 1500) {
      errors.custom_rainfall_mm = 'Custom rainfall cannot exceed 1,500 mm.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Baseline district vulnerability profiles for isolated mock stress testing.
 */
const BASELINE_MOCK_DISTRICTS: Record<
  string,
  { baseRisk: number; baseInundation: number; baseDepth: number; basePop: number }
> = {
  Dhemaji: { baseRisk: 2.8, baseInundation: 46.5, baseDepth: 2.1, basePop: 420000 },
  Majuli: { baseRisk: 2.6, baseInundation: 52.0, baseDepth: 1.8, basePop: 165000 },
  Lakhimpur: { baseRisk: 2.2, baseInundation: 38.0, baseDepth: 1.5, basePop: 380000 },
  Barpeta: { baseRisk: 2.4, baseInundation: 41.5, baseDepth: 1.9, basePop: 510000 },
  Silchar: { baseRisk: 2.5, baseInundation: 44.0, baseDepth: 2.4, basePop: 340000 },
  Dibrugarh: { baseRisk: 2.1, baseInundation: 32.0, baseDepth: 1.4, basePop: 280000 },
  Guwahati: { baseRisk: 1.8, baseInundation: 26.0, baseDepth: 1.1, basePop: 620000 },
  Dhubri: { baseRisk: 2.1, baseInundation: 35.0, baseDepth: 1.4, basePop: 460000 },
  Morigaon: { baseRisk: 2.0, baseInundation: 31.0, baseDepth: 1.3, basePop: 290000 },
};

/**
 * Isolated development-only mock simulation generator.
 * Strictly flagged with is_simulation: true and is_mock: true.
 */
export async function runDevelopmentMockSimulation(
  request: BackendSimulationRequest,
  delayMs = 600
): Promise<BackendSimulationResponse> {
  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  const mult = Math.min(Math.max(request.severity_multiplier ?? 1.0, 0.5), 3.0);
  const customRain =
    request.custom_rainfall_mm !== undefined && request.custom_rainfall_mm !== null
      ? Number(request.custom_rainfall_mm)
      : undefined;

  // Rainfall factor modifier
  const rainFactor = customRain !== undefined ? Math.min(2.5, Math.max(0.6, customRain / 150)) : 1.0;
  const combinedMultiplier = mult * rainFactor;

  const targetCity = request.city_or_district || 'Dhemaji';

  // Build target and neighboring simulated output
  const outputDistricts: BackendSimulationResultItem[] = [];

  // Primary chosen location first
  const primaryProfile = BASELINE_MOCK_DISTRICTS[targetCity] || {
    baseRisk: 2.0,
    baseInundation: 35.0,
    baseDepth: 1.5,
    basePop: 300000,
  };

  const primaryScore = Number(Math.min(3.0, primaryProfile.baseRisk * combinedMultiplier).toFixed(2));
  const primaryInundation = Number(Math.min(100.0, primaryProfile.baseInundation * combinedMultiplier).toFixed(1));
  const primaryDepth = Number((primaryProfile.baseDepth * combinedMultiplier).toFixed(2));
  const primaryPop = Math.round(primaryProfile.basePop * Math.min(2.5, combinedMultiplier));

  let primaryLevel = 'MODERATE';
  if (primaryScore >= 2.5) primaryLevel = 'CRITICAL';
  else if (primaryScore >= 2.0) primaryLevel = 'HIGH';
  else if (primaryScore < 1.0) primaryLevel = 'LOW';

  outputDistricts.push({
    name: targetCity,
    risk_score: primaryScore,
    risk_level: primaryLevel,
    inundation_pct: primaryInundation,
    water_depth_m: primaryDepth,
    impact: {
      population_at_risk: primaryPop,
      infrastructure_affected: Math.round(primaryInundation * 1.6),
    },
    is_simulation: true,
    is_mock: true,
  });

  // Secondary downstream catchment locations
  Object.entries(BASELINE_MOCK_DISTRICTS)
    .filter(([name]) => name !== targetCity)
    .slice(0, 3)
    .forEach(([name, profile]) => {
      const secMult = combinedMultiplier * 0.85;
      const score = Number(Math.min(3.0, profile.baseRisk * secMult).toFixed(2));
      const inundation = Number(Math.min(100.0, profile.baseInundation * secMult).toFixed(1));
      const depth = Number((profile.baseDepth * secMult).toFixed(2));
      const pop = Math.round(profile.basePop * Math.min(2.5, secMult));

      let level = 'MODERATE';
      if (score >= 2.5) level = 'CRITICAL';
      else if (score >= 2.0) level = 'HIGH';
      else if (score < 1.0) level = 'LOW';

      outputDistricts.push({
        name,
        risk_score: score,
        risk_level: level,
        inundation_pct: inundation,
        water_depth_m: depth,
        impact: {
          population_at_risk: pop,
          infrastructure_affected: Math.round(inundation * 1.4),
        },
        is_simulation: true,
        is_mock: true,
      });
    });

  return {
    status: 'development_mock_scenario',
    timestamp: new Date().toISOString(),
    parameters: {
      severity_multiplier: mult,
      use_live_weather: Boolean(request.use_live_weather),
      custom_rainfall_mm: customRain,
      city_or_district: targetCity,
    },
    simulation: outputDistricts,
    is_simulation: true,
    is_mock: true,
  };
}
