import React, { useState, useRef, useEffect } from 'react';
import { 
  MapPin, 
  Navigation, 
  Search, 
  ShieldAlert, 
  Clock, 
  Users, 
  Droplets, 
  ChevronDown, 
  ChevronUp, 
  Activity, 
  Map, 
  HelpCircle, 
  Compass, 
  Layers,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Waves
} from 'lucide-react';
import { SectorData } from '../types';
import { ASSAM_SECTORS } from '../data/assamData';
import { getRiskLevelConfig } from '../lib/riskLevelConfig';
import { RiskStatusAnimation } from './RiskStatusAnimation';
import { useCountUp } from '../hooks/useCountUp';

interface RiskHeroProps {
  currentSector: SectorData | null;
  onSelectSector: (sectorId: string) => void;
  onUseLocation: () => void;
  locationLoading?: boolean;
  isAnalyzing?: boolean;
  onViewRiskMap: () => void;
  onWhatShouldIDo: () => void;
  onViewPredictions: () => void;
}

export const RiskHero: React.FC<RiskHeroProps> = ({
  currentSector,
  onSelectSector,
  onUseLocation,
  locationLoading = false,
  isAnalyzing = false,
  onViewRiskMap,
  onWhatShouldIDo,
  onViewPredictions,
}) => {
  const [query, setQuery] = useState(currentSector?.district ?? '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(currentSector?.district ?? '');
  }, [currentSector?.id, currentSector?.district]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter sectors for search
  const filteredSectors = Object.values(ASSAM_SECTORS).filter((s) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      s.district.toLowerCase().includes(q) ||
      s.stationName.toLowerCase().includes(q) ||
      s.riverName.toLowerCase().includes(q) ||
      s.affectedNeighborhoods.some((n) => n.toLowerCase().includes(q))
    );
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const match = filteredSectors[0];
    if (match) {
      onSelectSector(match.id);
      setQuery(match.district);
      setShowDropdown(false);
    }
  };

  // Centralized risk-level visual config (color/label/status-line/animation),
  // shared with RiskStatusAnimation. See lib/riskLevelConfig.ts.
  const riskConfig = getRiskLevelConfig(currentSector?.hazardLevel);
  const isCritical = riskConfig.tier === 'CRITICAL';
  const isHigh = riskConfig.tier === 'HIGH';
  const RiskIcon = riskConfig.icon;

  // Count-up transition for the primary flood-probability figure. Re-renders
  // (not remounts) drive this, so it eases from the previously selected
  // area's value to the newly selected one.
  const animatedFloodProb = useCountUp(currentSector?.floodProb ?? 0, 700);

  return (
    <section className="pt-4 pb-2 px-3 sm:px-6 lg:px-8 max-w-[1536px] mx-auto w-full min-w-0">
      {/* 1. Compact Location Search & Official Alerts */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
        {/* Search Input Bar */}
        <div className="relative w-full lg:max-w-xl group">
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex items-center gap-2 overflow-hidden bg-white dark:bg-slate-900 border border-cyan-500/30 dark:border-cyan-400/25 rounded-xl px-3 py-2 shadow-[0_0_0_1px_rgba(14,165,233,0.06)] transition-all duration-300 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20 focus-within:shadow-[0_0_18px_rgba(14,165,233,0.25)] hover:shadow-[0_0_14px_rgba(14,165,233,0.15)]"
          >
            {/* Water surge background layer */}
            <svg
              className="search-wave-layer search-wave-layer-back"
              viewBox="0 0 200 40"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M0 24 Q 12.5 14, 25 24 T 50 24 T 75 24 T 100 24 T 125 24 T 150 24 T 175 24 T 200 24 V40 H0 Z"
                fill="#0284c7"
                opacity="0.2"
              />
            </svg>
            <svg
              className="search-wave-layer search-wave-layer-front"
              viewBox="0 0 200 40"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M0 27 Q 10 19, 20 27 T 40 27 T 60 27 T 80 27 T 100 27 T 120 27 T 140 27 T 160 27 T 180 27 T 200 27 V40 H0 Z"
                fill="#0ea5e9"
                opacity="0.15"
              />
            </svg>

            {/* Raindrop micro-accents */}
            <span className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
              <span className="search-rain-streak" style={{ left: '10%', animationDelay: '0s' }} />
              <span className="search-rain-streak" style={{ left: '28%', animationDelay: '0.5s' }} />
              <span className="search-rain-streak" style={{ left: '46%', animationDelay: '1s' }} />
              <span className="search-rain-streak" style={{ left: '64%', animationDelay: '1.6s' }} />
              <span className="search-rain-streak" style={{ left: '82%', animationDelay: '0.9s' }} />
              <span className="search-rain-streak" style={{ left: '94%', animationDelay: '1.3s' }} />
            </span>

            <Search className="relative z-10 w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
            <input
              ref={inputRef}
              id="flood-risk-search-input"
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Select a district, village, or town..."
              className="relative z-10 w-full text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm font-medium focus:outline-none bg-transparent py-1"
            />
            <button
              type="button"
              onClick={onUseLocation}
              disabled={locationLoading}
              title="Use GPS Coordinates"
              className="relative z-10 flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200 dark:border-sky-800/80 transition-all duration-300 flex-shrink-0"
            >
              <Navigation className={`w-3 h-3 ${locationLoading ? 'animate-spin text-sky-600' : ''}`} />
              <span className="hidden sm:inline">Use Location</span>
            </button>
          </form>

          {/* Autocomplete Dropdown */}
          {showDropdown && (
            <div
              ref={dropdownRef}
              className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden max-h-72 overflow-y-auto"
            >
              <div className="p-2 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                Select Assam District
              </div>
              {filteredSectors.map((sector) => {
                const isSelected = sector.id === currentSector?.id;
                return (
                  <button
                    key={sector.id}
                    type="button"
                    onClick={() => {
                      onSelectSector(sector.id);
                      setQuery(sector.district);
                      setShowDropdown(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 border-b border-slate-50 dark:border-slate-800/50 last:border-0 transition ${
                      isSelected ? 'bg-sky-50/70 dark:bg-slate-800 font-bold' : ''
                    }`}
                  >
                    <div>
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {sector.district}
                      </span>
                      <span className="text-xs text-slate-400 ml-2 font-mono">
                        {sector.riverName}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        sector.hazardLevel === 'HIGH' || sector.hazardLevel === 'CRITICAL'
                          ? 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300'
                          : sector.hazardLevel === 'MODERATE'
                          ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                          : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      {sector.hazardLevel} • {sector.floodProb}%
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <a
          href="https://sachet.ndma.gov.in/"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex w-full min-w-0 items-center gap-3 rounded-xl border border-sky-200/70 bg-sky-50/60 px-3 py-2 text-sky-800 transition-colors hover:border-sky-300 hover:bg-sky-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 dark:border-sky-800/60 dark:bg-sky-950/30 dark:text-sky-200 dark:hover:border-sky-700 dark:hover:bg-sky-900/40 dark:focus-visible:ring-sky-400 dark:focus-visible:ring-offset-slate-950 lg:max-w-md"
        >
          <ExternalLink aria-hidden="true" className="h-4 w-4 shrink-0 text-sky-700 dark:text-sky-300" />
          <span className="min-w-0">
            <span className="block text-xs font-semibold group-hover:underline underline-offset-4">
              Official NDMA Disaster Alerts
            </span>
            <span className="mt-0.5 block text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              View official disaster warnings and public alerts from NDMA Sachet.
            </span>
          </span>
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </div>

      {/* Analyzing Banner (Subtle Feedback) */}
      {isAnalyzing && currentSector && (
        <div className="mb-3 p-2.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200 text-xs flex items-center gap-2 animate-pulse">
          <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400 animate-spin" />
          <span className="font-semibold">
            Updating hydrological simulation for {currentSector.district}...
          </span>
        </div>
      )}

      {/* 2. THE HERO RISK SECTION ("ONE SCREEN → ONE PRIMARY DECISION") */}
      {!currentSector ? (
        <div className="relative rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 p-8 sm:p-10 text-center flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <MapPin className="w-6 h-6" />
          </div>
          <h2 className="font-heading font-extrabold text-lg sm:text-xl text-[#0b1c30] dark:text-white">
            Select a district to view flood risk
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
            Search for your district above or use your current location to see live flood risk, predictions, and safety guidance.
          </p>
        </div>
      ) : (
      <div
        key={currentSector.id}
        className={`relative overflow-hidden rounded-2xl border ${riskConfig.borderClass} ${riskConfig.cardBg} p-5 sm:p-7 transition-colors risk-card-enter`}
      >
        {/* Risk-aware ambient animation layer — decorative only, sits behind
            all real content and never affects layout (see RiskStatusAnimation). */}
        <RiskStatusAnimation variant={riskConfig.animationVariant} />

        {/* Real card content sits above the animation overlay. */}
        <div className="relative z-10">
        {/* Top Header: Location + Status Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/70 dark:border-slate-800/80">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <div className="w-8 h-8 rounded-lg bg-white/80 dark:bg-slate-800/80 shadow-2xs flex items-center justify-center text-sky-600 dark:text-sky-400 flex-shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight text-[#0b1c30] dark:text-white">
                  {currentSector.district}, {currentSector.state}
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                  {currentSector.riverName}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Subdivision: {currentSector.subdivision} • Station: {currentSector.stationCode}
              </p>
            </div>
          </div>

          {/* Prominent Risk State Badge (Color + Icon + Text + Badge) */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <div
              key={currentSector.id}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full font-heading font-extrabold text-xs sm:text-sm tracking-wider uppercase shadow-xs risk-badge-entrance ${riskConfig.badgeBg}`}
            >
              <RiskIcon className="w-4 h-4 flex-shrink-0" />
              <span>{riskConfig.label}</span>
            </div>
          </div>
        </div>

        {/* Centerpiece: Primary Decision Metrics ("AM I AT RISK?") */}
        <div className="py-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
          {/* Left: Giant Primary Flood Probability */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
              FLOOD PROBABILITY
            </span>
            <div className="flex items-baseline gap-3 mt-1">
              <span
                className={`font-heading font-extrabold text-5xl sm:text-6xl leading-none tracking-tight tabular-nums ${riskConfig.accentText}`}
              >
                {animatedFloodProb}%
              </span>
              <div className="flex flex-col">
                <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                  {currentSector.statusSummary}
                </span>
                <span className={`text-xs font-semibold mt-0.5 ${riskConfig.accentText}`}>
                  {riskConfig.statusLine}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Surge: <strong className="font-mono text-red-600 dark:text-red-400">{currentSector.riverStageDelta}</strong> above danger level
                </span>
              </div>
            </div>
          </div>

          {/* Right: Primary Immediate Action CTAs */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={onViewRiskMap}
              id="hero-view-risk-map-btn"
              className="flex min-h-11 items-center gap-2 px-5 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-[0.98] text-white font-semibold text-sm transition-colors"
            >
              <Map className="w-4 h-4" />
              <span>View Risk Map</span>
            </button>

            <button
              onClick={onWhatShouldIDo}
              id="hero-what-should-i-do-btn"
              className="flex min-h-11 items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700/80 active:scale-[0.98] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-sm transition-colors"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>What Should I Do?</span>
            </button>
          </div>
        </div>

        {/* 3 Secondary Essential Metrics (Scannable in 1 second) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-200/70 dark:border-slate-800/80">
          {/* 1. Expected Timing */}
          <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-slate-400 uppercase font-mono block">
                EXPECTED TIMING
              </span>
              <span className="font-heading font-extrabold text-base sm:text-lg text-slate-900 dark:text-white truncate block">
                {currentSector.peakWindow || '18–36 Hours'}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate block">
                {currentSector.peakWindowDesc || 'Peak hydro-surge window'}
              </span>
            </div>
          </div>

          {/* 2. People at Risk */}
          <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-slate-400 uppercase font-mono block">
                PEOPLE AT RISK
              </span>
              <span className="font-heading font-extrabold text-base sm:text-lg text-slate-900 dark:text-white truncate block">
                {((currentSector.populationAtRisk ?? 0) / 1000).toFixed(0)}K Residents
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate block">
                In riverine floodplains
              </span>
            </div>
          </div>

          {/* 3. Expected Water Depth */}
          <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-sky-400 flex items-center justify-center flex-shrink-0">
              <Droplets className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-slate-400 uppercase font-mono block">
                WATER DEPTH
              </span>
              <span className="font-heading font-extrabold text-base sm:text-lg text-slate-900 dark:text-white truncate block">
                {currentSector.waterDepthAvgM}m avg • {currentSector.waterDepthPeakM}m peak
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate block">
                Spread over {currentSector.inundationAreaKm2} km²
              </span>
            </div>
          </div>
        </div>

        {/* Progressive Disclosure: Accordion for Prediction Details */}
        <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-800/80">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white py-1 transition"
          >
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>{showDetails ? 'Hide technical prediction details' : 'Show prediction details & telemetry ↓'}</span>
            </span>
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showDetails && (
            <div className="mt-3 p-4 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs animate-in fade-in duration-150">
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-mono font-bold block">MODEL CONFIDENCE</span>
                <span className="font-heading font-bold text-sm text-slate-900 dark:text-white mt-0.5 block">
                  {currentSector.confidence}% (Ensemble AI)
                </span>
                <span className="text-[11px] text-slate-500">SAR + Physics Routing</span>
              </div>

              <div>
                <span className="text-slate-400 uppercase text-[10px] font-mono font-bold block">24H RAINFALL</span>
                <span className="font-heading font-bold text-sm text-slate-900 dark:text-white mt-0.5 block">
                  {currentSector.rainfall.currentRainfall24hMm} mm
                </span>
                <span className="text-[11px] text-slate-500">{currentSector.rainfall.intensity} intensity</span>
              </div>

              <div>
                <span className="text-slate-400 uppercase text-[10px] font-mono font-bold block">RIVER GAUGE STAGE</span>
                <span className="font-heading font-bold text-sm text-slate-900 dark:text-white mt-0.5 block">
                  {currentSector.stageAbsolute}m
                </span>
                <span className="text-[11px] text-slate-500">Danger: {currentSector.dangerLevel}m</span>
              </div>

              <div>
                <span className="text-slate-400 uppercase text-[10px] font-mono font-bold block">AFFECTED REGIONS</span>
                <span className="font-heading font-bold text-sm text-slate-900 dark:text-white mt-0.5 block truncate">
                  {currentSector.affectedNeighborhoods[0] || 'Riparian lowland'}
                </span>
                <button
                  onClick={onViewPredictions}
                  className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1 mt-0.5"
                >
                  <span>Hydrograph analysis →</span>
                </button>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
      )}
    </section>
  );
};
