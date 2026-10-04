import React, { useState, useMemo } from 'react';
import { historicalDataService } from '../services/historicalDataService';
import { HistoricalHeader } from './history/HistoricalHeader';
import { YearSelector } from './history/YearSelector';
import { FloodMetricCard } from './history/FloodMetricCard';
import { HistoricalTrendChart } from './history/HistoricalTrendChart';
import { CityHistoricalTelemetry } from './history/CityHistoricalTelemetry';
import { EventSummary } from './history/EventSummary';
import { OfficialEvidence } from './history/OfficialEvidence';
import { SatelliteEvidence } from './history/SatelliteEvidence';
import { DataMethodology } from './history/DataMethodology';
import { FloodEvent, BackendHistoryRecord } from '../types';
import { DataState } from './data-state';

export interface HistoricalViewProps {
  /** Optional historical records from GET /api/history/{city_name} */
  cityRecords?: BackendHistoryRecord[] | Record<string, unknown>[];
  /** Selected city name */
  selectedCity?: string;
  /** Current data state: LOADING | SUCCESS | EMPTY | ERROR | BACKEND_UNAVAILABLE */
  dataState?: DataState;
  /** Error message if in ERROR or BACKEND_UNAVAILABLE state */
  errorMessage?: string;
  /** Retry callback */
  onRetry?: () => void | Promise<void>;
  /** Callback when city is selected */
  onSelectCity?: (city: string) => void;
  /** Explicit flag if development mock data is being viewed */
  isDevelopmentMock?: boolean;
}

export const HistoricalView: React.FC<HistoricalViewProps> = ({
  cityRecords,
  selectedCity,
  dataState,
  errorMessage,
  onRetry,
  onSelectCity,
  isDevelopmentMock,
}) => {
  // Available verified years from CSV: 2025 down to 2018
  const events = useMemo(() => historicalDataService.getAllEvents(), []);
  const years = useMemo(() => historicalDataService.getAvailableYears(), []);
  
  // Default to 2024 as requested in prompt context (or most complete recent benchmark)
  const [selectedYear, setSelectedYear] = useState<number>(2024);

  // Active event object
  const activeEvent: FloodEvent = useMemo(() => {
    return historicalDataService.getEventByYear(selectedYear) || events[0];
  }, [selectedYear, events]);

  // Lookup map for fast year tab badge rendering
  const eventsByYear = useMemo(() => {
    return Object.fromEntries(events.map((e) => [e.year, e]));
  }, [events]);

  // Proof sources and satellite evidence
  const proofSourcesForYear = useMemo(() => {
    return historicalDataService.getProofSourcesForYear(selectedYear);
  }, [selectedYear]);

  const allProofSources = useMemo(() => {
    return historicalDataService.getAllProofSources();
  }, []);

  const satelliteEvidenceForYear = useMemo(() => {
    return historicalDataService.getSatelliteEvidenceForYear(selectedYear);
  }, [selectedYear]);

  const allSatelliteEvidence = useMemo(() => {
    return historicalDataService.getAllSatelliteEvidence();
  }, []);

  // Determine official source link for the header badge
  const currentSourceUrl = useMemo(() => {
    const matchedSource = proofSourcesForYear.find((s) => s.resource.includes(selectedYear.toString())) 
      || allProofSources[0];
    return matchedSource?.url;
  }, [selectedYear, proofSourcesForYear, allProofSources]);

  return (
    <div className="w-full max-w-[1536px] mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6 min-w-0 font-sans">
      {/* 1. Header with Title, Subtitle, and Archive Badge */}
      <HistoricalHeader
        currentYearSource={activeEvent.source}
        sourceUrl={currentSourceUrl}
      />

      {/* 2. City Historical Telemetry (GET /api/history/{city_name}) */}
      <CityHistoricalTelemetry
        cityName={selectedCity}
        records={cityRecords}
        dataState={dataState}
        errorMessage={errorMessage}
        onRetry={onRetry}
        onSelectCity={onSelectCity}
        isDevelopmentMock={isDevelopmentMock}
      />

      {/* 3. Year Selector Tabs: 2025 | 2024 | 2023 | 2022 | 2021 | 2020 | 2019 | 2018 */}
      <YearSelector
        years={years}
        selectedYear={selectedYear}
        onSelectYear={setSelectedYear}
        eventsByYear={eventsByYear}
      />

      {/* 4. Flood Profile: Verified Impact Cards with Lucide Icons */}
      <FloodMetricCard event={activeEvent} />

      {/* 5. Event Summary ("What happened?") & Historical Trend Chart */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start min-w-0">
        {/* Left Column (2 cols wide): Interactive Trend Comparison Chart */}
        <div className="xl:col-span-2 min-w-0">
          <HistoricalTrendChart
            events={events}
            selectedYear={selectedYear}
            onSelectYear={setSelectedYear}
          />
        </div>

        {/* Right Column (1 col wide): Event Summary ("What happened?") */}
        <div className="xl:col-span-1 min-w-0">
          <EventSummary event={activeEvent} />
        </div>
      </div>

      {/* 6. Official Evidence & Satellite Evidence Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Official Evidence: Memoranda & Reports from verified CSV */}
        <OfficialEvidence
          selectedYear={selectedYear}
          sources={proofSourcesForYear}
          allSources={allProofSources}
        />

        {/* Satellite Evidence: NRSC/ISRO Satellite Maps & Sensors */}
        <SatelliteEvidence
          selectedYear={selectedYear}
          evidenceItems={satelliteEvidenceForYear}
          allEvidenceItems={allSatelliteEvidence}
        />
      </div>

      {/* 7. Data Quality & Scientific Methodology ("About this data") */}
      <DataMethodology />
    </div>
  );
};
