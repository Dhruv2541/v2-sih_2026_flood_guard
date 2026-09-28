import React, { useMemo, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import {
  floodArchiveService,
  FloodEvent,
} from '../services/floodArchiveService';
import { HistoricalHeader } from './history/HistoricalHeader';
import { YearSelector } from './history/YearSelector';
import { FloodMetricCard } from './history/FloodMetricCard';
import { HistoricalTrendChart } from './history/HistoricalTrendChart';
import { EventSummary } from './history/EventSummary';
import { OfficialEvidence } from './history/OfficialEvidence';
import { SatelliteEvidence } from './history/SatelliteEvidence';
import { DataMethodology } from './history/DataMethodology';
import {
  AlertTriangle,
  ExternalLink,
  Home,
  IndianRupee,
  Map,
  PawPrint,
  Users,
  Wheat,
} from 'lucide-react';

type Severity = 'Catastrophic' | 'Severe' | 'Moderate' | 'Low impact';

const severityFor = (event: FloodEvent): Severity => {
  const pop = event.population_affected_lakh ?? 0;
  const deaths = event.human_lives_lost ?? 0;
  const damage = event.total_damage_crore ?? 0;

  if (pop >= 50 || deaths >= 150 || damage >= 2500) return 'Catastrophic';
  if (pop >= 30 || deaths >= 100 || damage >= 1000) return 'Severe';
  if (pop >= 10 || deaths >= 20 || damage >= 100) return 'Moderate';
  return 'Low impact';
};

const severityStyle: Record<Severity, { chip: string; dot: string; label: string }> = {
  Catastrophic: {
    chip: 'bg-violet-100 text-violet-800 dark:bg-violet-950/70 dark:text-violet-200 border-violet-200 dark:border-violet-800',
    dot: 'bg-violet-600 dark:bg-violet-400',
    label: 'Catastrophic Event',
  },
  Severe: {
    chip: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-200 border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-600 dark:bg-amber-400',
    label: 'Severe Surge',
  },
  Moderate: {
    chip: 'bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-200 border-sky-200 dark:border-sky-800',
    dot: 'bg-sky-600 dark:bg-sky-400',
    label: 'Moderate Wave',
  },
  'Low impact': {
    chip: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700',
    dot: 'bg-slate-600 dark:bg-slate-300',
    label: 'Localized Impact',
  },
};

export const HistoricalView: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const { resolvedTheme } = useTheme();
  const reduceMotion = usePrefersReducedMotion();
  const isDark = resolvedTheme === 'dark';

  // Load verified events from floodArchiveService (backed by assam_flood_events_2018_2025_verified.csv)
  const allEvents = useMemo(() => floodArchiveService.getEvents(), []);
  const availableYears = useMemo(() => allEvents.map((e) => e.year), [allEvents]);

  // Selected year event
  const currentEvent: FloodEvent = useMemo(() => {
    return (
      allEvents.find((e) => e.year === selectedYear) ||
      allEvents[0] || {
        year: 2024,
        population_affected_lakh: null,
        crop_area_affected_lakh_ha: null,
        human_lives_lost: null,
        cattle_lost: null,
        total_damage_crore: null,
        villages_affected: null,
        districts_affected: null,
        source: 'Verified Government Records',
      }
    );
  }, [allEvents, selectedYear]);

  const severity = severityFor(currentEvent);

  // Relevant proof sources and satellite evidence
  const proofSources = useMemo(
    () => floodArchiveService.getProofSourcesForYear(selectedYear),
    [selectedYear]
  );
  const satelliteEvidence = useMemo(
    () => floodArchiveService.getSatelliteEvidenceForYear(selectedYear),
    [selectedYear]
  );

  return (
    <div className="w-full max-w-[1536px] mx-auto px-3.5 sm:px-6 lg:px-8 py-5 space-y-6 min-w-0">
      {/* 1. Header */}
      <HistoricalHeader />

      {/* 2. Year Selector */}
      <YearSelector
        years={availableYears}
        selectedYear={selectedYear}
        onSelectYear={(yr) => setSelectedYear(yr)}
      />

      {/* 3. Selected Year Flood Profile */}
      <section
        id={`year-panel-${selectedYear}`}
        role="tabpanel"
        aria-labelledby={`year-tab-${selectedYear}`}
        className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-5 transition-all ${
          reduceMotion ? 'duration-0' : 'duration-200'
        }`}
      >
        {/* Profile Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0b1c30] dark:text-white font-heading">
              {currentEvent.year} Flood Profile
            </h2>
            <span
              className={`px-3 py-1 rounded-full border text-xs font-extrabold uppercase font-mono flex items-center gap-1.5 ${severityStyle[severity].chip}`}
            >
              <span className={`w-2 h-2 rounded-full ${severityStyle[severity].dot}`} aria-hidden="true" />
              {severityStyle[severity].label}
            </span>
          </div>

          {/* Source Indicator Badge */}
          <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono text-slate-500 dark:text-slate-400">
            <span className="font-semibold">Source:</span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium break-words max-w-[300px]">
              {currentEvent.source}
            </span>
          </div>
        </div>

        {/* Flood Metric Cards Grid */}
        <div className="flex flex-col gap-3.5">
          {/* Top Row: 4 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. Population Affected */}
            <FloodMetricCard
              label="Population Affected"
              value={
                currentEvent.population_affected_lakh !== null && currentEvent.population_affected_lakh !== undefined
                  ? currentEvent.population_affected_lakh.toLocaleString()
                  : null
              }
              unit="Lakh"
              note={
                currentEvent.population_affected_lakh
                  ? `~${Math.round(currentEvent.population_affected_lakh * 100000).toLocaleString()} people`
                  : undefined
              }
              Icon={Users}
              accentColor="text-sky-700 dark:text-sky-400"
              hideIfUnavailable={false}
            />

            {/* 2. Villages Affected */}
            <FloodMetricCard
              label="Villages Affected"
              value={currentEvent.villages_affected}
              unit="Villages"
              note="Notified inundated villages"
              Icon={Home}
              accentColor="text-orange-600 dark:text-orange-400"
              hideIfUnavailable={false}
            />

            {/* 3. Districts Affected */}
            <FloodMetricCard
              label="Districts Affected"
              value={
                currentEvent.districts_affected
                  ? `${currentEvent.districts_affected} of 35`
                  : null
              }
              note="Administrative revenue districts"
              Icon={Map}
              accentColor="text-indigo-600 dark:text-indigo-400"
              hideIfUnavailable={false}
            />

            {/* 4. Crop Area Affected (Distinct from Total Inundation) */}
            <FloodMetricCard
              label="Crop Area Affected"
              value={
                currentEvent.crop_area_affected_lakh_ha !== null && currentEvent.crop_area_affected_lakh_ha !== undefined
                  ? currentEvent.crop_area_affected_lakh_ha.toLocaleString()
                  : null
              }
              unit="Lakh Ha"
              note={
                currentEvent.crop_area_affected_lakh_ha
                  ? `~${Math.round(currentEvent.crop_area_affected_lakh_ha * 100000).toLocaleString()} Hectares`
                  : 'Agricultural crop damage only'
              }
              Icon={Wheat}
              accentColor="text-emerald-700 dark:text-emerald-400"
              hideIfUnavailable={false}
            />
          </div>

          {/* Bottom Row: 3 cards centered */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 lg:w-[75%] lg:mx-auto">
            {/* 5. Human Lives Lost */}
            <FloodMetricCard
              label="Human Lives Lost"
              value={currentEvent.human_lives_lost}
              unit="Fatalities"
              note="Official government confirmed count"
              Icon={AlertTriangle}
              accentColor="text-rose-600 dark:text-rose-400"
              hideIfUnavailable={false}
            />

            {/* 6. Cattle Lost */}
            <FloodMetricCard
              label="Cattle Lost"
              value={currentEvent.cattle_lost}
              unit="Livestock"
              note="Reported livestock casualties"
              Icon={PawPrint}
              accentColor="text-purple-600 dark:text-purple-400"
              hideIfUnavailable={false}
            />

            {/* 7. Estimated Economic Damage */}
            <FloodMetricCard
              label="Estimated Economic Damage"
              value={
                currentEvent.total_damage_crore !== null && currentEvent.total_damage_crore !== undefined
                  ? `₹${currentEvent.total_damage_crore.toLocaleString()}`
                  : null
              }
              unit={currentEvent.total_damage_crore ? 'Cr' : undefined}
              note="Public infrastructure & crop losses"
              Icon={IndianRupee}
              accentColor="text-amber-600 dark:text-amber-400"
              hideIfUnavailable={false}
            />
          </div>
        </div>
      </section>

      {/* 4. Event Summary: "What happened?" */}
      <EventSummary event={currentEvent} />

      {/* 5. Recharts Historical Trend Comparison */}
      <HistoricalTrendChart
        events={allEvents}
        selectedYear={selectedYear}
        onSelectYear={(yr) => setSelectedYear(yr)}
        isDark={isDark}
        reduceMotion={reduceMotion}
      />

      {/* 6. Official Evidence & Proof Documents */}
      <OfficialEvidence sources={proofSources} year={selectedYear} />

      {/* 7. Satellite Evidence (Specific Acquisition Observations) */}
      <SatelliteEvidence evidence={satelliteEvidence} year={selectedYear} />

      {/* 8. Data Quality & Scientific Methodology */}
      <DataMethodology />
    </div>
  );
};
