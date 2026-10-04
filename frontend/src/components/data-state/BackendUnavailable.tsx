/**
 * FloodGuard BackendUnavailable Component
 *
 * Dedicated state view rendered when the backend service or telemetry pipeline
 * is unreachable, offline, experiencing network timeout, or in development.
 *
 * Requirements:
 * - Clear message: "FloodGuard backend is currently unavailable."
 * - Accessible: aria-live="assertive", role="alert"
 * - Life-safety emergency hotlines (SEOC 1070 / ASDMA 1079) are prominently displayed.
 * - Keyboard-accessible RetryButton to attempt reconnection.
 * - Appropriate icon (ServerCrash / WifiOff).
 * - No fake values displayed when backend is unavailable.
 */

import React, { useState } from 'react';
import { ServerCrash, Phone, Terminal, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { BackendUnavailableProps } from './types';
import { RetryButton } from './RetryButton';

export const BackendUnavailable: React.FC<BackendUnavailableProps> = ({
  title = 'FloodGuard backend is currently unavailable.',
  message = 'The backend predictive modeling service is temporarily offline, under development, or unreachable over the network. Real-time predictions and automated telemetry are paused.',
  error,
  onRetry,
  isRetrying = false,
  showDiagnostics = true,
  className = '',
  compact = false,
}) => {
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  const errorString =
    error instanceof Error ? error.stack || error.message : typeof error === 'string' ? error : error ? JSON.stringify(error) : '';

  const copyTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
        copyTimerRef.current = null;
      }
    };
  }, []);

  const handleCopyDiagnostics = () => {
    const report = [
      `FloodGuard Backend Status Report`,
      `Timestamp: ${new Date().toISOString()}`,
      `Title: ${title}`,
      `Message: ${message}`,
      `Diagnostics: ${errorString || 'Connection Refused / Service Offline'}`,
    ].join('\n');

    navigator.clipboard?.writeText(report);
    setHasCopied(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => {
      setHasCopied(false);
      copyTimerRef.current = null;
    }, 2000);
  };

  if (compact) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className={`flex items-center justify-between gap-3 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-xs w-full ${className}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <ServerCrash className="w-4 h-4 text-amber-700 dark:text-amber-400 flex-shrink-0" />
          <div className="min-w-0 truncate">
            <span className="font-bold text-amber-950 dark:text-amber-200">{title} </span>
            <span className="text-amber-800 dark:text-amber-300">{message}</span>
          </div>
        </div>
        {onRetry && (
          <RetryButton
            onRetry={onRetry}
            isRetrying={isRetrying}
            label="Reconnect"
            retryingLabel="Connecting..."
            variant="secondary"
            size="sm"
          />
        )}
      </div>
    );
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`relative overflow-hidden bg-white dark:bg-slate-900 border-2 border-amber-400/80 dark:border-amber-500/60 rounded-2xl p-5 sm:p-7 shadow-md transition-colors text-left w-full ${className}`}
    >
      {/* Top Accent Strip */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />

      <div className="flex flex-col sm:flex-row items-start gap-4">
        {/* Offline Visual Badge */}
        <div
          className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-400 flex items-center justify-center flex-shrink-0 shadow-xs"
          aria-hidden="true"
        >
          <ServerCrash className="w-6 h-6 animate-pulse" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Status Flag */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
              SERVICE OFFLINE • TELEMETRY PAUSED
            </span>
          </div>

          {/* Heading */}
          <h3 className="font-heading font-extrabold text-base sm:text-xl text-slate-900 dark:text-slate-100 leading-snug">
            {title}
          </h3>

          {/* Explanation */}
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed max-w-2xl">
            {message}
          </p>

          {/* Safety Advisory Banner */}
          <div className="mt-3.5 p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-start gap-2.5">
            <Phone className="w-4 h-4 text-amber-700 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 dark:text-amber-200">
              <span className="font-bold">Life-Safety Notice:</span> Digital predictions are temporarily paused, but official Assam State Emergency Operation Centre phone lines remain active 24/7. Call{' '}
              <a href="tel:1070" className="font-bold underline text-amber-950 dark:text-amber-100">
                1070
              </a>{' '}
              or ASDMA at{' '}
              <a href="tel:1079" className="font-bold underline text-amber-950 dark:text-amber-100">
                1079
              </a>
              .
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {onRetry && (
              <RetryButton
                onRetry={onRetry}
                isRetrying={isRetrying}
                label="Reconnect to Backend"
                retryingLabel="Connecting..."
                variant="primary"
                size="md"
              />
            )}

            <a
              href="tel:1070"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
            >
              <Phone className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              <span>Call SEOC (1070)</span>
            </a>

            {showDiagnostics && errorString && (
              <button
                type="button"
                onClick={() => setIsDiagnosticsOpen(!isDiagnosticsOpen)}
                aria-expanded={isDiagnosticsOpen}
                className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Backend Diagnostics</span>
                {isDiagnosticsOpen ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>

          {/* Expandable Backend Diagnostics */}
          {showDiagnostics && isDiagnosticsOpen && errorString && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-150">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase">
                  DIAGNOSTIC STATUS
                </span>
                <button
                  type="button"
                  onClick={handleCopyDiagnostics}
                  className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-sky-700 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  {hasCopied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Copied Report</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Report</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px] space-y-1 border border-slate-800">
                <div>Timestamp: {new Date().toISOString()}</div>
                <div>Status: OFFLINE</div>
                <div className="pt-1 text-slate-400 border-t border-slate-800 mt-2">
                  Detail: {errorString}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
