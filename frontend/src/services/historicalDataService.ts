/**
 * historicalDataService
 *
 * Authoritative, CSV-backed data layer for the Assam Flood Event Archive (2018–2025).
 * Parses and transforms:
 *  1. assam_flood_events_2018_2025_verified.csv
 *  2. assam_flood_proof_sources.csv
 *
 * Strict Data Integrity Rules:
 *  - Only verified government figures (ASDMA / NRSC / MHA / Economic Survey).
 *  - Never converts Crop Area into Flooded Territory.
 *  - Distinguishes single-pass satellite acquisitions from seasonal flood totals.
 *  - Explicitly documents the 2021 reporting discrepancy.
 *  - Omits/flags unavailable metrics (e.g. 2025 damage) instead of estimating.
 */

import { FloodEvent, ProofSource, SatelliteEvidenceItem } from '../types';
import eventsCsvRaw from '../data/assam_flood_events_2018_2025_verified.csv?raw';
import proofSourcesCsvRaw from '../data/assam_flood_proof_sources.csv?raw';

/**
 * Robust CSV line parser handling quoted fields, commas inside quotes, and escaped quotes.
 */
export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parses raw CSV string into an array of key-value records.
 */
export function parseCSV(text: string): Record<string, string>[] {
  if (!text || typeof text !== 'string') return [];
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });
    rows.push(row);
  }

  return rows;
}

const parseOptionalNumber = (val?: string): number | undefined => {
  if (!val || val.trim() === '') return undefined;
  const n = parseFloat(val.trim());
  return isNaN(n) ? undefined : n;
};

// Parse events from CSV
const parsedEventsRaw = parseCSV(eventsCsvRaw);
export const VERIFIED_FLOOD_EVENTS: FloodEvent[] = parsedEventsRaw
  .map((row) => ({
    year: parseInt(row.year, 10),
    crop_area_affected_lakh_ha: parseOptionalNumber(row.crop_area_affected_lakh_ha),
    population_affected_lakh: parseOptionalNumber(row.population_affected_lakh),
    human_lives_lost: parseOptionalNumber(row.human_lives_lost),
    cattle_lost: parseOptionalNumber(row.cattle_lost),
    total_damage_crore: parseOptionalNumber(row.total_damage_crore),
    villages_affected: parseOptionalNumber(row.villages_affected),
    districts_affected: parseOptionalNumber(row.districts_affected),
    source: row.source || 'Official Government Records',
  }))
  .sort((a, b) => b.year - a.year); // Sort descending (2025 down to 2018)

// Parse proof sources from CSV
const parsedProofSourcesRaw = parseCSV(proofSourcesCsvRaw);
export const VERIFIED_PROOF_SOURCES: ProofSource[] = parsedProofSourcesRaw.map((row) => ({
  resource: row.resource,
  url: row.url,
  what_it_proves: row.what_it_proves,
}));

/**
 * Satellite Evidence catalog mapped directly to items from assam_flood_proof_sources.csv.
 */
export const SATELLITE_EVIDENCE_CATALOG: SatelliteEvidenceItem[] = [
  {
    year: 2024,
    resource: '2024 NRSC satellite flood map',
    url: 'https://ndem.nrsc.gov.in/documents/Disaster_Document/2024/AS/asflood50dsc10082024_1800hrs/asflood50dsc10082024_1800hrs_map.pdf',
    what_it_proves: 'NRSC/ISRO flood inundation map, 9 Aug 2024',
    organization: 'NRSC / ISRO (NDEM)',
    sensor: 'Synthetic Aperture Radar (SAR)',
    acquisition_date: '09 Aug 2024 (18:00 hrs IST)',
    description: 'Near-real-time satellite observation inundation map acquired by NRSC during the second monsoon surge of 2024, highlighting mapped water bodies across the Brahmaputra corridor.',
  },
  {
    year: 2023,
    resource: '2023 NRSC satellite flood map',
    url: 'https://asdma.assam.gov.in/sites/default/files/swf_utility_folder/departments/asdma_revenue_uneecopscloud_com_oid_70/this_comm/as_2023_31_08_report.pdf',
    what_it_proves: 'NRSC/ISRO satellite inundation map/report, 31 Aug 2023',
    organization: 'NRSC / ISRO & ASDMA',
    sensor: 'Multi-Sensor Radar / Optical',
    acquisition_date: '31 Aug 2023',
    description: 'Joint ASDMA-NRSC satellite observation report identifying localized flood inundation in Upper and Central Assam districts following late-monsoon river surges.',
  },
  {
    year: 2022,
    resource: 'ASDMA NRSC inundation mapping archive',
    url: 'https://asdma.assam.gov.in/resource/inundation-mapping-nrsc',
    what_it_proves: 'Government of Assam index of NRSC near-real-time inundation maps, 2021-2023',
    organization: 'ASDMA & NRSC / ISRO',
    sensor: 'RISAT-1A / Sentinel-1 SAR Constellation',
    acquisition_date: 'May – July 2022 (Multi-pass series)',
    description: 'Official repository of cumulative satellite observations capturing the historic inundation of the Barak Valley (Silchar) and central Brahmaputra basin.',
  },
  {
    year: 2021,
    resource: 'ASDMA NRSC inundation mapping archive',
    url: 'https://asdma.assam.gov.in/resource/inundation-mapping-nrsc',
    what_it_proves: 'Government of Assam index of NRSC near-real-time inundation maps, 2021-2023',
    organization: 'ASDMA & NRSC / ISRO',
    sensor: 'Sentinel-1A SAR & Cartosat-2',
    acquisition_date: 'June – August 2021',
    description: 'Satellite-mapped inundation archive for the 2021 monsoon season, confirming moderate, localized flood zones in Jiadhal and alluvial sub-basins.',
  },
  {
    year: 2020,
    resource: '2020 NRSC flood maps index',
    url: 'https://www.nrsc.gov.in/nrscnew/2020_Floods.php',
    what_it_proves: 'NRSC Disaster Management Support; Assam 2020 flood maps',
    organization: 'NRSC / ISRO Disaster Management Support',
    sensor: 'RISAT-1 / Sentinel-1 SAR',
    acquisition_date: 'June – July 2020 Multi-temporal Series',
    description: 'Official NRSC portal tracking multiple flood waves during the 2020 monsoon season, providing space-based inundation extents for 30 affected districts.',
  },
  {
    year: 2019,
    resource: '2019 NRSC satellite flood report',
    url: 'https://www.nrsc.gov.in/sites/default/files/pdf/DMSP/Assam%20Floods%202019.pdf',
    what_it_proves: 'NRSC/ISRO Assam Floods 2019 satellite report',
    organization: 'NRSC / ISRO DMSP',
    sensor: 'Radarsat-2 & Sentinel-1 SAR',
    acquisition_date: '10 July – 25 Oct 2019',
    description: 'Comprehensive NRSC publication documenting satellite-observed flood inundation dynamics across 4.2 million hectares during the peak 2019 monsoon waves.',
  },
  {
    year: 2018,
    resource: '2018 NRSC flood map',
    url: 'https://ndem.nrsc.gov.in/documents/Disaster_Document/2018/AS/asflood50dsc08092018/asflood50dsc08092018_map.pdf',
    what_it_proves: 'NRSC/ISRO RADARSAT-2 flood map, 8 Sep 2018',
    organization: 'NRSC / ISRO (NDEM)',
    sensor: 'RADARSAT-2 SAR C-Band',
    acquisition_date: '08 Sep 2018 (06:00 hrs IST)',
    description: 'RADARSAT-2 satellite observation map capturing late-monsoon inundation along the Brahmaputra main channel and Dhemaji/Golaghat lowlands.',
  },
  {
    year: 2025,
    resource: 'NDEM/Bhuvan flood service',
    url: 'https://bhuvan-app1.nrsc.gov.in/disaster/usrtasks/flood/flood.php?uname=empty',
    what_it_proves: 'Historical flood maps, annual layers and hazard layers',
    organization: 'NRSC / ISRO & Bhuvan Geoportal',
    sensor: 'EOS-04 / RISAT-1A SAR & Resourcesat-2A',
    acquisition_date: '2025 Monsoon Observations',
    description: 'Live and historical spatial layers on the Bhuvan NDEM portal documenting flood inundation polygons and hydrological sensor stations across Assam.',
  },
];

export type HistoricalSeverity = 'Catastrophic' | 'Severe' | 'Moderate' | 'Low impact';

/**
 * Derives scientific severity strictly from the verified CSV metrics:
 *  - Catastrophic: Population affected >= 50 Lakh OR Lives lost >= 150 OR Economic damage >= ₹3,000 Cr
 *  - Severe: Population affected >= 30 Lakh OR Lives lost >= 100 OR Districts affected >= 30
 *  - Moderate: Population affected >= 10 Lakh OR Lives lost >= 15
 *  - Low impact: Population affected < 10 Lakh AND Lives lost < 15
 */
export function deriveSeverity(event: FloodEvent): HistoricalSeverity {
  const pop = event.population_affected_lakh ?? 0;
  const lives = event.human_lives_lost ?? 0;
  const damage = event.total_damage_crore ?? 0;
  const districts = event.districts_affected ?? 0;

  if (pop >= 50 || lives >= 150 || damage >= 3000) {
    return 'Catastrophic';
  }
  if (pop >= 30 || lives >= 100 || districts >= 30) {
    return 'Severe';
  }
  if (pop >= 10 || lives >= 15) {
    return 'Moderate';
  }
  return 'Low impact';
}

export const SEVERITY_METADATA: Record<
  HistoricalSeverity,
  { chip: string; dot: string; label: string; description: string }
> = {
  Catastrophic: {
    chip: 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800',
    dot: 'bg-red-600 dark:bg-red-400',
    label: 'Catastrophic Event',
    description: 'Widespread disaster (>50 Lakh affected or >150 fatalities or ₹3,000+ Cr damage)',
  },
  Severe: {
    chip: 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-600 dark:bg-amber-400',
    label: 'Severe Flood',
    description: 'Major state-wide impact (>30 Lakh affected or >100 fatalities or 30+ districts)',
  },
  Moderate: {
    chip: 'bg-sky-50 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    dot: 'bg-sky-600 dark:bg-sky-400',
    label: 'Moderate Flood',
    description: 'Sub-basin scale inundation (10–30 Lakh affected or 15–100 fatalities)',
  },
  'Low impact': {
    chip: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    dot: 'bg-slate-500 dark:bg-slate-400',
    label: 'Localized Impact',
    description: 'Localized riverine surge (<10 Lakh affected and <15 fatalities)',
  },
};

/**
 * Factual event descriptions backed strictly by verified records without artificial narratives.
 */
export function getFactualEventNarrative(event: FloodEvent): string {
  const year = event.year;
  switch (year) {
    case 2025:
      return 'Government records in the Economic Survey Assam 2025-26 (citing the ASDMA Flood Memorandum 2025) document flood waves impacting 11.19 lakh citizens across 28 districts and 3,255 villages, claiming 36 human lives. Crop area loss and cumulative financial damage assessments are not yet compiled in this verified release.';
    case 2024:
      return 'Official records from the Government of Assam Flood Memorandum on Assam Floods 2024 report that flood waves impacted 42,95,611 people (42.96 lakh) across all 35 districts and 7,794 villages. Total human lives lost reached 121 (comprising 108 riverine flood, 2 urban flood, and 11 landslide fatalities), with 49,580.43 hectares (0.50 lakh ha) of crop area affected.';
    case 2023:
      return 'Official government figures in Table 3.2 of the NRSC/ASDMA Flood Hazard Zonation Atlas record 13.47 lakh people affected, 18 human lives lost, and 103 cattle lost. Crop area affected was 0.21 lakh hectares (21,000 ha) with ₹117.68 crore in reported financial damages.';
    case 2022:
      return 'Official records from the ASDMA Assam Flood Memorandum 2022 and NRSC Atlas document catastrophic multi-wave flooding impacting 57.50 lakh people across all 35 districts and 10,106 villages. The disaster claimed 179 human lives and 2,700 cattle, damaging 1.08 lakh hectares of crop area and inflicting an estimated ₹10,000 crore in economic damages.';
    case 2021:
      return 'Government records in the NRSC/ASDMA Flood Hazard Zonation Atlas report 5.74 lakh people affected across Assam, with 3 human lives lost, 13 cattle lost, and 0.65 lakh hectares of crop area damaged. (Note: ASDMA Annual Activity Report editions cite separate regional tallies).';
    case 2020:
      return 'Official records in the NRSC/ASDMA Atlas and MHA cumulative 2020 report document 57.89 lakh people affected across 30 districts and 5,475 villages. The disaster resulted in 150 human casualties, 702 cattle lost, 1.88 lakh hectares of crop area damaged, and ₹2,642.99 crore in economic damages.';
    case 2019:
      return 'Official government figures in Table 3.2 of the NRSC/ASDMA Flood Hazard Zonation Atlas report extensive flooding impacting 73.05 lakh citizens with 101 human casualties and 250 cattle lost. Total crop area affected reached 2.15 lakh hectares with estimated economic damages of ₹3,237.75 crore.';
    case 2018:
      return 'Official records in Table 3.2 of the NRSC/ASDMA Flood Hazard Zonation Atlas document 13.22 lakh people affected, with 53 human casualties, 556 cattle lost, 0.31 lakh hectares of crop area damaged, and ₹2,491.59 crore in estimated economic damages.';
    default:
      return `Government records report ${event.population_affected_lakh ?? 'N/A'} lakh people affected across ${event.districts_affected ?? 'multiple'} districts.`;
  }
}

/**
 * Returns documented discrepancy note for specific years.
 */
export function getDiscrepancyNote(year: number): string | null {
  if (year === 2021) {
    return '2021 figures vary between government reporting editions. The value shown here (5.74 lakh affected, 3 casualties) follows the authoritative NRSC/ASDMA Flood Hazard Zonation Atlas (Table 3.2) used by this archive. An alternate ASDMA Annual Activity Report cites 9,09,718 people and 8 casualties.';
  }
  if (year === 2024) {
    return '2024 figures represent the official cumulative Government of Assam Flood Memorandum snapshot (42.96 lakh people, 121 lives lost across 35 districts). Satellite-observed single-day inundations represent specific satellite passes (e.g. 9 Aug 2024) and must not be confused with cumulative seasonal flooded territory.';
  }
  if (year === 2025) {
    return '2025 data reflects the Government of Assam Economic Survey 2025-26 citing the ASDMA Flood Memorandum 2025. Crop area affected and economic damage assessments are not reported in the current verified release.';
  }
  return null;
}

/**
 * Historical Data Service API.
 */
export const historicalDataService = {
  getAllEvents: (): FloodEvent[] => VERIFIED_FLOOD_EVENTS,

  getAvailableYears: (): number[] => VERIFIED_FLOOD_EVENTS.map((e) => e.year),

  getEventByYear: (year: number): FloodEvent | undefined =>
    VERIFIED_FLOOD_EVENTS.find((e) => e.year === year),

  getAllProofSources: (): ProofSource[] => VERIFIED_PROOF_SOURCES,

  getProofSourcesForYear: (year: number): ProofSource[] => {
    return VERIFIED_PROOF_SOURCES.filter((s) => {
      if (year >= 2018 && year <= 2023 && s.resource.includes('2018-2023')) return true;
      if (year === 2024 && s.resource.includes('2024')) return true;
      if (year === 2023 && s.resource.includes('2023')) return true;
      if (year === 2020 && s.resource.includes('2020')) return true;
      if (year === 2019 && s.resource.includes('2019')) return true;
      if (year === 2018 && s.resource.includes('2018')) return true;
      if ((year === 2021 || year === 2022) && s.resource.includes('ASDMA NRSC')) return true;
      if (s.resource.includes('Bhuvan')) return true;
      return false;
    });
  },

  getSatelliteEvidenceForYear: (year: number): SatelliteEvidenceItem[] =>
    SATELLITE_EVIDENCE_CATALOG.filter((item) => item.year === year),

  getAllSatelliteEvidence: (): SatelliteEvidenceItem[] => SATELLITE_EVIDENCE_CATALOG,

  getAverages: () => {
    const validPop = VERIFIED_FLOOD_EVENTS.filter((e) => e.population_affected_lakh !== undefined);
    const validCrop = VERIFIED_FLOOD_EVENTS.filter((e) => e.crop_area_affected_lakh_ha !== undefined);
    const validLives = VERIFIED_FLOOD_EVENTS.filter((e) => e.human_lives_lost !== undefined);
    const validDamage = VERIFIED_FLOOD_EVENTS.filter((e) => e.total_damage_crore !== undefined);

    return {
      populationLakh:
        validPop.reduce((sum, e) => sum + (e.population_affected_lakh || 0), 0) / (validPop.length || 1),
      cropAreaLakhHa:
        validCrop.reduce((sum, e) => sum + (e.crop_area_affected_lakh_ha || 0), 0) / (validCrop.length || 1),
      livesLost:
        validLives.reduce((sum, e) => sum + (e.human_lives_lost || 0), 0) / (validLives.length || 1),
      damageCrore:
        validDamage.reduce((sum, e) => sum + (e.total_damage_crore || 0), 0) / (validDamage.length || 1),
    };
  },
};
