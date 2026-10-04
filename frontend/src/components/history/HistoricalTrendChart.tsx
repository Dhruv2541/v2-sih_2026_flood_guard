import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  Legend,
  ReferenceLine,
} from 'recharts';
import { FloodEvent } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { BarChart3, TrendingUp, Info } from 'lucide-react';

interface HistoricalTrendChartProps {
  events: FloodEvent[];
  selectedYear: number;
  onSelectYear: (year: number) => void;
}

type MetricMode = 'population' | 'lives' | 'crop' | 'damage' | 'dual';

interface MetricOption {
  id: MetricMode;
  label: string;
  unit: string;
  color: string;
}

// Standalone memoized accessible Tooltip to avoid Recharts unmount/remount on each render
const CustomTrendTooltip: React.FC<{
  active?: boolean;
  payload?: any[];
  selectedYear?: number;
}> = React.memo(({ active, payload, selectedYear }) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  const isSelected = data.yearNum === selectedYear;

  return (
    <div
      role="status"
      className="p-3 rounded-xl border shadow-xl text-xs font-mono min-w-[200px] z-50 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
    >
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5 mb-2">
        <span className="font-extrabold text-sm text-[#0b1c30] dark:text-white">
          {data.year} Record
        </span>
        {isSelected && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300">
            Selected
          </span>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-slate-500 dark:text-slate-400">Population:</span>
          <span className="font-bold text-sky-600 dark:text-sky-400">
            {data.population > 0 ? `${data.population.toFixed(2)} Lakh` : 'Not Reported'}
          </span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-slate-500 dark:text-slate-400">Lives Lost:</span>
          <span className="font-bold text-red-600 dark:text-red-400">
            {data.lives > 0 ? `${data.lives} casualties` : 'None / 0'}
          </span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-slate-500 dark:text-slate-400">Crop Area:</span>
          <span className="font-bold text-amber-600 dark:text-amber-400">
            {data.hasCrop ? `${data.crop.toFixed(2)} Lakh Ha` : 'Not Reported'}
          </span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-slate-500 dark:text-slate-400">Damage:</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            {data.hasDamage ? `₹${data.damage.toLocaleString()} Cr` : 'Not Reported'}
          </span>
        </div>
      </div>

      <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
        Click bar to view {data.year} profile
      </div>
    </div>
  );
});

CustomTrendTooltip.displayName = 'CustomTrendTooltip';

export const HistoricalTrendChart: React.FC<HistoricalTrendChartProps> = ({
  events,
  selectedYear,
  onSelectYear,
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [metricMode, setMetricMode] = useState<MetricMode>('population');

  // Chart data sorted chronologically 2018 -> 2025 (memoized)
  const chartData = useMemo(() => {
    return [...events]
      .sort((a, b) => a.year - b.year)
      .map((e) => ({
        year: e.year.toString(),
        yearNum: e.year,
        population: e.population_affected_lakh ?? 0,
        lives: e.human_lives_lost ?? 0,
        crop: e.crop_area_affected_lakh_ha ?? 0,
        damage: e.total_damage_crore ?? 0,
        hasCrop: e.crop_area_affected_lakh_ha !== undefined,
        hasDamage: e.total_damage_crore !== undefined,
      }));
  }, [events]);

  const metricOptions: MetricOption[] = [
    { id: 'population', label: 'Population Affected', unit: 'Lakh People', color: '#0284c7' },
    { id: 'lives', label: 'Human Lives Lost', unit: 'Casualties', color: '#ef4444' },
    { id: 'crop', label: 'Crop Area Affected', unit: 'Lakh Ha', color: '#f59e0b' },
    { id: 'damage', label: 'Economic Damage', unit: '₹ Crore', color: '#10b981' },
    { id: 'dual', label: 'Dual-Axis', unit: 'Lakh / Casualties', color: '#8b5cf6' },
  ];

  const currentOption = metricOptions.find((m) => m.id === metricMode)!;

  // Chart theme colors
  const gridStroke = isDark ? '#1e293b' : '#f1f5f9';
  const axisStroke = isDark ? '#94a3b8' : '#64748b';
  const selectedBarColor = isDark ? '#38bdf8' : '#0284c7';
  const defaultBarColor = isDark ? '#334155' : '#cbd5e1';



  return (
    <section
      aria-labelledby="trend-heading"
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs transition-colors space-y-4"
    >
      {/* Chart Header and Metric Selector */}
      <div className="flex flex-col gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <h2
              id="trend-heading"
              className="text-lg sm:text-xl font-extrabold text-[#0b1c30] dark:text-white font-heading"
            >
              Historical Flood Comparison (2018–2025)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
            Verified statistics across Assam monsoon seasons. Click any bar to inspect that year.
          </p>
        </div>

        {/* Metric Mode Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto touch-pan-x scrollbar-none max-w-full">
          {metricOptions.map((opt) => {
            const isActive = metricMode === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setMetricMode(opt.id)}
                aria-pressed={isActive}
                className={`px-2.5 py-1.5 text-xs font-mono font-semibold rounded-lg transition-colors whitespace-nowrap flex-shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#0b1c30] dark:bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recharts Visualization Container */}
      <div className="h-80 w-full min-w-0 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: metricMode === 'dual' ? 25 : 10, left: 10, bottom: 5 }}
            onClick={(state: any) => {
              if (state && state.activePayload && state.activePayload[0]) {
                const clickedYear = state.activePayload[0].payload.yearNum;
                onSelectYear(clickedYear);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />

            <XAxis
              dataKey="year"
              stroke={axisStroke}
              fontSize={12}
              fontFamily="monospace"
              tickLine={false}
              axisLine={{ stroke: isDark ? '#334155' : '#cbd5e1' }}
            />

            {/* Left Y-Axis */}
            <YAxis
              yAxisId="left"
              stroke={axisStroke}
              fontSize={11}
              fontFamily="monospace"
              tickLine={false}
              axisLine={false}
              label={{
                value: metricMode === 'dual' ? 'Population (Lakh)' : currentOption.unit,
                angle: -90,
                position: 'insideLeft',
                fill: axisStroke,
                fontSize: 11,
                fontFamily: 'monospace',
                offset: -2,
              }}
            />

            {/* Right Y-Axis (used strictly for dual-axis mode to prevent unit collisions) */}
            {metricMode === 'dual' && (
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#ef4444"
                fontSize={11}
                fontFamily="monospace"
                tickLine={false}
                axisLine={false}
                label={{
                  value: 'Lives Lost (Count)',
                  angle: 90,
                  position: 'insideRight',
                  fill: '#ef4444',
                  fontSize: 11,
                  fontFamily: 'monospace',
                  offset: -2,
                }}
              />
            )}

            <Tooltip content={<CustomTrendTooltip selectedYear={selectedYear} />} cursor={{ fill: isDark ? 'rgba(56, 189, 248, 0.08)' : 'rgba(2, 132, 199, 0.05)' }} />

            <Legend
              wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '10px' }}
            />

            {/* Primary Bar Series */}
            {metricMode === 'population' && (
              <Bar
                yAxisId="left"
                dataKey="population"
                name="Population Affected (Lakh)"
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={`pop-${entry.year}`}
                    fill={entry.yearNum === selectedYear ? selectedBarColor : defaultBarColor}
                    className="cursor-pointer transition-opacity hover:opacity-80"
                  />
                ))}
              </Bar>
            )}

            {metricMode === 'lives' && (
              <Bar
                yAxisId="left"
                dataKey="lives"
                name="Human Lives Lost (Count)"
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={`lives-${entry.year}`}
                    fill={entry.yearNum === selectedYear ? '#ef4444' : (isDark ? '#7f1d1d' : '#fca5a5')}
                    className="cursor-pointer transition-opacity hover:opacity-80"
                  />
                ))}
              </Bar>
            )}

            {metricMode === 'crop' && (
              <Bar
                yAxisId="left"
                dataKey="crop"
                name="Crop Area Affected (Lakh Ha)"
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={`crop-${entry.year}`}
                    fill={entry.yearNum === selectedYear ? '#f59e0b' : (isDark ? '#78350f' : '#fde68a')}
                    className="cursor-pointer transition-opacity hover:opacity-80"
                  />
                ))}
              </Bar>
            )}

            {metricMode === 'damage' && (
              <Bar
                yAxisId="left"
                dataKey="damage"
                name="Estimated Economic Damage (₹ Crore)"
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={`damage-${entry.year}`}
                    fill={entry.yearNum === selectedYear ? '#10b981' : (isDark ? '#064e3b' : '#a7f3d0')}
                    className="cursor-pointer transition-opacity hover:opacity-80"
                  />
                ))}
              </Bar>
            )}

            {/* Dual-Axis Mode: Population as Bars, Lives Lost as Line */}
            {metricMode === 'dual' && (
              <>
                <Bar
                  yAxisId="left"
                  dataKey="population"
                  name="Population (Lakh People)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={42}
                >
                  {chartData.map((entry) => (
                    <Cell
                      key={`dual-pop-${entry.year}`}
                      fill={entry.yearNum === selectedYear ? selectedBarColor : defaultBarColor}
                      className="cursor-pointer transition-opacity hover:opacity-80"
                    />
                  ))}
                </Bar>
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="lives"
                  name="Lives Lost (Fatalities)"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#ef4444', strokeWidth: 1.5, stroke: isDark ? '#0f172a' : '#fff' }}
                  activeDot={{ r: 6, fill: '#ef4444', strokeWidth: 2 }}
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Measurement Clarity Note */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono text-slate-500 dark:text-slate-400">
        <Info className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
        <span>
          Different data types (like population and currency) are shown on separate axes for accuracy.
        </span>
      </div>
    </section>
  );
};
