import { RegionRisk } from '../types';

/**
 * ISOLATED MOCK DATA - LOCAL TESTING & FALLBACK ONLY
 *
 * IMPORTANT ARCHITECTURE RULE:
 * This data is strictly for offline testing when the backend API is unconfigured.
 * It must NOT silently masquerade as live backend data.
 * Backend risk_level is the authoritative source of truth.
 */
export const IS_MOCK_DATA = true as const;

export const mockRegionRiskData: RegionRisk[] = [
  {
    region_id: "dhemaji",
    name: "Dhemaji District",
    flood_probability: 91,
    risk_level: "SEVERE",
    timestamp: new Date().toISOString()
  },
  {
    region_id: "majuli",
    name: "Majuli Island",
    flood_probability: 81,
    risk_level: "HIGH",
    timestamp: new Date().toISOString()
  },
  {
    region_id: "lakhimpur",
    name: "North Lakhimpur",
    flood_probability: 64,
    risk_level: "MODERATE",
    timestamp: new Date().toISOString()
  },
  {
    region_id: "dibrugarh",
    name: "Dibrugarh",
    flood_probability: 48,
    risk_level: "MODERATE",
    timestamp: new Date().toISOString()
  },
  {
    region_id: "tinsukia",
    name: "Tinsukia",
    flood_probability: 21,
    risk_level: "LOW",
    timestamp: new Date().toISOString()
  }
];
