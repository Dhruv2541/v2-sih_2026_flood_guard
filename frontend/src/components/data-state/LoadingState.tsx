/**
 * FloodGuard Accessible LoadingState Component
 *
 * Displays readable loading indicators and radar hydro-scanning animations
 * while flood intelligence or telemetry feeds are being retrieved.
 *
 * Requirements:
 * - Clear message: "Loading flood intelligence..."
 * - Accessible: aria-live="polite", role="status", aria-busy="true"
 * - No fake values while loading.
 * - Subtle animation only where useful (concentric radar wave pulse).
 */

import React from 'react';
import { Waves, Loader2 } from 'lucide-react';
import { LoadingStateProps } from './types';

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading flood intelligence...',
  subtitle = 'Retrieving real-time hydrometric telemetry and inundation models.',
  variant = 'radar',
  size = 'md',
  fullscreen = false,
  className = '',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`flex flex-col items-center justify-center text-center p-6 sm:p-8 transition-colors ${
        fullscreen ? 'min-h-[380px] w-full' : 'py-8 w-full'
      } ${className}`}
    >
      {/* Screen-reader announcement */}
      <span className="sr-only">
        {message} {subtitle}
      </span>

      {/* Visual Indicator - Subtle animation only where useful */}
      <div className="relative flex items-center justify-center mb-4" aria-hidden="true">
        {variant === 'radar' && (
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">
            {/* Concentric hydro-scanning rings */}
            <span className="absolute inset-0 rounded-full border border-sky-400 dark:border-sky-500 opacity-25 animate-ping" />
            <span className="absolute inset-2 rounded-full border border-sky-500 dark:border-sky-400 opacity-40 animate-pulse" />
            <div className="w-10 h-10 rounded-full bg-sky-50 dark:bg-sky-950/80 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-sky-600 dark:text-sky-400 shadow-xs">
              <Waves className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            </div>
          </div>
        )}

        {variant === 'spinner' && (
          <div className="w-10 h-10 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        )}

        {variant === 'inline' && (
          <div className="w-5 h-5 flex items-center justify-center text-sky-600 dark:text-sky-400 mr-2">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        )}
      </div>

      {/* Meaningful, Accessible Message */}
      <div className="max-w-md space-y-1">
        <h3
          className={`font-heading font-extrabold text-[#0b1c30] dark:text-slate-100 tracking-tight ${
            size === 'sm' ? 'text-xs sm:text-sm' : size === 'lg' ? 'text-lg sm:text-xl' : 'text-sm sm:text-base'
          }`}
        >
          {message}
        </h3>
        {subtitle && (
          <p
            className={`text-slate-600 dark:text-slate-400 leading-relaxed font-normal ${
              size === 'sm' ? 'text-[11px]' : 'text-xs sm:text-sm'
            }`}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Subtle Progress Bar Indicator */}
      <div
        className="w-32 sm:w-44 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-4"
        aria-hidden="true"
      >
        <div className="h-full bg-sky-500 rounded-full animate-pulse w-2/3" />
      </div>
    </div>
  );
};
