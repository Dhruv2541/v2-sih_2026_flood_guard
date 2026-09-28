import React from 'react';
import { X, Activity, Satellite, Waves, ShieldAlert, Download, Layers, Droplets, MapPin, Users, HelpCircle } from 'lucide-react';
import { SectorData } from '../types';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from 'recharts';

interface DiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  sector: SectorData;
}

export const DiagnosticModal: React.FC<DiagnosticModalProps> = ({
  isOpen,
  onClose,
  sector,
}) => {
  if (!isOpen) return null;

  // Chart data from sector rainfall forecast
  const rainfallChartData = [
    { name: 'Observed (24h)', rain: sector.rainfall?.currentRainfall24hMm || 245 },
    { name: '+24h Forecast', rain: sector.rainfall?.forecast24hMm || 190 },
    { name: '+48h Forecast', rain: sector.rainfall?.forecast48hMm || 115 },
    { name: '+72h Forecast', rain: sector.rainfall?.forecast72hMm || 45 },
  ];

  // Timeline evolution data
  const timelineChartData = sector.timeline?.map((t) => ({
    hour: t.label,
    risk: t.riskScore,
    inundation: t.inundationAreaKm2,
    probability: t.floodProbability,
  })) || [
    { hour: 'Now', risk: sector.vulnerabilityIndex, inundation: sector.inundationAreaKm2, probability: sector.floodProb }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-[calc(100vw-16px)] sm:max-w-4xl bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col transition-colors">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-3.5 sm:px-6 py-3 sm:py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 gap-2">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#0b1c30] dark:bg-sky-600 text-white flex items-center justify-center flex-shrink-0">
              <Activity className="w-4 h-4 text-sky-400 dark:text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-heading font-extrabold text-sm sm:text-lg text-slate-900 dark:text-slate-100 leading-tight flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span>Hydro-Diagnostic & Inundation Intelligence Sheet</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-transparent dark:border-sky-800 font-mono">
                  SIH26071
                </span>
              </h3>
              <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                Catchment: {sector.district} • Telemetry Station: {sector.stationCode} ({sector.stationName})
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors flex-shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 text-xs text-slate-700 dark:text-slate-300 min-w-0">
          {/* Top 4 Core Answers Executive Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <div className="p-3 bg-red-50/70 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-lg min-w-0">
              <div className="text-[10px] font-bold text-red-800 dark:text-red-300 uppercase font-mono">1. WILL IT FLOOD?</div>
              <div className="text-xl font-extrabold text-red-700 dark:text-red-400 font-mono mt-1">{sector.floodProb}% Prob</div>
              <div className="text-[10px] text-red-600 dark:text-red-400 mt-0.5">{sector.hazardLevel} Hazard Level</div>
            </div>

            <div className="p-3 bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/60 rounded-lg min-w-0">
              <div className="text-[10px] font-bold text-sky-800 dark:text-sky-300 uppercase font-mono">2. WHERE?</div>
              <div className="text-xl font-extrabold text-sky-800 dark:text-sky-300 font-mono mt-1">{sector.inundationAreaKm2} km²</div>
              <div className="text-[10px] text-sky-600 dark:text-sky-400 mt-0.5 line-clamp-1">{sector.affectedNeighborhoods[0]}</div>
            </div>

            <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-lg min-w-0">
              <div className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase font-mono">3. HOW SEVERE?</div>
              <div className="text-xl font-extrabold text-amber-800 dark:text-amber-300 font-mono mt-1">{sector.vulnerabilityIndex}/100</div>
              <div className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5">{sector.riverStageDelta}</div>
            </div>

            <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 rounded-lg min-w-0">
              <div className="text-[10px] font-bold text-indigo-800 dark:text-indigo-300 uppercase font-mono">4. AFFECTED?</div>
              <div className="text-xl font-extrabold text-indigo-800 dark:text-indigo-300 font-mono mt-1">{(sector.populationAtRisk / 1000).toFixed(0)}K Pop</div>
              <div className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-0.5 truncate">{sector.infrastructureCounts.hospitals} Hosp • {sector.infrastructureCounts.schools} Sch</div>
            </div>
          </div>

          {/* Visualizations Row: Rainfall Hyetograph & Inundation Curve */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
            {/* Chart 1: Heavy Rainfall Hyetograph */}
            <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs min-w-0 overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] uppercase font-mono flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <span className="truncate">Rainfall Precipitation & Forecast (mm)</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-transparent dark:border-blue-900 rounded font-mono flex-shrink-0">
                  {sector.rainfall?.intensity}
                </span>
              </div>
              <div className="h-44 w-full min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rainfallChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '6px' }} />
                    <Bar dataKey="rain" fill="#0284c7" radius={[4, 4, 0, 0]} name="Rainfall (mm)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: 72-Hour Inundation Evolution */}
            <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs min-w-0 overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] uppercase font-mono flex items-center gap-1.5">
                  <Waves className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                  <span className="truncate">72h Expected Flooded Area (km²)</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-transparent dark:border-sky-900 rounded font-mono flex-shrink-0">
                  Peak at +12h
                </span>
              </div>
              <div className="h-44 w-full min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineChartData}>
                    <defs>
                      <linearGradient id="colorInundation" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0284c7" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#0284c7" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '6px' }} />
                    <Area type="monotone" dataKey="inundation" stroke="#0284c7" strokeWidth={2} fillOpacity={1} fill="url(#colorInundation)" name="Inundation (km²)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* AI Explainability Attribution Factors */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-2">
              <HelpCircle className="w-4 h-4 text-sky-700 dark:text-sky-400 flex-shrink-0" />
              <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px] font-mono">
                AI / ML CAUSAL FEATURE ATTRIBUTION (SHAP VALUES)
              </h4>
            </div>
            <div className="overflow-x-auto max-w-full touch-pan-x scrollbar-none">
              <div className="min-w-[500px] border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-700 dark:text-slate-300 grid grid-cols-12 text-[11px]">
                  <span className="col-span-4">Causal Driver / Feature</span>
                  <span className="col-span-3">Observed Telemetry</span>
                  <span className="col-span-3">Risk Contribution</span>
                  <span className="col-span-2 text-right">Status</span>
                </div>
                {sector.factors?.map((f) => (
                  <div key={f.id} className="p-2.5 grid grid-cols-12 items-center text-xs">
                    <div className="col-span-4 font-semibold text-slate-800 dark:text-slate-200 pr-2">
                      <div>{f.name}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">{f.description}</div>
                    </div>
                    <div className="col-span-3 font-mono text-slate-700 dark:text-slate-300">{f.observedValue}</div>
                    <div className="col-span-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-2">
                        <span>{f.contributionPercent}%</span>
                        <div className="w-16 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-sky-700 dark:bg-sky-500 h-full rounded-full" style={{ width: `${f.contributionPercent * 2}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2 text-right font-bold font-mono">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                        f.status === 'CRITICAL' ? 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-transparent dark:border-red-900' :
                        f.status === 'HIGH' ? 'bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 border border-transparent dark:border-orange-900' :
                        f.status === 'MODERATE' ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-transparent dark:border-amber-900' : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-transparent dark:border-emerald-900'
                      }`}>
                        {f.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Demographic Exposure & Critical Infrastructure */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
            {/* Vulnerable Demographics */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 min-w-0">
              <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] uppercase font-mono block mb-2">
                HUMAN & ANIMAL EXPOSURE DEMOGRAPHICS
              </span>
              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Total Population Exposed:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{(sector.populationAtRisk ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Children under 5 years:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{(sector.vulnerableDemographics?.childrenUnder5 ?? 11200).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Elderly above 65 years:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{((sector.vulnerableDemographics?.elderlyAbove65 ?? sector.vulnerableDemographics?.elderlyOver65) ?? 8400).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Domestic Livestock at Risk:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{(sector.vulnerableDemographics?.livestockCount ?? 18500).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Satellite & Calibration Metadata */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 min-w-0">
              <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] uppercase font-mono block mb-2">
                EARTH OBSERVATION & SENSOR TELEMETRY
              </span>
              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">SAR Radar Satellite:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-right ml-2">Sentinel-1 C-Band (10m)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Elevation DEM Grid:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-right ml-2">SRTM 1-Arc Sec (30m)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Hydrological Hydro-Model:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-right ml-2">SIH-Hydro 2D Shallow</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Soil Moisture Radiometry:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-right ml-2">NASA SMAP L4 Radiometer</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono text-center sm:text-left">
            Generated by FloodGuard • Smart India Hackathon SIH26071
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex-1 sm:flex-none justify-center px-3 py-2 sm:py-1.5 min-h-[40px] sm:min-h-0 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-md border border-slate-300 dark:border-slate-700 text-xs flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none justify-center px-4 py-2 sm:py-1.5 min-h-[40px] sm:min-h-0 bg-[#0b1c30] dark:bg-sky-600 hover:bg-slate-800 dark:hover:bg-sky-500 text-white font-semibold rounded-md text-xs transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
