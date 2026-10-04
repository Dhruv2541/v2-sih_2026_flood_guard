import React from 'react';
import { Clock, FlaskConical } from 'lucide-react';

interface DataFreshnessProps {
  /**
   * ISO timestamp of when the backend calculated this assessment.
   * Leave undefined while the data comes from development samples; the
   * component then states plainly that the data is not live instead of
   * showing a made-up time.
   */
  calculatedAt?: string | null;
  className?: string;
}

/**
 * Answers "WHEN was this calculated?" for any risk view.
 * - Real timestamp  -> "Calculated <local time>"
 * - No timestamp    -> "Sample data · live feed not connected"
 */
export const DataFreshness: React.FC<DataFreshnessProps> = ({ calculatedAt, className = '' }) => {
  const parsed = calculatedAt ? new Date(calculatedAt) : null;
  const isValid = parsed !== null && !Number.isNaN(parsed.getTime());

  if (isValid && parsed) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 ${className}`}>
        <Clock aria-hidden="true" className="w-3.5 h-3.5 flex-shrink-0" />
        <span>
          Calculated{' '}
          <time dateTime={parsed.toISOString()} className="font-semibold">
            {parsed.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
          </time>
        </span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 ${className}`}>
      <FlaskConical aria-hidden="true" className="w-3.5 h-3.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
      <span>
        <span className="font-semibold text-amber-700 dark:text-amber-300">Sample data</span> · live feed not connected
      </span>
    </span>
  );
};
