import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FloodMetricCardProps {
  label: string;
  value: string | number | null | undefined;
  unit?: string;
  note?: string;
  Icon: LucideIcon;
  accentColor?: string;
  unavailableText?: string;
  hideIfUnavailable?: boolean;
}

export const FloodMetricCard: React.FC<FloodMetricCardProps> = ({
  label,
  value,
  unit,
  note,
  Icon,
  accentColor = 'text-sky-600 dark:text-sky-400',
  unavailableText = 'Not available in current verified dataset',
  hideIfUnavailable = true,
}) => {
  const isAvailable = value !== null && value !== undefined && value !== '';

  if (!isAvailable && hideIfUnavailable) {
    return null;
  }

  return (
    <div className="p-4 rounded-xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between transition-colors shadow-2xs">
      <div>
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase font-mono">
          <span>{label}</span>
          <Icon className={`w-4 h-4 ${accentColor}`} aria-hidden="true" />
        </div>

        <div className="mt-2.5">
          {isAvailable ? (
            <div className={`text-2xl sm:text-3xl font-extrabold font-heading ${accentColor} tracking-tight`}>
              {typeof value === 'number' ? value.toLocaleString() : value}
              {unit && <span className="text-sm sm:text-base font-semibold ml-1 text-slate-600 dark:text-slate-400 font-sans">{unit}</span>}
            </div>
          ) : (
            <div className="text-xs font-medium text-slate-400 dark:text-slate-500 italic mt-1 py-2">
              {unavailableText}
            </div>
          )}
        </div>
      </div>

      {note && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-mono">
          {note}
        </p>
      )}
    </div>
  );
};
