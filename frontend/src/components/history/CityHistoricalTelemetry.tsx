/**
 * CityHistoricalTelemetry Component
 *
 * Visualizes longitudinal historical telemetry from GET /api/history/{city_name}
 * using Recharts.
 *
 * Requirements:
 * - Location selection
 * - Rainfall chart (rainfall_mm over date)
 * - Flood probability chart (flood_probability over date)
 * - Date axis
 * - Responsive chart container
 * - Accessible tooltips
 * - Loading skeleton
 * - Empty state
 * - Error state
 * - Backend unavailable state
 * - Retry capability
 *
 * CRITICAL RULES:
 * - Backend owns historical records.
 * - Do not generate fake historical records to fill charts.
 * - Keep current development mock data isolated.
 */

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  CloudRain,
  Activity,
  MapPin,
  Calendar,
  Database,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { BackendHistoryRecord } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import {
  DataStateBoundary,
  EmptyState,
  ErrorState,
  BackendUnavailable,
  DataState,
} from '../data-state';
import {
  AVAILABLE_HISTORY_LOCATIONS,
  ISOLATED_CITY_MOCK_HISTORY,
  normalizeBackendHistoryRecord,
} from '../../lib/historyAdapter';

export interface CityHistoricalTelemetryProps {
  /** Selected city name (e.g. "Dhemaji", "Silchar") */
  cityName?: string;
  /** Historical telemetry records from GET /api/history/{city_name} */
  records?: BackendHistoryRecord[] | Record<string, unknown>[];
  /** Current data state */
  dataState?: DataState;
  /** Error message if in ERROR or BACKEND_UNAVAILABLE state */
  errorMessage?: string;
  /** Retry callback */
  onRetry?: () => void | Promise<void>;
  /** Location selection callback */
  onSelectCity?: (city: string) => void;
  /** Explicit flag if development mock data is being viewed */
  isDevelopmentMock?: boolean;
}

type ChartViewMode = 'split' | 'rainfall' | 'probability';

// Standalone memoized accessible tooltip to prevent Recharts unmount/remount on each parent render
const CustomHistoryTooltip: React.FC<{
  active?: boolean;
  payload?: any[];
  activeCity?: string;
}> = React.memo(({ active, payload, activeCity }) => {
  if (!active || !payload?.length) return null;
  const data: BackendHistoryRecord = payload[0].payload;

  return (
    <div
      role="status"
      className="p-3.5 rounded-xl border shadow-xl text-xs font-mono min-w-[210px] z-50 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
    >
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5 mb-2.5">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-sky-500" />
          <span className="font-extrabold text-sm text-[#0b1c30] dark:text-white">
            {data.date}
          </span>
        </div>
        {data.is_mock && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
            MOCK
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <CloudRain className="w-3.5 h-3.5 text-sky-500" />
            <span>Rainfall:</span>
          </span>
          <span className="font-bold text-sky-700 dark:text-sky-400">
            {data.rainfall_mm !== undefined ? `${data.rainfall_mm.toFixed(1)} mm` : 'Not recorded'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-amber-500" />
            <span>Flood Prob:</span>
          </span>
          <span className="font-bold text-amber-700 dark:text-amber-400">
            {data.flood_probability !== undefined ? `${data.flood_probability}%` : 'Not recorded'}
          </span>
        </div>
      </div>

      <div className="mt-2.5 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
        Source: GET /api/history/{activeCity || data.city_name || 'telemetry'}
      </div>
    </div>
  );
});

CustomHistoryTooltip.displayName = 'CustomHistoryTooltip';

export const CityHistoricalTelemetry: React.FC<CityHistoricalTelemetryProps> = ({
  cityName: propCityName,
  records: propRecords,
  dataState: propDataState,
  errorMessage,
  onRetry,
  onSelectCity,
  isDevelopmentMock,
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // Local selection state (defaults to Dhemaji)
  const [internalCity, setInternalCity] = useState<string>('Dhemaji');
  const activeCity = propCityName || internalCity;

  // View mode: 'split' (side by side / stacked), 'rainfall', or 'probability'
  const [viewMode, setViewMode] = useState<ChartViewMode>('split');

  const handleCityChange = (city: string) => {
    setInternalCity(city);
    if (onSelectCity) {
      onSelectCity(city);
    }
  };

  // Resolve records:
  // If records passed in props, normalize them.
  // Otherwise, fallback to isolated development mock layer for activeCity.
  const activeRecords: BackendHistoryRecord[] = useMemo(() => {
    if (propRecords && Array.isArray(propRecords)) {
      return propRecords.map((r) => normalizeBackendHistoryRecord(r as Record<string, unknown>));
    }
    // Return isolated mock dataset for known test cities, or empty array (NO FAKE GENERATION)
    return ISOLATED_CITY_MOCK_HISTORY[activeCity] || [];
  }, [propRecords, activeCity]);

  const isMock =
    isDevelopmentMock !== undefined
      ? isDevelopmentMock
      : activeRecords.some((r) => r.is_mock);

  // Check which metrics actually exist in the data (to avoid displaying blank series)
  const hasRainfall = useMemo(
    () => activeRecords.some((r) => r.rainfall_mm !== undefined && r.rainfall_mm !== null),
    [activeRecords]
  );
  const hasProbability = useMemo(
    () => activeRecords.some((r) => r.flood_probability !== undefined && r.flood_probability !== null),
    [activeRecords]
  );

  // Determine effective data state
  const effectiveDataState: DataState =
    propDataState !== undefined
      ? propDataState
      : activeRecords.length === 0
      ? 'EMPTY'
      : 'SUCCESS';

  // Chart theme colors
  const gridStroke = isDark ? '#1e293b' : '#f1f5f9';
  const axisStroke = isDark ? '#94a3b8' : '#64748b';
  const rainColor = isDark ? '#38bdf8' : '#0284c7';
  const probColor = isDark ? '#f59e0b' : '#d97706';

  // Loading skeleton placeholder for charts
  const ChartSkeleton = () => (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="w-48 h-6 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="w-28 h-6 rounded bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="h-64 w-full bg-slate-100 dark:bg-slate-800/60 rounded-xl flex items-end justify-between p-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="w-full bg-slate-200 dark:bg-slate-700 rounded-t"
            style={{ height: `${20 + (i * 11) % 70}%` }}
          />
        ))}
      </div>
    </div>
  );

  return (
    <section
      aria-label="City Historical Telemetry"
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs transition-colors space-y-5"
    >
      {/* ────────────────────────────────────────────────────────────────
          1. HEADER & LOCATION SELECTOR
          ──────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-sky-600 dark:text-sky-400 flex-shrink-0" />
              <span>STATION TELEMETRY &amp; PROBABILITY ARCHIVE</span>
            </span>
            {isMock && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                <Database className="w-3 h-3" />
                <span>DEV MOCK • HISTORICAL ARCHIVE</span>
              </span>
            )}
          </div>
          <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#0b1c30] dark:text-slate-100">
            Local Rainfall &amp; Flood Probability Series
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Longitudinal hydro-meteorological observation records for {activeCity} catchments from{' '}
            <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs">
              GET /api/history/{activeCity}
            </code>.
          </p>
        </div>

        {/* Location Selection & Chart Mode Toggles */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
          {/* Location Selector Dropdown */}
          <div className="relative min-w-[170px]">
            <label htmlFor="history-city-select" className="sr-only">
              Select City or District
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                id="history-city-select"
                value={activeCity}
                onChange={(e) => handleCityChange(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 min-h-[44px] text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 cursor-pointer appearance-none"
              >
                {AVAILABLE_HISTORY_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc} District
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* View Mode Switcher (min-h-[44px] touch targets) */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            {(['split', 'rainfall', 'probability'] as const).map((mode) => {
              const isActive = viewMode === mode;
              const labels: Record<ChartViewMode, string> = {
                split: 'Both Series',
                rainfall: 'Rainfall (mm)',
                probability: 'Flood Prob (%)',
              };
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  aria-pressed={isActive}
                  className={`px-3 py-2 min-h-[44px] text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center justify-center ${
                    isActive
                      ? 'bg-white dark:bg-sky-600 text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {labels[mode]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────
          2. DATA STATE BOUNDARY CONTROLLER
          ──────────────────────────────────────────────────────────────── */}
      <DataStateBoundary
        state={effectiveDataState}
        loadingComponent={<ChartSkeleton />}
        emptyComponent={
          <EmptyState
            title={`No historical records for ${activeCity}.`}
            description={`No verified hydro-meteorological observations or flood probability records exist for ${activeCity}. You may select another district to inspect available archives.`}
            actionLabel="View Dhemaji Archive"
            onAction={() => handleCityChange('Dhemaji')}
          />
        }
        errorComponent={
          <ErrorState
            title="Unable to load historical records."
            message={errorMessage || `Could not fetch historical telemetry records for ${activeCity} from the telemetry service.`}
            onRetry={onRetry}
          />
        }
        backendUnavailableComponent={
          <BackendUnavailable
            title="FloodGuard backend is currently unavailable."
            message="Historical telemetry and meteorological archive service is unreachable."
            onRetry={onRetry}
          />
        }
      >
        {/* ────────────────────────────────────────────────────────────
            3. RECHARTS VISUALIZATION CONTAINERS
            ──────────────────────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Rainfall Chart (displayed when mode is 'split' or 'rainfall') */}
          {(viewMode === 'split' || viewMode === 'rainfall') && hasRainfall && (
            <div className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <CloudRain className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <h3 className="font-heading font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                    Observed Precipitation ({activeCity})
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  Unit: Millimeters (mm)
                </span>
              </div>

              <div className="h-64 sm:h-72 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={activeRecords}
                    margin={{ top: 10, right: 15, left: -5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke={axisStroke}
                      fontSize={11}
                      fontFamily="monospace"
                      tickLine={false}
                      axisLine={{ stroke: isDark ? '#334155' : '#cbd5e1' }}
                    />
                    <YAxis
                      stroke={axisStroke}
                      fontSize={11}
                      fontFamily="monospace"
                      tickLine={false}
                      axisLine={false}
                      unit="mm"
                    />
                    <Tooltip content={<CustomHistoryTooltip activeCity={activeCity} />} cursor={{ fill: isDark ? 'rgba(56, 189, 248, 0.08)' : 'rgba(2, 132, 199, 0.05)' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '8px' }} />
                    <Bar
                      dataKey="rainfall_mm"
                      name="Rainfall (mm)"
                      fill={rainColor}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={48}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Flood Probability Chart (displayed when mode is 'split' or 'probability') */}
          {(viewMode === 'split' || viewMode === 'probability') && hasProbability && (
            <div className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <h3 className="font-heading font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                    Flood Probability Trend ({activeCity})
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  Scale: 0–100%
                </span>
              </div>

              <div className="h-64 sm:h-72 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={activeRecords}
                    margin={{ top: 10, right: 15, left: -5, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="probGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={probColor} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={probColor} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke={axisStroke}
                      fontSize={11}
                      fontFamily="monospace"
                      tickLine={false}
                      axisLine={{ stroke: isDark ? '#334155' : '#cbd5e1' }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      stroke={axisStroke}
                      fontSize={11}
                      fontFamily="monospace"
                      tickLine={false}
                      axisLine={false}
                      unit="%"
                    />
                    <ReferenceLine
                      y={70}
                      stroke="#ef4444"
                      strokeDasharray="4 4"
                      label={{
                        value: 'High Alert (70%)',
                        fill: '#ef4444',
                        fontSize: 10,
                        fontFamily: 'monospace',
                        position: 'insideTopRight',
                      }}
                    />
                    <Tooltip content={<CustomHistoryTooltip activeCity={activeCity} />} cursor={{ stroke: probColor, strokeWidth: 1.5 }} />
                    <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '8px' }} />
                    <Area
                      type="monotone"
                      dataKey="flood_probability"
                      name="Flood Probability (%)"
                      stroke={probColor}
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#probGradient)"
                      dot={{ r: 3.5, fill: probColor, strokeWidth: 1, stroke: isDark ? '#0f172a' : '#fff' }}
                      activeDot={{ r: 5.5, strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Metric Footnote & Measurement Guidance */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <Layers className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
            <span>
              Precipitation and flood probability are recorded independently from catchment gauge stations without synthetic extrapolation.
            </span>
          </div>
        </div>
      </DataStateBoundary>
    </section>
  );
};
