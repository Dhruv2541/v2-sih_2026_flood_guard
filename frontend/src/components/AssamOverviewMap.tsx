import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Layers3, Radio, MapPin } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

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

// ─────────────────────────────────────────────────────────────────────────────
// Hotspot Data
// ─────────────────────────────────────────────────────────────────────────────

export interface Hotspot {
  id: string;
  name: string;
  coordinates: [number, number];
  floodProb: number;           // 0-100
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'SEVERE';
  waterDepthM: number;
  riverGauge?: string;
  populationAtRisk: number;
  isPrimary?: boolean;         // Gets pulse animation
}

const ASSAM_HOTSPOTS: Hotspot[] = [
  {
    id: 'dhemaji',
    name: 'Dhemaji',
    coordinates: [94.5822, 27.4812],
    floodProb: 87.6,
    riskLevel: 'HIGH',
    waterDepthM: 2.85,
    riverGauge: 'Jiadhal River Gauge #04',
    populationAtRisk: 686000,
    isPrimary: true, // Highest risk → pulse animation
  },
  {
    id: 'majuli',
    name: 'Majuli Island',
    coordinates: [94.2238, 26.9634],
    floodProb: 81.2,
    riskLevel: 'HIGH',
    waterDepthM: 2.40,
    riverGauge: 'Kherkatia Gauge #02',
    populationAtRisk: 168000,
  },
  {
    id: 'lakhimpur',
    name: 'Lakhimpur',
    coordinates: [94.1044, 27.2346],
    floodProb: 64.8,
    riskLevel: 'MODERATE',
    waterDepthM: 1.45,
    riverGauge: 'Subansiri Gauge #01',
    populationAtRisk: 215000,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Get color for risk level - calm, credible palette */
const getRiskColor = (level: Hotspot['riskLevel']): string => {
  switch (level) {
    case 'CRITICAL':
    case 'SEVERE':
      return '#dc2626'; // red-600 - urgent but not alarming
    case 'HIGH':
      return '#ea580c'; // orange-600 - high attention
    case 'MODERATE':
      return '#f59e0b'; // amber-500 - caution
    case 'LOW':
    default:
      return '#10b981'; // emerald-500 - safe
  }
};

/** Build marker HTML with optional pulse */
const buildMarkerElement = (hotspot: Hotspot, isDark: boolean): HTMLDivElement => {
  const container = document.createElement('div');
  container.className = 'assam-hotspot-marker';
  container.style.cssText = `
    position: relative;
    width: ${hotspot.isPrimary ? '48px' : '40px'};
    height: ${hotspot.isPrimary ? '48px' : '40px'};
    cursor: pointer;
    transition: transform 0.2s ease;
  `;
  container.dataset.hotspotId = hotspot.id;

  const color = getRiskColor(hotspot.riskLevel);

  // Pulse rings for primary hotspot
  if (hotspot.isPrimary) {
    const ring1 = document.createElement('div');
    ring1.className = 'pulse-ring';
    ring1.style.cssText = `
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 2px solid ${color};
      opacity: 0.7;
      animation: assam-pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    `;
    container.appendChild(ring1);

    const ring2 = document.createElement('div');
    ring2.className = 'pulse-ring';
    ring2.style.cssText = `
      position: absolute;
      inset: 6px;
      border-radius: 50%;
      border: 1.5px solid ${color};
      opacity: 0.5;
      animation: assam-pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite 0.7s;
    `;
    container.appendChild(ring2);
  }

  // Core marker dot
  const dot = document.createElement('div');
  dot.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: ${hotspot.isPrimary ? '16px' : '14px'};
    height: ${hotspot.isPrimary ? '16px' : '14px'};
    border-radius: 50%;
    background: ${color};
    border: 2.5px solid ${isDark ? '#0f172a' : '#ffffff'};
    box-shadow: 0 2px 8px ${color}40, 0 0 0 4px ${color}20;
    z-index: 2;
  `;
  container.appendChild(dot);

  // Hover effect
  container.addEventListener('mouseenter', () => {
    container.style.transform = 'scale(1.15)';
  });
  container.addEventListener('mouseleave', () => {
    container.style.transform = 'scale(1)';
  });

  return container;
};

/** Build popup HTML */
const buildPopupContent = (hotspot: Hotspot): string => {
  const color = getRiskColor(hotspot.riskLevel);
  return `
    <div class="fg-map-card" style="min-width: 220px;">
      <span class="fg-map-eyebrow" style="color: ${color};">
        ${hotspot.riskLevel} FLOOD RISK
      </span>
      <strong style="font-size: 15px; color: #f4f7fb;">${hotspot.name}</strong>
      ${hotspot.riverGauge ? `<span style="color: #8fa0b8; font-size: 11px; margin-top: 2px; display: block;">${hotspot.riverGauge}</span>` : ''}
      
      <div class="fg-map-stat" style="margin-top: 10px;">
        <span>Flood probability</span>
        <b style="color: ${color};">${hotspot.floodProb}%</b>
      </div>
      
      <div class="fg-map-stat">
        <span>Peak water depth</span>
        <b style="color: #22b8f0;">${hotspot.waterDepthM.toFixed(2)} m</b>
      </div>
      
      <div class="fg-map-stat">
        <span>People at risk</span>
        <b style="color: #f4f7fb;">${(hotspot.populationAtRisk / 1000).toFixed(0)}K</b>
      </div>
      
      <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ffffff20;">
        <button 
          onclick="window.dispatchEvent(new CustomEvent('selectHotspot', { detail: '${hotspot.id}' }))"
          style="
            width: 100%;
            padding: 6px 12px;
            background: #0ea5e9;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
          "
          onmouseover="this.style.background='#0284c7'"
          onmouseout="this.style.background='#0ea5e9'"
        >
          View Detailed Forecast →
        </button>
      </div>
    </div>
  `;
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export interface AssamOverviewMapProps {
  /** Callback when a hotspot is selected */
  onSelectHotspot?: (hotspotId: string) => void;
  /** Current selected hotspot (highlights it) */
  selectedHotspotId?: string;
  /** Map height - responsive by default */
  height?: string;
  /** Show/hide controls */
  showControls?: boolean;
}

export const AssamOverviewMap: React.FC<AssamOverviewMapProps> = ({
  onSelectHotspot,
  selectedHotspotId,
  height = 'clamp(360px, 50vh, 520px)', // Responsive height
  showControls = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const popupsRef = useRef<Map<string, mapboxgl.Popup>>(new Map());
  const { resolvedTheme } = useTheme();
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!MAPBOX_TOKEN || !mapContainerRef.current || mapRef.current) return;

    const mapContainer = mapContainerRef.current;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainer,
      style: resolvedTheme === 'dark' 
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

    // Mapbox measures its canvas at construction time. The overview is mounted
    // inside an animated responsive section, so ensure the WebGL canvas is
    // resized whenever its card receives its final dimensions. Without this,
    // Mapbox can retain a short initial canvas and leave the lower map area blank.
    const resizeMap = () => map.resize();
    const resizeObserver = new ResizeObserver(resizeMap);
    resizeObserver.observe(mapContainer);

    // Add navigation control
    if (showControls) {
      map.addControl(
        new mapboxgl.NavigationControl({
          showCompass: true,
          visualizePitch: false,
        }),
        'top-right'
      );

      // Compact attribution
      map.addControl(
        new mapboxgl.AttributionControl({ compact: true }),
        'bottom-right'
      );
    }

    map.on('load', () => {
      requestAnimationFrame(resizeMap);
      setIsMapLoaded(true);
      
      // Add hotspot markers
      ASSAM_HOTSPOTS.forEach((hotspot) => {
        const markerEl = buildMarkerElement(hotspot, resolvedTheme === 'dark');
        
        const marker = new mapboxgl.Marker({
          element: markerEl,
          anchor: 'center',
        })
          .setLngLat(hotspot.coordinates)
          .addTo(map);

        markersRef.current.set(hotspot.id, marker);

        // Create popup
        const popup = new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: false,
          offset: 25,
          className: 'fg-map-popup',
          maxWidth: '280px',
        })
          .setLngLat(hotspot.coordinates)
          .setHTML(buildPopupContent(hotspot));

        popupsRef.current.set(hotspot.id, popup);

        // Marker hover: show popup
        markerEl.addEventListener('mouseenter', () => {
          popup.addTo(map);
        });

        markerEl.addEventListener('mouseleave', () => {
          // Only remove if not clicked/pinned
          const isPinned = markerEl.dataset.pinned === 'true';
          if (!isPinned) {
            popup.remove();
          }
        });

        // Marker click: select hotspot
        markerEl.addEventListener('click', (e) => {
          e.stopPropagation();
          
          // Close all other popups and unpin markers
          markersRef.current.forEach((m, id) => {
            const el = m.getElement();
            el.dataset.pinned = 'false';
            if (id !== hotspot.id) {
              popupsRef.current.get(id)?.remove();
            }
          });

          // Pin this popup
          markerEl.dataset.pinned = 'true';
          popup.addTo(map);

          // Smooth camera movement to hotspot
          map.easeTo({
            center: hotspot.coordinates,
            zoom: Math.max(map.getZoom(), 8.5),
            duration: 800,
            essential: true,
            easing: (t) => t * (2 - t), // easeOutQuad
          });

          onSelectHotspot?.(hotspot.id);
        });
      });
    });

    // Listen for custom event from popup button
    const handleSelectEvent = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      onSelectHotspot?.(customEvent.detail);
    };
    window.addEventListener('selectHotspot', handleSelectEvent);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('selectHotspot', handleSelectEvent);
      markersRef.current.forEach((marker) => marker.remove());
      popupsRef.current.forEach((popup) => popup.remove());
      markersRef.current.clear();
      popupsRef.current.clear();
      map.remove();
      mapRef.current = null;
      setIsMapLoaded(false);
    };
  }, [resolvedTheme]); // Only recreate on theme change

  // Handle selected hotspot highlighting
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || !selectedHotspotId) return;

    const marker = markersRef.current.get(selectedHotspotId);
    const popup = popupsRef.current.get(selectedHotspotId);
    
    if (marker && popup) {
      const markerEl = marker.getElement();
      markerEl.dataset.pinned = 'true';
      popup.addTo(mapRef.current);
      
      // Smooth fly to selected hotspot
      const hotspot = ASSAM_HOTSPOTS.find(h => h.id === selectedHotspotId);
      if (hotspot) {
        mapRef.current.easeTo({
          center: hotspot.coordinates,
          zoom: 8.5,
          duration: 1000,
          essential: true,
          easing: (t) => t * (2 - t),
        });
      }
    }
  }, [selectedHotspotId, isMapLoaded]);

  // Fallback UI when no token
  if (!MAPBOX_TOKEN) {
    return (
      <div
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E1B2F] flex items-center justify-center p-8 text-center"
        style={{ height }}
      >
        <div className="max-w-md space-y-4">
          <Layers3 className="mx-auto w-10 h-10 text-sky-500" />
          <div>
            <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-[#F4F7FB] mb-2">
              Mapbox Token Required
            </h3>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-[#8FA0B8] mb-3">
              To view the live Assam flood risk map, add your Mapbox access token to{' '}
              <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-sky-600 dark:text-sky-400 text-xs font-mono">
                .env.local
              </code>
            </p>
            <pre className="text-left text-xs rounded-lg bg-slate-100 dark:bg-[#07101F] border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-slate-700 dark:text-slate-300 overflow-x-auto">
              VITE_MAPBOX_ACCESS_TOKEN=pk.your_token
            </pre>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Create a free token at{' '}
            <a
              href="https://account.mapbox.com/access-tokens/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 dark:text-sky-400 hover:underline font-medium"
            >
              account.mapbox.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="assam-overview-map relative isolate w-full min-h-[400px] overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#0E1B2F] shadow-sm"
      style={{ height, contain: 'layout paint' }}
      aria-label="Assam flood risk overview map"
    >
      {/* Mapbox container */}
      <div ref={mapContainerRef} className="absolute inset-0 h-full w-full" />

      {/* Top overlay badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 pointer-events-none max-w-[calc(100%-80px)]">
        {/* Live indicator */}
        <div className="flex items-center gap-2 rounded-xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200/80 dark:border-slate-700/60 px-2.5 sm:px-3 py-1.5 sm:py-2 shadow-sm pointer-events-auto">
          <Radio className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-600 dark:text-sky-400 animate-pulse flex-shrink-0" />
          <span className="text-[11px] sm:text-xs font-bold tracking-wide text-slate-900 dark:text-slate-100 truncate">
            ASSAM · LIVE
          </span>
        </div>

        {/* Active hotspots count */}
        <div className="flex items-center gap-2 rounded-xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200/80 dark:border-slate-700/60 px-2.5 sm:px-3 py-1.5 sm:py-2 shadow-sm pointer-events-auto">
          <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
          <span className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
            {ASSAM_HOTSPOTS.filter(h => h.riskLevel === 'HIGH' || h.riskLevel === 'CRITICAL').length} High-Risk
          </span>
        </div>
      </div>

      {/* Legend (bottom-left) - responsive */}
      <div className="absolute bottom-3 left-3 z-10 rounded-xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200/80 dark:border-slate-700/60 px-3 sm:px-4 py-2 sm:py-3 shadow-md max-w-[calc(100%-80px)]">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 sm:mb-2 font-mono">
          Risk Level
        </div>
        <div className="flex flex-col gap-1 sm:gap-1.5 text-[11px] sm:text-xs">{[
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

      {/* Loading state */}
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-[#0E1B2F] z-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-slate-300 dark:border-slate-700 border-t-sky-600 dark:border-t-sky-400 rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Loading Assam map...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
