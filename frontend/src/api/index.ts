/**
 * FloodGuard API Layer
 *
 * Centralized export point for all API modules, client transport functions, and types.
 * Expected architecture:
 *   Component → API function → client.ts → FastAPI backend
 */

export * from './client';
export * from './state';
export * from './predictions';
export * from './alerts';
export * from './history';
export * from './simulation';
export * from './impact';
