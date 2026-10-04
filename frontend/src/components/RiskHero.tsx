import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Check,
  X,
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
  ExternalLink,
  ClipboardList,
  Loader2
} from 'lucide-react';
import { SectorData } from '../types';
import { ASSAM_SECTORS } from '../data/assamData';
import { getRiskLevelConfig } from '../lib/riskLevelConfig';
import { RiskStatusAnimation } from './RiskStatusAnimation';
import { DataFreshness } from './DataFreshness';
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
  // Index of the keyboard/hover-highlighted option in the listbox (-1 = none).
  const [activeIndex, setActiveIndex] = useState(-1);
  const [showDetails, setShowDetails] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const listboxId = 'flood-risk-search-listbox';
  const optionId = (index: number) => `flood-risk-search-option-${index}`;

  // Shortcut hint label: ⌘K on Apple platforms, Ctrl K elsewhere.
  const isApplePlatform =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);

  useEffect(() => {
    setQuery(currentSector?.district ?? '');
  }, [currentSector?.id, currentSector?.district]);

  const closeDropdown = () => {
    setShowDropdown(false);
    setActiveIndex(-1);
  };

  // Close dropdown on outside click (anything outside the whole search area)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global shortcut: Ctrl+K / ⌘K anywhere, or "/" when not already typing.
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        !!target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      const isModK = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
      const isSlash = event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !isTyping;

      if (isModK || isSlash) {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setShowDropdown(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Filter sectors for search (memoized to avoid recalculation on unrelated renders)
  const filteredSectors = useMemo(() => {
    const q = query.toLowerCase().trim();
    return Object.values(ASSAM_SECTORS).filter((s) => {
      if (!q) return true;
      return (
        s.district.toLowerCase().includes(q) ||
        s.stationName.toLowerCase().includes(q) ||
        s.riverName.toLowerCase().includes(q) ||
        s.affectedNeighborhoods.some((n) => n.toLowerCase().includes(q))
      );
    });
  }, [query]);

  const selectSector = (sector: SectorData) => {
    onSelectSector(sector.id);
    setQuery(sector.district);
    closeDropdown();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Prefer the highlighted option; otherwise fall back to the best match.
    const match = filteredSectors[activeIndex] ?? filteredSectors[0];
    if (match) selectSector(match);
  };

  const handleClear = () => {
    setQuery('');
    setActiveIndex(-1);
    setShowDropdown(true);
    inputRef.current?.focus();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const count = filteredSectors.length;
    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        if (!count) return;
        if (!showDropdown) {
          setShowDropdown(true);
          const currentIdx = filteredSectors.findIndex((s) => s.id === currentSector?.id);
          setActiveIndex(currentIdx >= 0 ? currentIdx : 0);
        } else {
          setActiveIndex((i) => (i + 1) % count);
        }
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        if (!count) return;
        if (!showDropdown) {
          setShowDropdown(true);
          setActiveIndex(count - 1);
        } else {
          setActiveIndex((i) => (i <= 0 ? count - 1 : i - 1));
        }
        break;
      }
      case 'Escape': {
        if (showDropdown) {
          e.preventDefault();
          closeDropdown();
        } else if (query) {
          // Second Escape clears the field (WAI-ARIA combobox pattern).
          e.preventDefault();
          setQuery('');
        }
        break;
      }
      case 'Tab':
        closeDropdown();
        break;
      // Enter is handled by the form's onSubmit, which honours activeIndex.
    }
  };

  // Keep the highlighted option visible while arrowing through a long list.
  useEffect(() => {
    if (activeIndex < 0) return;
    document.getElementById(optionId(activeIndex))?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  // Centralized risk-level visual config (color/label/status-line/animation),
  // shared with RiskStatusAnimation. See lib/riskLevelConfig.ts.
  const riskConfig = getRiskLevelConfig(currentSector?.hazardLevel);
  const RiskIcon = riskConfig.icon;

  // Count-up transition for the primary flood-probability figure. Re-renders
  // (not remounts) drive this, so it eases from the previously selected
  // area's value to the newly selected one.
  const animatedFloodProb = useCountUp(currentSector?.floodProb ?? 0, 700);

  // WHAT SHOULD I DO: lead with the first concrete recommendation for this area.
  const primaryAction = currentSector?.recommendedActions?.[0];

  const focusRing =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 dark:focus-visible:ring-sky-400 dark:focus-visible:ring-offset-slate-950';

  return (
    <section className="pt-4 pb-2 px-3 sm:px-6 lg:px-8 max-w-[1536px] mx-auto w-full min-w-0">
      {/* 1. Location search + official alerts link */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
        {/* Search Input Bar */}
        <div ref={searchContainerRef} className="relative w-full lg:max-w-xl">
          <form
            onSubmit={handleSearchSubmit}
            role="search"
            className="group flex items-center gap-2.5 h-12 pl-3.5 pr-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm transition-[border-color,box-shadow] duration-150 hover:border-slate-400 dark:hover:border-slate-600 focus-within:border-sky-600 dark:focus-within:border-sky-500 focus-within:shadow-[0_0_0_3px_rgba(2,132,199,0.15),0_4px_12px_-2px_rgba(15,23,42,0.08)] dark:focus-within:shadow-[0_0_0_3px_rgba(56,189,248,0.2),0_4px_12px_-2px_rgba(0,0,0,0.4)]"
          >
            <Search
              aria-hidden="true"
              className="w-[18px] h-[18px] text-slate-500 dark:text-slate-400 group-focus-within:text-sky-700 dark:group-focus-within:text-sky-400 flex-shrink-0 transition-colors"
            />
            <input
              ref={inputRef}
              id="flood-risk-search-input"
              type="text"
              role="combobox"
              aria-label="Search district, river, or town"
              aria-expanded={showDropdown}
              aria-controls={listboxId}
              aria-autocomplete="list"
              aria-activedescendant={showDropdown && activeIndex >= 0 ? optionId(activeIndex) : undefined}
              aria-keyshortcuts="Control+K Meta+K /"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(-1);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onKeyDown={handleInputKeyDown}
              placeholder="Search district, river, or town"
              autoComplete="off"
              spellCheck={false}
              className="flex-1 min-w-0 h-full bg-transparent text-[15px] font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-500 dark:placeholder:text-slate-400 placeholder:font-normal focus:outline-none"
            />

            {query && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear search"
                title="Clear search"
                className={`flex items-center justify-center w-7 h-7 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0 ${focusRing}`}
              >
                <X aria-hidden="true" className="w-4 h-4" />
              </button>
            )}

            {/* Shortcut hint: hidden while the field is focused (it's already active) */}
            <kbd
              aria-hidden="true"
              className="hidden md:inline-flex group-focus-within:hidden items-center gap-0.5 h-6 px-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-sans text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex-shrink-0 select-none"
            >
              {isApplePlatform ? '⌘' : 'Ctrl'}
              <span className="ml-0.5">K</span>
            </kbd>

            <span aria-hidden="true" className="h-6 w-px bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
            <button
              type="button"
              onClick={() => {
                closeDropdown();
                onUseLocation();
              }}
              disabled={locationLoading}
              aria-label={locationLoading ? 'Locating your position' : 'Use my current location'}
              title="Use my current location"
              className={`flex items-center gap-1.5 min-h-11 px-3.5 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 hover:text-sky-800 dark:hover:bg-slate-800 dark:hover:text-sky-300 transition-colors flex-shrink-0 disabled:opacity-60 disabled:cursor-wait cursor-pointer ${focusRing}`}
            >
              {locationLoading ? (
                <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" />
              ) : (
                <Navigation aria-hidden="true" className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{locationLoading ? 'Locating…' : 'Use location'}</span>
            </button>
          </form>

          {/* Announce result count to screen readers as the user types */}
          <div className="sr-only" role="status" aria-live="polite">
            {showDropdown
              ? filteredSectors.length === 0
                ? 'No matching districts.'
                : `${filteredSectors.length} district${filteredSectors.length === 1 ? '' : 's'} available. Use up and down arrows to navigate.`
              : ''}
          </div>

          {/* Autocomplete Dropdown */}
          {showDropdown && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden">
              <div
                aria-hidden="true"
                className="flex items-center justify-between px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono"
              >
                <span>Select Assam district</span>
                <span className="hidden sm:inline normal-case tracking-normal font-sans font-medium">
                  ↑↓ navigate · Enter select · Esc close
                </span>
              </div>
              {filteredSectors.length === 0 ? (
                <div className="px-3.5 py-4 text-sm text-slate-600 dark:text-slate-400">
                  No matching district. Try a district, river, or town name.
                </div>
              ) : (
                <ul
                  id={listboxId}
                  role="listbox"
                  aria-label="Assam districts"
                  className="max-h-72 overflow-y-auto py-1"
                >
                  {filteredSectors.map((sector, index) => {
                    const isSelected = sector.id === currentSector?.id;
                    const isActive = index === activeIndex;
                    const sectorTier = getRiskLevelConfig(sector.hazardLevel).tier;
                    return (
                      <li
                        key={sector.id}
                        id={optionId(index)}
                        role="option"
                        aria-selected={isActive}
                        // Keep focus in the input so typing/arrowing continues to work.
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectSector(sector)}
                        onMouseMove={() => activeIndex !== index && setActiveIndex(index)}
                        className={`relative mx-1 px-3 py-2.5 min-h-11 flex items-center justify-between gap-2 rounded-lg cursor-pointer transition-colors ${
                          isActive
                            ? 'bg-slate-100 dark:bg-slate-800'
                            : isSelected
                            ? 'bg-sky-50 dark:bg-sky-950/40'
                            : ''
                        }`}
                      >
                        {isSelected && (
                          <span
                            aria-hidden="true"
                            className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-sky-600 dark:bg-sky-400"
                          />
                        )}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-4 flex-shrink-0 flex justify-center">
                            {isSelected && (
                              <Check aria-hidden="true" className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                            )}
                          </span>
                          <div className="min-w-0 truncate">
                            <span
                              className={`text-sm text-slate-900 dark:text-slate-100 ${
                                isSelected ? 'font-bold' : 'font-semibold'
                              }`}
                            >
                              {sector.district}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 ml-2 font-mono">
                              {sector.riverName}
                            </span>
                            {isSelected && <span className="sr-only"> (currently selected)</span>}
                          </div>
                        </div>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase flex-shrink-0 ${
                            sectorTier === 'CRITICAL' || sectorTier === 'HIGH'
                              ? 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300'
                              : sectorTier === 'MODERATE'
                              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                              : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                          }`}
                        >
                          {sector.hazardLevel} • {sector.floodProb}%
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        <a
          href="https://sachet.ndma.gov.in/"
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex h-12 items-center gap-2 self-start lg:self-auto rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 shadow-sm text-sm font-semibold text-sky-800 dark:text-sky-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${focusRing}`}
        >
          <ExternalLink aria-hidden="true" className="h-4 w-4 shrink-0" />
          <span>Official NDMA alerts (Sachet)</span>
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </div>

      {/* Loading feedback while the selected area is being assessed */}
      {isAnalyzing && currentSector && (
        <div
          role="status"
          aria-live="polite"
          className="mb-3 px-3 py-2 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200 text-sm flex items-center gap-2"
        >
          <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin text-sky-600 dark:text-sky-400" />
          <span className="font-semibold">Loading flood risk for {currentSector.district}…</span>
        </div>
      )}

      {/* 2. HERO RISK SECTION: WHERE / WHAT / HOW SEVERE / WHEN / WHAT TO DO */}
      {!currentSector ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 p-8 sm:p-10 text-center flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <MapPin aria-hidden="true" className="w-6 h-6" />
          </div>
          <h2 className="font-heading font-extrabold text-lg sm:text-xl text-[#0b1c30] dark:text-white">
            Select a district to view flood risk
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">
            Search for your district above or use your current location to see its flood risk assessment, forecast, and safety guidance.
          </p>
        </div>
      ) : (
        <div
          key={currentSector.id}
          className={`relative overflow-hidden rounded-2xl border ${riskConfig.borderClass} ${riskConfig.cardBg} p-5 sm:p-7 transition-colors risk-card-enter`}
        >
          {/* Risk-aware ambient animation layer: decorative only, sits behind
              all real content and never affects layout (see RiskStatusAnimation). */}
          <RiskStatusAnimation variant={riskConfig.animationVariant} />

          <div className="relative z-10">
            {/* WHERE + HOW SEVERE */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/70 dark:border-slate-800/80">
              <div className="flex items-start gap-3 text-slate-800 dark:text-slate-100 min-w-0">
                <MapPin aria-hidden="true" className="w-5 h-5 mt-1.5 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight text-[#0b1c30] dark:text-white">
                      {currentSector.district}, {currentSector.state}
                    </h1>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                      {currentSector.riverName}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                    {currentSector.subdivision} • Station: {currentSector.stationCode}
                  </p>
                </div>
              </div>

              <div
                key={currentSector.id}
                className={`flex items-center gap-2 self-start sm:self-center px-3.5 py-1.5 rounded-full font-heading font-extrabold text-xs sm:text-sm tracking-wider uppercase risk-badge-entrance ${riskConfig.badgeBg}`}
              >
                <RiskIcon aria-hidden="true" className="w-4 h-4 flex-shrink-0" />
                <span>{riskConfig.label}</span>
              </div>
            </div>

            {/* WHAT is the risk: primary figure + CTAs */}
            <div className="py-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 font-mono">
                  Flood probability
                </span>
                <div className="flex items-baseline gap-4 mt-1 flex-wrap">
                  <span
                    className={`font-heading font-extrabold text-5xl sm:text-6xl leading-none tracking-tight tabular-nums ${riskConfig.accentText}`}
                  >
                    {animatedFloodProb}%
                  </span>
                  <div className="flex flex-col">
                    <span className={`text-sm sm:text-base font-bold leading-tight ${riskConfig.accentText}`}>
                      {riskConfig.statusLine}
                    </span>
                    <span className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                      River stage{' '}
                      <strong className="font-mono text-slate-900 dark:text-slate-100">{currentSector.riverStageDelta}</strong>
                      {currentSector.riverStageDesc ? ` · ${currentSector.riverStageDesc}` : ''}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={onViewRiskMap}
                  id="hero-view-risk-map-btn"
                  className={`flex min-h-11 items-center gap-2 px-5 py-3 rounded-xl bg-sky-700 hover:bg-sky-600 active:scale-[0.98] text-white font-semibold text-sm transition-colors ${focusRing}`}
                >
                  <Map aria-hidden="true" className="w-4 h-4" />
                  <span>View risk map</span>
                </button>

                <button
                  onClick={onWhatShouldIDo}
                  id="hero-what-should-i-do-btn"
                  className={`flex min-h-11 items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700/80 active:scale-[0.98] text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold text-sm transition-colors ${focusRing}`}
                >
                  <ShieldAlert aria-hidden="true" className="w-4 h-4" />
                  <span>Find shelters</span>
                </button>
              </div>
            </div>

            {/* WHAT SHOULD I DO */}
            {primaryAction && (
              <div className="mb-5 flex items-start gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 px-4 py-3">
                <ClipboardList aria-hidden="true" className={`w-5 h-5 mt-0.5 flex-shrink-0 ${riskConfig.accentText}`} />
                <div className="min-w-0">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 font-mono block">
                    Recommended action
                  </span>
                  <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 leading-snug mt-0.5">
                    {primaryAction}
                  </p>
                </div>
              </div>
            )}

            {/* Key figures: one bordered strip instead of three separate cards */}
            <dl className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-start gap-3 p-4">
                <Clock aria-hidden="true" className="w-5 h-5 mt-0.5 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                <div className="min-w-0">
                  <dt className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase font-mono">Expected timing</dt>
                  <dd className="font-heading font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                    {currentSector.peakWindow}
                  </dd>
                  <dd className="text-xs text-slate-600 dark:text-slate-400">{currentSector.peakWindowDesc}</dd>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4">
                <Users aria-hidden="true" className="w-5 h-5 mt-0.5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                <div className="min-w-0">
                  <dt className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase font-mono">People at risk</dt>
                  <dd className="font-heading font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                    {(currentSector.populationAtRisk ?? 0).toLocaleString()}
                  </dd>
                  <dd className="text-xs text-slate-600 dark:text-slate-400">Residents in riverine floodplains</dd>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4">
                <Droplets aria-hidden="true" className="w-5 h-5 mt-0.5 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                <div className="min-w-0">
                  <dt className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase font-mono">Water depth</dt>
                  <dd className="font-heading font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                    {currentSector.waterDepthAvgM} m avg · {currentSector.waterDepthPeakM} m peak
                  </dd>
                  <dd className="text-xs text-slate-600 dark:text-slate-400">
                    Over {currentSector.inundationAreaKm2} km²
                  </dd>
                </div>
              </div>
            </dl>

            {/* WHEN + progressive disclosure */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <DataFreshness />
              <button
                onClick={() => setShowDetails(!showDetails)}
                aria-expanded={showDetails}
                aria-controls="risk-hero-details"
                className={`inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 rounded-lg transition-colors cursor-pointer ${focusRing}`}
              >
                <Activity aria-hidden="true" className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>{showDetails ? 'Hide technical details' : 'Technical details'}</span>
                {showDetails ? <ChevronUp aria-hidden="true" className="w-4 h-4" /> : <ChevronDown aria-hidden="true" className="w-4 h-4" />}
              </button>
            </div>

            {showDetails && (
              <div
                id="risk-hero-details"
                className="mt-3 p-4 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm animate-in fade-in duration-150"
              >
                <div>
                  <span className="text-slate-600 dark:text-slate-400 uppercase text-xs font-mono font-bold block">Model confidence</span>
                  <span className="font-heading font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {currentSector.confidence}%
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-400">SAR + physics routing</span>
                </div>

                <div>
                  <span className="text-slate-600 dark:text-slate-400 uppercase text-xs font-mono font-bold block">24h rainfall</span>
                  <span className="font-heading font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {currentSector.rainfall.currentRainfall24hMm} mm
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-400">{currentSector.rainfall.intensity} intensity</span>
                </div>

                <div>
                  <span className="text-slate-600 dark:text-slate-400 uppercase text-xs font-mono font-bold block">River gauge stage</span>
                  <span className="font-heading font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {currentSector.stageAbsolute} m
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-400">Danger level {currentSector.dangerLevel} m</span>
                </div>

                <div>
                  <span className="text-slate-600 dark:text-slate-400 uppercase text-xs font-mono font-bold block">Affected area</span>
                  <span className="font-heading font-bold text-slate-900 dark:text-white mt-0.5 block truncate">
                    {currentSector.affectedNeighborhoods[0] || 'Riparian lowland'}
                  </span>
                  <button
                    onClick={onViewPredictions}
                    className={`text-xs font-bold text-sky-700 dark:text-sky-400 hover:underline inline-flex items-center gap-1 mt-0.5 rounded ${focusRing}`}
                  >
                    <span>Hydrograph analysis →</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
