import React, { useState } from 'react';
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { FloodEvent } from '../../services/floodArchiveService';
import { BarChart3, TrendingUp } from 'lucide-react';

interface HistoricalTrendChartProps {
  events: FloodEvent[];
  selectedYear: number;
  onSelectYear: (year: number) => void;
  isDark: boolean;
  reduceMotion?: boolean;
}

type ChartMetric =
  | 'population'
  | 'crop_area'
  | 'human_lives'
  | 'damage'
  | 'cattle'
  | 'villages';

interface MetricConfig {
  id: ChartMetric;
  label: string;
  shortLabel: string;
  unit: string;
  color: string;
  mutedColor: string;
  getValue: (e: FloodEvent) => number | null;
  formatTooltip: (val: number) => string;
}

export const HistoricalTrendChart: React.FC<HistoricalTrendChartProps> = ({
  events,
  selectedYear,
  onSelectYear,
  isDark,
  reduceMotion = false,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<ChartMetric>('population');

  const metricConfigs: Record<ChartMetric, MetricConfig> = {
    population: {
      id: 'population',
      label: 'Population Affected',
      shortLabel: 'Population',
      unit: 'Lakh people',
      color: isDark ? '#38bdf8' : '#0284c7',
      mutedColor: isDark ? '#1e3a5f' : '#b9dced',
      getValue: (e) => e.population_affected_lakh ?? null,
      formatTooltip: (v) => `${v.toLocaleString()} Lakh people (~${(v * 100000).toLocaleString()})`,
    },
    crop_area: {
      id: 'crop_area',
      label: 'Crop Area Affected',
      shortLabel: 'Crop Area',
      unit: 'Lakh Hectares',
      color: isDark ? '#34d399' : '#059669',
      mutedColor: isDark ? '#134e4a' : '#a7f3d0',
      getValue: (e) => e.crop_area_affected_lakh_ha ?? null,
      formatTooltip: (v) => `${v.toLocaleString()} Lakh Hectares`,
    },
    human_lives: {
      id: 'human_lives',
      label: 'Human Lives Lost',
      shortLabel: 'Lives Lost',
      unit: 'Fatalities',
      color: isDark ? '#f87171' : '#dc2626',
      mutedColor: isDark ? '#7f1d1d' : '#fecaca',
      getValue: (e) => e.human_lives_lost ?? null,
      formatTooltip: (v) => `${v.toLocaleString()} lives lost`,
    },
    damage: {
      id: 'damage',
      label: 'Estimated Economic Damage',
      shortLabel: 'Damage',
      unit: '₹ Crore',
      color: isDark ? '#fbbf24' : '#d97706',
      mutedColor: isDark ? '#78350f' : '#fde68a',
      getValue: (e) => e.total_damage_crore ?? null,
      formatTooltip: (v) => `₹${v.toLocaleString()} Crore`,
    },
    cattle: {
      id: 'cattle',
      label: 'Cattle Lost',
      shortLabel: 'Cattle',
      unit: 'Head of livestock',
      color: isDark ? '#a78bfa' : '#7c3aed',
      mutedColor: isDark ? '#4c1d95' : '#ddd6fe',
      getValue: (e) => e.cattle_lost ?? null,
      formatTooltip: (v) => `${v.toLocaleString()} cattle lost`,
    },
    villages: {
      id: 'villages',
      label: 'Villages Affected',
      shortLabel: 'Villages',
      unit: 'Villages',
      color: isDark ? '#fb923c' : '#ea580c',
      mutedColor: isDark ? '#7c2d12' : '#ffedd5',
      getValue: (e) => e.villages_affected ?? null,
      formatTooltip: (v) => `${v.toLocaleString()} villages`,
    },
  };

  const activeConfig = metricConfigs[selectedMetric];

  // Prepare chart data chronologically (2018 to 2025)
  const chartData = [...events]
    .sort((a, b) => a.year - b.year)
    .map((e) => {
      const val = activeConfig.getValue(e);
      return {
        year: e.year.toString(),
        value: val !== null ? val : 0,
        isMissing: val === null,
        rawEvent: e,
      };
    });

  // Calculate average for available years
  const validValues = chartData.filter((d) => !d.isMissing).map((d) => d.value);
  const averageValue =
    validValues.length > 0
      ? validValues.reduce((sum, v) => sum + v, 0) / validValues.length
      : 0;

  const gridStroke = isDark ? '#2c3e56' : '#e8eef5';
  const axisStroke = isDark ? '#b1c0d4' : '#475569';

  return (
    <section
      aria-labelledby="historical-trend-title"
      className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 min-w-0 transition-colors"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-600 dark:text-sky-400" aria-hidden="true" />
            <h2 id="historical-trend-title" className="font-heading font-extrabold text-lg text-[#0b1c30] dark:text-slate-100">
              Historical Flood Comparison (2018–2025)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Single-metric axis prevents misleading unit distortion. Showing: <strong>{activeConfig.label}</strong> ({activeConfig.unit}).
          </p>
        </div>

        {/* Metric Selector Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full touch-pan-x scrollbar-none py-1">
          {(Object.keys(metricConfigs) as ChartMetric[]).map((metricId) => {
            const config = metricConfigs[metricId];
            const isCurrent = selectedMetric === metricId;
            return (
              <button
                key={metricId}
                type="button"
                onClick={() => setSelectedMetric(metricId)}
                aria-pressed={isCurrent}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  isCurrent
                    ? 'bg-[#0b1c30] dark:bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {config.shortLabel}
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-72 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 14, right: 12, left: 4, bottom: 4 }}
            onClick={(state: any) => {
              if (state && state.activePayload && state.activePayload.length) {
                const clickedYear = parseInt(state.activePayload[0].payload.year, 10);
                if (!isNaN(clickedYear)) {
                  onSelectYear(clickedYear);
                }
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis
              dataKey="year"
              stroke={axisStroke}
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={axisStroke}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={54}
              label={{
                value: activeConfig.unit,
                angle: -90,
                position: 'insideLeft',
                fill: axisStroke,
                fontSize: 10,
              }}
            />
            <Tooltip
              cursor={{ fill: isDark ? 'rgba(148,163,184,0.08)' : 'rgba(14,116,144,0.05)' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                const isSelected = parseInt(d.year, 10) === selectedYear;
                return (
                  <div
                    role="status"
                    className="min-w-48 rounded-xl border p-3 shadow-xl text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-1.5 font-bold font-mono">
                      <span>{d.year}</span>
                      {isSelected && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                          Selected Year
                        </span>
                      )}
                    </div>
                    <div className="mt-2">
                      <div className="text-slate-500 dark:text-slate-400 text-[11px]">{activeConfig.label}</div>
                      <div className="font-extrabold text-sm sm:text-base text-sky-700 dark:text-sky-400 mt-0.5">
                        {d.isMissing ? 'Data not available in verified record' : activeConfig.formatTooltip(d.value)}
                      </div>
                    </div>
                    <div className="mt-2 text-[10px] text-slate-400 italic">
                      Click bar to select {d.year}
                    </div>
                  </div>
                );
              }}
            />
            {averageValue > 0 && (
              <ReferenceLine
                y={averageValue}
                stroke={isDark ? '#7386a0' : '#94a3b8'}
                strokeDasharray="4 4"
                label={{
                  value: `Avg: ${Math.round(averageValue * 10) / 10}`,
                  position: 'insideTopLeft',
                  fill: axisStroke,
                  fontSize: 10,
                }}
              />
            )}
            <Bar
              dataKey="value"
              name={activeConfig.label}
              radius={[4, 4, 0, 0]}
              maxBarSize={46}
              isAnimationActive={!reduceMotion}
            >
              {chartData.map((entry) => {
                const isSelected = parseInt(entry.year, 10) === selectedYear;
                return (
                  <Cell
                    key={entry.year}
                    fill={isSelected ? activeConfig.color : activeConfig.mutedColor}
                    fillOpacity={entry.isMissing ? 0.2 : isSelected ? 1 : 0.75}
                    stroke={isSelected ? (isDark ? '#ffffff' : '#0b1c30') : undefined}
                    strokeWidth={isSelected ? 1.5 : 0}
                  />
                );
              })}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
        <span className="flex items-center gap-1.5 font-mono">
          <TrendingUp className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          Period 2018–2025 average: <strong>{Math.round(averageValue * 10) / 10} {activeConfig.unit}</strong>
        </span>
        <span className="italic hidden sm:inline">
          Values matching verified government returns
        </span>
      </div>
    </section>
  );
};
