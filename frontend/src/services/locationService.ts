import { ASSAM_SECTORS } from '../data/assamData';
import { SectorData } from '../types';

export interface LocationSuggestion {
  id: string;
  name: string;
  district: string;
  type: 'District Headquarter' | 'Sub-Division' | 'River Island' | 'Gauge Catchment';
  coordinates: { lat: number; lng: number };
  riskLevel: string;
  score: number;
}

export const locationService = {
  searchLocations: (query: string): LocationSuggestion[] => {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const suggestions: LocationSuggestion[] = [];
    for (const [id, s] of Object.entries(ASSAM_SECTORS)) {
      if (
        s.district.toLowerCase().includes(q) ||
        s.subdivision.toLowerCase().includes(q) ||
        s.stationName.toLowerCase().includes(q) ||
        s.riverName.toLowerCase().includes(q) ||
        s.affectedNeighborhoods.some((n) => n.toLowerCase().includes(q))
      ) {
        suggestions.push({
          id,
          name: s.district,
          district: s.district,
          type: id === 'majuli' ? 'River Island' : 'District Headquarter',
          coordinates: s.coordinates,
          riskLevel: s.hazardLevel,
          score: s.vulnerabilityIndex,
        });
      }
    }
    return suggestions;
  },

  getNearestSector: (lat: number, lng: number): SectorData => {
    let nearest = ASSAM_SECTORS['dhemaji'];
    let minDistance = Infinity;

    for (const sector of Object.values(ASSAM_SECTORS)) {
      const dLat = sector.coordinates.lat - lat;
      const dLng = sector.coordinates.lng - lng;
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = sector;
      }
    }
    return nearest;
  }
};
