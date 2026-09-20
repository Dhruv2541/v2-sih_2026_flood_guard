import { ACTIVE_FLOOD_ALERTS } from '../data/assamData';
import { FloodAlert, AlertSeverity } from '../types';

export const alertService = {
  getActiveAlerts: (severity?: AlertSeverity): FloodAlert[] => {
    if (!severity) return ACTIVE_FLOOD_ALERTS;
    return ACTIVE_FLOOD_ALERTS.filter((a) => a.riskLevel === severity);
  },

  subscribeToAlerts: async (destination: string, district: string): Promise<{ success: boolean; message: string }> => {
    // Simulate instantaneous dispatch registration
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      success: true,
      message: `Emergency SMS & Siren alert dispatch successfully registered for ${district} (${destination}).`
    };
  }
};
