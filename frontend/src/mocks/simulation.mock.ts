/**
 * ============================================================================
 * FloodGuard Development Mock Layer - Hydrological Simulation Scenarios
 * ============================================================================
 *
 * CAUTION: DEVELOPMENT MOCK DATA ONLY.
 *
 * This dataset provides simulated hydraulic routing results and scenario
 * calculations (e.g. 1.0x baseline, 1.25x high monsoon, 1.5x extreme breach)
 * for interactive UI stress-testing sliders while the backend numerical
 * simulation engine is under development.
 *
 * RULES & CONSTRAINTS:
 * 1. Simulation physics and ML routing calculations must run on the backend in production.
 * 2. NEVER silently substitute this mock data when the real backend API fails.
 * 3. Components should eventually transition from this mock adapter to
 *    `src/api/simulation.ts` when `POST /api/simulate` is active.
 *
 * @module mocks/simulation.mock
 */

import {
  SimulationRequest,
  SimulationResponse,
  SimulationDistrictResult
} from '../api/simulation';

/** Explicit flag identifying mock origin */
export const IS_DEVELOPMENT_MOCK = true as const;

export const MOCK_DISCLAIMER_NOTICE =
  'DEVELOPMENT MOCK DATA ONLY: Simulated scenario physics for UI slider testing.';

/**
 * Baseline simulated district vulnerabilities across the Assam river network.
 */
const BASELINE_SIMULATION_DISTRICTS: Array<{
  name: string;
  baseRisk: number;
  baseInundation: number;
  baseDepth: number;
  popExposed: number;
}> = [
  { name: 'Dhemaji', baseRisk: 2.8, baseInundation: 46.5, baseDepth: 2.1, popExposed: 420000 },
  { name: 'Majuli', baseRisk: 2.6, baseInundation: 52.0, baseDepth: 1.8, popExposed: 165000 },
  { name: 'Lakhimpur', baseRisk: 2.2, baseInundation: 38.0, baseDepth: 1.5, popExposed: 380000 },
  { name: 'Barpeta', baseRisk: 2.4, baseInundation: 41.5, baseDepth: 1.9, popExposed: 510000 },
  { name: 'Dhubri', baseRisk: 2.1, baseInundation: 35.0, baseDepth: 1.4, popExposed: 460000 },
  { name: 'Morigaon', baseRisk: 2.0, baseInundation: 31.0, baseDepth: 1.3, popExposed: 290000 },
  { name: 'Cachar (Silchar)', baseRisk: 2.5, baseInundation: 44.0, baseDepth: 2.4, popExposed: 340000 }
];

/**
 * Generates an isolated mock simulation response based on requested scenario parameters.
 *
 * @param request - Simulation parameters (e.g. severity_multiplier, sector_id)
 */
export function getMockSimulation(request: SimulationRequest = {}): SimulationResponse {
  const mult = Math.min(Math.max(request.severity_multiplier ?? 1.0, 0.5), 3.0);
  const rainfallMult = request.rainfall_multiplier ?? 1.0;
  const combinedMult = mult * rainfallMult;

  const districts: SimulationDistrictResult[] = BASELINE_SIMULATION_DISTRICTS.map((d) => {
    const calculatedRiskScore = Number(Math.min(3.0, d.baseRisk * combinedMult).toFixed(2));
    const calculatedInundation = Number(Math.min(100.0, d.baseInundation * combinedMult).toFixed(1));
    const calculatedDepth = Number((d.baseDepth * combinedMult).toFixed(2));
    const calculatedPop = Math.round(d.popExposed * Math.min(2.5, combinedMult));

    let riskLevel = 'MODERATE';
    if (calculatedRiskScore >= 2.5) riskLevel = 'CRITICAL';
    else if (calculatedRiskScore >= 2.0) riskLevel = 'HIGH';
    else if (calculatedRiskScore < 1.0) riskLevel = 'LOW';

    return {
      name: d.name,
      risk_score: calculatedRiskScore,
      risk_level: riskLevel,
      inundation_pct: calculatedInundation,
      water_depth_m: calculatedDepth,
      impact: {
        population_at_risk: calculatedPop,
        infrastructure_affected: Math.round(calculatedInundation * 1.5)
      },
      _isDevelopmentMock: true
    };
  });

  return {
    status: 'development_mock',
    timestamp: new Date().toISOString(),
    parameters: {
      severity_multiplier: mult,
      rainfall_multiplier: rainfallMult,
      use_live_weather: request.use_live_weather ?? false,
      sector_id: request.sector_id
    },
    simulation: districts,
    _isDevelopmentMock: true,
    _mockNotice: MOCK_DISCLAIMER_NOTICE
  };
}
