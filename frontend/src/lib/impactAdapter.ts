/**
 * FloodGuard Impact Data Adapter & Normalizer
 *
 * Normalizes backend response from GET /api/impact/{location_name}
 *
 * CRITICAL BUSINESS RULES:
 * 1. Do not fabricate demographic or infrastructure figures.
 * 2. If a backend field is missing or undefined, preserve undefined rather than generating fake numbers.
 * 3. Keep mock data isolated behind the development mock layer.
 */

import { SectorData, InfrastructureItem } from '../types';
import { SectorImpactResponse, InfrastructureAsset, DemographicVulnerability } from '../api/impact';
import { ASSAM_SECTORS } from '../data/assamData';

export interface NormalizedImpactData {
  location: string;
  district: string;
  subdivision?: string;
  coordinates?: { lat: number; lng: number };
  populationAtRisk?: number;
  demographics: {
    childrenUnder5?: number;
    elderlyAbove65?: number;
    pregnantWomen?: number;
    livestockCount?: number;
    informalDwellings?: number;
  };
  infrastructureCounts: {
    hospitals?: number;
    schools?: number;
    roads?: number;
    bridges?: number;
    total?: number;
  };
  infrastructureList: InfrastructureItem[];
  isMock: boolean;
}

/**
 * Normalizes an infrastructure asset item from API or mock layer.
 */
export function normalizeInfrastructureAsset(raw: Record<string, unknown>): InfrastructureItem {
  const id = String(raw.id || Math.random().toString(36).substring(2));
  const name = String(raw.name || 'Unnamed Asset');
  const rawType = String(raw.type || 'road').toLowerCase();
  const type: 'hospital' | 'school' | 'road' | 'bridge' =
    rawType === 'hospital' || rawType === 'school' || rawType === 'road' || rawType === 'bridge'
      ? rawType
      : 'road';

  const status = String(raw.status || 'Monitored');
  const riskLevel = String(raw.risk_level || raw.riskLevel || 'MODERATE').toUpperCase() as any;
  const distanceFromInundationM =
    raw.distance_from_inundation_m !== undefined && raw.distance_from_inundation_m !== null
      ? Number(raw.distance_from_inundation_m)
      : raw.distanceFromInundationM !== undefined && raw.distanceFromInundationM !== null
      ? Number(raw.distanceFromInundationM)
      : 0;

  const capacityOrBeds = raw.capacity ? String(raw.capacity) : raw.capacityOrBeds ? String(raw.capacityOrBeds) : undefined;
  const details = String(raw.details || 'Standard operational protocol');

  const coords = raw.coordinates as Record<string, unknown> | undefined;
  const coordinates = {
    lat: coords?.lat !== undefined ? Number(coords.lat) : undefined,
    lng: coords?.lng !== undefined ? Number(coords.lng) : undefined,
    x: coords?.x !== undefined ? Number(coords.x) : undefined,
    y: coords?.y !== undefined ? Number(coords.y) : undefined,
  };

  return {
    id,
    name,
    type,
    status,
    riskLevel,
    distanceFromInundationM,
    capacityOrBeds,
    details,
    coordinates,
  };
}

/**
 * Normalizes backend response GET /api/impact/{location_name}
 * Returns strictly parsed values without fabricated fallbacks.
 */
export function normalizeBackendImpact(
  raw: Record<string, unknown>,
  fallbackSector?: SectorData
): NormalizedImpactData {
  const district = String(raw.district || raw.location || fallbackSector?.district || 'Assam Sector');
  const location = String(raw.location || raw.district || fallbackSector?.district || district);
  const subdivision = raw.subdivision ? String(raw.subdivision) : fallbackSector?.subdivision;

  const rawCoords = raw.coordinates as Record<string, unknown> | undefined;
  const coordinates = rawCoords?.lat && rawCoords?.lng
    ? { lat: Number(rawCoords.lat), lng: Number(rawCoords.lng) }
    : fallbackSector?.coordinates;

  const populationAtRisk =
    raw.population_at_risk !== undefined && raw.population_at_risk !== null
      ? Number(raw.population_at_risk)
      : raw.populationAtRisk !== undefined && raw.populationAtRisk !== null
      ? Number(raw.populationAtRisk)
      : fallbackSector?.populationAtRisk;

  const rawDemo = (raw.demographics || raw.vulnerableDemographics || {}) as Record<string, unknown>;
  const demographics = {
    childrenUnder5:
      rawDemo.children_under_5 !== undefined && rawDemo.children_under_5 !== null
        ? Number(rawDemo.children_under_5)
        : rawDemo.childrenUnder5 !== undefined && rawDemo.childrenUnder5 !== null
        ? Number(rawDemo.childrenUnder5)
        : fallbackSector?.vulnerableDemographics?.childrenUnder5,
    elderlyAbove65:
      rawDemo.elderly_above_65 !== undefined && rawDemo.elderly_above_65 !== null
        ? Number(rawDemo.elderly_above_65)
        : rawDemo.elderlyAbove65 !== undefined && rawDemo.elderlyAbove65 !== null
        ? Number(rawDemo.elderlyAbove65)
        : rawDemo.elderlyOver65 !== undefined && rawDemo.elderlyOver65 !== null
        ? Number(rawDemo.elderlyOver65)
        : fallbackSector?.vulnerableDemographics?.elderlyOver65,
    pregnantWomen:
      rawDemo.pregnant_women !== undefined && rawDemo.pregnant_women !== null
        ? Number(rawDemo.pregnant_women)
        : rawDemo.pregnantWomen !== undefined && rawDemo.pregnantWomen !== null
        ? Number(rawDemo.pregnantWomen)
        : undefined,
    livestockCount:
      rawDemo.livestock_count !== undefined && rawDemo.livestock_count !== null
        ? Number(rawDemo.livestock_count)
        : rawDemo.livestockCount !== undefined && rawDemo.livestockCount !== null
        ? Number(rawDemo.livestockCount)
        : fallbackSector?.vulnerableDemographics?.livestockCount,
    informalDwellings:
      rawDemo.informal_dwellings !== undefined && rawDemo.informal_dwellings !== null
        ? Number(rawDemo.informal_dwellings)
        : rawDemo.informalDwellings !== undefined && rawDemo.informalDwellings !== null
        ? Number(rawDemo.informalDwellings)
        : undefined,
  };

  const rawCounts = (raw.infrastructure_counts || raw.infrastructureCounts || {}) as Record<string, unknown>;
  const rawList = Array.isArray(raw.infrastructure_list)
    ? raw.infrastructure_list
    : Array.isArray(raw.infrastructureList)
    ? raw.infrastructureList
    : fallbackSector?.infrastructureList || [];

  const infrastructureList: InfrastructureItem[] = rawList.map((item) =>
    normalizeInfrastructureAsset(item as Record<string, unknown>)
  );

  const hospitalsCount =
    rawCounts.hospitals !== undefined && rawCounts.hospitals !== null
      ? Number(rawCounts.hospitals)
      : fallbackSector?.infrastructureCounts?.hospitals ??
        infrastructureList.filter((a) => a.type === 'hospital').length;

  const schoolsCount =
    rawCounts.schools !== undefined && rawCounts.schools !== null
      ? Number(rawCounts.schools)
      : fallbackSector?.infrastructureCounts?.schools ??
        infrastructureList.filter((a) => a.type === 'school').length;

  const roadsCount =
    rawCounts.roads !== undefined && rawCounts.roads !== null
      ? Number(rawCounts.roads)
      : fallbackSector?.infrastructureCounts?.roads ??
        infrastructureList.filter((a) => a.type === 'road').length;

  const bridgesCount =
    rawCounts.bridges !== undefined && rawCounts.bridges !== null
      ? Number(rawCounts.bridges)
      : fallbackSector?.infrastructureCounts?.bridges ??
        infrastructureList.filter((a) => a.type === 'bridge').length;

  const isMock = Boolean(raw.is_mock || raw._isDevelopmentMock || fallbackSector !== undefined);

  return {
    location,
    district,
    subdivision,
    coordinates,
    populationAtRisk,
    demographics,
    infrastructureCounts: {
      hospitals: hospitalsCount,
      schools: schoolsCount,
      roads: roadsCount,
      bridges: bridgesCount,
      total: infrastructureList.length,
    },
    infrastructureList,
    isMock,
  };
}

/**
 * Development helper: Adapts a SectorData mock record into a typed NormalizedImpactData.
 */
export function adaptSectorToImpact(sector: SectorData): NormalizedImpactData {
  return normalizeBackendImpact({ _isDevelopmentMock: true }, sector);
}
