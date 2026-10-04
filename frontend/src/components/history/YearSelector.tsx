import React from 'react';
import { FloodEvent } from '../../types';
import { deriveSeverity, SEVERITY_METADATA } from '../../services/historicalDataService';

interface YearSelectorProps {
  years: number[];
  selectedYear: number;
  onSelectYear: (year: number) => void;
  eventsByYear: Record<number, FloodEvent>;
}

export const YearSelector: React.FC<YearSelectorProps> = ({
  years,
  selectedYear,
  onSelectYear,
  eventsByYear,
}) => {
  return (
    <div
      role="region"
      aria-label="Historical Year Selection"
      className="bg-white dark:bg-slate-900 p-2 sm:p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-1.5 overflow-x-auto touch-pan-x scrollbar-none max-w-full min-w-0"
    >
      <div className="flex items-center gap-1 sm:gap-1.5 flex-nowrap min-w-max w-full">
        {years.map((year) => {
          const isSelected = selectedYear === year;
          const event = eventsByYear[year];
          const severity = event ? deriveSeverity(event) : 'Moderate';
          const meta = SEVERITY_METADATA[severity];

          return (
            <button
              key={year}
              type="button"
              onClick={() => onSelectYear(year)}
              aria-pressed={isSelected}
              aria-label={`Year ${year}, ${meta.label}${isSelected ? ' (Selected)' : ''}`}
              id={`year-tab-${year}`}
              className={`flex-1 min-w-[80px] sm:min-w-[96px] py-2 px-2.5 sm:px-3 rounded-xl font-mono text-xs font-bold transition-all duration-150 flex flex-col items-center justify-center gap-1 cursor-pointer select-none focus:outline-hidden focus-visible:ring-2 focus-visible:ring-sky-500 ${
                isSelected
                  ? 'bg-[#0b1c30] dark:bg-sky-600 text-white shadow-md shadow-sky-950/20 ring-1 ring-slate-900/10 dark:ring-sky-400/30'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white border border-slate-200/60 dark:border-slate-700/60'
              }`}
            >
              <span className="text-sm font-extrabold tracking-tight">{year}</span>
              <div className="flex items-center gap-1 max-w-full">
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    isSelected ? 'bg-sky-400 dark:bg-white' : meta.dot
                  }`}
                  aria-hidden="true"
                />
                <span
                  className={`text-[9px] font-mono tracking-normal truncate ${
                    isSelected ? 'text-slate-200 dark:text-sky-100 font-semibold' : 'text-slate-400 dark:text-slate-500 font-medium'
                  }`}
                >
                  {severity === 'Low impact' ? 'Low Impact' : severity}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
