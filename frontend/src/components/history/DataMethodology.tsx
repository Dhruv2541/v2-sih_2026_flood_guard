import React from 'react';
import { Info, ShieldCheck, Database, Layers, AlertCircle } from 'lucide-react';

export const DataMethodology: React.FC = () => {
  return (
    <section
      aria-labelledby="methodology-heading"
      className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 transition-colors space-y-4"
    >
      <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <Info className="w-5 h-5 text-sky-600 dark:text-sky-400" />
        <h2
          id="methodology-heading"
          className="text-base sm:text-lg font-extrabold text-[#0b1c30] dark:text-white font-heading"
        >
          About this data & Scientific Methodology
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-sans leading-relaxed">
        {/* Pillar 1: Official Government Provenance */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold font-mono text-slate-800 dark:text-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Authoritative Sources</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300">
            Every record in this archive is drawn from published government documentation, including the NRSC Flood
            Hazard Zonation Atlas (Table 3.2), ASDMA annual flood memoranda, and Government of Assam Economic Surveys.
          </p>
        </div>

        {/* Pillar 2: Crop Area vs Inundation */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold font-mono text-slate-800 dark:text-slate-100">
            <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Crop Area ≠ Flooded Territory</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300">
            Agricultural crop land affected represents damaged standing crops reported by district agriculture departments.
            It is an economic assessment and is strictly not equated with total geographical flood inundation territory.
          </p>
        </div>

        {/* Pillar 3: Satellite Observations */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold font-mono text-slate-800 dark:text-slate-100">
            <Database className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Single-Pass Satellite Limits</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300">
            Satellite radar maps (SAR) reflect the instantaneous water surface extent at the exact moment of sensor overpass.
            They capture specific flood peaks, not the cumulative season-long flooded area.
          </p>
        </div>

        {/* Pillar 4: Missing Values Integrity */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold font-mono text-slate-800 dark:text-slate-100">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Zero Extrapolation Policy</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300">
            Where official publications omit specific metrics (e.g. 2024 economic damage or 2025 crop area), fields are
            left unpopulated or labeled &ldquo;Data unavailable&rdquo;. Values are never estimated or synthetically imputed.
          </p>
        </div>

        {/* Pillar 5: 2021 Multi-Edition Tracking */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5 md:col-span-2 lg:col-span-2">
          <div className="flex items-center gap-1.5 font-bold font-mono text-slate-800 dark:text-slate-100">
            <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Inter-Agency Version Transparency</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300">
            Discrepancies between reporting editions (such as the 2021 variations between the NRSC Historical Atlas and
            the ASDMA Annual Activity Report) are transparently disclosed to preserve historical fidelity and scientific integrity.
          </p>
        </div>
      </div>
    </section>
  );
};
