import React from 'react';
import { Database, ShieldCheck } from 'lucide-react';

export const HistoricalHeader: React.FC = () => {
  return (
    <header className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors min-w-0">
      <div>
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="w-2 h-2 rounded-full bg-sky-600 dark:bg-sky-400" aria-hidden="true" />
          <span className="text-[11px] sm:text-xs font-mono font-bold tracking-wider text-slate-500 dark:text-slate-400">
            Assam Flood Event Archive (2018–2025)
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-3 h-3" aria-hidden="true" />
            Verified Government Data
          </span>
        </div>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0b1c30] dark:text-slate-100 tracking-tight">
          Historical Flood Events
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Explore verified historical flood events across Assam using government records and satellite-derived evidence.
        </p>
      </div>

      <div className="flex items-center gap-2 self-start md:self-auto text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700/80">
        <Database className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" aria-hidden="true" />
        <span>Source: NRSC / ASDMA / Govt. of Assam</span>
      </div>
    </header>
  );
};
