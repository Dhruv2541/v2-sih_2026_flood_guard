/**
 * FloodGuard Accessible ErrorState Component
 *
 * Renders high-contrast, informative failure notices for request errors
 * or system computation exceptions.
 *
 * Requirements:
 * - Clear message: "Unable to load flood data."
 * - Accessible: aria-live="assertive", role="alert"
 * - Do not display fake values when an API fails.
 * - Keyboard-accessible RetryButton.
 * - Appropriate icons (AlertTriangle).
 * - Clear diagnostics so errors are not hidden in console logs only.
 */

import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Copy, Check, Phone, Terminal } from 'lucide-react';
import { ErrorStateProps } from './types';
import { RetryButton } from './RetryButton';

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to load flood data.',
  message = 'An unexpected error occurred while communicating with the telemetry service. Please verify your connection and try again.',
  error,
  onRetry,
  isRetrying = false,
  retryLabel = 'Try Again',
  compact = false,
  showDiagnostics = true,
  showEmergencyFallback = true,
  className = '',
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
      `FloodGuard Diagnostic Report`,
      `Timestamp: ${new Date().toISOString()}`,
      `Error Title: ${title}`,
      `User Message: ${message}`,
      `Technical Details:`,
      errorString || 'No technical error stack provided.',
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
        className={`flex items-center justify-between gap-3 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs w-full ${className}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
          <div className="min-w-0 truncate">
            <span className="font-bold text-red-900 dark:text-red-200">{title} </span>
            <span className="text-red-700 dark:text-red-300">{message}</span>
          </div>
        </div>
        {onRetry && (
          <RetryButton
            onRetry={onRetry}
            isRetrying={isRetrying}
            label={retryLabel}
            variant="danger"
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
      className={`bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/60 rounded-2xl p-5 sm:p-7 shadow-sm transition-colors text-left w-full ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-start gap-4">
        {/* Warning Icon Badge */}
        <div
          className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950/80 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0 shadow-xs"
          aria-hidden="true"
        >
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Status Flag */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="inline-block w-2 h-2 rounded-full bg-red-600 dark:bg-red-500 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
              TELEMETRY ERROR
            </span>
          </div>

          {/* Heading */}
          <h3 className="font-heading font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-100 leading-snug">
            {title}
          </h3>

          {/* User-facing Meaningful Description */}
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed max-w-2xl">
            {message}
          </p>

          {/* Action Row: Keyboard Accessible Retry and Emergency Contacts */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {onRetry && (
              <RetryButton
                onRetry={onRetry}
                isRetrying={isRetrying}
                label={retryLabel}
                variant="primary"
                size="md"
              />
            )}

            {showEmergencyFallback && (
              <a
                href="tel:1070"
                className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
              >
                <Phone className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                <span>Call SEOC (1070)</span>
              </a>
            )}

            {/* Toggle Technical Diagnostics Accordion */}
            {showDiagnostics && errorString && (
              <button
                type="button"
                onClick={() => setIsDiagnosticsOpen(!isDiagnosticsOpen)}
                aria-expanded={isDiagnosticsOpen}
                className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Technical Diagnostics</span>
                {isDiagnosticsOpen ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>

          {/* Expandable Technical Diagnostics Accordion */}
          {showDiagnostics && isDiagnosticsOpen && errorString && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-150">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase">
                  ERROR LOG DETAILS
                </span>
                <button
                  type="button"
                  onClick={handleCopyDiagnostics}
                  className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-sky-700 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  {hasCopied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Log</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto leading-relaxed max-h-44 border border-slate-800 selection:bg-sky-600">
                {errorString}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
