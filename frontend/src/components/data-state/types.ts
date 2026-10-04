/**
 * FloodGuard Data-State System Types
 *
 * Defines the standard states and component contracts for all API-driven views.
 *
 * Each API-driven component must support:
 * - LOADING: Active data ingestion/processing. Shows skeletons/spinners. No fake values while loading.
 * - SUCCESS: Data successfully retrieved and operational.
 * - EMPTY: Query executed successfully but returned 0 records / empty dataset.
 * - ERROR: Request failed due to server error, network glitch, or computation error.
 * - BACKEND_UNAVAILABLE: Backend server is unreachable, offline, or timed out.
 */

import React from 'react';

export type DataState =
  | 'LOADING'
  | 'SUCCESS'
  | 'EMPTY'
  | 'ERROR'
  | 'BACKEND_UNAVAILABLE';

export interface RetryButtonProps {
  /** Function invoked when the retry button is triggered */
  onRetry: () => void | Promise<void>;
  /** Whether a retry attempt is currently in-flight */
  isRetrying?: boolean;
  /** Button label when idle (default: "Retry") */
  label?: string;
  /** Button label while retrying (default: "Retrying...") */
  retryingLabel?: string;
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  /** Size scale */
  size?: 'sm' | 'md' | 'lg';
  /** Custom icon */
  icon?: React.ReactNode;
  /** Screen reader label */
  ariaLabel?: string;
  /** Additional CSS class names */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

export interface LoadingStateProps {
  /** Clear status message (default: "Loading flood intelligence...") */
  message?: string;
  /** Optional secondary subtitle */
  subtitle?: string;
  /** Visual presentation mode */
  variant?: 'radar' | 'spinner' | 'inline';
  /** Size scale */
  size?: 'sm' | 'md' | 'lg';
  /** Occupy full height center */
  fullscreen?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export interface SkeletonCardProps {
  /** Layout preset */
  variant?: 'metric' | 'alert' | 'table-row' | 'list' | 'detail';
  /** Number of skeleton cards to render */
  count?: number;
  /** Additional CSS classes */
  className?: string;
}

export interface SkeletonChartProps {
  /** Desired chart height (default: 300) */
  height?: number | string;
  /** Chart type to simulate */
  type?: 'area' | 'bar' | 'line';
  /** Optional title placeholder */
  title?: string;
  /** Additional CSS classes */
  className?: string;
}

export interface EmptyStateProps {
  /** Empty state headline (default: "No prediction data available.") */
  title?: string;
  /** Clear contextual explanation */
  description?: string;
  /** Custom icon */
  icon?: React.ReactNode;
  /** Primary recovery action button text */
  actionLabel?: string;
  /** Action button click handler */
  onAction?: () => void;
  /** Compact inline mode */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export interface ErrorStateProps {
  /** Error headline (default: "Unable to load flood data.") */
  title?: string;
  /** Human-readable explanation of the error */
  message?: string;
  /** Raw error or diagnostic message */
  error?: unknown;
  /** Retry callback */
  onRetry?: () => void | Promise<void>;
  /** In-flight retry state */
  isRetrying?: boolean;
  /** Custom label for retry button */
  retryLabel?: string;
  /** Compact inline view */
  compact?: boolean;
  /** Expandable technical diagnostics */
  showDiagnostics?: boolean;
  /** Show link to Assam SEOC 1070 emergency line */
  showEmergencyFallback?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export interface BackendUnavailableProps {
  /** Custom headline (default: "FloodGuard backend is currently unavailable.") */
  title?: string;
  /** Descriptive message explaining backend status */
  message?: string;
  /** Error details */
  error?: unknown;
  /** Reconnect/retry callback */
  onRetry?: () => void | Promise<void>;
  /** In-flight retry state */
  isRetrying?: boolean;
  /** Compact inline layout */
  compact?: boolean;
  /** Expandable diagnostics */
  showDiagnostics?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export interface DataStateBoundaryProps {
  /** Current active data state */
  state: DataState;
  /** Operational content rendered exclusively on SUCCESS */
  children: React.ReactNode;
  /** Optional error object for ERROR and BACKEND_UNAVAILABLE states */
  error?: unknown;
  /** Retry callback */
  onRetry?: () => void | Promise<void>;
  /** In-flight retry state */
  isRetrying?: boolean;
  /** Custom loading element */
  loadingComponent?: React.ReactNode;
  /** Custom empty state element */
  emptyComponent?: React.ReactNode;
  /** Custom error element */
  errorComponent?: React.ReactNode;
  /** Custom backend unavailable element */
  backendUnavailableComponent?: React.ReactNode;
  /** Custom message overrides */
  loadingMessage?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  errorTitle?: string;
  errorMessage?: string;
  backendUnavailableTitle?: string;
  className?: string;
}
