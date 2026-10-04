import React, { useState, useMemo } from 'react';
import { SectorData, InfrastructureItem } from '../types';
import { SectorImpactResponse } from '../api/impact';
import { ASSAM_SECTORS } from '../data/assamData';
import {
  DataStateBoundary,
  SkeletonCard,
  EmptyState,
  ErrorState,
  BackendUnavailable,
  DataState,
} from './data-state';
import {
  Users,
  Building2,
  GraduationCap,
  Navigation,
  ShieldAlert,
  MapPin,
  Compass,
  Database,
} from 'lucide-react';
import {
  normalizeBackendImpact,
  adaptSectorToImpact,
} from '../lib/impactAdapter';

export interface ImpactViewProps {
  currentSector: SectorData;
  onSelectSector: (sectorId: string) => void;
  onOpenShelterModal: () => void;
  /** Optional live impact data from GET /api/impact/{location_name} */
  impactData?: SectorImpactResponse | Record<string, unknown>;
  /** Current data state: LOADING | SUCCESS | EMPTY | ERROR | BACKEND_UNAVAILABLE */
  dataState?: DataState;
  /** Error message if in ERROR or BACKEND_UNAVAILABLE state */
  errorMessage?: string;
  /** Retry callback */
  onRetry?: () => void | Promise<void>;
  /** Explicit flag if development mock data is being viewed */
  isDevelopmentMock?: boolean;
}

export const ImpactView: React.FC<ImpactViewProps> = ({
  currentSector,
  onSelectSector,
  onOpenShelterModal,
  impactData,
  dataState: propDataState,
  errorMessage,
  onRetry,
  isDevelopmentMock,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'hospital' | 'school' | 'road' | 'bridge'>('all');
  const [selectedAsset, setSelectedAsset] = useState<InfrastructureItem | null>(null);

  // Normalize incoming impact data (or adapt currentSector for offline testing)
  const normalizedImpact = useMemo(() => {
    if (impactData) {
      return normalizeBackendImpact(impactData as Record<string, unknown>, currentSector);
    }
    return adaptSectorToImpact(currentSector);
  }, [impactData, currentSector]);

  const isMock =
    isDevelopmentMock !== undefined
      ? isDevelopmentMock
      : normalizedImpact.isMock;

  const infraList = normalizedImpact.infrastructureList;
  const filteredAssets = useMemo(() => {
    return activeCategory === 'all'
      ? infraList
      : infraList.filter((item) => item.type === activeCategory);
  }, [infraList, activeCategory]);

  const effectiveDataState: DataState =
    propDataState !== undefined
      ? propDataState
      : filteredAssets.length === 0
      ? 'EMPTY'
      : 'SUCCESS';

  const demographics = normalizedImpact.demographics;
  const counts = normalizedImpact.infrastructureCounts;

  return (
    <div className="w-full max-w-[1536px] mx-auto px-3.5 sm:px-6 lg:px-8 py-5 space-y-5 animate-in fade-in duration-200 min-w-0">
      {/* Top Header & Sector Switcher */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-300 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse flex-shrink-0" />
            <span className="text-xs font-mono font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase truncate">
              EXPOSURE &amp; HUMAN VULNERABILITY ANALYSIS
            </span>
            {isMock && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                <Database className="w-3 h-3" />
                <span>DEV MOCK • SIMULATED EXPOSURE MODEL</span>
              </span>
            )}
          </div>
          <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#0b1c30] dark:text-slate-100">
            Who and What Will Be Affected?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
            Distinguishing flood hazard (water depth &amp; spread) from real physical exposure (population, schools, healthcare, transport arteries).
          </p>
        </div>

        {/* Sector Quick Switcher (min-h-[44px] touch target) */}
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 p-2 rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto max-w-full touch-pan-x scrollbar-none self-start lg:self-auto">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase font-mono mr-1 flex-shrink-0">Sector:</span>
          {Object.values(ASSAM_SECTORS).map((s) => (
            <button
              key={s.id}
              onClick={() => {
                onSelectSector(s.id);
                setSelectedAsset(null);
              }}
              className={`px-3.5 py-2 min-h-[44px] text-xs rounded-md font-semibold transition whitespace-nowrap flex-shrink-0 cursor-pointer flex items-center justify-center ${s.id === currentSector.id
                  ? 'bg-[#0b1c30] dark:bg-sky-600 text-white font-bold'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                }`}
            >
              {s.district}
            </button>
          ))}
        </div>
      </div>

      {/* Authoritative Data State Controller */}
      <DataStateBoundary
        state={effectiveDataState}
        loadingComponent={
          <div className="space-y-5" aria-busy="true">
            <SkeletonCard variant="metric" count={5} />
            <SkeletonCard variant="list" count={4} />
          </div>
        }
        emptyComponent={
          <EmptyState
            title="No prediction data available."
            description="No critical infrastructure assets recorded in the selected category."
            actionLabel={activeCategory !== 'all' ? 'Show All Categories' : undefined}
            onAction={activeCategory !== 'all' ? () => setActiveCategory('all') : undefined}
          />
        }
        errorComponent={
          <ErrorState
            title="Unable to load impact data."
            message={errorMessage || 'Could not retrieve human exposure and infrastructure telemetry from the impact service.'}
            onRetry={onRetry}
          />
        }
        backendUnavailableComponent={
          <BackendUnavailable
            title="FloodGuard backend is currently unavailable."
            message="Infrastructure exposure assessment and vulnerability service is unreachable."
            onRetry={onRetry}
          />
        }
      >
        <div className="space-y-5">
          {/* Exposure Metrics Banner: Population & Vulnerable Demographics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total Population At Risk */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-300 dark:border-slate-800 shadow-sm transition-colors">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase font-mono">
                <span>Total Exposed</span>
                <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="mt-2 text-3xl font-heading font-extrabold text-[#0b1c30] dark:text-slate-100">
                {normalizedImpact.populationAtRisk !== undefined
                  ? `${((normalizedImpact.populationAtRisk) / 1000).toFixed(0)}K`
                  : '—'}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {normalizedImpact.populationAtRisk !== undefined
                  ? `${normalizedImpact.populationAtRisk.toLocaleString()} residents in risk zone`
                  : 'Census exposure not reported'}
              </div>
            </div>

            {/* Children Under 5 */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-300 dark:border-slate-800 shadow-sm transition-colors">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase font-mono">
                <span>Children Under 5</span>
                <span className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-transparent dark:border-red-900 text-[10px] font-bold">Priority</span>
              </div>
              <div className="mt-2 text-3xl font-heading font-extrabold text-red-700 dark:text-red-400">
                {demographics.childrenUnder5 !== undefined
                  ? demographics.childrenUnder5.toLocaleString()
                  : '—'}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {demographics.childrenUnder5 !== undefined
                  ? 'Specialized pediatric evacuation need'
                  : 'Data not reported by district'}
              </div>
            </div>

            {/* Elderly Above 65 */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-300 dark:border-slate-800 shadow-sm transition-colors">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase font-mono">
                <span>Elderly (65+)</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-transparent dark:border-amber-900 text-[10px] font-bold">Assisted</span>
              </div>
              <div className="mt-2 text-3xl font-heading font-extrabold text-amber-800 dark:text-amber-400">
                {demographics.elderlyAbove65 !== undefined
                  ? demographics.elderlyAbove65.toLocaleString()
                  : '—'}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {demographics.elderlyAbove65 !== undefined
                  ? 'Mobility assistance required'
                  : 'Data not reported by district'}
              </div>
            </div>

            {/* Livestock & Cattle */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-300 dark:border-slate-800 shadow-sm transition-colors">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase font-mono">
                <span>Livestock Exposed</span>
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">High Bunds</span>
              </div>
              <div className="mt-2 text-3xl font-heading font-extrabold text-slate-800 dark:text-slate-100">
                {demographics.livestockCount !== undefined
                  ? demographics.livestockCount.toLocaleString()
                  : '—'}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {demographics.livestockCount !== undefined
                  ? 'Cattle, goats & buffaloes'
                  : 'Livestock census not available'}
              </div>
            </div>

            {/* Evacuation Shelters */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-300 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase font-mono">
                  <span>Safe Shelters</span>
                  <ShieldAlert className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="mt-2 text-3xl font-heading font-extrabold text-emerald-700 dark:text-emerald-400">
                  {counts.schools !== undefined ? `${counts.schools} Designated` : '—'}
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenShelterModal}
                className="mt-2 text-xs font-bold text-sky-700 dark:text-sky-400 hover:text-sky-900 dark:hover:text-sky-300 text-left cursor-pointer"
              >
                View Shelter Roster →
              </button>
            </div>
          </div>

          {/* Critical Infrastructure Breakdown Section */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
            {/* Category Tabs */}
            <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex flex-col md:flex-row md:items-center justify-between gap-3 min-w-0">
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-full touch-pan-x scrollbar-none pb-1 md:pb-0">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase font-mono mr-2 flex-shrink-0">Filter Assets:</span>
                <button
                  type="button"
                  onClick={() => setActiveCategory('all')}
                  className={`px-3.5 py-2 min-h-[44px] text-xs font-semibold rounded-lg transition whitespace-nowrap flex-shrink-0 cursor-pointer flex items-center justify-center ${activeCategory === 'all'
                      ? 'bg-[#0b1c30] dark:bg-slate-100 text-white dark:text-slate-900 font-bold'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                    }`}
                >
                  All Assets ({infraList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCategory('hospital')}
                  className={`px-3.5 py-2 min-h-[44px] text-xs font-semibold rounded-lg transition flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 cursor-pointer justify-center ${activeCategory === 'hospital'
                      ? 'bg-red-700 text-white font-bold'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                    }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Hospitals ({counts.hospitals ?? 0})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCategory('school')}
                  className={`px-3.5 py-2 min-h-[44px] text-xs font-semibold rounded-lg transition flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 cursor-pointer justify-center ${activeCategory === 'school'
                      ? 'bg-indigo-700 text-white font-bold'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                    }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Schools/Shelters ({counts.schools ?? 0})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCategory('road')}
                  className={`px-3.5 py-2 min-h-[44px] text-xs font-semibold rounded-lg transition flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 cursor-pointer justify-center ${activeCategory === 'road'
                      ? 'bg-orange-700 text-white font-bold'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                    }`}
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Roads ({counts.roads ?? 0})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCategory('bridge')}
                  className={`px-3.5 py-2 min-h-[44px] text-xs font-semibold rounded-lg transition flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 cursor-pointer justify-center ${activeCategory === 'bridge'
                      ? 'bg-slate-800 dark:bg-slate-700 text-white font-bold'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                    }`}
                >
                  <span>Bridges ({counts.bridges ?? 0})</span>
                </button>
              </div>

              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                District: {normalizedImpact.district} • Sub-Division: {normalizedImpact.subdivision || currentSector.subdivision}
              </span>
            </div>

          {/* Infrastructure Assets Table / Cards Grid */}
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {filteredAssets.map((asset) => {
            const isCritical = asset.riskLevel === 'CRITICAL';
            const isHigh = asset.riskLevel === 'HIGH';
            const isSafe = asset.status.toLowerCase().includes('safe') || asset.status.toLowerCase().includes('open');

            return (
              <div
                key={asset.id}
                onClick={() => setSelectedAsset(asset)}
                className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 ${selectedAsset?.id === asset.id ? 'bg-sky-50/80 dark:bg-sky-950/40 border-l-4 border-sky-600' : ''
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${asset.type === 'hospital' ? 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300' :
                      asset.type === 'school' ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300' :
                        asset.type === 'road' ? 'bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                    }`}>
                    {asset.type === 'hospital' && <Building2 className="w-5 h-5" />}
                    {asset.type === 'school' && <GraduationCap className="w-5 h-5" />}
                    {asset.type === 'road' && <Navigation className="w-5 h-5" />}
                    {asset.type === 'bridge' && <Compass className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{asset.name}</h4>
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${isCritical ? 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-transparent dark:border-red-900' :
                          isHigh ? 'bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 border border-transparent dark:border-orange-900' :
                            'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-transparent dark:border-emerald-900'
                        }`}>
                        {asset.riskLevel} RISK
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2 font-mono">
                      <span>Status: <strong className="text-slate-800 dark:text-slate-200">{asset.status}</strong></span>
                      <span>•</span>
                      <span>Distance to Flood: <strong className="text-slate-800 dark:text-slate-200">{asset.distanceFromInundationM}m</strong></span>
                      {asset.capacityOrBeds && (
                        <>
                          <span>•</span>
                          <span>Capacity: <strong className="text-slate-800 dark:text-slate-200">{asset.capacityOrBeds}</strong></span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">{asset.details}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAsset(asset);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </div>
      </DataStateBoundary>

      {/* Modal / Detail Drawer for selected asset */}
      {selectedAsset && (
        <div className="p-4 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-900 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in transition-colors">
          <div>
            <span className="text-[10px] font-bold text-sky-800 dark:text-sky-300 uppercase font-mono">
              INSPECTION PIN: {selectedAsset.name}
            </span>
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
              Coordinates: {currentSector.coordinates.lat.toFixed(4)}°N, {currentSector.coordinates.lng.toFixed(4)}°E • Recommendation: {selectedAsset.details}
            </p>
          </div>
          <button
            onClick={() => setSelectedAsset(null)}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded text-xs font-semibold"
          >
            Dismiss Details
          </button>
        </div>
      )}
    </div>
  );
};
