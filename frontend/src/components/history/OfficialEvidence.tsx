import React, { useState } from 'react';
import { ProofSource } from '../../types';
import { ExternalLink, FileCheck2, Building2, Info } from 'lucide-react';

interface OfficialEvidenceProps {
  selectedYear: number;
  sources: ProofSource[];
  allSources: ProofSource[];
}

export const OfficialEvidence: React.FC<OfficialEvidenceProps> = ({
  selectedYear,
  sources,
  allSources,
}) => {
  // Derive abbreviated source organization
  const getOrganization = (url: string) => {
    if (url.includes('asdma.assam.gov.in')) return 'ASDMA';
    if (url.includes('bhuvan')) return 'ISRO / Bhuvan';
    if (url.includes('ndem.nrsc.gov.in')) return 'NRSC / NDEM';
    if (url.includes('nrsc.gov.in')) return 'NRSC / ISRO';
    return 'Govt. of Assam / CWC';
  };

  // Determine relevance label
  const getRelevance = (resource: string) => {
    if (resource.includes(selectedYear.toString())) return `Direct ${selectedYear}`;
    if (selectedYear >= 2018 && selectedYear <= 2023 && resource.includes('2018-2023'))
      return `Baseline (incl. ${selectedYear})`;
    if (resource.includes('inundation-mapping') && (selectedYear === 2021 || selectedYear === 2022))
      return `NRT Archive`;
    return 'Geospatial Ref.';
  };

  const displaySources = sources.length > 0 ? sources : allSources.slice(0, 3);

  return (
    <section
      aria-labelledby="official-evidence-heading"
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs transition-colors space-y-4"
    >
      {/* Header — subtitle moved inline, paragraph removed */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <FileCheck2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2
            id="official-evidence-heading"
            className="text-lg sm:text-xl font-extrabold text-[#0b1c30] dark:text-white font-heading"
          >
            Official Evidence ({selectedYear})
          </h2>
        </div>
        <span className="hidden sm:inline text-[11px] font-mono text-slate-400 dark:text-slate-500">
          Govt. memoranda & NRSC reports
        </span>
      </div>

      {/* Grid of Evidence Cards — condensed layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {displaySources.map((source, idx) => {
          const org = getOrganization(source.url);
          const relevance = getRelevance(source.resource);
          const isDirect = source.resource.includes(selectedYear.toString());

          return (
            <EvidenceCard
              key={`${source.resource}-${idx}`}
              source={source}
              org={org}
              relevance={relevance}
              isDirect={isDirect}
            />
          );
        })}
      </div>
    </section>
  );
};

/* ─── Condensed Evidence Card ──────────────────────────────────────────── */

interface EvidenceCardProps {
  source: ProofSource;
  org: string;
  relevance: string;
  isDirect: boolean;
}

const EvidenceCard: React.FC<EvidenceCardProps> = ({ source, org, relevance, isDirect }) => {
  const [showProof, setShowProof] = useState(false);

  return (
    <div
      className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all duration-150 ${
        isDirect
          ? 'bg-sky-50/60 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800/80 shadow-xs'
          : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/70'
      }`}
    >
      <div className="space-y-1.5">
        {/* Org badge + relevance tag — single row */}
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400">
            <Building2 className="w-3 h-3 flex-shrink-0" />
            {org}
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider flex-shrink-0 ${
              isDirect
                ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/80 dark:text-sky-300'
                : 'bg-slate-200/80 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
            }`}
          >
            {relevance}
          </span>
        </div>

        {/* Resource Title */}
        <h3 className="font-heading font-extrabold text-sm text-[#0b1c30] dark:text-white capitalize leading-snug">
          {source.resource}
        </h3>

        {/* Key Insights toggle */}
        <button
          type="button"
          onClick={() => setShowProof(!showProof)}
          className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 dark:text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer"
          aria-expanded={showProof}
          aria-label={showProof ? "Hide key insights" : "Show key insights"}
        >
          <Info className="w-3 h-3" />
          <span>{showProof ? 'Hide insights' : 'Key insights'}</span>
        </button>
        {showProof && (
          <p className="text-[11px] font-mono text-slate-600 dark:text-slate-300 leading-normal pl-4 border-l-2 border-slate-200 dark:border-slate-700">
            {source.what_it_proves}
          </p>
        )}
      </div>

      {/* Compact footer: hostname + action */}
      <div className="pt-2.5 mt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate max-w-[140px]">
          {new URL(source.url).hostname}
        </span>
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0b1c30] dark:bg-sky-600 hover:bg-sky-700 dark:hover:bg-sky-500 text-white text-[11px] font-mono font-semibold transition-colors shadow-xs"
          aria-label={`View source: ${source.resource}`}
        >
          View
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
