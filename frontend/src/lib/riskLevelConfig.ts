import { CircleAlert, TriangleAlert, ShieldCheck, type LucideIcon } from 'lucide-react';
import type { AlertSeverity } from '../types';

export type RiskAnimationVariant = 'critical' | 'high' | 'moderate' | 'low';

export interface RiskLevelConfig {
  tier: AlertSeverity;
  label: string;
  statusLine: string;
  badgeBg: string;
  borderClass: string;
  glowClass: string;
  accentText: string;
  cardBg: string;
  icon: LucideIcon;
  animationVariant: RiskAnimationVariant;
}

export function getRiskLevelConfig(level?: AlertSeverity | string | null): RiskLevelConfig {
  const norm = level?.toUpperCase();

  if (norm === 'CRITICAL' || norm === 'SEVERE') {
    return {
      tier: 'CRITICAL',
      label: 'CRITICAL FLOOD EMERGENCY',
      statusLine: 'Severe risk • Immediate protective action required',
      badgeBg: 'bg-red-600 text-white',
      borderClass: 'border-red-400 dark:border-red-800',
      glowClass: 'shadow-red-500/10 dark:shadow-red-950/40',
      accentText: 'text-red-600 dark:text-red-400',
      cardBg: 'bg-white dark:bg-slate-900',
      icon: CircleAlert,
      animationVariant: 'critical',
    };
  }

  if (norm === 'HIGH') {
    return {
      tier: 'HIGH',
      label: 'HIGH FLOOD RISK',
      statusLine: 'High risk • Prepare for rapid inundation & evacuation',
      badgeBg: 'bg-red-600 text-white',
      borderClass: 'border-red-300 dark:border-red-800/80',
      glowClass: 'shadow-red-500/10',
      accentText: 'text-red-600 dark:text-red-400',
      cardBg: 'bg-white dark:bg-slate-900',
      icon: TriangleAlert,
      animationVariant: 'high',
    };
  }

  if (norm === 'MODERATE') {
    return {
      tier: 'MODERATE',
      label: 'MODERATE FLOOD WATCH',
      statusLine: 'Moderate risk • Monitor water levels & official advisories',
      badgeBg: 'bg-amber-600 text-white',
      borderClass: 'border-amber-300 dark:border-amber-800/80',
      glowClass: 'shadow-amber-500/10',
      accentText: 'text-amber-600 dark:text-amber-400',
      cardBg: 'bg-white dark:bg-slate-900',
      icon: TriangleAlert,
      animationVariant: 'moderate',
    };
  }

  return {
    tier: 'LOW',
    label: 'LOW FLOOD RISK',
    statusLine: 'Low risk • Normal monitoring conditions',
    badgeBg: 'bg-emerald-600 text-white',
    borderClass: 'border-emerald-300 dark:border-emerald-800/80',
    glowClass: 'shadow-emerald-500/10',
    accentText: 'text-emerald-600 dark:text-emerald-400',
    cardBg: 'bg-white dark:bg-slate-900',
    icon: ShieldCheck,
    animationVariant: 'low',
  };
}
