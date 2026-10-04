/**
 * FloodGuard Accessible RetryButton Component
 *
 * Provides a high-contrast, fully keyboard-accessible action button
 * for recovering from failed data requests and reconnecting to backend services.
 *
 * Accessibility:
 * - Native <button type="button">
 * - Visible high-contrast focus rings for keyboard navigation
 * - Explicit aria-busy during in-flight retries
 * - Meaningful aria-label for screen reader users
 * - Subtle icon rotation animation only while retrying
 * - Prevents multiple accidental submissions while in-flight
 */

import React, { useState } from 'react';
import { RefreshCw, RotateCcw } from 'lucide-react';
import { RetryButtonProps } from './types';

export const RetryButton: React.FC<RetryButtonProps> = ({
  onRetry,
  isRetrying: controlledIsRetrying,
  label = 'Retry',
  retryingLabel = 'Retrying...',
  variant = 'primary',
  size = 'md',
  icon,
  ariaLabel,
  className = '',
  disabled = false,
}) => {
  const [internalIsRetrying, setInternalIsRetrying] = useState(false);
  const isRetrying = controlledIsRetrying ?? internalIsRetrying;

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isRetrying || disabled) return;

    try {
      const result = onRetry();
      if (result instanceof Promise) {
        setInternalIsRetrying(true);
        await result;
      }
    } finally {
      setInternalIsRetrying(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.stopPropagation();
    }
  };

  const variantStyles = {
    primary:
      'bg-[#0b1c30] hover:bg-sky-800 text-white dark:bg-sky-600 dark:hover:bg-sky-500 shadow-xs border border-transparent',
    secondary:
      'bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 border border-slate-300 dark:border-slate-700',
    outline:
      'bg-transparent hover:bg-slate-100 text-slate-700 dark:hover:bg-slate-800/80 dark:text-slate-200 border border-slate-300 dark:border-slate-700',
    danger:
      'bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-500 shadow-xs border border-transparent',
    ghost:
      'bg-transparent hover:bg-slate-100 text-sky-700 dark:hover:bg-slate-800 dark:text-sky-400',
  };

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 min-h-[34px] gap-1.5 rounded-md font-semibold',
    md: 'text-xs sm:text-sm px-4 py-2 min-h-[40px] gap-2 rounded-lg font-bold',
    lg: 'text-sm sm:text-base px-5 py-2.5 min-h-[46px] gap-2.5 rounded-lg font-bold',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled || isRetrying}
      aria-busy={isRetrying}
      aria-label={ariaLabel || (isRetrying ? `${retryingLabel} Please wait.` : `${label} flood data request`)}
      className={`inline-flex items-center justify-center transition-all duration-150 cursor-pointer select-none
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900
        disabled:opacity-60 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}`}
    >
      <span
        aria-hidden="true"
        className={`flex-shrink-0 transition-transform ${isRetrying ? 'animate-spin' : ''}`}
      >
        {icon ? (
          icon
        ) : variant === 'danger' ? (
          <RotateCcw className={iconSizes[size]} />
        ) : (
          <RefreshCw className={iconSizes[size]} />
        )}
      </span>
      <span>{isRetrying ? retryingLabel : label}</span>
    </button>
  );
};
