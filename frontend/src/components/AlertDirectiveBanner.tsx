import React from 'react';
import { BellRing, PhoneCall, MapPin, AlertOctagon } from 'lucide-react';
import { SectorData } from '../types';

interface AlertDirectiveBannerProps {
  sector: SectorData;
  onCallSeoc: () => void;
  onOpenShelterMap: () => void;
}

export const AlertDirectiveBanner: React.FC<AlertDirectiveBannerProps> = ({
  sector,
  onCallSeoc,
  onOpenShelterMap,
}) => {
  const isCriticalOrHigh = sector.hazardLevel === 'CRITICAL' || sector.hazardLevel === 'HIGH';

  return (
    <section className="max-w-[1536px] mx-auto px-3 sm:px-6 lg:px-8 mt-6 w-full min-w-0">
      <div
        className={`rounded-2xl border p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm transition-all min-w-0 ${
          isCriticalOrHigh
            ? 'bg-[#ffdad6]/40 dark:bg-red-950/40 border-[#fecaca] dark:border-red-900/60'
            : 'bg-amber-50/60 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60'
        }`}
      >
        {/* Left Icon & Message */}
        <div className="flex items-start gap-3.5 min-w-0">
          <div
            className={`w-11 h-11 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 text-white shadow-sm ${
              isCriticalOrHigh ? 'bg-[#ba1a1a]' : 'bg-amber-600'
            }`}
          >
            <BellRing className="w-5 h-5 animate-pulse" />
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-extrabold uppercase tracking-widest ${
                  isCriticalOrHigh ? 'text-red-700 dark:text-red-300' : 'text-amber-800 dark:text-amber-300'
                }`}
              >
                ASDMA DIRECTIVE LEVEL {sector.hazardLevel === 'CRITICAL' ? '3' : '2'} ACTIVATED
              </span>
            </div>

            <h2
              className={`font-heading font-extrabold text-lg sm:text-xl tracking-tight leading-snug break-words ${
                isCriticalOrHigh ? 'text-red-900 dark:text-red-200' : 'text-amber-950 dark:text-amber-200'
              }`}
            >
              {isCriticalOrHigh ? (
                <span>STAY ALERT • YOUR AREA HAS HIGH FLOOD RISK</span>
              ) : (
                <span>WATCH ADVISORY • RIVER CHANNEL MONITORING ACTIVE</span>
              )}
            </h2>

            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-normal leading-relaxed max-w-3xl break-words">
              {sector.asdmaDirective}
            </p>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 flex-shrink-0 self-stretch sm:self-auto w-full sm:w-auto">
          <button
            onClick={onCallSeoc}
            id="directive-call-seoc-btn"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded bg-[#ba1a1a] hover:bg-[#991b1b] active:bg-[#7f1d1d] text-white text-xs sm:text-sm font-semibold tracking-wide shadow-sm transition-colors whitespace-nowrap touch-manipulation"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Call SEOC 1070</span>
          </button>

          <button
            onClick={onOpenShelterMap}
            id="directive-shelter-map-btn"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-semibold tracking-wide transition-colors shadow-2xs whitespace-nowrap touch-manipulation"
          >
            <MapPin className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            <span>Shelter Map</span>
          </button>
        </div>
      </div>
    </section>
  );
};
