import React from 'react';

interface YearSelectorProps {
  years: number[];
  selectedYear: number;
  onSelectYear: (year: number) => void;
}

export const YearSelector: React.FC<YearSelectorProps> = ({
  years,
  selectedYear,
  onSelectYear,
}) => {
  return (
    <div className="w-full flex items-center justify-between gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 overflow-x-auto max-w-full touch-pan-x scrollbar-none py-1 px-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80" role="tablist" aria-label="Historical Flood Archive Years">
        {years.map((year) => {
          const isSelected = selectedYear === year;
          return (
            <button
              key={year}
              type="button"
              role="tab"
              id={`year-tab-${year}`}
              aria-selected={isSelected}
              aria-controls={`year-panel-${year}`}
              onClick={() => onSelectYear(year)}
              className={`px-3.5 py-2 min-h-[38px] text-xs sm:text-sm font-bold font-mono rounded-xl transition-all duration-150 whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 focus:outline-hidden focus:ring-2 focus:ring-sky-500 ${
                isSelected
                  ? 'bg-[#0b1c30] dark:bg-sky-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{year}</span>
              {year === 2025 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md font-sans font-medium ${
                    isSelected
                      ? 'bg-amber-400/25 text-amber-200'
                      : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                  }`}
                >
                  Latest
                </span>
              )}
            </button>
          );
        })}
      </div>
      <span className="text-xs font-mono text-slate-500 dark:text-slate-400 hidden sm:inline-block">
        Showing flood records for <strong>{selectedYear}</strong>
      </span>
    </div>
  );
};
