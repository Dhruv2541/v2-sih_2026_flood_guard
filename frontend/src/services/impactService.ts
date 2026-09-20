import { ASSAM_SECTORS } from '../data/assamData';
import { InfrastructureItem } from '../types';

export const impactService = {
  getInfrastructureForSector: (sectorId: string): InfrastructureItem[] => {
    const sector = ASSAM_SECTORS[sectorId] || ASSAM_SECTORS['dhemaji'];
    return sector.infrastructureList;
  },

  getPopulationExposure: (sectorId: string) => {
    const sector = ASSAM_SECTORS[sectorId] || ASSAM_SECTORS['dhemaji'];
    return {
      totalPopulation: sector.populationAtRisk,
      demographics: sector.vulnerableDemographics,
      infrastructureSummary: sector.infrastructureCounts
    };
  }
};
