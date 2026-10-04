/**
 * FloodGuard DataStateBoundary Component
 *
 * The unified authoritative state controller for all API-driven components.
 * Consistently maps:
 *  - LOADING             -> loadingComponent || <LoadingState />
 *  - SUCCESS             -> children
 *  - EMPTY               -> emptyComponent || <EmptyState />
 *  - ERROR               -> errorComponent || <ErrorState />
 *  - BACKEND_UNAVAILABLE -> backendUnavailableComponent || <BackendUnavailable />
 *
 * Guarantees consistent error handling across the entire app without duplication.
 */

import React from 'react';
import { DataStateBoundaryProps } from './types';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { BackendUnavailable } from './BackendUnavailable';

export const DataStateBoundary: React.FC<DataStateBoundaryProps> = ({
  state,
  children,
  error,
  onRetry,
  isRetrying = false,
  loadingComponent,
  emptyComponent,
  errorComponent,
  backendUnavailableComponent,
  loadingMessage,
  emptyTitle,
  emptyDescription,
  errorTitle,
  errorMessage,
  backendUnavailableTitle,
  className = '',
}) => {
  switch (state) {
    case 'LOADING':
      return (
        <div className={`w-full ${className}`}>
          {loadingComponent || <LoadingState message={loadingMessage} />}
        </div>
      );

    case 'EMPTY':
      return (
        <div className={`w-full ${className}`}>
          {emptyComponent || (
            <EmptyState
              title={emptyTitle}
              description={emptyDescription}
              onAction={onRetry}
              actionLabel={onRetry ? 'Refresh' : undefined}
            />
          )}
        </div>
      );

    case 'BACKEND_UNAVAILABLE':
      return (
        <div className={`w-full ${className}`}>
          {backendUnavailableComponent || (
            <BackendUnavailable
              title={backendUnavailableTitle}
              error={error}
              onRetry={onRetry}
              isRetrying={isRetrying}
            />
          )}
        </div>
      );

    case 'ERROR':
      return (
        <div className={`w-full ${className}`}>
          {errorComponent || (
            <ErrorState
              title={errorTitle}
              message={errorMessage}
              error={error}
              onRetry={onRetry}
              isRetrying={isRetrying}
            />
          )}
        </div>
      );

    case 'SUCCESS':
    default:
      return <>{children}</>;
  }
};
