import React from 'react';
import { HelpCircle, Info, Scale, ShieldAlert } from 'lucide-react';

export const DataMethodology: React.FC = () => {
  return (
    <section
      aria-labelledby="about-this-data-title"
      className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 space-y-3 transition-colors shadow-2xs"
    >
      <div className="flex items-center gap-2">
        <Info className="w-5 h-5 text-sky-600 dark:text-sky-400" aria-hidden="true" />
        <h2 id="about-this-data-title" className="font-heading font-extrabold text-base text-slate-900 dark:text-slate-100">
          About this data & Methodology
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed">
        <div className="flex gap-2 items-start">
          <Scale className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" aria-hidden="true" />
          <p>
            <strong>Official Sourcing:</strong> All historical flood metrics are sourced strictly from published records of the Assam State Disaster Management Authority (ASDMA), Central Water Commission (CWC), and the National Remote Sensing Centre (NRSC / ISRO).
          </p>
        </div>

        <div className="flex gap-2 items-start">
          <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" aria-hidden="true" />
          <p>
            <strong>Crop Area ≠ Flooded Territory:</strong> &quot;Crop area affected&quot; measures agricultural cropland damage in hectares, which is physically distinct from total surface flood inundation area.
          </p>
        </div>

        <div className="flex gap-2 items-start">
          <HelpCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" aria-hidden="true" />
          <p>
            <strong>Satellite Inundation:</strong> Mapped satellite values represent discrete observations for specific satellite overpass acquisitions and do not represent continuous season-long water spread.
          </p>
        </div>

        <div className="flex gap-2 items-start">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" aria-hidden="true" />
          <p>
            <strong>Handling Missing Data:</strong> Certain metrics (such as economic damages or village counts) are unavailable in official returns for specific years. Missing values are preserved as unavailable rather than interpolated or guessed.
          </p>
        </div>
      </div>
    </section>
  );
};
