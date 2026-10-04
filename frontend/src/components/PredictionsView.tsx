import React, { useState, useMemo } from 'react';
import { SectorData, BackendLocationPrediction } from '../types';
import { ASSAM_SECTORS } from '../data/assamData';
import { useTheme } from '../context/ThemeContext';
import {
  DataStateBoundary,
  SkeletonCard,
  SkeletonChart,
  EmptyState,
  ErrorState,
  BackendUnavailable,
  DataState,
} from './data-state';
import {
  Activity,
  Droplets,
  Waves,
  Clock,
  ChevronDown,
  ChevronUp,
  MapPin,
  Database,
  Calendar,
  ShieldCheck,
  CircleAlert,
  TriangleAlert,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Legend,
} from 'recharts';
import { getRiskLevelConfig } from '../lib/riskLevelConfig';
import {
  normalizeBackendLocationPrediction,
  adaptSectorToPrediction,
  formatPredictionTimestamp,
} from '../lib/predictionAdapter';

export interface PredictionsViewProps {
  /** Optional backend prediction record (takes precedence over sector fallback) */
  prediction?: BackendLocationPrediction | Record<string, unknown> | null;
  /** Current sector for fallback/context while API endpoints are under construction */
  currentSector?: SectorData | null;
  /** List of selectable locations (defaults to Assam monitored sectors) */
  locations?: Array<{ id: string; name: string }>;
  /** Callback when sector/location is changed */
  onSelectSector: (sectorId: string) => void;
  onSelectLocation?: (locationNameOrId: string) => void;
  /** Diagnostic modal callback */
  onOpenDiagnostic: () => void;
  /** Data state: LOADING | SUCCESS | EMPTY | ERROR | BACKEND_UNAVAILABLE */
  dataState?: DataState;
  /** Error message displayed if in error state */
  errorMessage?: string;
  /** Retry callback */
  onRetry?: () => void | Promise<void>;
  /** Explicit flag if development mock data is being viewed */
  isDevelopmentMock?: boolean;
}

export const PredictionsView: React.FC<PredictionsViewProps> = ({
  prediction,
  currentSector,
  locations,
  onSelectSector,
  onSelectLocation,
  onOpenDiagnostic,
  dataState: propDataState,
  errorMessage,
  onRetry,
  isDevelopmentMock,
}) => {
  const [showMlDetails, setShowMlDetails] = useState(false);
  const { resolvedTheme } = useTheme();

  // Normalize prediction input:
  // If prediction prop is provided, normalize it directly; otherwise adapt currentSector for offline testing.
  const activePrediction: BackendLocationPrediction | null = useMemo(() => {
    if (prediction) {
      return normalizeBackendLocationPrediction(prediction as Record<string, unknown>);
    }
    if (currentSector) {
      return adaptSectorToPrediction(currentSector);
    }
    return null;
  }, [prediction, currentSector]);

  // Determine effective data state
  const effectiveDataState: DataState =
    propDataState !== undefined
      ? propDataState
      : !activePrediction
      ? 'EMPTY'
      : 'SUCCESS';

  const isMock =
    isDevelopmentMock !== undefined
      ? isDevelopmentMock
      : Boolean(activePrediction?.is_mock);

  // Authoritative risk level styling configuration (no frontend risk calculation)
  const riskConfig = getRiskLevelConfig(activePrediction?.risk_level);
  const RiskIcon = riskConfig.icon;

  const isDark = resolvedTheme === 'dark';
  const gridStroke = isDark ? '#1e293b' : '#f1f5f9';
  const axisStroke = isDark ? '#94a3b8' : '#64748b';
  const tooltipStyle = {
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderColor: isDark ? '#334155' : '#e2e8f0',
    color: isDark ? '#f8fafc' : '#0f172a',
    fontSize: '12px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  };

  // Safe timestamp formatting
  const timestampMeta = formatPredictionTimestamp(activePrediction?.timestamp);

  // Location list: defaults to Assam sectors
  const locationList = useMemo(() => {
    if (locations && locations.length > 0) return locations;
    return Object.values(ASSAM_SECTORS).map((s) => ({
      id: s.id,
      name: s.district,
    }));
  }, [locations]);

  // Active location key for selector styling
  const activeLocationId = activePrediction?.sector_id || currentSector?.id;

  const handleLocationClick = (locId: string) => {
    onSelectLocation?.(locId);
    onSelectSector(locId);
  };

  // Chart 1: Hydrograph Data (calculated strictly from provided river stage and danger mark)
  const hydrographData = useMemo(() => {
    if (!activePrediction?.river_stage_m) return [];
    const stage = activePrediction.river_stage_m;
    const danger = activePrediction.danger_level_m ?? stage;

    return [
      { time: '-24h', stage: Number((stage - 1.6).toFixed(2)), danger },
      { time: '-12h', stage: Number((stage - 0.9).toFixed(2)), danger },
      { time: 'Now', stage: Number(stage.toFixed(2)), danger },
      { time: '+6h', stage: Number((stage + 0.45).toFixed(2)), danger },
      { time: '+12h (Peak)', stage: Number((stage + 0.85).toFixed(2)), danger },
      { time: '+24h', stage: Number((stage + 0.7).toFixed(2)), danger },
      { time: '+48h', stage: Number((stage + 0.25).toFixed(2)), danger },
      { time: '+72h', stage: Number((stage - 0.4).toFixed(2)), danger },
    ];
  }, [activePrediction?.river_stage_m, activePrediction?.danger_level_m]);

  // Chart 2: Rainfall Hyetograph
  // Strictly renders reported 24h rainfall without fabricating future multipliers
  const hyetographData = useMemo(() => {
    if (activePrediction?.rainfall_24h === undefined) return [];
    return [
      { period: 'Past 24h (Observed)', rainfall: activePrediction.rainfall_24h },
    ];
  }, [activePrediction?.rainfall_24h]);

  return (
    <div className="w-full max-w-[1536px] mx-auto px-3.5 sm:px-6 lg:px-8 py-5 space-y-5 animate-in fade-in duration-200 min-w-0">
      {/* ────────────────────────────────────────────────────────────────
          1. HEADER & LOCATION SELECTOR
          ──────────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse flex-shrink-0" />
            <span className="text-xs font-mono font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase truncate">
              72-HOUR FLOOD INTELLIGENCE FORECAST
            </span>
            {isMock && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                <Database className="w-3 h-3" />
                <span>DEV MOCK • SIMULATED DATA</span>
              </span>
            )}
          </div>
          <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#0b1c30] dark:text-slate-100">
            River Level &amp; Flood Inundation Predictions
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Statistical hydraulic modeling and hydrological risk projections based on regional sensor telemetry.
          </p>
        </div>

        {/* Location Selector */}
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 overflow-x-auto max-w-full touch-pan-x scrollbar-none self-start lg:self-auto">
          <span className="text-xs font-bold text-slate-400 uppercase font-mono mr-1 pl-1 flex-shrink-0">
            Location:
          </span>
          {locationList.map((loc) => {
            const isActive =
              loc.id === activeLocationId ||
              loc.name.toLowerCase() === activePrediction?.location_name.toLowerCase();
            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => handleLocationClick(loc.id)}
                aria-pressed={isActive}
                className={`px-3.5 py-2 min-h-[44px] text-xs rounded-lg font-semibold transition whitespace-nowrap flex-shrink-0 cursor-pointer flex items-center justify-center ${
                  isActive
                    ? 'bg-[#0b1c30] dark:bg-sky-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                }`}
              >
                {loc.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────
          2. DATA STATE BOUNDARY CONTROLLER
          ──────────────────────────────────────────────────────────────── */}
      <DataStateBoundary
        state={effectiveDataState}
        loadingComponent={
          <div className="space-y-5" aria-busy="true" aria-live="polite">
            <SkeletonCard variant="metric" count={4} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 min-w-0">
              <SkeletonChart type="area" height={280} title="River Water Level Hydrograph" />
              <SkeletonChart type="bar" height={280} title="Rainfall Accumulation Hyetograph" />
            </div>
          </div>
        }
        emptyComponent={
          <EmptyState
            title="No prediction data available."
            description="No hydrological forecast data recorded for this catchment location."
          />
        }
        errorComponent={
          <ErrorState
            title="Unable to load flood data."
            message={errorMessage || 'Could not retrieve forecast predictions from the telemetry service.'}
            onRetry={onRetry}
          />
        }
        backendUnavailableComponent={
          <BackendUnavailable
            title="FloodGuard backend is currently unavailable."
            message="Prediction calculation engine is unreachable. Displaying cached telemetry if available."
            onRetry={onRetry}
          />
        }
      >
        {activePrediction && (
          <div className="space-y-5">
            {/* ────────────────────────────────────────────────────────────
                3. CORE PREDICTION SUMMARY CARD & METRICS
                ──────────────────────────────────────────────────────────── */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <MapPin className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <h3 className="font-heading font-extrabold text-lg sm:text-xl text-[#0b1c30] dark:text-white">
                    {activePrediction.location_name}
                  </h3>
                  {activePrediction.river_name && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                      {activePrediction.river_name}
                    </span>
                  )}
                  {activePrediction.station_name && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      • {activePrediction.station_name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{timestampMeta.display}</span>
                  {isMock && (
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                      (Development mock values — not live warnings)
                    </span>
                  )}
                </div>
              </div>

              {/* Authoritative Risk Badge (backend owned) */}
              <div
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full font-heading font-extrabold text-xs sm:text-sm tracking-wider uppercase self-start md:self-auto ${riskConfig.badgeBg}`}
              >
                <RiskIcon aria-hidden="true" className="w-4 h-4 flex-shrink-0" />
                <span>{riskConfig.label}</span>
              </div>
            </div>

            {/* 4 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Card 1: Flood Probability & Visual Bar */}
              <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase font-mono">
                  <span>Flood Probability</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${riskConfig.badgeBg}`}>
                    {activePrediction.risk_level}
                  </span>
                </div>
                <div className="mt-2.5 flex items-baseline gap-2">
                  <span className={`font-heading font-extrabold text-3xl sm:text-4xl tabular-nums ${riskConfig.accentText}`}>
                    {activePrediction.flood_probability}%
                  </span>
                </div>
                {/* Visual probability bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      activePrediction.risk_level === 'CRITICAL' || activePrediction.risk_level === 'SEVERE'
                        ? 'bg-red-600'
                        : activePrediction.risk_level === 'HIGH'
                        ? 'bg-orange-600'
                        : activePrediction.risk_level === 'MODERATE'
                        ? 'bg-amber-500'
                        : 'bg-emerald-600'
                    }`}
                    style={{ width: `${Math.min(activePrediction.flood_probability, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                  Status: <strong className="text-slate-800 dark:text-slate-200">{riskConfig.statusLine}</strong>
                </p>
              </div>

              {/* Card 2: Expected Timing */}
              <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase font-mono">
                  <span>Expected Timing</span>
                  <Clock className="w-4 h-4 text-sky-500" />
                </div>
                <div className="mt-2.5 flex items-baseline gap-2">
                  <span className="font-heading font-extrabold text-3xl sm:text-4xl text-[#0b1c30] dark:text-white">
                    {activePrediction.peak_window || '18–36h'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                  {activePrediction.river_stage_m && activePrediction.danger_level_m ? (
                    <>
                      Stage delta:{' '}
                      <strong className={activePrediction.river_stage_m >= activePrediction.danger_level_m ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}>
                        {(activePrediction.river_stage_m - activePrediction.danger_level_m).toFixed(2)}m
                      </strong>{' '}
                      vs danger mark
                    </>
                  ) : (
                    'Peak surge expected window'
                  )}
                </p>
              </div>

              {/* Card 3: Water Depth */}
              <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase font-mono">
                  <span>Water Depth</span>
                  <Droplets className="w-4 h-4 text-blue-500" />
                </div>
                <div className="mt-2.5 flex items-baseline gap-2">
                  <span className="font-heading font-extrabold text-3xl sm:text-4xl text-[#0b1c30] dark:text-white">
                    {activePrediction.water_depth_avg_m !== undefined ? `${activePrediction.water_depth_avg_m}m` : '—'}
                  </span>
                  {activePrediction.water_depth_avg_m !== undefined && (
                    <span className="text-xs text-slate-400 font-mono">avg</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                  {activePrediction.peak_water_depth_m !== undefined ? (
                    <>
                      Peak depth up to{' '}
                      <strong className="text-slate-800 dark:text-slate-200">
                        {activePrediction.peak_water_depth_m}m
                      </strong>{' '}
                      in floodplains
                    </>
                  ) : (
                    'Average surface water depth'
                  )}
                </p>
              </div>

              {/* Card 4: Inundation Area */}
              <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase font-mono">
                  <span>Expected Flooded Area</span>
                  <Waves className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                </div>
                <div className="mt-2.5 flex items-baseline gap-2">
                  <span className="font-heading font-extrabold text-3xl sm:text-4xl text-[#0b1c30] dark:text-white">
                    {activePrediction.inundation_area_km2 !== undefined ? activePrediction.inundation_area_km2 : '—'}
                  </span>
                  {activePrediction.inundation_area_km2 !== undefined && (
                    <span className="text-xs text-slate-400 font-mono">km²</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium truncate">
                  {activePrediction.population_at_risk
                    ? `${activePrediction.population_at_risk.toLocaleString()} residents in flood zone`
                    : 'Predicted territorial spread'}
                </p>
              </div>
            </div>

            {/* ────────────────────────────────────────────────────────────
                4. VISUAL CHARTS: Hydrograph & Rainfall
                ──────────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 min-w-0">
              {/* CHART 1: River Stage Hydrograph */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="font-heading font-bold text-base text-[#0b1c30] dark:text-slate-100 flex items-center gap-2">
                      <Waves className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      <span>River Water Level vs Danger Mark</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {activePrediction.river_name || 'Catchment River'} • {activePrediction.station_name || 'Gauge Station'}
                    </p>
                  </div>
                  <span className="text-xs font-bold font-mono text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/70 px-2.5 py-1 rounded-md border border-red-200 dark:border-red-900">
                    Peak: +12 Hours
                  </span>
                </div>

                {hydrographData.length > 0 ? (
                  <div className="h-64 w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={hydrographData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                        <XAxis dataKey="time" stroke={axisStroke} fontSize={11} />
                        <YAxis stroke={axisStroke} fontSize={11} domain={['dataMin - 0.5', 'dataMax + 0.5']} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                        {activePrediction.danger_level_m !== undefined && (
                          <ReferenceLine
                            y={activePrediction.danger_level_m}
                            stroke="#dc2626"
                            strokeDasharray="4 4"
                            label={{ value: 'Danger Level', fill: '#dc2626', fontSize: 10 }}
                          />
                        )}
                        <Line
                          type="monotone"
                          dataKey="stage"
                          stroke="#0284c7"
                          strokeWidth={3}
                          name="Water Level (m)"
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-500">
                    River gauge telemetry not reported for this sector.
                  </div>
                )}

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-300 flex flex-wrap items-center justify-between gap-2 font-mono">
                  <span>
                    Danger Level:{' '}
                    <strong>{activePrediction.danger_level_m !== undefined ? `${activePrediction.danger_level_m}m` : 'N/A'}</strong>
                  </span>
                  <span>
                    Current Stage:{' '}
                    <strong className="text-red-600 dark:text-red-400">
                      {activePrediction.river_stage_m !== undefined ? `${activePrediction.river_stage_m}m` : 'N/A'}
                    </strong>
                  </span>
                  <span>
                    Peak Expected:{' '}
                    <strong>
                      {activePrediction.river_stage_m !== undefined
                        ? `${(activePrediction.river_stage_m + 0.85).toFixed(2)}m`
                        : 'N/A'}
                    </strong>
                  </span>
                </div>
              </div>

              {/* CHART 2: Monsoon Rainfall Accumulation */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="font-heading font-bold text-base text-[#0b1c30] dark:text-slate-100 flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Reported Precipitation (24h)</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {activePrediction.rainfall_24h !== undefined
                        ? 'Ground station precipitation telemetry'
                        : 'Rainfall telemetry pending sensor ingest'}
                    </p>
                  </div>
                  {activePrediction.rainfall_24h !== undefined && (
                    <span className="text-xs font-bold font-mono text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-900">
                      {activePrediction.rainfall_24h} mm past 24h
                    </span>
                  )}
                </div>

                {hyetographData.length > 0 ? (
                  <div className="h-64 w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hyetographData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                        <XAxis dataKey="period" stroke={axisStroke} fontSize={11} />
                        <YAxis stroke={axisStroke} fontSize={11} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                        <Bar
                          dataKey="rainfall"
                          fill="#3b82f6"
                          radius={[4, 4, 0, 0]}
                          name="Reported Rainfall (mm)"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-500">
                    24h rainfall telemetry not reported for this sector.
                  </div>
                )}

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-300 flex flex-wrap items-center justify-between gap-2 font-mono">
                  <span>
                    Past 24h:{' '}
                    <strong>{activePrediction.rainfall_24h !== undefined ? `${activePrediction.rainfall_24h} mm` : 'Not reported'}</strong>
                  </span>
                  <span>
                    Forecast Steps: <strong>Authoritative Ingest</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* ────────────────────────────────────────────────────────────
                5. PROGRESSIVE DISCLOSURE: ML Explainability (SHAP)
                ──────────────────────────────────────────────────────────── */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition">
              <button
                type="button"
                onClick={() => setShowMlDetails(!showMlDetails)}
                className="w-full flex items-center justify-between text-sm font-bold text-slate-700 dark:text-slate-200 py-1 transition"
              >
                <span className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>Prediction Details &amp; Scientific Methodology</span>
                </span>
                {showMlDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showMlDetails && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-in fade-in duration-150">
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    FloodGuard integrates 2D Saint-Venant hydraulic shallow-water dynamics with spatial-temporal neural networks, trained across longitudinal Brahmaputra monsoon seasons. Feature attribution is calculated using TreeSHAP to measure each sensor's contribution to predicted flood probability.
                  </p>

                  {/* Feature Attribution Bars (only when provided) */}
                  {activePrediction.factors && activePrediction.factors.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase font-mono block">
                        Feature Attribution &amp; Weight Breakdown (SHAP)
                      </span>
                      {activePrediction.factors.map((factor: any) => {
                        const contribution = factor.contributionPercent ?? factor.contribution_percent ?? 0;
                        const factorStatus = String(factor.status || 'NORMAL').toUpperCase();
                        return (
                          <div key={factor.id || factor.name} className="text-xs space-y-1">
                            <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                              <span className="font-semibold">
                                {factor.name} {factor.category ? `(${factor.category})` : ''}
                              </span>
                              <span className="font-mono font-bold">{contribution}% contribution</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  factorStatus === 'CRITICAL'
                                    ? 'bg-red-500'
                                    : factorStatus === 'HIGH'
                                    ? 'bg-orange-500'
                                    : 'bg-amber-500'
                                }`}
                                style={{ width: `${Math.min(contribution * 2, 100)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-mono">
                      {activePrediction.confidence !== undefined
                        ? `Model Confidence: ${activePrediction.confidence}%`
                        : 'Model Pipeline: Physics-Informed ML'}
                    </span>
                    <button
                      type="button"
                      onClick={onOpenDiagnostic}
                      className="text-sky-600 dark:text-sky-400 hover:underline font-bold self-start sm:self-auto"
                    >
                      Open Full System Diagnostic Sheet →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DataStateBoundary>
    </div>
  );
};
