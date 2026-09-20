import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CircleHelp, Flag, Gauge } from 'lucide-react';
import { SectorData } from '../types';
import { DataInaccuracyModal } from './DataInaccuracyModal';

interface SectorInspectorProps {
  sector: SectorData;
  onOpenDiagnostic: () => void;
  onViewWeights: () => void;
  onFocusImpact?: () => void;
  onReportInaccuracy?: () => void;
}

export const SectorInspector: React.FC<SectorInspectorProps> = ({
  sector,
  onOpenDiagnostic,
  onViewWeights,
  onReportInaccuracy,
}) => {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const isUrgent = sector.hazardLevel === 'CRITICAL' || sector.hazardLevel === 'HIGH';
  const accent = isUrgent ? 'text-red-400' : sector.hazardLevel === 'MODERATE' ? 'text-amber-400' : 'text-emerald-400';
  const indicator = isUrgent ? 'bg-red-500' : sector.hazardLevel === 'MODERATE' ? 'bg-amber-400' : 'bg-emerald-400';
  const factors = sector.factors || [];

  return (
    <aside className="bg-white dark:bg-[#0E1B2F] rounded-2xl border border-slate-200 dark:border-slate-800/90 p-5 sm:p-6 flex flex-col h-full w-full min-w-0 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold tracking-[0.13em] text-slate-500 dark:text-[#8FA0B8] uppercase">Area summary</span>
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300"><span className={`h-2 w-2 rounded-full ${indicator} ${isUrgent ? 'animate-pulse' : ''}`} /> Live</span>
      </div>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-heading font-bold text-2xl text-[#0b1c30] dark:text-[#F4F7FB] tracking-tight">{sector.district}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-[#8FA0B8]">{sector.riverName} · {sector.stationCode}</p>
        </div>
        <div className="text-right">
          <span className="block text-xs font-medium text-slate-500 dark:text-[#8FA0B8]">Risk score</span>
          <span className={`font-heading text-4xl font-bold tracking-tight ${accent}`}>{sector.vulnerabilityIndex}<span className="text-base text-slate-400 dark:text-slate-500">/100</span></span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-800 border-y border-slate-200 dark:border-slate-800 py-4">
        <div className="pr-3"><span className="block text-[11px] uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">Confidence</span><strong className="mt-1 block text-sm text-slate-900 dark:text-[#F4F7FB]">{sector.confidence}%</strong></div>
        <div className="px-3"><span className="block text-[11px] uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">Inundation</span><strong className="mt-1 block text-sm text-slate-900 dark:text-[#F4F7FB]">{sector.inundationAreaKm2} km²</strong></div>
        <div className="pl-3"><span className="block text-[11px] uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">Peak depth</span><strong className="mt-1 block text-sm text-slate-900 dark:text-[#F4F7FB]">{sector.waterDepthPeakM}m</strong></div>
      </div>

      <button type="button" onClick={() => setShowWhy(!showWhy)} aria-expanded={showWhy} className="mt-4 min-h-11 w-full flex items-center justify-between rounded-xl px-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
        <span className="flex items-center gap-2"><CircleHelp className="w-[18px] h-[18px] text-sky-500" />Why is this area at risk?</span>
        <ChevronDown className={`w-[18px] h-[18px] transition-transform ${showWhy ? 'rotate-180' : ''}`} />
      </button>

      {showWhy && (
        <div className="mt-2 space-y-3 border-t border-slate-200 dark:border-slate-800 pt-4 fg-details-enter">
          {factors.slice(0, 3).map((factor) => (
            <div key={factor.id}>
              <div className="flex justify-between gap-3 text-xs"><span className="font-medium text-slate-700 dark:text-slate-200 truncate">{factor.name}</span><span className="font-semibold text-slate-500 dark:text-[#8FA0B8]">{factor.contributionPercent}%</span></div>
              <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"><div className={`h-full rounded-full ${factor.status === 'CRITICAL' || factor.status === 'HIGH' ? 'bg-red-500' : factor.status === 'MODERATE' ? 'bg-amber-400' : 'bg-sky-500'}`} style={{ width: `${factor.contributionPercent * 2}%` }} /></div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-[#8FA0B8]">{factor.observedValue}</p>
            </div>
          ))}
          <button onClick={onViewWeights} className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500">View model details <ChevronRight className="w-4 h-4" /></button>
        </div>
      )}

      <div className="mt-auto pt-5 flex items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-[#8FA0B8]"><Gauge className="w-4 h-4 text-sky-500" /> IMD + CWC telemetry</span>
        <button onClick={onOpenDiagnostic} className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500">Details <ChevronRight className="w-4 h-4" /></button>
      </div>
      <button type="button" onClick={() => onReportInaccuracy ? onReportInaccuracy() : setIsReportModalOpen(true)} className="mt-3 inline-flex min-h-11 items-center gap-2 self-start text-xs text-slate-500 dark:text-[#8FA0B8] hover:text-amber-600 dark:hover:text-amber-300"><Flag className="w-4 h-4" /> Report data inaccuracy</button>
      <DataInaccuracyModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} sector={sector} />
    </aside>
  );
};
