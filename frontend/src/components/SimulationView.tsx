/**
 * SimulationView Component
 *
 * Dedicated UI for running hydrological what-if flood scenarios (POST /api/simulate).
 *
 * Requirements:
 * - Severity multiplier control (slider 0.5x to 3.0x)
 * - Live weather toggle
 * - Custom rainfall input (mm)
 * - Location selector
 * - Form validation
 * - Submit button
 * - Loading state
 * - Result state
 * - Error state
 * - Empty state
 *
 * MANDATORY WARNING:
 * "SIMULATION MODE — This is a hypothetical scenario, not an actual observed flood event."
 *
 * CRITICAL BUSINESS RULES:
 * 1. Simulation data must NEVER be presented as actual flood observations.
 * 2. Keep simulation state strictly separated from live prediction state.
 * 3. Do not fabricate a simulation result.
 */

import React, { useState } from 'react';
import {
  Sliders,
  Play,
  RotateCcw,
  AlertTriangle,
  CloudRain,
  Radio,
  MapPin,
  Database,
  Layers,
  Sparkles,
  HelpCircle,
  Activity,
  ArrowRight,
} from 'lucide-react';
import {
  BackendSimulationRequest,
  BackendSimulationResponse,
  BackendSimulationResultItem,
} from '../types';
import {
  SIMULATION_WARNING_BANNER,
  SIMULATION_AVAILABLE_LOCATIONS,
  SimulationFormState,
  validateSimulationInputs,
  runDevelopmentMockSimulation,
} from '../lib/simulationAdapter';
import {
  DataStateBoundary,
  SkeletonCard,
  EmptyState,
  ErrorState,
  DataState,
} from './data-state';

export interface SimulationViewProps {
  /** Optional external callback or injected runner */
  onRunSimulation?: (payload: BackendSimulationRequest) => Promise<BackendSimulationResponse>;
  /** Optional pre-loaded simulation result */
  initialResult?: BackendSimulationResponse;
  /** Explicit flag if development mock data is being viewed */
  isDevelopmentMock?: boolean;
}

export const SimulationView: React.FC<SimulationViewProps> = ({
  onRunSimulation,
  initialResult,
  isDevelopmentMock = true,
}) => {
  // Scenario Form State
  const [formState, setFormState] = useState<SimulationFormState>({
    severity_multiplier: 1.2,
    use_live_weather: true,
    custom_rainfall_mm: 180,
    city_or_district: 'Dhemaji',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [dataState, setDataState] = useState<DataState>(initialResult ? 'SUCCESS' : 'EMPTY');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [simulationResponse, setSimulationResponse] = useState<BackendSimulationResponse | null>(
    initialResult || null
  );

  // Form field handlers
  const handleMultiplierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setFormState((prev) => ({ ...prev, severity_multiplier: val }));
    if (validationErrors.severity_multiplier) {
      setValidationErrors((prev) => ({ ...prev, severity_multiplier: undefined! }));
    }
  };

  const handleRainfallChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormState((prev) => ({ ...prev, custom_rainfall_mm: val }));
    if (validationErrors.custom_rainfall_mm) {
      setValidationErrors((prev) => ({ ...prev, custom_rainfall_mm: undefined! }));
    }
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFormState((prev) => ({ ...prev, city_or_district: val }));
    if (validationErrors.city_or_district) {
      setValidationErrors((prev) => ({ ...prev, city_or_district: undefined! }));
    }
  };

  const handleWeatherToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({ ...prev, use_live_weather: e.target.checked }));
  };

  const handleReset = () => {
    setFormState({
      severity_multiplier: 1.0,
      use_live_weather: true,
      custom_rainfall_mm: 150,
      city_or_district: 'Dhemaji',
    });
    setValidationErrors({});
    setDataState('EMPTY');
    setSimulationResponse(null);
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validate Form Inputs
    const validation = validateSimulationInputs(formState);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }
    setValidationErrors({});

    // 2. Prepare Payload
    const payload: BackendSimulationRequest = {
      severity_multiplier: Number(formState.severity_multiplier),
      use_live_weather: formState.use_live_weather,
      custom_rainfall_mm:
        formState.custom_rainfall_mm !== '' ? Number(formState.custom_rainfall_mm) : undefined,
      city_or_district: formState.city_or_district,
    };

    // 3. Execute Simulation (via injected runner or isolated development mock)
    setDataState('LOADING');
    try {
      let result: BackendSimulationResponse;
      if (onRunSimulation) {
        result = await onRunSimulation(payload);
      } else {
        // Isolated development mock testing layer
        result = await runDevelopmentMockSimulation(payload, 750);
      }

      setSimulationResponse(result);
      setDataState('SUCCESS');
    } catch (err: any) {
      setDataState('ERROR');
      setErrorMessage(err?.message || 'Failed to compute scenario simulation.');
    }
  };

  return (
    <div className="w-full max-w-[1536px] mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6 min-w-0 font-sans animate-in fade-in duration-200">
      {/* ────────────────────────────────────────────────────────────────
          1. HEADER & PROMINENT SIMULATION BANNER
          ──────────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse flex-shrink-0" />
              <span className="text-xs font-mono font-bold tracking-wider text-purple-700 dark:text-purple-400 uppercase">
                HYDROLOGICAL STRESS-TEST ENGINE
              </span>
              {isDevelopmentMock && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  <Database className="w-3 h-3" />
                  <span>DEV MOCK • SIMULATED PHYSICS SCENARIO</span>
                </span>
              )}
            </div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0b1c30] dark:text-slate-100 tracking-tight">
              Scenario Simulation &amp; Stress Testing
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
              Model hypothetical extreme weather events, upper-catchment deluge, and embankment breach scenarios to assess secondary inundation exposure.
            </p>
          </div>
        </div>

        {/* ── CRITICAL MANDATORY SIMULATION WARNING BANNER ── */}
        <div
          role="alert"
          aria-live="polite"
          className="mt-4 p-4 rounded-xl bg-amber-500/10 dark:bg-amber-950/40 border-2 border-amber-500/40 text-amber-950 dark:text-amber-200 flex items-start gap-3 shadow-xs"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm leading-relaxed">
            <strong className="block font-extrabold font-mono uppercase tracking-wide text-amber-900 dark:text-amber-300">
              {SIMULATION_WARNING_BANNER}
            </strong>
            <p className="mt-0.5 text-amber-800/90 dark:text-amber-300/90">
              Outputs from this tool are exploratory projections for disaster preparedness drills. They must never be conflated with binding statutory flood alerts or live observation data from CWC or ASDMA.
            </p>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────
          2. SCENARIO INPUT CONTROLS & SUBMIT FORM
          ──────────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs transition-colors">
        <div className="flex items-center gap-2 pb-3 mb-5 border-b border-slate-100 dark:border-slate-800">
          <Sliders className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <h2 className="font-heading font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
            Configure What-If Scenario Parameters
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
            {/* 1. Location Selector */}
            <div className="space-y-1.5">
              <label htmlFor="sim-city-select" className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase">
                1. Target District / Circle
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  id="sim-city-select"
                  value={formState.city_or_district}
                  onChange={handleLocationChange}
                  className={`w-full pl-9 pr-3 py-2.5 min-h-[44px] text-xs font-bold rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer ${
                    validationErrors.city_or_district
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {SIMULATION_AVAILABLE_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc} District
                    </option>
                  ))}
                </select>
              </div>
              {validationErrors.city_or_district && (
                <p className="text-[11px] text-red-600 dark:text-red-400 font-semibold">
                  {validationErrors.city_or_district}
                </p>
              )}
              <span className="text-[11px] text-slate-400 dark:text-slate-500 block">
                Primary catchment for hydraulic routing
              </span>
            </div>

            {/* 2. Severity Multiplier Control */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="sim-severity-mult" className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase">
                  2. Severity Multiplier
                </label>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-extrabold bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  {formState.severity_multiplier.toFixed(1)}×
                </span>
              </div>
              <input
                id="sim-severity-mult"
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={formState.severity_multiplier}
                onChange={handleMultiplierChange}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600 dark:accent-purple-400"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>0.5× (Subdued)</span>
                <span className="font-bold text-slate-600 dark:text-slate-400">1.0× (Baseline)</span>
                <span>3.0× (Extreme)</span>
              </div>
              {validationErrors.severity_multiplier && (
                <p className="text-[11px] text-red-600 dark:text-red-400 font-semibold">
                  {validationErrors.severity_multiplier}
                </p>
              )}
            </div>

            {/* 3. Custom Rainfall Input (mm) */}
            <div className="space-y-1.5">
              <label htmlFor="sim-custom-rainfall" className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase">
                3. Custom Rainfall (mm/24h)
              </label>
              <div className="relative">
                <CloudRain className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="sim-custom-rainfall"
                  type="number"
                  min="0"
                  max="1500"
                  value={formState.custom_rainfall_mm}
                  onChange={handleRainfallChange}
                  placeholder="e.g. 200"
                  className={`w-full pl-9 pr-12 py-2.5 min-h-[44px] text-xs font-bold rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    validationErrors.custom_rainfall_mm
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono font-bold text-slate-400 pointer-events-none">
                  mm
                </span>
              </div>
              {validationErrors.custom_rainfall_mm && (
                <p className="text-[11px] text-red-600 dark:text-red-400 font-semibold">
                  {validationErrors.custom_rainfall_mm}
                </p>
              )}
              <span className="text-[11px] text-slate-400 dark:text-slate-500 block">
                Precipitation threshold injected into runoff
              </span>
            </div>

            {/* 4. Live Weather Integration Toggle */}
            <div className="space-y-1.5 pt-1">
              <span className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase">
                4. Environmental Feeds
              </span>
              <label
                htmlFor="sim-live-weather"
                className="flex items-center gap-3 p-2.5 min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-750 transition"
              >
                <input
                  id="sim-live-weather"
                  type="checkbox"
                  checked={formState.use_live_weather}
                  onChange={handleWeatherToggle}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                    <span>Fuse Live Radar</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate">
                    Integrates current soil moisture &amp; river base stage
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>Hydraulic routing: POST /api/simulate</span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleReset}
                disabled={dataState === 'LOADING'}
                className="flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Baseline</span>
              </button>

              <button
                type="submit"
                disabled={dataState === 'LOADING'}
                className="flex items-center gap-2 px-6 py-2.5 min-h-[44px] rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white font-bold text-xs shadow-md transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {dataState === 'LOADING' ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Calculating Physics...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Scenario Simulation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ────────────────────────────────────────────────────────────────
          3. SCENARIO SIMULATION RESULT / DATA STATE BOUNDARY
          ──────────────────────────────────────────────────────────────── */}
      <DataStateBoundary
        state={dataState}
        loadingComponent={
          <div className="space-y-4" aria-busy="true">
            <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center gap-3">
              <span className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono font-bold text-purple-900 dark:text-purple-300">
                Solving non-linear shallow water equations for {formState.city_or_district}...
              </span>
            </div>
            <SkeletonCard variant="detail" count={1} />
            <SkeletonCard variant="metric" count={4} />
          </div>
        }
        emptyComponent={
          <EmptyState
            title="No scenario currently simulated."
            description="Configure what-if parameters above (severity multiplier, custom rainfall, and location) and click 'Run Scenario Simulation' to execute hypothetical catchment stress testing."
            actionLabel="Run Baseline Scenario (1.0×)"
            onAction={() => {
              setFormState((prev) => ({ ...prev, severity_multiplier: 1.0 }));
              handleSubmit({ preventDefault: () => {} } as any);
            }}
          />
        }
        errorComponent={
          <ErrorState
            title="Unable to execute simulation scenario."
            message={errorMessage || 'Simulation numerical engine is unreachable. Please verify scenario parameters.'}
            onRetry={() => handleSubmit({ preventDefault: () => {} } as any)}
          />
        }
        backendUnavailableComponent={
          <ErrorState
            title="Simulation service currently unavailable."
            message="The hydrological numerical modeling backend endpoint is offline."
            onRetry={() => handleSubmit({ preventDefault: () => {} } as any)}
          />
        }
      >
        {simulationResponse && simulationResponse.simulation && (
          <div className="space-y-6">
            {/* Scenario Summary Banner */}
            <div className="p-5 rounded-2xl bg-purple-900 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/20 text-white border border-white/30 uppercase">
                    HYPOTHETICAL STRESS SCENARIO
                  </span>
                  <span className="text-xs font-mono text-purple-200">
                    Timestamp: {simulationResponse.timestamp ? new Date(simulationResponse.timestamp).toLocaleTimeString() : 'Current Run'}
                  </span>
                </div>
                <h3 className="font-heading font-extrabold text-xl text-white">
                  Simulation Results for {formState.city_or_district} Catchment
                </h3>
                <p className="text-xs text-purple-200 mt-0.5">
                  Parameters applied: Multiplier {formState.severity_multiplier.toFixed(1)}× • Rainfall {formState.custom_rainfall_mm || 'Baseline'} mm • Live Weather: {formState.use_live_weather ? 'Enabled' : 'Disabled'}
                </p>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto">
                <span className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs font-mono font-bold text-white">
                  {simulationResponse.simulation.length} Catchment Nodes Computed
                </span>
              </div>
            </div>

            {/* Results Grid: Simulated District Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {simulationResponse.simulation.map((district) => {
                const isTarget = district.name === formState.city_or_district;
                const isCritical = district.risk_level === 'CRITICAL';
                const isHigh = district.risk_level === 'HIGH';

                return (
                  <div
                    key={district.name}
                    className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border transition-all ${
                      isTarget
                        ? 'border-purple-500 dark:border-purple-500 shadow-md ring-2 ring-purple-500/20'
                        : 'border-slate-200 dark:border-slate-800 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <h4 className="font-heading font-extrabold text-base text-slate-900 dark:text-white">
                          {district.name}
                        </h4>
                      </div>
                      {isTarget && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">
                          Target
                        </span>
                      )}
                    </div>

                    {/* Simulated Risk Badge */}
                    <div className="mb-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold uppercase border ${
                          isCritical
                            ? 'bg-red-50 dark:bg-red-950/70 border-red-300 dark:border-red-900 text-red-700 dark:text-red-300'
                            : isHigh
                            ? 'bg-orange-50 dark:bg-orange-950/70 border-orange-300 dark:border-orange-900 text-orange-700 dark:text-orange-300'
                            : 'bg-amber-50 dark:bg-amber-950/70 border-amber-300 dark:border-amber-900 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        <Activity className="w-3.5 h-3.5" />
                        <span>SIMULATED {district.risk_level}</span>
                      </span>
                    </div>

                    <div className="space-y-2 text-xs font-mono pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Inundation Area:</span>
                        <strong className="text-slate-800 dark:text-slate-200">{district.inundation_pct}%</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Max Water Depth:</span>
                        <strong className="text-slate-800 dark:text-slate-200">{district.water_depth_m}m</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Population at Risk:</span>
                        <strong className="text-slate-800 dark:text-slate-200">
                          {district.impact?.population_at_risk?.toLocaleString() || '—'}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Infra Assets at Risk:</span>
                        <strong className="text-slate-800 dark:text-slate-200">
                          {district.impact?.infrastructure_affected || '—'}
                        </strong>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-mono text-purple-700 dark:text-purple-400 text-center">
                      Hypothetical Projection
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Scientific Caveat Footer */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <HelpCircle className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
              <span>
                Simulated values represent numerical modeling estimations. For operational evacuation decisions, consult authoritative ASDMA bulletins.
              </span>
            </div>
          </div>
        )}
      </DataStateBoundary>
    </div>
  );
};
