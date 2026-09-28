import React from 'react';
import { MapPin } from 'lucide-react';

interface SelectDistrictPromptProps {
  onGoToSearch: () => void;
}

export const SelectDistrictPrompt: React.FC<SelectDistrictPromptProps> = ({ onGoToSearch }) => {
  return (
    <div className="max-w-[1536px] mx-auto px-3 sm:px-6 lg:px-8 py-16 w-full min-w-0 flex flex-col items-center text-center gap-3">
      <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
        <MapPin className="w-6 h-6" />
      </div>
      <h2 className="font-heading font-extrabold text-lg sm:text-xl text-[#0b1c30] dark:text-white">
        Select a district to continue
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
        Choose a district on the overview page to see its flood risk map, predictions, and impact data.
      </p>
      <button
        onClick={onGoToSearch}
        className="mt-1 flex min-h-11 items-center gap-2 px-5 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-[0.98] text-white font-semibold text-sm transition-colors"
      >
        <span>Go to District Search</span>
      </button>
    </div>
  );
};
