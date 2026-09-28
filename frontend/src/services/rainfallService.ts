import { ASSAM_SECTORS } from '../data/assamData';
import { RainfallForecast } from '../types';

export const rainfallService = {
  getForecast: (sectorId: string): RainfallForecast => {
    const sector = ASSAM_SECTORS[sectorId] || ASSAM_SECTORS['dhemaji'];
    return sector.rainfall;
  },

  calculateRunoffPotential: (rainfallMm: number, soilSaturationPercent: number): { runoffIndex: number; categorization: string } => {
    // Basic hydrological rational formula representation
    const potential = (rainfallMm / 200) * (soilSaturationPercent / 100);
    const index = Math.min(Math.round(potential * 100), 100);
    let categorization = 'Low Runoff Velocity';
    if (index > 75) categorization = 'Flash Torrent Surge Velocity';
    else if (index > 50) categorization = 'Rapid Overland Ponding';
    else if (index > 30) categorization = 'Moderate Gravity Drainage';
    return { runoffIndex: index, categorization };
  }
};
