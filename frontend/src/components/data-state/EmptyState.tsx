/**
 * FloodGuard Accessible EmptyState Component
 *
 * Renders when a query completes successfully, but yields no records
 * (e.g. zero active flood alerts, all rivers operating below danger stage, or no filter matches).
 *
 * Requirements:
 * - Clear message: "No prediction data available."
 * - Accessible: role="status", aria-live="polite"
 * - Appropriate icons (e.g. ShieldCheck, Waves)
 * - Clear recovery action buttons
 */

import React from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';
import { EmptyStateProps } from './types';

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No prediction data available.',
  description = 'There are currently no active flood records or hazard advisories matching your query.',
  icon,
  actionLabel,
  onAction,
  compact = false,
  className = '',
}) => {
  if (compact) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs w-full ${className}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="text-slate-500 dark:text-slate-400 flex-shrink-0">
            {icon || <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
          </div>
          <div className="min-w-0 truncate">
            <span className="font-bold text-slate-800 dark:text-slate-200">{title} </span>
            <span className="text-slate-600 dark:text-slate-400">{description}</span>
          </div>
        </div>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="px-2.5 py-1 text-xs font-semibold rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
          >
            {actionLabel}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 text-center flex flex-col items-center justify-center shadow-xs transition-colors w-full ${className}`}
    >
      {/* Icon Badge */}
      <div
        className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 shadow-xs"
        aria-hidden="true"
      >
        {icon || <ShieldCheck className="w-7 h-7" />}
      </div>

      {/* Title */}
      <h3 className="font-heading font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-100 tracking-tight">
        {title}
      </h3>

      {/* Description */}
      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 max-w-md leading-relaxed">
        {description}
      </p>

      {/* Action Button */}
      {actionLabel && onAction && (
        <div className="mt-5">
          <button
            type="button"
            onClick={onAction}
            className="px-4 py-2 min-h-[40px] text-xs sm:text-sm font-bold rounded-lg bg-[#0b1c30] hover:bg-sky-800 text-white dark:bg-sky-600 dark:hover:bg-sky-500 shadow-xs transition cursor-pointer"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
};
