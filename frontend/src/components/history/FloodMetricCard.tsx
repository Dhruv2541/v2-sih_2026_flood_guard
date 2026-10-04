import React from 'react';
import {
  Users,
  Home,
  Map,
  Wheat,
  AlertTriangle,
  PawPrint,
  IndianRupee,
  Info,
} from 'lucide-react';
import { FloodEvent } from '../../types';
import { deriveSeverity, SEVERITY_METADATA } from '../../services/historicalDataService';

interface FloodMetricCardProps {
  event: FloodEvent;
}

export const FloodMetricCard: React.FC<FloodMetricCardProps> = ({ event }) => {
  const severity = deriveSeverity(event);
  const meta = SEVERITY_METADATA[severity];

  // Helper formatting functions
  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return null;
    return num.toLocaleString();
  };

  const formatLakh = (lakh?: number) => {
    if (lakh === undefined || lakh === null) return null;
    // If integer or simple decimal
    if (lakh >= 10) return `${lakh.toFixed(2)} Lakh`;
    return `${lakh.toFixed(2)} Lakh`;
  };

  // Metric definitions based exclusively on verified CSV fields
  const metrics = [
    {
      id: 'population',
      label: 'Population Affected',
      value: formatLakh(event.population_affected_lakh),
      rawNote: event.population_affected_lakh
        ? `~${Math.round(event.population_affected_lakh * 100000).toLocaleString()} citizens impacted`
        : null,
      icon: Users,
      accent: 'text-sky-700 dark:text-sky-400',
      bg: 'bg-sky-50/80 dark:bg-sky-950/40 border-sky-200/80 dark:border-sky-800/60',
      available: event.population_affected_lakh !== undefined,
    },
    {
      id: 'lives',
      label: 'Human Lives Lost',
      value: formatNumber(event.human_lives_lost),
      rawNote: 'Official casualties reported',
      icon: AlertTriangle,
      accent: 'text-red-700 dark:text-red-400',
      bg: 'bg-red-50/80 dark:bg-red-950/40 border-red-200/80 dark:border-red-800/60',
      available: event.human_lives_lost !== undefined,
    },
    {
      id: 'crop',
      label: 'Crop Area Affected',
      value: event.crop_area_affected_lakh_ha !== undefined
        ? `${event.crop_area_affected_lakh_ha.toFixed(2)} Lakh Ha`
        : null,
      rawNote: event.crop_area_affected_lakh_ha !== undefined
        ? `${Math.round(event.crop_area_affected_lakh_ha * 100000).toLocaleString()} ha agricultural land (not total inundation)`
        : 'Data unavailable in current verified dataset',
      icon: Wheat,
      accent: 'text-amber-700 dark:text-amber-400',
      bg: 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-800/60',
      available: event.crop_area_affected_lakh_ha !== undefined,
    },
    {
      id: 'damage',
      label: 'Estimated Economic Damage',
      value: event.total_damage_crore !== undefined
        ? `₹${event.total_damage_crore.toLocaleString()} Cr`
        : null,
      rawNote: event.total_damage_crore !== undefined
        ? 'Public & private infrastructure loss'
        : 'Not reported in current verified dataset',
      icon: IndianRupee,
      accent: 'text-emerald-700 dark:text-emerald-400',
      bg: 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-800/60',
      available: event.total_damage_crore !== undefined,
    },
    {
      id: 'districts',
      label: 'Districts Affected',
      value: event.districts_affected !== undefined ? `${event.districts_affected} of 35` : null,
      rawNote: 'Jurisdictional coverage',
      icon: Map,
      accent: 'text-indigo-700 dark:text-indigo-400',
      bg: 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-200/80 dark:border-indigo-800/60',
      available: event.districts_affected !== undefined,
    },
    {
      id: 'villages',
      label: 'Villages Affected',
      value: formatNumber(event.villages_affected),
      rawNote: 'Rural revenue units submerged',
      icon: Home,
      accent: 'text-blue-700 dark:text-blue-400',
      bg: 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200/80 dark:border-blue-800/60',
      available: event.villages_affected !== undefined,
    },
    {
      id: 'cattle',
      label: 'Cattle Lost',
      value: formatNumber(event.cattle_lost),
      rawNote: 'Livestock mortalities documented',
      icon: PawPrint,
      accent: 'text-orange-700 dark:text-orange-400',
      bg: 'bg-orange-50/80 dark:bg-orange-950/40 border-orange-200/80 dark:border-orange-800/60',
      available: event.cattle_lost !== undefined,
    },
  ];

  // Filter to available metrics for a clean, credible UI, but keep key indicators clear
  const availableMetrics = metrics.filter((m) => m.available);

  return (
    <section
      aria-labelledby="profile-heading"
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs transition-colors space-y-4"
    >
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 flex-wrap">
          <h2
            id="profile-heading"
            className="text-xl sm:text-2xl font-extrabold text-[#0b1c30] dark:text-white font-heading tracking-tight"
          >
            {event.year} Flood Profile
          </h2>
          <span
            className={`px-3 py-1 rounded-full border text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${meta.chip}`}
          >
            <span className={`w-2 h-2 rounded-full ${meta.dot}`} aria-hidden="true" />
            {meta.label}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
          <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span>{meta.description}</span>
        </div>
      </div>

      {/* Grid of Verified Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {availableMetrics.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all duration-150 flex flex-col justify-between ${item.bg}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono font-bold tracking-wider text-slate-600 dark:text-slate-300">
                  {item.label}
                </span>
                <Icon className={`w-4 h-4 ${item.accent}`} aria-hidden="true" />
              </div>

              <div className="my-2.5">
                <span className={`text-2xl sm:text-3xl font-extrabold font-heading ${item.accent}`}>
                  {item.value}
                </span>
              </div>

              {item.rawNote && (
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 leading-tight">
                  {item.rawNote}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Missing Data Disclosures for Transparency */}
      {metrics.some((m) => !m.available) && (
        <div className="pt-2 flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80">
          <span className="font-bold text-slate-600 dark:text-slate-300">Unreported Metrics:</span>
          <span>
            {metrics
              .filter((m) => !m.available)
              .map((m) => m.label)
              .join(', ')}{' '}
            not documented in the current verified release.
          </span>
        </div>
      )}
    </section>
  );
};
