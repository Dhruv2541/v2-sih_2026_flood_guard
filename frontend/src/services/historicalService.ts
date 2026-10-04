/**
 * @deprecated LEGACY SERVICE.
 * Production flow: Component -> src/api/history.ts -> Backend GET /api/history/{city_name}
 * UI Mock flow: Component -> src/mocks/history.mock.ts or src/mocks/adapter.ts
 */

import { HISTORICAL_DATA } from '../data/assamData';
import { HistoricalYearRecord } from '../types';

export const historicalService = {
  getAllHistoricalYears: (): HistoricalYearRecord[] => {
    return HISTORICAL_DATA;
  },

  getYearRecord: (year: number): HistoricalYearRecord | undefined => {
    return HISTORICAL_DATA.find((item) => item.year === year);
  },

  getRainfallFloodCorrelation: () => {
    return HISTORICAL_DATA.map((item) => ({
      year: item.year,
      rainfallMm: item.monsoonRainfallMm,
      inundationAreaKm2: item.floodInundationAreaKm2,
      affectedPopM: (item.affectedPopulationTotal / 1000000).toFixed(2),
      damagesCr: item.damagesCrInr
    }));
  }
};
