import { ASSAM_SECTORS } from '../data/assamData';
import { SectorData } from '../types';

export const inundationService = {
  getInundationOverview: (sectorId: string) => {
    const sector = ASSAM_SECTORS[sectorId] || ASSAM_SECTORS['dhemaji'];
    return {
      extentKm2: sector.inundationAreaKm2,
      depthAvgM: sector.waterDepthAvgM,
      depthPeakM: sector.waterDepthPeakM,
      path: sector.inundationPathSummary,
      neighborhoods: sector.affectedNeighborhoods,
      riverStage: sector.stageAbsolute,
      dangerMark: sector.dangerLevel,
      delta: sector.riverStageDelta
    };
  }
};
