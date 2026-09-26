import React from 'react';
import { FloodEvent } from '../../services/floodArchiveService';
import { AlertCircle, FileText, Info } from 'lucide-react';

interface EventSummaryProps {
  event: FloodEvent;
}

export const EventSummary: React.FC<EventSummaryProps> = ({ event }) => {
  const getFactualSummary = (e: FloodEvent): string => {
    switch (e.year) {
      case 2022:
        return 'In 2022, government disaster records and NRSC satellite data recorded catastrophic flood pulses impacting 57.5 lakh people across all 35 districts in Assam. 10,106 villages and 1.08 lakh hectares of cropland were inundated, causing 179 human lives lost, 2,700 cattle deaths, and an estimated ₹10,000 crore in economic damage.';
      case 2024:
        return 'According to the Government of Assam 2024 Flood Memorandum, cumulative flood waves affected 42.96 lakh people across all 35 districts. Approximately 7,794 villages and 0.50 lakh hectares of agricultural crops were damaged, resulting in 121 confirmed human fatalities.';
      case 2025:
        return 'Government of Assam Economic Survey records (citing the ASDMA Flood Memorandum 2025) report 11.19 lakh people affected across 28 districts and 3,255 villages, with 36 confirmed human lives lost. Crop area damage and total monetary damage are not available in the current verified dataset.';
      case 2020:
        return 'The 2020 monsoon season saw severe flooding compounded by pandemic restrictions, impacting 57.89 lakh people across 30 districts and 5,475 villages. Government records document 150 human lives lost, 702 cattle lost, 1.88 lakh hectares of crop area affected, and ₹2,642.99 crore in damages.';
      case 2019:
        return 'The NRSC/ASDMA historical atlas documents 73.05 lakh people affected across Assam during the 2019 monsoon surges, with 2.15 lakh hectares of crop area affected, 101 human lives lost, and estimated damages of ₹3,237.75 crore.';
      case 2018:
        return 'NRSC/ASDMA atlas records indicate 13.22 lakh people affected across Assam during the 2018 flood season, with 0.31 lakh hectares of crop area submerged, 53 human lives lost, 556 cattle lost, and ₹2,491.59 crore in total damages.';
      case 2023:
        return 'During the 2023 monsoon, 13.47 lakh people were affected across Assam, with 0.21 lakh hectares of crop area damaged, 18 human lives lost, 103 cattle lost, and total damages estimated at ₹117.68 crore.';
      case 2021:
        return 'In 2021, the NRSC/ASDMA historical atlas records 5.74 lakh people affected, 0.65 lakh hectares of crop area submerged, 3 human lives lost, and 13 cattle lost.';
      default: {
        const parts: string[] = [];
        if (e.population_affected_lakh) parts.push(`${e.population_affected_lakh} lakh people affected`);
        if (e.districts_affected) parts.push(`across ${e.districts_affected} districts`);
        if (e.villages_affected) parts.push(`impacting ${e.villages_affected} villages`);
        if (e.human_lives_lost) parts.push(`with ${e.human_lives_lost} human lives lost`);
        return `Government records report ${parts.join(', ')}.`;
      }
    }
  };

  return (
    <section
      aria-labelledby="what-happened-title"
      className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition-colors"
    >
      <div className="flex items-center gap-2">
        <FileText className="w-5 h-5 text-sky-600 dark:text-sky-400" aria-hidden="true" />
        <h2 id="what-happened-title" className="font-heading font-extrabold text-base sm:text-lg text-[#0b1c30] dark:text-slate-100">
          What happened in {event.year}?
        </h2>
      </div>

      <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        {getFactualSummary(event)}
      </p>

      {/* 2021 Discrepancy Note */}
      {event.year === 2021 && (
        <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50/90 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" aria-hidden="true" />
          <div className="leading-relaxed">
            <strong>2021 Reporting Note:</strong> 2021 figures vary between government reporting editions. The value shown here follows the NRSC/ASDMA historical atlas dataset used by this archive.
          </div>
        </div>
      )}

      {/* 2025 Missing Data Note */}
      {event.year === 2025 && (
        <div className="p-3.5 rounded-xl border border-sky-200 dark:border-sky-800/80 bg-sky-50/80 dark:bg-sky-950/30 text-sky-900 dark:text-sky-200 text-xs flex items-start gap-2.5">
          <Info className="w-4 h-4 shrink-0 text-sky-600 dark:text-sky-400 mt-0.5" aria-hidden="true" />
          <div className="leading-relaxed">
            <strong>2025 Coverage Note:</strong> Crop area affected and total monetary damage are not available in current verified dataset. Missing values are intentionally preserved rather than inferred.
          </div>
        </div>
      )}

      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono gap-4">
        <span className="shrink-0">Verified Primary Source:</span>
        <span className="text-right font-semibold text-slate-700 dark:text-slate-200 break-words">
          {event.source}
        </span>
      </div>
    </section>
  );
};
