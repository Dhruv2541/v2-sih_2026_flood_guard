/**
 * FloodGuard Centralized HTTP API Client
 *
 * This is the single, authoritative HTTP transport layer for all backend communication.
 * It constructs URLs, executes fetch, handles HTTP errors, parses JSON responses,
 * supports configurable request timeouts, and provides structured error messages.
 *
 * ARCHITECTURE RULES:
 * - This module must NEVER contain business logic, hazard classifications, or risk formulas.
 * - Components must NOT construct backend URLs or call fetch() directly.
 * - Backend risk_level is the single source of truth.
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Base URL for the FastAPI backend, sourced from the VITE_API_BASE_URL
 * environment variable. Falls back to empty string so callers can detect
 * "not configured" and handle accordingly.
 */
const API_BASE_URL: string = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  ''
).trim();

/** Default request timeout in milliseconds (15 seconds). */
const DEFAULT_TIMEOUT_MS = 15_000;

// ---------------------------------------------------------------------------
// Error Types
// ---------------------------------------------------------------------------

/**
 * Structured error thrown by the API client.
 * Consumers can inspect status, statusText, and the parsed body.
 */
export class ApiError extends Error {
  /** HTTP status code (e.g. 404, 500), or 0 for network/timeout errors. */
  public readonly status: number;
  /** HTTP status text, or an error code for non-HTTP failures. */
  public readonly statusText: string;
  /** Parsed JSON response body returned by the server, if available. */
  public readonly body: unknown;

  constructor(
    message: string,
    status: number,
    statusText: string,
    body: unknown = null,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.body = body;
  }
}

// ---------------------------------------------------------------------------
// Public Helpers
// ---------------------------------------------------------------------------

/**
 * Returns true when VITE_API_BASE_URL is configured (non-empty).
 * Used by callers to gracefully handle unconfigured development environments.
 */
export function isApiConfigured(): boolean {
  return API_BASE_URL !== '';
}

/**
 * Returns the resolved base URL for logging and diagnostic purposes.
 */
export function getBaseUrl(): string {
  return API_BASE_URL;
}

// ---------------------------------------------------------------------------
// Request Options & Core Transport Function
// ---------------------------------------------------------------------------

export interface RequestOptions {
  /** HTTP method. Defaults to 'GET'. */
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** JSON-serializable request body (for POST/PUT/PATCH). */
  body?: unknown;
  /** Additional custom headers to merge with default headers. */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds. Defaults to DEFAULT_TIMEOUT_MS (15s). */
  timeoutMs?: number;
  /** Query string parameters. Undefined and null values are omitted. */
  params?: Record<string, string | number | boolean | undefined | null>;
  /** Optional caller-provided AbortSignal for request cancellation on unmount or input change. */
  signal?: AbortSignal;
}

/**
 * Returns true if the given error was caused by caller request cancellation.
 */
export function isAbortError(error: unknown): boolean {
  return error instanceof ApiError && error.statusText === 'ABORTED';
}

/** In-flight concurrent GET request deduplication cache */
const inFlightGetRequests = new Map<string, Promise<unknown>>();

/**
 * Constructs a valid URL from base URL, relative path, and query parameters.
 */
function buildUrl(
  path: string,
  base: string,
  params?: Record<string, string | number | boolean | undefined | null>,
): URL {
  const trimmedBase = base.replace(/\/+$/, '');
  const trimmedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${trimmedBase}${trimmedPath}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url;
}

/**
 * Sends an HTTP request to `<API_BASE_URL><path>` and returns the parsed JSON response typed as `T`.
 *
 * @param path - URL path including leading slash, e.g. `/api/state`
 * @param opts - Request configuration options
 * @returns Parsed JSON response typed as `T`
 * @throws {ApiError} on HTTP errors (4xx / 5xx), timeouts, network errors, cancellation, or missing base URL.
 */
export async function request<T>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError(
      'API base URL is not configured. Set VITE_API_BASE_URL in your .env file.',
      0,
      'NOT_CONFIGURED',
    );
  }

  const {
    method = 'GET',
    body,
    headers: extraHeaders,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    params,
    signal: callerSignal,
  } = opts;

  // Immediate abort check
  if (callerSignal?.aborted) {
    throw new ApiError('Request was cancelled.', 0, 'ABORTED');
  }

  const url = buildUrl(path, API_BASE_URL, params);
  const cacheKey = `${method}:${url.toString()}`;

  // Deduplicate concurrent identical in-flight GET requests when caller did not specify custom signal
  if (method === 'GET' && !callerSignal && inFlightGetRequests.has(cacheKey)) {
    return inFlightGetRequests.get(cacheKey) as Promise<T>;
  }

  const executeRequest = async (): Promise<T> => {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...extraHeaders,
    };

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    const controller = new AbortController();
    let isTimeout = false;
    const timer = setTimeout(() => {
      isTimeout = true;
      controller.abort();
    }, timeoutMs);

    let abortListener: (() => void) | null = null;
    if (callerSignal) {
      abortListener = () => {
        clearTimeout(timer);
        controller.abort();
      };
      callerSignal.addEventListener('abort', abortListener, { once: true });
    }

    try {
      const response = await fetch(url.toString(), {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        let errorBody: unknown = null;
        try {
          errorBody = await response.json();
        } catch {
          // Response may be plain text or HTML error page
        }

        const serverMessage =
          typeof errorBody === 'object' && errorBody !== null && 'message' in errorBody
            ? String((errorBody as { message: unknown }).message)
            : typeof errorBody === 'object' && errorBody !== null && 'detail' in errorBody
            ? String((errorBody as { detail: unknown }).detail)
            : response.statusText;

        throw new ApiError(
          `HTTP ${response.status} (${response.statusText}): ${serverMessage}`,
          response.status,
          response.statusText,
          errorBody,
        );
      }

      const data: T = await response.json();
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        if (callerSignal?.aborted) {
          throw new ApiError('Request was cancelled.', 0, 'ABORTED');
        }
        if (isTimeout) {
          throw new ApiError(
            `Request to ${method} ${path} timed out after ${timeoutMs}ms. Check backend server availability.`,
            0,
            'TIMEOUT',
          );
        }
        throw new ApiError('Request was cancelled.', 0, 'ABORTED');
      }

      throw new ApiError(
        `Network error communicating with backend at ${path}: ${error instanceof Error ? error.message : String(error)}`,
        0,
        'NETWORK_ERROR',
      );
    } finally {
      clearTimeout(timer);
      if (callerSignal && abortListener) {
        callerSignal.removeEventListener('abort', abortListener);
      }
    }
  };

  const promise = executeRequest();

  if (method === 'GET' && !callerSignal) {
    inFlightGetRequests.set(cacheKey, promise);
    promise.finally(() => {
      inFlightGetRequests.delete(cacheKey);
    });
  }

  return promise;
}
