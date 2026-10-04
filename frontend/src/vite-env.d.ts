/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL for the FloodGuard FastAPI backend */
  readonly VITE_API_BASE_URL?: string;
  /** Deprecated legacy alias for backend API URL */
  readonly VITE_API_URL?: string;
  /** Public Mapbox GL token for GIS and satellite maps */
  readonly VITE_MAPBOX_ACCESS_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
