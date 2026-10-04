import React from 'react';
import { SatelliteEvidenceItem } from '../../types';
import { Satellite, Calendar, Radio, ExternalLink, AlertCircle, Eye } from 'lucide-react';

interface SatelliteEvidenceProps {
  selectedYear: number;
  evidenceItems: SatelliteEvidenceItem[];
  allEvidenceItems: SatelliteEvidenceItem[];
}

export const SatelliteEvidence: React.FC<SatelliteEvidenceProps> = ({
  selectedYear,
  evidenceItems,
  allEvidenceItems,
}) => {
  // If specific item for this year exists, display it; otherwise display general repository link
  const currentItems =
    evidenceItems.length > 0
      ? evidenceItems
      : allEvidenceItems.filter((item) => item.year === 2024 || item.year === 2022);

  const hasDirectObservation = evidenceItems.length > 0;

  return (
    <section
      aria-labelledby="satellite-evidence-heading"
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs transition-colors space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          {/* Satellite map visual thumbnail */}
          <div className="hidden sm:flex w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-sky-100 to-sky-200 dark:from-sky-900/60 dark:to-slate-800 border border-sky-200 dark:border-sky-800 items-center justify-center" aria-hidden="true">
            <svg className="w-7 h-7 text-sky-600 dark:text-sky-400 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Satellite className="w-5 h-5 text-sky-600 dark:text-sky-400 sm:hidden" />
              <h2
                id="satellite-evidence-heading"
                className="text-lg sm:text-xl font-extrabold text-[#0b1c30] dark:text-white font-heading"
              >
                Satellite Evidence ({selectedYear})
              </h2>
            </div>
          </div>
        </div>
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
          NRSC / ISRO Disaster Management Support
        </span>
      </div>

      {/* Mandatory Scientific Disclaimer Banner */}
      <div
        role="note"
        className="flex items-start gap-2.5 p-3 rounded-xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/60 text-xs text-sky-900 dark:text-sky-200"
      >
        <AlertCircle className="w-4 h-4 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="font-semibold">Observation Notice:</strong> Satellite flood inundation maps depict
          the surface water extent mapped during specific orbital satellite overpasses (e.g. RADARSAT-2, Sentinel-1 SAR).
          They represent <em className="italic">mapped observations for that acquisition</em> and must not be confused with
          the total seasonal flooded territory or agricultural crop area.
        </p>
      </div>

      {/* Satellite Item Cards */}
      <div className="space-y-4">
        {currentItems.map((item, idx) => (
          <div
            key={`${item.resource}-${idx}`}
            className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3 transition-colors"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-sky-100 text-sky-800 dark:bg-sky-900/80 dark:text-sky-300">
                    Satellite Observation
                  </span>
                  <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {item.organization}
                  </span>
                </div>
                <h3 className="font-heading font-extrabold text-base text-[#0b1c30] dark:text-white mt-1">
                  {item.what_it_proves}
                </h3>
              </div>

              {/* View Official Map Button */}
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0b1c30] dark:bg-sky-600 hover:bg-sky-700 dark:hover:bg-sky-500 text-white font-mono text-xs font-bold transition-colors shadow-xs self-start md:self-auto flex-shrink-0"
                aria-label={`View official satellite map for ${item.resource}`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Official Map</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>
            </div>

            {/* Satellite Metadata Badges */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              {item.acquisition_date && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Acquisition: {item.acquisition_date}</span>
                </div>
              )}

              {item.sensor && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                  <Radio className="w-3.5 h-3.5 text-sky-500" />
                  <span>Sensor: {item.sensor}</span>
                </div>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-sans leading-relaxed">
              {item.description}
            </p>
          </div>
        ))}
      </div>

      {!hasDirectObservation && (
        <p className="text-xs font-mono text-slate-500 dark:text-slate-400 italic">
          Note: Showing multi-year NDEM/ASDMA radar archives applicable to the {selectedYear} seasonal baseline.
        </p>
      )}
    </section>
  );
};
