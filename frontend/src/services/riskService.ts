import { SectorData } from '../types';
import { ASSAM_SECTORS } from '../data/assamData';
let cachedSimulation: any[] | null = null;

export const riskService = {
  getAllSectors: (): Record<string, SectorData> => {
    return ASSAM_SECTORS;
  },

  getSectorRisk: async (sectorId: string, forecastHour: number = 0): Promise<SectorData> => {
    try {
      if (!cachedSimulation) {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/simulate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ severity_multiplier: 1.0, use_live_weather: true })
        });
        const data = await res.json();
        cachedSimulation = data.simulation || [];
      }
    } catch (e) {
      console.warn("Backend ML API unreachable, using local mock data", e);
    }

    const baseSector = { ...(ASSAM_SECTORS[sectorId] || ASSAM_SECTORS['dhemaji']) };
    
    // Inject Live Backend ML Data if available
    if (cachedSimulation) {
      const backendData = cachedSimulation.find(s => 
        s.name.toLowerCase() === baseSector.district.toLowerCase() || 
        s.name.toLowerCase() === sectorId.toLowerCase()
      );
      if (backendData) {
        // Map backend 0-3 risk score to frontend 0-100 index
        const mappedScore = backendData.risk_score === 3 ? 95 : backendData.risk_score === 2 ? 75 : backendData.risk_score === 1 ? 45 : 15;
        const mappedLevel = backendData.risk_score === 3 ? 'CRITICAL' : backendData.risk_score === 2 ? 'HIGH' : backendData.risk_score === 1 ? 'MODERATE' : 'LOW';
        
        baseSector.vulnerabilityIndex = mappedScore;
        baseSector.hazardLevel = mappedLevel as any;
        baseSector.inundationAreaKm2 = backendData.inundation_pct || baseSector.inundationAreaKm2;
        if (backendData.impact) {
          baseSector.populationAtRisk = backendData.impact.population_at_risk || baseSector.populationAtRisk;
        }
      }
    }

    if (forecastHour === 0) {
      return baseSector;
    }

    const step = baseSector.timeline.find((t) => t.hour === forecastHour);
    if (!step) return baseSector;

    return {
      ...baseSector,
      vulnerabilityIndex: step.riskScore,
      hazardLevel: step.riskLevel,
      floodProb: step.floodProbability,
      inundationAreaKm2: step.inundationAreaKm2,
      populationAtRisk: step.populationAtRisk,
      stageAbsolute: step.riverStageM,
    };
  },

  getGlobalRiskStats: () => {
    const sectors = Object.values(ASSAM_SECTORS);
    const criticalCount = sectors.filter((s) => s.hazardLevel === 'CRITICAL' || s.hazardLevel === 'HIGH').length;
    const totalPopAtRisk = sectors.reduce((acc, s) => acc + s.populationAtRisk, 0);
    const totalInundationKm2 = sectors.reduce((acc, s) => acc + s.inundationAreaKm2, 0);
    return {
      activeSectorsCount: sectors.length,
      highRiskDistricts: criticalCount,
      totalPopAtRisk,
      totalInundationKm2: Math.round(totalInundationKm2),
      cwcMonitoringStations: 10,
    };
  }
};
