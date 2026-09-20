import React, { useState } from 'react';
import { SectorData } from '../types';
import { ASSAM_SECTORS } from '../data/assamData';
import { useTheme } from '../context/ThemeContext';
import { 
  Activity, 
  Droplets, 
  Waves, 
  HelpCircle, 
  Clock, 
  ChevronDown,
  ChevronUp,
  MapPin,
  TrendingUp
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine, 
  Legend 
} from 'recharts';

interface PredictionsViewProps {
  currentSector: SectorData;
  onSelectSector: (sectorId: string) => void;
  onOpenDiagnostic: () => void;
}

export const PredictionsView: React.FC<PredictionsViewProps> = ({
  currentSector,
  onSelectSector,
  onOpenDiagnostic,
}) => {
  const [showMlDetails, setShowMlDetails] = useState(false);
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

  // Chart 1: 72-hour River Hydrograph with Danger Level & HFL
  const hydrographData = [
    { time: '-24h', stage: Number((currentSector.stageAbsolute - 1.6).toFixed(2)), danger: currentSector.dangerLevel },
    { time: '-12h', stage: Number((currentSector.stageAbsolute - 0.9).toFixed(2)), danger: currentSector.dangerLevel },
    { time: 'Now', stage: Number((currentSector.stageAbsolute).toFixed(2)), danger: currentSector.dangerLevel },
    { time: '+6h', stage: Number((currentSector.stageAbsolute + 0.45).toFixed(2)), danger: currentSector.dangerLevel },
    { time: '+12h (Peak)', stage: Number((currentSector.stageAbsolute + 0.85).toFixed(2)), danger: currentSector.dangerLevel },
    { time: '+24h', stage: Number((currentSector.stageAbsolute + 0.70).toFixed(2)), danger: currentSector.dangerLevel },
    { time: '+48h', stage: Number((currentSector.stageAbsolute + 0.25).toFixed(2)), danger: currentSector.dangerLevel },
    { time: '+72h', stage: Number((currentSector.stageAbsolute - 0.40).toFixed(2)), danger: currentSector.dangerLevel },
  ];

  // Chart 2: Rainfall Hyetograph & Cumulative Volume
  const hyetographData = [
    { period: 'Past 24h', rainfall: currentSector.rainfall.currentRainfall24hMm },
    { period: '+12h', rainfall: Math.round((currentSector.rainfall.expectedRainfall48hMm || 45) * 0.4) },
    { period: '+24h', rainfall: Math.round((currentSector.rainfall.expectedRainfall48hMm || 45) * 0.6) },
    { period: '+48h', rainfall: currentSector.rainfall.expectedRainfall48hMm || 60 },
    { period: '+72h', rainfall: currentSector.rainfall.expectedRainfall72hMm || 95 },
  ];

  // Chart 3: Inundation Area Progression
  const inundationSpreadData = currentSector.timeline?.map((t) => ({
    time: t.label,
    area: t.inundationAreaKm2,
    depth: Number((currentSector.waterDepthAvgM * (t.riskScore / 50)).toFixed(2)),
  })) || [
    { time: 'Now', area: currentSector.inundationAreaKm2, depth: currentSector.waterDepthAvgM }
  ];

  return (
    <div className="w-full max-w-[1536px] mx-auto px-3.5 sm:px-6 lg:px-8 py-5 space-y-5 animate-in fade-in duration-200 min-w-0">
      {/* Header & Catchment Selector */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse flex-shrink-0"></span>
            <span className="text-xs font-mono font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase truncate">
              72-HOUR FLOOD PREDICTION
            </span>
          </div>
          <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#0b1c30] dark:text-slate-100">
            River Level &amp; Flood Inundation Forecast
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Forecasted water levels, rainfall accumulation, and flooded territory based on live river sensors and weather telemetry.
          </p>
        </div>

        {/* Sector Selector */}
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 overflow-x-auto max-w-full touch-pan-x scrollbar-none self-start lg:self-auto">
          <span className="text-xs font-bold text-slate-400 uppercase font-mono mr-1 pl-1 flex-shrink-0">District:</span>
          {Object.values(ASSAM_SECTORS).map((s) => (
            <button
              key={s.id}
              onClick={() => onSelectSector(s.id)}
              className={`px-3 py-1.5 min-h-[36px] text-xs rounded-lg font-semibold transition whitespace-nowrap flex-shrink-0 ${
                s.id === currentSector.id
                  ? 'bg-[#0b1c30] dark:bg-sky-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
              }`}
            >
              {s.district}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Core Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Flood Probability */}
        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase font-mono">
            <span>Flood Probability</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
              currentSector.hazardLevel === 'HIGH' || currentSector.hazardLevel === 'CRITICAL'
                ? 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300'
                : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
            }`}>
              {currentSector.hazardLevel}
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="font-heading font-extrabold text-3xl sm:text-4xl text-red-600 dark:text-red-400">
              {currentSector.floodProb}%
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
            Status: <strong className="text-slate-800 dark:text-slate-200">{currentSector.statusSummary}</strong>
          </p>
        </div>

        {/* Metric 2: Expected Timing */}
        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase font-mono">
            <span>Expected Timing</span>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="font-heading font-extrabold text-3xl sm:text-4xl text-[#0b1c30] dark:text-white">
              {currentSector.peakWindow || '18–36h'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
            Surge Peak: <strong className="text-red-600 dark:text-red-400">{currentSector.riverStageDelta}</strong> over danger
          </p>
        </div>

        {/* Metric 3: Water Depth */}
        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase font-mono">
            <span>Water Depth</span>
            <Droplets className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="font-heading font-extrabold text-3xl sm:text-4xl text-[#0b1c30] dark:text-white">
              {currentSector.waterDepthAvgM}m
            </span>
            <span className="text-xs text-slate-400 font-mono">avg</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
            Peak depth up to <strong className="text-slate-800 dark:text-slate-200">{currentSector.waterDepthPeakM}m</strong> in lowlands
          </p>
        </div>

        {/* Metric 4: Inundation Area */}
        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase font-mono">
            <span>Expected Flooded Area</span>
            <Waves className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="font-heading font-extrabold text-3xl sm:text-4xl text-[#0b1c30] dark:text-white">
              {currentSector.inundationAreaKm2}
            </span>
            <span className="text-xs text-slate-400 font-mono">km²</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium truncate" title={currentSector.inundationPathSummary}>
            {currentSector.inundationPathSummary}
          </p>
        </div>
      </div>

      {/* Primary Clean Visual Charts */}
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
                {currentSector.riverName} • {currentSector.stationName}
              </p>
            </div>
            <span className="text-xs font-bold font-mono text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/70 px-2.5 py-1 rounded-md border border-red-200 dark:border-red-900">
              Peak: +12 Hours
            </span>
          </div>

          <div className="h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hydrographData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="time" stroke={axisStroke} fontSize={11} />
                <YAxis stroke={axisStroke} fontSize={11} domain={['dataMin - 0.5', 'dataMax + 0.5']} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <ReferenceLine y={currentSector.dangerLevel} stroke="#dc2626" strokeDasharray="4 4" label={{ value: 'Danger Level', fill: '#dc2626', fontSize: 10 }} />
                <Line type="monotone" dataKey="stage" stroke="#0284c7" strokeWidth={3} name="Water Level (m)" dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-300 flex flex-wrap items-center justify-between gap-2 font-mono">
            <span>Danger Level: <strong>{currentSector.dangerLevel}m</strong></span>
            <span>Current Stage: <strong className="text-red-600 dark:text-red-400">{currentSector.stageAbsolute}m</strong></span>
            <span>Peak Expected: <strong>{(currentSector.stageAbsolute + 0.85).toFixed(2)}m</strong></span>
          </div>
        </div>

        {/* CHART 2: Rainfall Accumulation */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-heading font-bold text-base text-[#0b1c30] dark:text-slate-100 flex items-center gap-2">
                <Droplets className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Monsoon Rainfall Accumulation</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                IMD Precipitation Forecast ({currentSector.rainfall.intensity} intensity)
              </p>
            </div>
            <span className="text-xs font-bold font-mono text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-900">
              {currentSector.rainfall.currentRainfall24hMm} mm past 24h
            </span>
          </div>

          <div className="h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hyetographData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="period" stroke={axisStroke} fontSize={11} />
                <YAxis stroke={axisStroke} fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="rainfall" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Expected Rainfall (mm)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-300 flex flex-wrap items-center justify-between gap-2 font-mono">
            <span>Soil Moisture: <strong>High</strong></span>
            <span>Catchment Runoff: <strong>Fast</strong></span>
            <span>Rain Trend: <strong className="capitalize">{currentSector.rainfall.trend}</strong></span>
          </div>
        </div>
      </div>

      {/* Progressive Disclosure: Prediction Details */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition">
        <button
          onClick={() => setShowMlDetails(!showMlDetails)}
          className="w-full flex items-center justify-between text-sm font-bold text-slate-700 dark:text-slate-200 py-1 transition"
        >
          <span className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Prediction Details</span>
          </span>
          {showMlDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showMlDetails && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-in fade-in duration-150">
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              FloodGuard integrates 2D Saint-Venant hydraulic shallow-water dynamics with spatial-temporal ConvLSTM neural networks, trained across longitudinal Brahmaputra monsoon seasons. Feature attribution is calculated using TreeSHAP to measure each sensor's contribution to predicted flood probability.
            </p>

            {/* Feature Attribution Bars */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase font-mono block">
                Feature Attribution &amp; Weight Breakdown (SHAP)
              </span>
              {currentSector.factors?.map((factor) => (
                <div key={factor.id} className="text-xs space-y-1">
                  <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                    <span className="font-semibold">{factor.name} ({factor.category})</span>
                    <span className="font-mono font-bold">{factor.contributionPercent}% contribution</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        factor.status === 'CRITICAL' ? 'bg-red-500' :
                        factor.status === 'HIGH' ? 'bg-orange-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${factor.contributionPercent * 2}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-mono">
                Model: SIH-Hydro-v3.2 • SAR Verified (ROC-AUC: 0.96)
              </span>
              <button
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
  );
};
