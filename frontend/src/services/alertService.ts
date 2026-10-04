/**
 * @deprecated LEGACY SERVICE.
 * Production flow: Component -> src/api/alerts.ts -> Backend GET /api/alerts
 * UI Mock flow: Component -> src/mocks/alerts.mock.ts or src/mocks/adapter.ts
 */

import { ACTIVE_FLOOD_ALERTS } from '../data/assamData';
import { FloodAlert, AlertSeverity } from '../types';

export const alertService = {
  getActiveAlerts: (severity?: AlertSeverity): FloodAlert[] => {
    if (!severity) return ACTIVE_FLOOD_ALERTS;
    return ACTIVE_FLOOD_ALERTS.filter((a) => a.riskLevel === severity);
  },

  subscribeToAlerts: async (destination: string, district: string): Promise<{ success: boolean; message: string }> => {
    // Backend endpoint does not exist. Do not pretend it successfully registered.
    return {
      success: false,
      message: `SMS dispatch service is not connected to a backend endpoint. Mobile notification for ${district} (${destination}) was not registered.`
    };
  }
};
