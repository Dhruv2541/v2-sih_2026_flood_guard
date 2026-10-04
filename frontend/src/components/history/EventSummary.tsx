import React, { useState } from 'react';
import { FloodEvent } from '../../types';
import {
  getFactualEventNarrative,
  getDiscrepancyNote,
  deriveSeverity,
  SEVERITY_METADATA,
} from '../../services/historicalDataService';
import { FileText, AlertCircle, ChevronDown } from 'lucide-react';

interface EventSummaryProps {
  event: FloodEvent;
}

export const EventSummary: React.FC<EventSummaryProps> = ({ event }) => {
  const narrative = getFactualEventNarrative(event);
  const discrepancyNote = getDiscrepancyNote(event.year);
  const severity = deriveSeverity(event);
  const meta = SEVERITY_METADATA[severity];

  const [isNarrativeOpen, setIsNarrativeOpen] = useState(false);
  const [isDiscrepancyOpen, setIsDiscrepancyOpen] = useState(false);

  // Truncate narrative for collapsed preview
  const PREVIEW_LEN = 130;
  const needsTruncation = narrative.length > PREVIEW_LEN;
  const preview = needsTruncation
    ? narrative.slice(0, PREVIEW_LEN).replace(/\s+\S*$/, '') + '\u2026'
    : narrative;

  return (
    <section
      aria-labelledby="summary-heading"
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs transition-colors space-y-3 overflow-hidden min-w-0"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          <h2
            id="summary-heading"
            className="text-lg sm:text-xl font-extrabold text-[#0b1c30] dark:text-white font-heading"
          >
            What happened? ({event.year})
          </h2>
        </div>
      </div>

      {/* Condensed Narrative — expandable accordion */}
      <div>
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200 font-sans">
          {isNarrativeOpen || !needsTruncation ? narrative : preview}
        </p>
        {needsTruncation && (
          <button
            type="button"
            onClick={() => setIsNarrativeOpen(!isNarrativeOpen)}
            className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors cursor-pointer"
          >
            <span>{isNarrativeOpen ? 'Show less' : 'Read full synopsis'}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isNarrativeOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        )}
      </div>

      {/* Inline Key-Value Badge Row */}
      <div className="flex flex-wrap items-center gap-2 pt-1 min-w-0">
        {/* Classification Badge */}
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-bold ${meta.chip}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
          {meta.label}
        </span>

        {/* Districts Badge */}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
          {event.districts_affected
            ? `${event.districts_affected} Districts`
            : 'Multi-District'}
        </span>
      </div>

      {/* Source Citation — cleanly bounded to card width with ellipsis truncation */}
      <div
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-[11px] font-mono text-slate-500 dark:text-slate-400 w-full max-w-full min-w-0"
        title={event.source}
      >
        <span className="font-bold text-slate-400 dark:text-slate-500 flex-shrink-0">Src:</span>
        <span className="truncate min-w-0 flex-1">{event.source}</span>
      </div>

      {/* Data Source Notes — collapsed by default */}
      {discrepancyNote && (
        <button
          type="button"
          onClick={() => setIsDiscrepancyOpen(!isDiscrepancyOpen)}
          aria-expanded={isDiscrepancyOpen}
          aria-label="Toggle Data Source Notes"
          className="w-full text-left cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 rounded-xl"
        >
          <div
            role="note"
            className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 text-xs text-amber-900 dark:text-amber-200"
          >
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold font-mono text-[11px] tracking-wider text-amber-800 dark:text-amber-300">
                  Data Source Notes
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-amber-500 flex-shrink-0 transition-transform duration-200 ${
                    isDiscrepancyOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>
              {isDiscrepancyOpen && (
                <p className="mt-1.5 leading-relaxed font-sans">{discrepancyNote}</p>
              )}
            </div>
          </div>
        </button>
      )}
    </section>
  );
};
