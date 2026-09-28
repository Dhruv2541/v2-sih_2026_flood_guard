import React, { useState } from 'react';
import { X, MapPin, Phone, Users, Shield, HeartPulse, Droplets, CheckCircle, Navigation } from 'lucide-react';
import { RELIEF_CAMPS } from '../data/assamData';
import { SectorData } from '../types';

interface ShelterModalProps {
  isOpen: boolean;
  onClose: () => void;
  sector: SectorData;
}

export const ShelterModal: React.FC<ShelterModalProps> = ({
  isOpen,
  onClose,
  sector,
}) => {
  const [filterMedicalOnly, setFilterMedicalOnly] = useState(false);

  if (!isOpen) return null;

  const filteredCamps = filterMedicalOnly
    ? RELIEF_CAMPS.filter((c) => c.hasMedicalPost)
    : RELIEF_CAMPS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-[calc(100vw-16px)] sm:max-w-3xl bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded bg-[#ba1a1a] text-white flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-heading font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-100 leading-tight truncate">
                Designated Flood Relief Camps & Shelters
              </h3>
              <div className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate">
                Safe Elevated High-Bunds in {sector.district}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 sm:w-8 sm:h-8 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors flex-shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-4 sm:px-6 py-2.5 sm:py-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs bg-white dark:bg-slate-900/70">
          <span className="font-semibold text-slate-600 dark:text-slate-300">
            Showing {filteredCamps.length} active emergency relief facilities
          </span>
          <label className="flex items-center gap-2 cursor-pointer select-none py-1">
            <input
              type="checkbox"
              checked={filterMedicalOnly}
              onChange={(e) => setFilterMedicalOnly(e.target.checked)}
              className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600"
            />
            <span className="text-slate-700 dark:text-slate-300 font-medium">With Medical Post Only</span>
          </label>
        </div>

        {/* Camps List */}
        <div className="p-3.5 sm:p-6 overflow-y-auto space-y-3 sm:space-y-4 min-w-0">
          {filteredCamps.map((camp) => {
            const occupancyPct = Math.round((camp.currentOccupancy / camp.capacity) * 100);

            return (
              <div
                key={camp.id}
                className="p-3.5 sm:p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors bg-white dark:bg-slate-800/80 space-y-3 min-w-0"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 min-w-0">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                        {camp.name}
                      </h4>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-mono font-bold text-[10px]">
                        {camp.distanceKm} KM AWAY
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-1.5 font-mono">
                      <span>{camp.location}</span>
                      <span>•</span>
                      <span>Elev: {camp.elevatedMsl}m MSL (Safe from breach)</span>
                    </p>
                  </div>

                  {/* Occupancy Indicator */}
                  <div className="text-left sm:text-right sm:flex-shrink-0">
                    <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                      {camp.currentOccupancy} / {camp.capacity} Occupied
                    </div>
                    <div className="w-full sm:w-28 bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-1 overflow-hidden sm:ml-auto">
                      <div
                        className={`h-full ${occupancyPct > 80 ? 'bg-red-500' : 'bg-emerald-500'}`}
                        style={{ width: `${occupancyPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Amenities Badges */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px]">
                  {camp.hasCleanWater && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 font-medium">
                      <Droplets className="w-3 h-3 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                      <span>72h Potable Water</span>
                    </span>
                  )}
                  {camp.hasMedicalPost && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 dark:bg-red-950/80 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800 font-medium">
                      <HeartPulse className="w-3 h-3 text-red-600 dark:text-red-400 flex-shrink-0" />
                      <span>Paramedic Post (108)</span>
                    </span>
                  )}
                  {camp.hasCattleShelter && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-medium">
                      <Shield className="w-3 h-3 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                      <span>High-Bund Livestock Pen</span>
                    </span>
                  )}
                </div>

                {/* Contact & Navigation Row */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex flex-wrap items-center justify-between text-xs text-slate-600 dark:text-slate-400 gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Officer In-charge:</span>
                    <span>{camp.contactOfficer}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${camp.phone}`}
                      className="inline-flex items-center gap-1 font-mono font-bold text-slate-900 dark:text-slate-100 hover:text-sky-700 dark:hover:text-sky-400 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 min-h-[36px] rounded"
                    >
                      <Phone className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                      <span>{camp.phone}</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-xs">
          <span className="text-slate-500 dark:text-slate-400 text-center sm:text-left">
            Coordinated by DDMA Dhemaji Disaster Management Control
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2.5 sm:py-2 rounded bg-slate-900 dark:bg-sky-600 text-white font-semibold hover:bg-slate-800 dark:hover:bg-sky-500 transition min-h-[44px] sm:min-h-0 flex items-center justify-center"
          >
            Close Shelter Directory
          </button>
        </div>
      </div>
    </div>
  );
};
