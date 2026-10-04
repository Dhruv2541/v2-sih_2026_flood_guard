import React from 'react';
import { ExternalLink, ShieldCheck } from 'lucide-react';

interface HistoricalHeaderProps {
  currentYearSource?: string;
  sourceUrl?: string;
}

function formatShortSource(source: string): string {
  if (source.includes('Economic Survey Assam 2025-26')) {
    return 'Economic Survey Assam 2025-26';
  }
  if (source.includes('Flood Memorandum on Assam Floods 2024')) {
    return 'ASDMA Flood Memorandum 2024';
  }
  if (source.includes('Flood Memorandum 2022')) {
    return 'ASDMA Flood Memorandum 2022';
  }
  if (source.includes('Flood Hazard Zonation Atlas')) {
    return 'NRSC / ASDMA Flood Atlas (1998–2023)';
  }
  if (source.includes('MHA cumulative 2020 report')) {
    return 'NRSC Atlas & MHA 2020 Report';
  }
  const segments = source.split(/[,;]/);
  return segments[0].length > 36 ? `${segments[0].slice(0, 33)}...` : segments[0];
}

export const HistoricalHeader: React.FC<HistoricalHeaderProps> = ({
  currentYearSource = 'NRSC / ASDMA Verified Records',
  sourceUrl = 'https://www.nrsc.gov.in/sites/default/files/pdf/DMSP/Flood_Hazard_Zonation_Atlas_of_Assam_using_multi_sensor_satellite_data1998_2023.pdf',
}) => {
  return (
    <header className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors min-w-0">
      <div className="space-y-1.5 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="w-2 h-2 rounded-full bg-sky-600 dark:bg-sky-400" aria-hidden="true" />
          <span className="text-xs font-mono font-bold tracking-wider text-sky-700 dark:text-sky-300 uppercase">
            Assam Flood Event Archive (2018–2025)
          </span>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
            <ShieldCheck className="w-3 h-3" />
            Verified Government Records
          </span>
        </div>

        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0b1c30] dark:text-slate-100 tracking-tight">
          Historical Flood Events
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
          Explore verified historical flood events across Assam using government records and satellite-derived evidence.
        </p>
      </div>

      {/* Data Source Badge — short visible title with full citation in tooltip & aria-label */}
      <div className="mt-2 md:mt-0 flex-shrink-0 self-start md:self-auto">
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors group"
          title={`Official Record Citation: ${currentYearSource}`}
          aria-label={`Official Record Source: ${currentYearSource}`}
        >
          <span className="font-mono text-xs uppercase font-bold text-slate-400 dark:text-slate-500">
            Source:
          </span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
            {formatShortSource(currentYearSource)}
          </span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors flex-shrink-0" />
        </a>
      </div>
    </header>
  );
};
