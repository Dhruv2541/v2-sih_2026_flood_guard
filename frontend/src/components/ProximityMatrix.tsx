import React from 'react';
import { ArrowRight, Compass } from 'lucide-react';
import { ASSAM_SECTORS } from '../data/assamData';

interface ProximityMatrixProps {
  onSelectSector: (sectorId: string) => void;
  currentSectorId: string;
}

export const ProximityMatrix: React.FC<ProximityMatrixProps> = ({
  onSelectSector,
  currentSectorId,
}) => {
  const neighboringCatchments = [
    {
      id: 'majuli',
      distance: '36 km South',
      riskLabel: 'HIGH RISK',
      riskColor: 'bg-red-50 dark:bg-red-950/70 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900',
      title: 'Majuli Island',
      desc: 'Kherkatia Suti backwater pressure rising rapidly.',
      score: '78',
    },
    {
      id: 'lakhimpur',
      distance: '42 km West',
      riskLabel: 'MODERATE',
      riskColor: 'bg-sky-50 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800',
      title: 'North Lakhimpur',
      desc: 'Subansiri barrage outflow sustained within threshold.',
      score: '58',
    },
    {
      id: 'dibrugarh',
      distance: '52 km South-East',
      riskLabel: 'MODERATE',
      riskColor: 'bg-sky-50 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800',
      title: 'Dibrugarh',
      desc: 'Main Brahmaputra channel embankment fortified.',
      score: '46',
    },
    {
      id: 'tinsukia',
      distance: '88 km East',
      riskLabel: 'LOW RISK',
      riskColor: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
      title: 'Tinsukia',
      desc: 'Lohit confluence levels holding under danger mark.',
      score: '22',
    },
  ];

  return (
    <section className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 mt-12 transition-colors w-full min-w-0">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800 min-w-0">
        <div className="min-w-0">
          <span className="text-[11px] font-bold tracking-wider text-[#006398] dark:text-sky-400 uppercase font-mono">
            SPATIAL PROXIMITY ANALYTICS
          </span>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0b1c30] dark:text-slate-100 tracking-tight mt-1 break-words">
            Risk Matrix In Neighboring Catchments
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-normal mt-1 max-w-3xl leading-relaxed break-words">
            Hydrological discharge runs contiguous across the Upper Assam valley. Monitor upstream and downstream vulnerabilities.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-500 dark:text-slate-400 font-semibold self-start md:self-end bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 flex-shrink-0">
          Radial Radius: <span className="text-slate-900 dark:text-slate-200 font-bold">100 KM Corridor</span>
        </div>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 w-full min-w-0">
        {neighboringCatchments.map((catchment) => {
          const isSelected = currentSectorId === catchment.id;
          return (
            <div
              key={catchment.id}
              className={`bg-white dark:bg-slate-900 rounded-lg border p-4 sm:p-5 shadow-sm flex flex-col justify-between transition-all hover:border-slate-400 dark:hover:border-slate-700 min-w-0 ${
                isSelected
                  ? 'border-sky-600 dark:border-sky-500 ring-2 ring-sky-100 dark:ring-sky-950 bg-sky-50/20 dark:bg-sky-950/30'
                  : 'border-slate-300/80 dark:border-slate-800'
              }`}
            >
              <div className="min-w-0">
                {/* Distance & Risk Badge */}
                <div className="flex items-center justify-between gap-2 pb-2">
                  <span className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 truncate">
                    {catchment.distance}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border flex-shrink-0 ${catchment.riskColor}`}
                  >
                    {catchment.riskLabel}
                  </span>
                </div>

                {/* Catchment Name */}
                <h3 className="font-heading font-bold text-lg text-[#0b1c30] dark:text-slate-100 mt-1 truncate">
                  {catchment.title}
                </h3>

                {/* Catchment Description */}
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed min-h-[36px] break-words">
                  {catchment.desc}
                </p>
              </div>

              {/* Bottom Score & Inspect Action */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-baseline gap-0.5">
                  <span className="font-heading font-extrabold text-xl text-slate-900 dark:text-slate-100 font-mono">
                    {catchment.score}
                  </span>
                  <span className="text-xs font-medium text-slate-400 dark:text-slate-500">/100</span>
                </div>

                <button
                  onClick={() => {
                    onSelectSector(catchment.id);
                    // Smooth scroll to top map
                    window.scrollTo({ top: 380, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-[#006398] dark:text-sky-400 hover:text-[#00476e] dark:hover:text-sky-300 group transition-colors min-h-[32px] touch-manipulation"
                >
                  <span>Inspect</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
