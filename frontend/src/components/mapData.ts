import { CWC_GAUGE_STATIONS } from '../data/assamData';
import { InfrastructureItem, SectorData } from '../types';

export type MapFeature = {
  type: 'Feature';
  geometry: { type: 'Point' | 'Polygon'; coordinates: number[] | number[][][] };
  properties: Record<string, string | number | boolean>;
};

export type MapFeatureCollection = { type: 'FeatureCollection'; features: MapFeature[] };

const empty = (): MapFeatureCollection => ({ type: 'FeatureCollection', features: [] });

export const inundationGeoJson = (sector: SectorData, opacity: number): MapFeatureCollection => {
  const { lat, lng } = sector.coordinates;
  const latitudeRadius = 0.045 + Math.min(sector.inundationAreaKm2 / 14000, 0.03);
  const longitudeRadius = latitudeRadius * 1.55;

  return {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: { opacity, risk: sector.hazardLevel, district: sector.district },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [lng - longitudeRadius, lat - latitudeRadius * 0.35],
          [lng - longitudeRadius * 0.4, lat + latitudeRadius],
          [lng + longitudeRadius, lat + latitudeRadius * 0.45],
          [lng + longitudeRadius * 0.65, lat - latitudeRadius * 0.65],
          [lng - longitudeRadius * 0.45, lat - latitudeRadius],
          [lng - longitudeRadius, lat - latitudeRadius * 0.35],
        ]],
      },
    }],
  };
};

export const gaugeGeoJson = (): MapFeatureCollection => ({
  type: 'FeatureCollection',
  features: CWC_GAUGE_STATIONS.map((gauge) => ({
    type: 'Feature',
    properties: {
      id: gauge.id,
      name: gauge.name,
      river: gauge.river,
      stage: gauge.currentStage,
      danger: gauge.dangerLevel,
      delta: Number((gauge.currentStage - gauge.dangerLevel).toFixed(2)),
      trend: gauge.trend,
      discharge: gauge.discharge,
    },
    geometry: { type: 'Point', coordinates: [gauge.coordinates.lng, gauge.coordinates.lat] },
  })),
});

export const infrastructureGeoJson = (items: InfrastructureItem[]): MapFeatureCollection => ({
  type: 'FeatureCollection',
  features: items.flatMap((item) => {
    const { lat, lng } = item.coordinates;
    if (lat == null || lng == null) return [];
    return [{
      type: 'Feature' as const,
      properties: {
        id: item.id,
        name: item.name,
        type: item.type,
        status: item.status,
        risk: item.riskLevel,
        distance: item.distanceFromInundationM,
        capacity: item.capacityOrBeds || '',
        details: item.details,
      },
      geometry: { type: 'Point' as const, coordinates: [lng, lat] },
    }];
  }),
});

export const emptyGeoJson = empty;
