import React, { useState } from 'react';
import { Radio, Search, ArrowUpRight, ArrowDownRight, Minus, Filter, Download } from 'lucide-react';
import { CWC_GAUGE_STATIONS } from '../data/assamData';
import { GaugeStation } from '../types';

interface RegionalTelemetryViewProps {
  onSelectStation?: (stationName: string) => void;
}

export const RegionalTelemetryView: React.FC<RegionalTelemetryViewProps> = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'danger' | 'warning' | 'normal'>('all');

  const filteredStations = CWC_GAUGE_STATIONS.filter((stn) => {
    const matchesSearch =
      stn.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stn.river.toLowerCase().includes(searchTerm.toLowerCase());

    const isOverDanger = stn.currentStage >= stn.dangerLevel;
    const isNearDanger = !isOverDanger && stn.currentStage >= stn.dangerLevel - 1.0;

    if (statusFilter === 'danger') return matchesSearch && isOverDanger;
    if (statusFilter === 'warning') return matchesSearch && isNearDanger;
    if (statusFilter === 'normal') return matchesSearch && !isOverDanger && !isNearDanger;
    return matchesSearch;
  });

  return (
    <div className="w-full max-w-[1440px] mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8 animate-in fade-in duration-200 min-w-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800 transition-colors min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider text-[#006398] dark:text-sky-400 uppercase truncate">
            <Radio className="w-4 h-4 text-sky-600 dark:text-sky-400 flex-shrink-0" />
            <span className="truncate">CENTRAL WATER COMMISSION (CWC) • LIVE HYDRO-NET ASSAM</span>
          </div>
          <h1 className="font-heading font-extrabold text-xl sm:text-2xl sm:text-3xl text-[#0b1c30] dark:text-slate-100 tracking-tight mt-1">
            Regional Telemetry & Gauge Network
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-normal mt-1 max-w-3xl">
            Real-time stage and discharge telemetry across 114 hydrometric stations in the Brahmaputra and Barak river basins.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-end">
          <button
            onClick={() => alert('Exporting CWC hydro-metric tabular records as CSV')}
            className="flex items-center gap-1.5 px-3 py-2 min-h-[40px] sm:min-h-0 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm transition-colors min-w-0">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter by station or river..."
            className="w-full pl-9 pr-3 py-2 min-h-[40px] rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs w-full sm:w-auto overflow-x-auto max-w-full touch-pan-x scrollbar-none pb-1 sm:pb-0">
          <span className="text-slate-500 dark:text-slate-400 font-medium mr-1 flex-shrink-0">Status:</span>
          {(['all', 'danger', 'warning', 'normal'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 min-h-[36px] rounded text-xs font-semibold capitalize transition-colors whitespace-nowrap flex-shrink-0 ${
                statusFilter === filter
                  ? 'bg-slate-900 dark:bg-sky-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Telemetry Table */}
      <div className="mt-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-800 overflow-hidden shadow-sm transition-colors min-w-0">
        <div className="overflow-x-auto max-w-full touch-pan-x scrollbar-none">
          <table className="w-full text-left text-xs font-medium border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Station Name</th>
                <th className="py-3 px-4">River Trunk</th>
                <th className="py-3 px-4">Current Stage (m)</th>
                <th className="py-3 px-4">Danger Level (m)</th>
                <th className="py-3 px-4">Delta</th>
                <th className="py-3 px-4">Discharge (m³/s)</th>
                <th className="py-3 px-4">Trend (3h)</th>
                <th className="py-3 px-4">Hazard State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStations.map((stn) => {
                const delta = Number((stn.currentStage - stn.dangerLevel).toFixed(2));
                const isOverDanger = delta >= 0;
                const isWarning = !isOverDanger && delta >= -1.0;

                return (
                  <tr key={stn.id} className="hover:bg-sky-50/40 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100 font-sans">
                      {stn.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono">{stn.river}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {stn.currentStage.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400">
                      {stn.dangerLevel.toFixed(2)}
                    </td>
                    <td
                      className={`py-3.5 px-4 font-mono font-bold ${
                        isOverDanger
                          ? 'text-red-600 dark:text-red-400'
                          : isWarning
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {delta >= 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {(stn.discharge ?? 0).toLocaleString()} m³/s
                    </td>
                    <td className="py-3.5 px-4">
                      {stn.trend === 'rising' && (
                        <span className="inline-flex items-center gap-1 text-red-700 dark:text-red-400 font-semibold font-mono">
                          <ArrowUpRight className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                          <span>Rising</span>
                        </span>
                      )}
                      {stn.trend === 'falling' && (
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold font-mono">
                          <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Falling</span>
                        </span>
                      )}
                      {stn.trend === 'steady' && (
                        <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 font-semibold font-mono">
                          <Minus className="w-3.5 h-3.5 text-slate-400" />
                          <span>Steady</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {isOverDanger ? (
                        <span className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900 font-bold font-mono text-[10px] uppercase">
                          CRITICAL INUNDATION
                        </span>
                      ) : isWarning ? (
                        <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900 font-bold font-mono text-[10px] uppercase">
                          WARNING WATCH
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 font-bold font-mono text-[10px] uppercase">
                          NORMAL FLOW
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
