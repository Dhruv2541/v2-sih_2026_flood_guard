import React, { useEffect, useRef, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Layers3, Radio, MapPin, X, ArrowRight, Database } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { BackendRegionPrediction } from '../types';
import {
  DataState,
  LoadingState,
  EmptyState,
  ErrorState,
  BackendUnavailable,
} from './data-state';
import {
  DEFAULT_MOCK_MAP_PREDICTIONS,
  getMapRiskPresentation,
  normalizeBackendPrediction,
} from '../lib/mapRegionAdapter';

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined;

/** Center on Assam state */
const ASSAM_CENTER: [number, number] = [92.94, 26.20];

/** Zoom level showing full Assam + river corridors */
const DEFAULT_ZOOM = 7.2;

/** Restrict panning to Assam and neighbouring river basins */
const ASSAM_BOUNDS: [[number, number], [number, number]] = [
  [89.69, 24.13], // Southwest
  [96.02, 28.02], // Northeast
];

/** Safe timestamp formatter */
function formatPredictionTime(timestamp?: string): string {
  if (!timestamp) return 'Time not specified';
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return timestamp;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) + ' IST';
  } catch {
    return timestamp;
  }
}

/**
 * Builds HTML for Mapbox popup consuming backend prediction object fields:
 * - region_name
 * - risk_level (authoritative from backend, NO frontend calculation)
 * - flood_probability
 * - rainfall_24h
 * - timestamp
 */
function buildPopupContent(pred: BackendRegionPrediction): string {
  const presentation = getMapRiskPresentation(pred.risk_level);
  const rainfallHtml = pred.rainfall_24h !== undefined
    ? `<div style="display: flex; align-items: center; justify-content: space-between;">
         <span style="font-size: 11px; color: #94a3b8; font-weight: 500;">24h Rainfall</span>
         <span style="font-family: ui-monospace, monospace; font-size: 12px; font-weight: 700; color: #38bdf8;">
           ${pred.rainfall_24h} mm
         </span>
       </div>`
    : '';

  const timestampHtml = pred.timestamp
    ? `<div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: #64748b; padding-top: 3px; border-top: 1px solid rgba(148, 163, 184, 0.12);">
         <span>${pred.is_mock ? 'Mock timestamp' : 'Calculated'}</span>
         <span style="font-family: ui-monospace, monospace;">${formatPredictionTime(pred.timestamp)}</span>
       </div>`
    : '';

  const mockBadge = pred.is_mock
    ? `<span style="font-size: 9px; font-weight: 700; color: #94a3b8; background: rgba(148, 163, 184, 0.12); padding: 1px 5px; border-radius: 4px; text-transform: uppercase;">
         Sample Data
       </span>`
    : '';

  return `
    <div class="fg-map-card" style="min-width: 220px; padding: 13px 15px; cursor: pointer;" title="Click to view details for ${pred.region_name}">
      <!-- Top Eyebrow: Authoritative Backend Risk Level -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 7px; gap: 8px;">
        <span style="
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 8px;
          border-radius: 9999px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: ${presentation.badgeText};
          background: ${presentation.badgeBg};
          border: 1px solid ${presentation.badgeBorder};
        ">
          <span style="width: 6px; height: 6px; border-radius: 50%; background: ${presentation.dotColor}; box-shadow: 0 0 6px ${presentation.dotColor};"></span>
          ${pred.risk_level} RISK
        </span>
        ${mockBadge}
      </div>

      <!-- Region Name -->
      <div style="margin-bottom: 9px;">
        <strong style="font-size: 15px; font-weight: 800; color: #f8fafc; letter-spacing: -0.01em; line-height: 1.25; display: block;">
          ${pred.region_name}
        </strong>
      </div>

      <!-- Structured Prediction Telemetry Metrics -->
      <div style="
        display: flex;
        flex-direction: column;
        gap: 7px;
        background: rgba(15, 23, 42, 0.55);
        border: 1px solid rgba(148, 163, 184, 0.14);
        border-radius: 10px;
        padding: 9px 11px;
      ">
        <!-- Flood Probability -->
        <div>
          <div style="display: flex; align-items: baseline; justify-content: space-between;">
            <span style="font-size: 11px; color: #94a3b8; font-weight: 500;">Flood probability</span>
            <span style="font-family: ui-monospace, monospace; font-size: 13.5px; font-weight: 800; color: ${presentation.color};">
              ${pred.flood_probability}%
            </span>
          </div>
          <div style="width: 100%; height: 3px; background: rgba(148, 163, 184, 0.18); border-radius: 9999px; margin-top: 4px; overflow: hidden;">
            <div style="width: ${Math.min(pred.flood_probability, 100)}%; height: 100%; background: ${presentation.color}; border-radius: 9999px;"></div>
          </div>
        </div>

        ${rainfallHtml}
        ${timestampHtml}
      </div>
    </div>
  `;
}

/**
 * Builds HTML DOM element for Mapbox marker with pulse ring for high/critical risks.
 */
function buildMarkerElement(
  pred: BackendRegionPrediction,
  isSelected: boolean,
  isDark: boolean
): HTMLDivElement {
  const presentation = getMapRiskPresentation(pred.risk_level);

  const container = document.createElement('div');
  container.className = 'assam-hotspot-marker';
  container.style.cssText = `
    position: relative;
    width: ${presentation.hasPulse ? '46px' : '38px'};
    height: ${presentation.hasPulse ? '46px' : '38px'};
    cursor: pointer;
    transition: transform 0.2s ease;
    z-index: ${isSelected ? '25' : presentation.hasPulse ? '15' : '10'};
  `;
  container.dataset.regionId = pred.region_id || pred.region_name.toLowerCase();

  // Subtle pulse ring for high / critical severity
  if (presentation.hasPulse) {
    const ring = document.createElement('div');
    ring.className = 'pulse-ring';
    ring.style.cssText = `
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 2px solid ${presentation.color};
      opacity: 0.7;
      animation: assam-pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    `;
    container.appendChild(ring);
  }

  // Selected region highlight ring
  if (isSelected) {
    const selectedHalo = document.createElement('div');
    selectedHalo.style.cssText = `
      position: absolute;
      inset: -4px;
      border-radius: 50%;
      border: 2.5px solid #0284c7;
      box-shadow: 0 0 12px rgba(2, 132, 199, 0.6);
      pointer-events: none;
    `;
    container.appendChild(selectedHalo);
  }

  // Core marker dot
  const dot = document.createElement('div');
  dot.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: ${isSelected ? '18px' : presentation.hasPulse ? '16px' : '13px'};
    height: ${isSelected ? '18px' : presentation.hasPulse ? '16px' : '13px'};
    border-radius: 50%;
    background: ${presentation.color};
    border: 2.5px solid ${isDark ? '#0f172a' : '#ffffff'};
    box-shadow: 0 2px 8px ${presentation.color}40, 0 0 0 3px ${presentation.color}25;
    z-index: 2;
    transition: transform 0.2s ease, width 0.2s ease, height 0.2s ease;
  `;
  container.appendChild(dot);

  container.addEventListener('mouseenter', () => {
    container.style.transform = 'scale(1.18)';
  });
  container.addEventListener('mouseleave', () => {
    container.style.transform = isSelected ? 'scale(1.1)' : 'scale(1)';
  });

  return container;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component Props
// ─────────────────────────────────────────────────────────────────────────────

export interface AssamOverviewMapProps {
  /** Authoritative prediction records from backend (Phase 5 preparation) */
  predictions?: BackendRegionPrediction[] | Record<string, unknown>[];
  /** Current data state: LOADING | SUCCESS | EMPTY | ERROR | BACKEND_UNAVAILABLE */
  dataState?: DataState;
  /** Error message displayed when in ERROR or BACKEND_UNAVAILABLE state */
  errorMessage?: string;
  /** Retry callback */
  onRetry?: () => void | Promise<void>;
  /** Callback triggered when a region is selected */
  onSelectRegion?: (prediction: BackendRegionPrediction) => void;
  /** Backward compatibility with onSelectHotspot */
  onSelectHotspot?: (hotspotId: string) => void;
  /** Current selected region id or name */
  selectedRegionId?: string;
  /** Backward compatibility with selectedHotspotId */
  selectedHotspotId?: string;
  /** Map container height */
  height?: string;
  /** Show/hide zoom and compass controls */
  showControls?: boolean;
  /** Explicit flag indicating whether data is development mock */
  isDevelopmentMock?: boolean;
}

export const AssamOverviewMap: React.FC<AssamOverviewMapProps> = ({
  predictions,
  dataState = 'SUCCESS',
  errorMessage,
  onRetry,
  onSelectRegion,
  onSelectHotspot,
  selectedRegionId,
  selectedHotspotId,
  height = 'clamp(400px, 55vh, 560px)',
  showControls = true,
  isDevelopmentMock,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const popupsRef = useRef<Map<string, mapboxgl.Popup>>(new Map());
  const { resolvedTheme } = useTheme();
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Active selection: prioritize selectedRegionId, fall back to selectedHotspotId
  const activeSelectedId = selectedRegionId || selectedHotspotId;
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(
    activeSelectedId || null
  );

  useEffect(() => {
    if (activeSelectedId !== undefined) {
      setInternalSelectedId(activeSelectedId || null);
    }
  }, [activeSelectedId]);

  // Normalize incoming backend prediction objects
  const normalizedPredictions: BackendRegionPrediction[] = useMemo(() => {
    if (predictions && Array.isArray(predictions) && predictions.length > 0) {
      return predictions.map((p) =>
        normalizeBackendPrediction(p as Record<string, unknown>)
      );
    }
    // Fallback to development mock dataset when no backend predictions are supplied
    return DEFAULT_MOCK_MAP_PREDICTIONS;
  }, [predictions]);

  // Determine if using development mock data
  const isMockData =
    isDevelopmentMock !== undefined
      ? isDevelopmentMock
      : normalizedPredictions.some((p) => p.is_mock);

  // High-risk count strictly derived from backend-provided risk_level strings
  const highRiskCount = useMemo(() => {
    return normalizedPredictions.filter((p) => {
      const norm = String(p.risk_level || '').toUpperCase();
      return norm === 'HIGH' || norm === 'CRITICAL' || norm === 'SEVERE';
    }).length;
  }, [normalizedPredictions]);

  // Selected region prediction object
  const selectedPrediction = useMemo(() => {
    if (!internalSelectedId) return null;
    const lower = internalSelectedId.toLowerCase().trim();
    return (
      normalizedPredictions.find(
        (p) =>
          p.region_id?.toLowerCase() === lower ||
          p.region_name.toLowerCase().includes(lower) ||
          lower.includes(p.region_name.toLowerCase())
      ) || null
    );
  }, [normalizedPredictions, internalSelectedId]);

  const selectedPresentation = selectedPrediction
    ? getMapRiskPresentation(selectedPrediction.risk_level)
    : null;

  const appliedThemeRef = useRef(resolvedTheme);

  // Initialize Mapbox map once
  useEffect(() => {
    if (!MAPBOX_TOKEN || !mapContainerRef.current || mapRef.current) return;

    const mapContainer = mapContainerRef.current;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainer,
      style:
        resolvedTheme === 'dark'
          ? 'mapbox://styles/mapbox/dark-v11'
          : 'mapbox://styles/mapbox/light-v11',
      center: ASSAM_CENTER,
      zoom: DEFAULT_ZOOM,
      maxBounds: ASSAM_BOUNDS,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
      minZoom: 6,
      maxZoom: 10,
    });

    mapRef.current = map;
    appliedThemeRef.current = resolvedTheme;

    const resizeMap = () => map.resize();
    const resizeObserver = new ResizeObserver(resizeMap);
    resizeObserver.observe(mapContainer);

    if (showControls) {
      map.addControl(
        new mapboxgl.NavigationControl({
          showCompass: true,
          visualizePitch: false,
        }),
        'top-right'
      );
      map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');
    }

    map.on('load', () => {
      requestAnimationFrame(resizeMap);
      setIsMapLoaded(true);
    });

    return () => {
      resizeObserver.disconnect();
      markersRef.current.forEach((marker) => marker.remove());
      popupsRef.current.forEach((popup) => popup.remove());
      markersRef.current.clear();
      popupsRef.current.clear();
      map.remove();
      mapRef.current = null;
      setIsMapLoaded(false);
    };
  }, [showControls]);

  // Preserve map instance across theme changes without recreating Mapbox WebGL context
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;
    if (appliedThemeRef.current === resolvedTheme) return;
    appliedThemeRef.current = resolvedTheme;
    const style =
      resolvedTheme === 'dark'
        ? 'mapbox://styles/mapbox/dark-v11'
        : 'mapbox://styles/mapbox/light-v11';
    map.setStyle(style);
  }, [resolvedTheme, isMapLoaded]);

  const onSelectRegionRef = useRef(onSelectRegion);
  onSelectRegionRef.current = onSelectRegion;
  const onSelectHotspotRef = useRef(onSelectHotspot);
  onSelectHotspotRef.current = onSelectHotspot;

  // Sync markers with predictions and selection
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    // Clear previous markers & popups
    markersRef.current.forEach((m) => m.remove());
    popupsRef.current.forEach((p) => p.remove());
    markersRef.current.clear();
    popupsRef.current.clear();

    normalizedPredictions.forEach((pred) => {
      const coords = pred.coordinates || ASSAM_CENTER;
      const idKey = pred.region_id || pred.region_name.toLowerCase();
      const isSelected = selectedPrediction?.region_id === pred.region_id;

      const markerEl = buildMarkerElement(pred, isSelected, resolvedTheme === 'dark');

      const marker = new mapboxgl.Marker({
        element: markerEl,
        anchor: 'center',
      })
        .setLngLat(coords)
        .addTo(map);

      markersRef.current.set(idKey, marker);

      const popup = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: false,
        offset: 24,
        className: 'fg-map-popup',
        maxWidth: '280px',
      })
        .setLngLat(coords)
        .setHTML(buildPopupContent(pred));

      popupsRef.current.set(idKey, popup);

      // Marker hover preview
      markerEl.addEventListener('mouseenter', () => {
        popup.addTo(map);
      });
      markerEl.addEventListener('mouseleave', () => {
        if (internalSelectedId?.toLowerCase() !== idKey.toLowerCase()) {
          popup.remove();
        }
      });

      // Marker click: select region
      markerEl.addEventListener('click', (e) => {
        e.stopPropagation();

        // Close other popups
        popupsRef.current.forEach((p, k) => {
          if (k !== idKey) p.remove();
        });

        popup.addTo(map);
        setInternalSelectedId(idKey);

        map.easeTo({
          center: coords,
          zoom: Math.max(map.getZoom(), 8.5),
          duration: 750,
          essential: true,
        });

        onSelectRegionRef.current?.(pred);
        onSelectHotspotRef.current?.(idKey);
      });
    });
  }, [
    normalizedPredictions,
    isMapLoaded,
    resolvedTheme,
    selectedPrediction,
    internalSelectedId,
  ]);

  const prevFocusedIdRef = useRef<string | null>(null);

  // Highlight and focus selected region when changed externally
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || !selectedPrediction) return;

    const idKey = selectedPrediction.region_id || selectedPrediction.region_name.toLowerCase();
    if (prevFocusedIdRef.current === idKey) return;
    prevFocusedIdRef.current = idKey;

    const popup = popupsRef.current.get(idKey);
    const coords = selectedPrediction.coordinates || ASSAM_CENTER;

    if (popup) {
      popup.addTo(mapRef.current);
    }

    mapRef.current.easeTo({
      center: coords,
      zoom: 8.5,
      duration: 850,
      essential: true,
    });
  }, [selectedPrediction, isMapLoaded]);

  // ─────────────────────────────────────────────────────────────────────────
  // Data States Handlers
  // ─────────────────────────────────────────────────────────────────────────

  // 1. Missing Mapbox Token Fallback
  if (!MAPBOX_TOKEN) {
    return (
      <div
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-8 text-center"
        style={{ height }}
      >
        <div className="max-w-md space-y-4">
          <Layers3 className="mx-auto w-10 h-10 text-sky-500" />
          <div>
            <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
              Mapbox Token Required
            </h3>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 mb-3">
              To view the Assam flood risk map, configure{' '}
              <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-sky-600 dark:text-sky-400 text-xs font-mono">
                VITE_MAPBOX_ACCESS_TOKEN
              </code>{' '}
              in your environment.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. ERROR State
  if (dataState === 'ERROR') {
    return (
      <div
        className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 flex items-center justify-center p-6 text-center"
        style={{ height }}
      >
        <ErrorState
          title="Unable to load flood data."
          message={errorMessage || 'Could not retrieve regional prediction maps from the service.'}
          onRetry={onRetry}
          compact
        />
      </div>
    );
  }

  // 3. BACKEND UNAVAILABLE State
  if (dataState === 'BACKEND_UNAVAILABLE') {
    return (
      <div
        className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 flex items-center justify-center p-6 text-center"
        style={{ height }}
      >
        <BackendUnavailable
          title="FloodGuard backend is currently unavailable."
          message="Cannot reach prediction engine. Real-time telemetry maps are temporarily paused."
          onRetry={onRetry}
          compact
        />
      </div>
    );
  }

  // 4. EMPTY State (no records found)
  if (dataState === 'EMPTY' || (dataState === 'SUCCESS' && normalizedPredictions.length === 0)) {
    return (
      <div
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6 text-center"
        style={{ height }}
      >
        <EmptyState
          title="No prediction data available."
          description="No regional flood risk predictions have been generated for monitored sectors."
          compact
        />
      </div>
    );
  }

  // 5. OPERATIONAL MAP (with LoadingState overlay if dataState === 'LOADING')
  return (
    <div
      className="assam-overview-map relative isolate w-full min-h-[400px] overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-sm"
      style={{ height, contain: 'layout paint' }}
      aria-label="Assam flood risk overview map"
      aria-busy={dataState === 'LOADING' || !isMapLoaded}
    >
      {/* Mapbox Canvas Container */}
      <div ref={mapContainerRef} className="absolute inset-0 h-full w-full" />

      {/* Top Left Status Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 pointer-events-none max-w-[calc(100%-80px)]">
        {/* Source & Authenticity Indicator (Never claiming mock values are live) */}
        <div className="flex items-center gap-2 rounded-xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200/80 dark:border-slate-700/60 px-2.5 sm:px-3 py-1.5 sm:py-2 shadow-sm pointer-events-auto">
          {isMockData ? (
            <>
              <Database className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <span className="text-[11px] sm:text-xs font-bold tracking-wide text-slate-700 dark:text-slate-300 truncate">
                SAMPLE PREDICTIONS · OFFLINE
              </span>
            </>
          ) : (
            <>
              <Radio className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 animate-pulse flex-shrink-0" />
              <span className="text-[11px] sm:text-xs font-bold tracking-wide text-slate-900 dark:text-slate-100 truncate">
                ASSAM · LIVE TELEMETRY
              </span>
            </>
          )}
        </div>

        {/* Monitored High-Risk Count */}
        <div className="flex items-center gap-2 rounded-xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200/80 dark:border-slate-700/60 px-2.5 sm:px-3 py-1.5 sm:py-2 shadow-sm pointer-events-auto">
          <MapPin className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
          <span className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
            {highRiskCount} High-Risk Monitored
          </span>
        </div>
      </div>

      {/* Floating Selected Region Details Panel (Top/Right corner overlay) */}
      {selectedPrediction && selectedPresentation && (
        <div className="absolute top-3 right-3 sm:right-14 z-20 max-w-[270px] sm:max-w-xs w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider"
                style={{
                  color: selectedPresentation.badgeText,
                  backgroundColor: selectedPresentation.badgeBg,
                  border: `1px solid ${selectedPresentation.badgeBorder}`,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: selectedPresentation.dotColor }}
                />
                {selectedPrediction.risk_level} RISK
              </span>
              <h4 className="font-heading font-extrabold text-base text-slate-900 dark:text-slate-100 mt-1">
                {selectedPrediction.region_name}
              </h4>
            </div>
            <button
              onClick={() => setInternalSelectedId(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors"
              aria-label="Close selected region panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Flood Probability</span>
              <span
                className="font-mono font-bold"
                style={{ color: selectedPresentation.color }}
              >
                {selectedPrediction.flood_probability}%
              </span>
            </div>

            {selectedPrediction.rainfall_24h !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 font-medium">24h Rainfall</span>
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                  {selectedPrediction.rainfall_24h} mm
                </span>
              </div>
            )}

            {selectedPrediction.timestamp && (
              <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                <span>{selectedPrediction.is_mock ? 'Mock time' : 'Calculated'}</span>
                <span className="font-mono truncate max-w-[120px]">
                  {formatPredictionTime(selectedPrediction.timestamp)}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              onSelectRegion?.(selectedPrediction);
              onSelectHotspot?.(
                selectedPrediction.region_id || selectedPrediction.region_name.toLowerCase()
              );
            }}
            className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-sky-700 hover:bg-sky-600 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <span>Focus {selectedPrediction.region_name}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Symbology Legend (bottom-left) */}
      <div className="absolute bottom-3 left-3 z-10 rounded-xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200/80 dark:border-slate-700/60 px-3 sm:px-4 py-2 sm:py-3 shadow-md max-w-[calc(100%-80px)]">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 sm:mb-2 font-mono">
          Backend Risk Tiers
        </div>
        <div className="flex flex-col gap-1 sm:gap-1.5 text-[11px] sm:text-xs">
          {[
            { level: 'CRITICAL / SEVERE', color: '#dc2626', label: 'Critical' },
            { level: 'HIGH', color: '#ea580c', label: 'High' },
            { level: 'MODERATE', color: '#f59e0b', label: 'Moderate' },
            { level: 'LOW', color: '#10b981', label: 'Low' },
          ].map(({ level, color, label }) => (
            <div key={level} className="flex items-center gap-1.5 sm:gap-2">
              <span
                className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-white dark:border-slate-900 shadow-sm flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Loading State Overlay (if dataState === 'LOADING' or map tiles are buffering) */}
      {(dataState === 'LOADING' || !isMapLoaded) && (
        <div
          role="status"
          aria-live="polite"
          className="absolute inset-0 flex items-center justify-center bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-xs z-30"
        >
          <LoadingState
            message="Loading flood intelligence map..."
            subtitle="Synchronizing regional geospatial telemetry"
            variant="spinner"
          />
        </div>
      )}
    </div>
  );
};
