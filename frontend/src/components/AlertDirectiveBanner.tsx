import React from 'react';
import { PhoneCall, MapPin, AlertOctagon, TriangleAlert } from 'lucide-react';
import { SectorData } from '../types';
import { getRiskLevelConfig } from '../lib/riskLevelConfig';

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
  const tier = getRiskLevelConfig(sector.hazardLevel).tier;
  const isEmergency = tier === 'CRITICAL' || tier === 'HIGH';
  const Icon = tier === 'CRITICAL' ? AlertOctagon : TriangleAlert;

  const focusRing =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 dark:focus-visible:ring-sky-400 dark:focus-visible:ring-offset-slate-950';

  return (
    <section
      className="max-w-[1536px] mx-auto px-3 sm:px-6 lg:px-8 mt-4 w-full min-w-0"
      aria-label="Official advisory"
    >
      <div
        role="alert"
        className={`rounded-2xl border p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0 transition-all ${
          isEmergency
            ? 'bg-red-50 border-red-200 dark:bg-slate-900 dark:border-slate-700/80 dark:border-l-4 dark:border-l-red-500 dark:shadow-[0_4px_24px_rgba(239,68,68,0.15)]'
            : 'bg-amber-50 border-amber-200 dark:bg-slate-900 dark:border-slate-700/80 dark:border-l-4 dark:border-l-amber-500 dark:shadow-[0_4px_24px_rgba(245,158,11,0.15)]'
        }`}
      >
        <div className="flex items-start gap-3.5 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-sm ${
              isEmergency ? 'bg-red-600 dark:bg-red-600' : 'bg-amber-600 dark:bg-amber-600'
            }`}
          >
            <Icon aria-hidden="true" className="w-5 h-5" />
          </div>

          <div className="space-y-1 min-w-0">
            <h2
              className={`font-heading font-extrabold text-base sm:text-lg leading-snug break-words ${
                isEmergency ? 'text-red-900 dark:text-red-400' : 'text-amber-950 dark:text-amber-400'
              }`}
            >
              {isEmergency
                ? `Flood warning for ${sector.district}`
                : `Flood watch for ${sector.district}`}
            </h2>

            {sector.asdmaDirective && (
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed max-w-3xl break-words">
                {sector.asdmaDirective}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 flex-shrink-0 w-full md:w-auto">
          <button
            onClick={onCallSeoc}
            id="directive-call-seoc-btn"
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 min-h-11 rounded-xl bg-red-700 hover:bg-red-600 active:bg-red-800 text-white text-sm font-semibold transition-colors whitespace-nowrap touch-manipulation ${focusRing}`}
          >
            <PhoneCall aria-hidden="true" className="w-4 h-4" />
            <span>Call SEOC 1070</span>
          </button>

          <button
            onClick={onOpenShelterMap}
            id="directive-shelter-map-btn"
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 min-h-11 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-sm font-semibold transition-colors whitespace-nowrap touch-manipulation ${focusRing}`}
          >
            <MapPin aria-hidden="true" className="w-4 h-4" />
            <span>Shelter map</span>
          </button>
        </div>
      </div>
    </section>
  );
};
