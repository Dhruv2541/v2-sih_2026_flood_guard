import React, { useState } from 'react';
import { HISTORICAL_DATA } from '../data/assamData';
import { useTheme } from '../context/ThemeContext';
import { 
  Clock, 
  Droplets, 
  Users, 
  TrendingUp, 
  Waves, 
  Coins, 
  ShieldAlert,
  Info
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';

export const HistoricalView: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const { resolvedTheme } = useTheme();

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

  const activeRecord = HISTORICAL_DATA.find((d) => d.year === selectedYear) || HISTORICAL_DATA[0];

  // Correlation chart data (Rainfall vs Flooded Area)
  const correlationData = HISTORICAL_DATA.map((d) => ({
    year: d.year.toString(),
    rainfallMm: d.monsoonRainfallMm,
    inundationKm2: d.floodInundationAreaKm2,
    populationM: Number((d.affectedPopulationTotal / 1000000).toFixed(2)),
    damagesCr: d.damagesCrInr,
  }));

  return (
    <div className="w-full max-w-[1536px] mx-auto px-3.5 sm:px-6 lg:px-8 py-5 space-y-5 animate-in fade-in duration-200 min-w-0">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors min-w-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0"></span>
            <span className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">
              ASSAM FLOOD TELEMETRY ARCHIVE (2018–2025)
            </span>
          </div>
          <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#0b1c30] dark:text-slate-100">
            Historical Flood Events
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Compare annual monsoon rainfall, flooded territory, displaced population, and economic damage.
          </p>
        </div>

        {/* Year Selector Pills */}
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 overflow-x-auto max-w-full touch-pan-x scrollbar-none self-start md:self-auto">
          {HISTORICAL_DATA.map((d) => (
            <button
              key={d.year}
              onClick={() => setSelectedYear(d.year)}
              className={`px-3 py-1.5 min-h-[36px] text-xs font-bold font-mono rounded-lg transition whitespace-nowrap flex-shrink-0 ${
                selectedYear === d.year
                  ? 'bg-[#0b1c30] dark:bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
              }`}
            >
              {d.year}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Year Snapshot Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm transition">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#0b1c30] dark:text-white font-heading">
              {activeRecord.year} Flood Profile
            </h3>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase font-mono ${
              activeRecord.severityCategory === 'Catastrophic'
                ? 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300'
                : 'bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300'
            }`}>
              {activeRecord.severityCategory || 'Severe'}
            </span>
          </div>

          <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
            Districts Impacted: <strong className="text-slate-700 dark:text-slate-300">{activeRecord.affectedDistrictsCount || activeRecord.districtsAffectedCount || 28} of 35</strong>
          </span>
        </div>

        {/* 4 Cards: Rainfall, Inundation, Population, Damage */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4">
          {/* Card 1: Rainfall */}
          <div className="p-4 rounded-xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase font-mono">
              <span>Monsoon Rainfall</span>
              <Droplets className="w-4 h-4 text-blue-500" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#0b1c30] dark:text-white font-heading">
              {activeRecord.monsoonRainfallMm} mm
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
              Basin cumulative precipitation
            </p>
          </div>

          {/* Card 2: Inundation */}
          <div className="p-4 rounded-xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase font-mono">
              <span>Flooded Territory</span>
              <Waves className="w-4 h-4 text-sky-500" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-sky-700 dark:text-sky-400 font-heading">
              {(activeRecord.floodInundationAreaKm2 ?? 0).toLocaleString()} km²
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
              Submerged land &amp; crop area
            </p>
          </div>

          {/* Card 3: Population */}
          <div className="p-4 rounded-xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase font-mono">
              <span>People Affected</span>
              <Users className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#0b1c30] dark:text-white font-heading">
              {(((activeRecord.affectedPopulationTotal ?? 0) / 1000000)).toFixed(2)}M
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
              Displaced or relief sheltered
            </p>
          </div>

          {/* Card 4: Economic Damage */}
          <div className="p-4 rounded-xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase font-mono">
              <span>Economic Damage</span>
              <TrendingUp className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-amber-700 dark:text-amber-400 font-heading">
              ₹{(activeRecord.damagesCrInr ?? 0).toLocaleString()} Cr
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
              Infrastructure &amp; crop loss
            </p>
          </div>
        </div>

        {/* Short Executive Summary (1-2 sentences max) */}
        {activeRecord.summaryNarrative && (
          <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <strong className="text-slate-900 dark:text-slate-100 font-semibold">Event Summary: </strong>
            {activeRecord.summaryNarrative}
          </div>
        )}
      </div>

      {/* Clean Historical Trends Chart */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition min-w-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading font-bold text-base text-[#0b1c30] dark:text-slate-100">
              Longitudinal Inundation vs. Rainfall Trend (2018–2025)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comparison between total monsoonal precipitation and resultant flooded area across Assam.
            </p>
          </div>
        </div>

        <div className="h-72 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={correlationData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="year" stroke={axisStroke} fontSize={11} />
              <YAxis yAxisId="left" stroke="#0284c7" fontSize={11} />
              <YAxis yAxisId="right" orientation="right" stroke={axisStroke} fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              <Bar yAxisId="left" dataKey="inundationKm2" fill="#38bdf8" name="Inundation Area (km²)" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="rainfallMm" stroke="#0284c7" strokeWidth={2.5} name="Monsoon Rain (mm)" dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
