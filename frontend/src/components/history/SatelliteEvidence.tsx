import React from 'react';
import { SatelliteEvidenceItem } from '../../services/floodArchiveService';
import { ExternalLink, Orbit, Satellite } from 'lucide-react';

interface SatelliteEvidenceProps {
  evidence?: SatelliteEvidenceItem;
  year: number;
}

export const SatelliteEvidence: React.FC<SatelliteEvidenceProps> = ({ evidence, year }) => {
  if (!evidence) {
    return null;
  }

  return (
    <section
      aria-labelledby="satellite-evidence-title"
      className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Satellite className="w-5 h-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
          <h2 id="satellite-evidence-title" className="font-heading font-extrabold text-base sm:text-lg text-[#0b1c30] dark:text-slate-100">
            Satellite Evidence
          </h2>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
          <Orbit className="w-3.5 h-3.5" />
          {evidence.badge}
        </span>
      </div>

      <div className="p-4 sm:p-5 rounded-xl border border-indigo-100 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/40 to-slate-50/40 dark:from-indigo-950/20 dark:to-slate-900/50 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
          <div>
            <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
              {evidence.title}
            </h3>
            <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mt-0.5">
              {evidence.organization}
            </p>
          </div>
          {evidence.acquisitionDate && (
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
              Acquisition: {evidence.acquisitionDate}
            </span>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4 sm:gap-5 pt-2">
          {/* Visual Map Placeholder */}
          <div className="w-full md:w-48 aspect-[4/3] bg-indigo-500/5 dark:bg-indigo-950/30 rounded-xl flex items-center justify-center border border-indigo-200/50 dark:border-indigo-800/50 shrink-0">
            <div className="flex flex-col items-center text-indigo-300 dark:text-indigo-700/50">
              <Satellite className="w-10 h-10 mb-2 opacity-50" />
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase">Satellite Capture</span>
            </div>
          </div>
          
          <div className="flex-1 space-y-3">
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {evidence.description}
            </p>

            {evidence.sensor && (
              <div className="flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Sensor & Payload:</span>
                <span>{evidence.sensor}</span>
              </div>
            )}

            <div className="p-2.5 rounded-lg bg-indigo-100/50 dark:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-800/60 text-[11px] text-indigo-900 dark:text-indigo-200 leading-relaxed">
              <strong>Scientific Methodology Notice:</strong> This map represents an observed satellite inundation capture for a specific orbital pass, not the total cumulative flooded area for the entire {year} calendar year.
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <a
            href={evidence.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 transition shadow-sm"
          >
            <span>View Official Map / Report</span>
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
};
