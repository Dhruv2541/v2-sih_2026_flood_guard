import React from 'react';
import { ProofSource } from '../../services/floodArchiveService';
import { BookCheck, ExternalLink, ShieldCheck } from 'lucide-react';

interface OfficialEvidenceProps {
  sources: ProofSource[];
  year: number;
}

export const OfficialEvidence: React.FC<OfficialEvidenceProps> = ({ sources, year }) => {
  const getOrganizationFromSource = (source: ProofSource): string => {
    const text = (source.resource + ' ' + source.what_it_proves).toLowerCase();
    if (text.includes('nrsc') || text.includes('isro')) return 'National Remote Sensing Centre (NRSC / ISRO)';
    if (text.includes('asdma')) return 'Assam State Disaster Management Authority (ASDMA)';
    if (text.includes('mha')) return 'Ministry of Home Affairs, Govt. of India';
    if (text.includes('government of assam')) return 'Government of Assam';
    return 'Official Government Agency';
  };

  return (
    <section
      aria-labelledby="official-evidence-title"
      className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <BookCheck className="w-5 h-5 text-sky-600 dark:text-sky-400" aria-hidden="true" />
          <h2 id="official-evidence-title" className="font-heading font-extrabold text-base sm:text-lg text-[#0b1c30] dark:text-slate-100">
            Official Evidence & Proof Documents
          </h2>
        </div>
        <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
          Showing citations supporting {year} records
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {sources.map((src, idx) => {
          const org = getOrganizationFromSource(src);
          return (
            <div
              key={`${src.url}-${idx}`}
              className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300">
                    <ShieldCheck className="w-3 h-3" />
                    Government Record
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {year}
                  </span>
                </div>

                <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 mt-2 capitalize">
                  {src.resource}
                </h3>
                <p className="text-xs text-sky-700 dark:text-sky-400 font-medium mt-0.5">
                  {org}
                </p>

                <div className="mt-2.5 p-2.5 rounded-lg bg-white dark:bg-slate-850 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-bold text-slate-900 dark:text-slate-100 block mb-0.5">What it proves:</span>
                  {src.what_it_proves}
                </div>
              </div>

              <div className="mt-4 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-3">
                <span className="text-[11px] font-mono text-slate-400 break-all line-clamp-2">
                  {src.url.replace(/^https?:\/\//, '')}
                </span>
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 transition shadow-2xs"
                >
                  <span>View Source</span>
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
