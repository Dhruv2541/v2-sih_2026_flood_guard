import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { motion } from 'motion/react';
import {
  Building2,
  ChevronDown,
  Droplets,
  Eye,
  Layers3,
  Mountain,
  Pause,
  Play,
  Radio,
  SlidersHorizontal,
  Waves,
} from 'lucide-react';
import { SectorData } from '../types';
import { useTheme } from '../context/ThemeContext';
import { gaugeGeoJson, infrastructureGeoJson, inundationGeoJson, MapFeatureCollection } from './mapData';

interface InteractiveMapProps {
  currentSector: SectorData;
  onSelectSector: (sectorId: string) => void;
  onOpenDiagnostic: () => void;
  forecastHour?: number;
  onForecastHourChange?: (hour: number) => void;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
const timelineSteps = [0, 6, 12, 24, 48, 72];
const darkStyle = 'mapbox://styles/mapbox/dark-v11';
const lightStyle = 'mapbox://styles/mapbox/light-v11';

const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
}[character] || character));

const toPoint = (coordinates: unknown): [number, number] | null => {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null;
  return [Number(coordinates[0]), Number(coordinates[1])];
};

const visibility = (map: mapboxgl.Map, layerId: string, isVisible: boolean) => {
  if (map.getLayer(layerId)) map.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  currentSector,
  onOpenDiagnostic,
  forecastHour = 0,
  onForecastHourChange,
}) => {
  const mapNode = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const playInterval = useRef<number | null>(null);
  const { resolvedTheme } = useTheme();
  const appliedStyleTheme = useRef(resolvedTheme);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showFlood, setShowFlood] = useState(true);
  const [showGauges, setShowGauges] = useState(true);
  const [showInfrastructure, setShowInfrastructure] = useState(true);
  const [terrainEnabled, setTerrainEnabled] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const activeStep = useMemo(
    () => currentSector.timeline?.find((step) => step.hour === forecastHour) || currentSector.timeline?.[0],
    [currentSector, forecastHour],
  );
  const floodData = useMemo(
    () => inundationGeoJson(currentSector, activeStep?.inundationOpacity ?? 0.65),
    [currentSector, activeStep],
  );
  const infrastructureData = useMemo(
    () => infrastructureGeoJson(currentSector.infrastructureList || []),
    [currentSector],
  );

  const updateSource = useCallback((map: mapboxgl.Map, id: string, data: MapFeatureCollection) => {
    const source = map.getSource(id) as mapboxgl.GeoJSONSource | undefined;
    source?.setData(data as never);
  }, []);

  const showGaugePopup = useCallback((map: mapboxgl.Map, coordinates: [number, number], properties: Record<string, unknown>, persistent = false) => {
    popupRef.current?.remove();
    const delta = Number(properties.delta);
    const isAboveDanger = delta > 0;
    popupRef.current = new mapboxgl.Popup({
      closeButton: persistent,
      closeOnClick: !persistent,
      offset: 14,
      className: 'fg-map-popup',
    })
      .setLngLat(coordinates)
      .setHTML(
        `<div class="fg-map-card">
          <span class="fg-map-eyebrow">Live river gauge</span>
          <strong>${escapeHtml(properties.name)}</strong>
          <span>${escapeHtml(properties.river)}</span>
          <div class="fg-map-stat"><span>Stage</span><b>${Number(properties.stage).toFixed(2)}m</b></div>
          <div class="fg-map-stat"><span>Danger mark</span><b class="${isAboveDanger ? 'fg-danger' : 'fg-safe'}">${isAboveDanger ? '+' : ''}${delta.toFixed(2)}m ${properties.trend === 'rising' ? '▲' : '▼'}</b></div>
        </div>`,
      )
      .addTo(map);
  }, []);

  const showInfrastructurePopup = useCallback((map: mapboxgl.Map, coordinates: [number, number], properties: Record<string, unknown>) => {
    popupRef.current?.remove();
    popupRef.current = new mapboxgl.Popup({ closeButton: true, closeOnClick: true, offset: 14, className: 'fg-map-popup' })
      .setLngLat(coordinates)
      .setHTML(
        `<div class="fg-map-card">
          <span class="fg-map-eyebrow">${escapeHtml(properties.type)} · ${escapeHtml(properties.risk)} risk</span>
          <strong>${escapeHtml(properties.name)}</strong>
          <span>${escapeHtml(properties.status)}</span>
          <div class="fg-map-stat"><span>From inundation</span><b>${escapeHtml(properties.distance)}m</b></div>
        </div>`,
      )
      .addTo(map);
  }, []);

  const installLayers = useCallback((map: mapboxgl.Map) => {
    const addSource = (id: string, data: MapFeatureCollection, options: Record<string, unknown> = {}) => {
      if (!map.getSource(id)) map.addSource(id, { type: 'geojson', data: data as never, ...options } as mapboxgl.AnySourceData);
    };
    addSource('flood-zone', floodData);
    addSource('gauges', gaugeGeoJson());
    addSource('infrastructure', infrastructureData, { cluster: true, clusterMaxZoom: 14, clusterRadius: 50 });
    addSource('active-sector', {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', properties: { district: currentSector.district }, geometry: { type: 'Point', coordinates: [currentSector.coordinates.lng, currentSector.coordinates.lat] } }],
    });
    if (!map.getSource('mapbox-dem')) {
      map.addSource('mapbox-dem', { type: 'raster-dem', url: 'mapbox://mapbox.mapbox-terrain-dem-v1', tileSize: 512, maxzoom: 14 });
    }

    if (!map.getLayer('flood-fill')) {
      map.addLayer({ id: 'flood-fill', type: 'fill', source: 'flood-zone', paint: { 'fill-color': '#179ed1', 'fill-opacity': 0.65 } });
      map.addLayer({ id: 'flood-outline', type: 'line', source: 'flood-zone', paint: { 'line-color': '#48c7f5', 'line-width': 2.5, 'line-opacity': 0.9, 'line-dasharray': [2, 2] } });
      map.addLayer({
        id: 'active-sector-label',
        type: 'symbol',
        source: 'active-sector',
        layout: {
          'text-field': ['get', 'district'],
          'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
          'text-size': 12,
          'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
          'text-radial-offset': 1.2,
          'text-justify': 'auto',
          'text-allow-overlap': false,
          'text-ignore-placement': false,
        },
        paint: { 'text-color': resolvedTheme === 'dark' ? '#f4f7fb' : '#07101f', 'text-halo-color': resolvedTheme === 'dark' ? '#07101f' : '#ffffff', 'text-halo-width': 1.5 },
      });
      map.addLayer({ id: 'gauge-points', type: 'circle', source: 'gauges', paint: { 'circle-radius': 6, 'circle-color': '#22b8f0', 'circle-stroke-color': '#f4f7fb', 'circle-stroke-width': 1.5 } });
      map.addLayer({ id: 'infrastructure-clusters', type: 'circle', source: 'infrastructure', filter: ['has', 'point_count'], paint: { 'circle-color': '#0e1b2f', 'circle-radius': ['step', ['get', 'point_count'], 17, 10, 21, 30, 26], 'circle-stroke-color': '#22b8f0', 'circle-stroke-width': 2 } });
      map.addLayer({ id: 'infrastructure-cluster-count', type: 'symbol', source: 'infrastructure', filter: ['has', 'point_count'], layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 12, 'text-allow-overlap': true }, paint: { 'text-color': '#f4f7fb' } });
      map.addLayer({ id: 'infrastructure-points', type: 'circle', source: 'infrastructure', filter: ['!', ['has', 'point_count']], paint: { 'circle-radius': 7, 'circle-color': ['match', ['get', 'risk'], 'CRITICAL', '#ef4444', 'HIGH', '#f97316', 'MODERATE', '#fbbf24', '#22c55e'], 'circle-stroke-color': '#f4f7fb', 'circle-stroke-width': 1.5 } });
    }
    visibility(map, 'flood-fill', showFlood);
    visibility(map, 'flood-outline', showFlood);
    visibility(map, 'gauges', showGauges);
    visibility(map, 'gauge-points', showGauges);
    visibility(map, 'infrastructure-clusters', showInfrastructure);
    visibility(map, 'infrastructure-cluster-count', showInfrastructure);
    visibility(map, 'infrastructure-points', showInfrastructure);
  }, [currentSector, floodData, infrastructureData, resolvedTheme, showFlood, showGauges, showInfrastructure]);

  useEffect(() => {
    if (!MAPBOX_TOKEN || !mapNode.current || mapRef.current) return;
    const container = mapNode.current;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container,
      style: resolvedTheme === 'dark' ? darkStyle : lightStyle,
      center: [currentSector.coordinates.lng, currentSector.coordinates.lat],
      zoom: 9.7,
      pitch: 26,
      bearing: -8,
      attributionControl: false,
    });
    mapRef.current = map;
    appliedStyleTheme.current = resolvedTheme;

    // The full GIS view is positioned inside a viewport-height panel. Mapbox
    // can otherwise retain its pre-layout canvas size and leave an empty navy
    // surface behind the controls.
    const resizeMap = () => map.resize();
    const resizeObserver = new ResizeObserver(resizeMap);
    resizeObserver.observe(container);
    map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'bottom-right');
    map.on('load', () => {
      requestAnimationFrame(resizeMap);
      installLayers(map);
      setIsLoaded(true);
      map.on('click', 'gauge-points', (event) => {
        const feature = event.features?.[0] as any;
        const coordinates = toPoint(feature?.geometry?.coordinates);
        if (coordinates && feature) showGaugePopup(map, coordinates, feature.properties || {}, true);
      });
      map.on('mouseenter', 'gauge-points', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mousemove', 'gauge-points', (event) => {
        const feature = event.features?.[0] as any;
        const coordinates = toPoint(feature?.geometry?.coordinates);
        if (coordinates && feature) showGaugePopup(map, coordinates, feature.properties || {});
      });
      map.on('mouseleave', 'gauge-points', () => { map.getCanvas().style.cursor = ''; popupRef.current?.remove(); });
      map.on('click', 'infrastructure-points', (event) => {
        const feature = event.features?.[0] as any;
        const coordinates = toPoint(feature?.geometry?.coordinates);
        if (coordinates && feature) showInfrastructurePopup(map, coordinates, feature.properties || {});
      });
      map.on('mouseenter', 'infrastructure-points', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mousemove', 'infrastructure-points', (event) => {
        const feature = event.features?.[0] as any;
        const coordinates = toPoint(feature?.geometry?.coordinates);
        if (coordinates && feature) showInfrastructurePopup(map, coordinates, feature.properties || {});
      });
      map.on('mouseleave', 'infrastructure-points', () => { map.getCanvas().style.cursor = ''; popupRef.current?.remove(); });
      map.on('click', 'infrastructure-clusters', (event) => {
        const feature = map.queryRenderedFeatures(event.point, { layers: ['infrastructure-clusters'] })[0] as any;
        const clusterId = feature?.properties?.cluster_id;
        const coordinates = toPoint(feature?.geometry?.coordinates);
        const source = map.getSource('infrastructure') as mapboxgl.GeoJSONSource;
        if (clusterId != null && coordinates) source.getClusterExpansionZoom(Number(clusterId), (error, zoom) => {
          if (!error) map.easeTo({ center: coordinates, zoom });
        });
      });
    });
    map.on('error', (event) => {
      const message = event.error?.message;
      if (message) setMapError(message);
    });
    return () => {
      resizeObserver.disconnect();
      if (playInterval.current) window.clearInterval(playInterval.current);
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const prevSectorIdRef = useRef<string>(currentSector.id);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;
    updateSource(map, 'flood-zone', floodData);
    updateSource(map, 'infrastructure', infrastructureData);
    updateSource(map, 'active-sector', {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', properties: { district: currentSector.district }, geometry: { type: 'Point', coordinates: [currentSector.coordinates.lng, currentSector.coordinates.lat] } }],
    });
    // Only pan camera when selected sector ID changes, avoiding continuous camera thrashing on timeline steps
    if (prevSectorIdRef.current !== currentSector.id) {
      prevSectorIdRef.current = currentSector.id;
      map.easeTo({ center: [currentSector.coordinates.lng, currentSector.coordinates.lat], duration: 700, essential: true });
    }
  }, [currentSector, floodData, infrastructureData, isLoaded, updateSource]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;
    visibility(map, 'flood-fill', showFlood);
    visibility(map, 'flood-outline', showFlood);
    visibility(map, 'gauge-points', showGauges);
    visibility(map, 'infrastructure-clusters', showInfrastructure);
    visibility(map, 'infrastructure-cluster-count', showInfrastructure);
    visibility(map, 'infrastructure-points', showInfrastructure);
    map.setTerrain(terrainEnabled ? { source: 'mapbox-dem', exaggeration: 1.5 } : null);
  }, [isLoaded, showFlood, showGauges, showInfrastructure, terrainEnabled]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded || !map.getLayer('flood-outline')) return;
    const shouldPulse = currentSector.hazardLevel === 'HIGH' || currentSector.hazardLevel === 'CRITICAL';
    if (!shouldPulse) {
      map.setPaintProperty('flood-outline', 'line-opacity', 0.9);
      return;
    }
    let dim = false;
    const interval = window.setInterval(() => {
      if (map.getLayer('flood-outline')) map.setPaintProperty('flood-outline', 'line-opacity', dim ? 0.35 : 0.95);
      dim = !dim;
    }, 800);
    return () => {
      window.clearInterval(interval);
      if (map.getLayer('flood-outline')) {
        map.setPaintProperty('flood-outline', 'line-opacity', 0.9);
      }
    };
  }, [currentSector.hazardLevel, isLoaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;
    if (appliedStyleTheme.current === resolvedTheme) return;
    const style = resolvedTheme === 'dark' ? darkStyle : lightStyle;
    appliedStyleTheme.current = resolvedTheme;
    map.setStyle(style);
    map.once('style.load', () => {
      installLayers(map);
      map.setTerrain(terrainEnabled ? { source: 'mapbox-dem', exaggeration: 1.5 } : null);
    });
  }, [resolvedTheme, installLayers, terrainEnabled, isLoaded]);

  const togglePlayback = () => {
    if (isPlaying) {
      if (playInterval.current) {
        window.clearInterval(playInterval.current);
        playInterval.current = null;
      }
      setIsPlaying(false);
      return;
    }
    setIsPlaying(true);
    let index = timelineSteps.indexOf(forecastHour);
    playInterval.current = window.setInterval(() => {
      index = (index + 1) % timelineSteps.length;
      onForecastHourChange?.(timelineSteps[index]);
      if (index === timelineSteps.length - 1) {
        if (playInterval.current) {
          window.clearInterval(playInterval.current);
          playInterval.current = null;
        }
        setIsPlaying(false);
      }
    }, 1200);
  };

  if (!MAPBOX_TOKEN || MAPBOX_TOKEN === 'pk.your_public_mapbox_token') {
    return (
      <div className="min-h-[440px] h-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6 text-center">
        <div className="max-w-sm"><Layers3 className="mx-auto w-8 h-8 text-sky-500" /><h3 className="mt-4 font-heading text-lg font-bold text-slate-900 dark:text-slate-100">Connect your Mapbox map</h3><p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Add a public <code>VITE_MAPBOX_ACCESS_TOKEN</code> to your local environment. The new map will then load clustering, terrain, dynamic GIS layers, and hover micro-cards.</p></div>
      </div>
    );
  }

  return (
    <div className="interactive-flood-map relative min-h-[440px] h-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#0E1B2F]">
      <div ref={mapNode} className="absolute inset-0 h-full w-full" aria-label="Interactive flood risk map" />
      {mapError && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-[#07101F]/90 p-6 text-center">
          <div className="max-w-sm rounded-2xl border border-white/10 bg-[#0E1B2F] p-5 shadow-2xl">
            <Layers3 className="mx-auto h-7 w-7 text-sky-400" />
            <h3 className="mt-3 font-heading text-lg font-bold text-white">Map temporarily unavailable</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">The GIS base layer could not load. Check the public Mapbox token and refresh this view.</p>
          </div>
        </div>
      )}
      <div className="absolute top-4 left-4 z-10">
        <button onClick={() => setIsDrawerOpen(!isDrawerOpen)} aria-expanded={isDrawerOpen} className="flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-[#07101F]/85 px-3 text-sm font-semibold text-white shadow-lg backdrop-blur-md hover:bg-[#12233B]">
          <SlidersHorizontal className="w-[18px] h-[18px] text-sky-400" /> Layers <ChevronDown className={`w-4 h-4 transition-transform ${isDrawerOpen ? 'rotate-180' : ''}`} />
        </button>
        {isDrawerOpen && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mt-2 w-64 rounded-2xl border border-white/10 bg-[#07101F]/90 p-3 shadow-xl backdrop-blur-xl">
            <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Map layers</p>
            {[
              ['Flood extent', showFlood, setShowFlood, Waves],
              ['River gauges', showGauges, setShowGauges, Radio],
              ['Critical infrastructure', showInfrastructure, setShowInfrastructure, Building2],
              ['DEM 30m terrain', terrainEnabled, setTerrainEnabled, Mountain],
            ].map(([label, active, setActive, Icon]) => {
              const LayerIcon = Icon as React.ElementType;
              return <button key={label as string} onClick={() => (setActive as React.Dispatch<React.SetStateAction<boolean>>)(!active)} className="flex min-h-11 w-full items-center justify-between rounded-xl px-2 text-left text-sm text-slate-200 hover:bg-white/5"><span className="flex items-center gap-2"><LayerIcon className="w-4 h-4 text-sky-400" />{label as string}</span><span className={`h-5 w-9 rounded-full p-0.5 transition-colors ${active ? 'bg-sky-500' : 'bg-slate-700'}`}><span className={`block h-4 w-4 rounded-full bg-white transition-transform ${active ? 'translate-x-4' : ''}`} /></span></button>;
            })}
          </motion.div>
        )}
      </div>

      <div className="absolute top-4 right-4 z-10 rounded-xl border border-white/10 bg-[#07101F]/80 px-3 py-2 text-right text-xs text-slate-300 shadow-lg backdrop-blur-md">
        <span className="block text-[10px] uppercase tracking-[0.1em] text-slate-400">Forecast</span><strong className="text-sky-300">{activeStep?.label || 'Now'}</strong>
      </div>

      <div className="absolute bottom-4 left-4 right-4 sm:right-auto z-10 max-w-[calc(100vw-32px)]">
        <div className="flex max-w-full items-center gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-[#07101F]/88 p-2 shadow-xl backdrop-blur-xl scrollbar-none touch-pan-x">
          <button onClick={togglePlayback} className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 text-xs font-semibold text-white hover:bg-sky-500 cursor-pointer">{isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}{isPlaying ? 'Pause' : 'Play'}</button>
          {timelineSteps.map((hour) => <button key={hour} onClick={() => onForecastHourChange?.(hour)} className={`min-h-11 shrink-0 rounded-xl px-3.5 text-xs font-semibold transition-colors cursor-pointer ${forecastHour === hour ? 'bg-white text-[#07101F]' : 'text-slate-300 hover:bg-white/10'}`}>{hour === 0 ? 'Now' : `+${hour}h`}</button>)}
        </div>
      </div>

      <button onClick={onOpenDiagnostic} className="absolute bottom-4 right-4 z-10 hidden sm:flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-[#07101F]/85 px-3.5 text-xs font-semibold text-white shadow-lg backdrop-blur-md hover:bg-[#12233B] cursor-pointer"><Eye className="w-4 h-4 text-sky-400" /> Details</button>
    </div>
  );
};
