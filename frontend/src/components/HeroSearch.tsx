import React, { useState, useRef, useEffect } from 'react';
import { Search, Navigation, Droplets, MapPin, Users, Sparkles, ExternalLink, ArrowRight } from 'lucide-react';
import { ASSAM_SECTORS } from '../data/assamData';
import { SectorData } from '../types';

interface HeroSearchProps {
  currentSector: SectorData;
  onSelectSector: (sectorId: string) => void;
  onUseLocation: () => void;
  locationLoading?: boolean;
  isAnalyzing?: boolean;
}

export const HeroSearch: React.FC<HeroSearchProps> = ({
  currentSector,
  onSelectSector,
  onUseLocation,
  locationLoading = false,
  isAnalyzing = false,
}) => {
  const [query, setQuery] = useState(`${currentSector.district}`);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(currentSector.district);
  }, [currentSector.id, currentSector.district]);

  // Structured hotspot filters with precise risk metrics
  const hotspots = [
    { id: 'dhemaji', label: 'Dhemaji', score: 82, severity: 'HIGH', dotClass: 'bg-red-500', badgeClass: 'text-red-700 dark:text-red-400' },
    { id: 'majuli', label: 'Majuli', score: 78, severity: 'HIGH', dotClass: 'bg-red-500', badgeClass: 'text-red-700 dark:text-red-400' },
    { id: 'lakhimpur', label: 'Lakhimpur', score: 58, severity: 'MOD', dotClass: 'bg-amber-500', badgeClass: 'text-amber-700 dark:text-amber-400' },
    { id: 'dibrugarh', label: 'Dibrugarh', score: 46, severity: 'MOD', dotClass: 'bg-amber-500', badgeClass: 'text-amber-700 dark:text-amber-400' },
    { id: 'barpeta', label: 'Barpeta', score: 18, severity: 'LOW', dotClass: 'bg-emerald-500', badgeClass: 'text-emerald-700 dark:text-emerald-400' },
    { id: 'cachar', label: 'Cachar', score: 19, severity: 'LOW', dotClass: 'bg-emerald-500', badgeClass: 'text-emerald-700 dark:text-emerald-400' },
  ];

  // Filter sectors for autocompletion
  const filteredSectors = Object.values(ASSAM_SECTORS).filter((s) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      s.district.toLowerCase().includes(q) ||
      s.stationName.toLowerCase().includes(q) ||
      s.riverName.toLowerCase().includes(q) ||
      s.affectedNeighborhoods.some(n => n.toLowerCase().includes(q))
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

  // Decompose affected neighborhoods into clean, scannable 2-second scannable text
  const getZoneSummary = () => {
    const rawPrimary = currentSector.affectedNeighborhoods[0] || `${currentSector.district} Municipality`;
    const primaryName = rawPrimary.includes('(') ? rawPrimary.split('(')[0].trim() : rawPrimary;
    const parenMatch = rawPrimary.match(/\(([^)]+)\)/);
    const wardsOrParen = parenMatch ? parenMatch[1] : '';
    const rawSecondary = currentSector.affectedNeighborhoods[1] || '';
    const secondaryShort = rawSecondary.split(' ')[0] || '';

    let subLine = '';
    if (wardsOrParen && secondaryShort) {
      subLine = `${wardsOrParen} • ${secondaryShort}`;
    } else if (wardsOrParen) {
      subLine = wardsOrParen;
    } else if (rawSecondary) {
      subLine = rawSecondary.length > 28 ? rawSecondary.slice(0, 28) + '…' : rawSecondary;
    } else {
      subLine = 'Riverine Lowland Corridor';
    }
    return { primaryName, subLine };
  };

  const zoneSummary = getZoneSummary();

  return (
    <section className="pt-6 pb-4 px-3 sm:px-6 lg:px-8 max-w-[1536px] mx-auto transition-colors w-full min-w-0">
      {/* Title, Platform Purpose & Subdued Reference */}
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-transparent dark:border-sky-800/60 font-bold text-[11px] tracking-wider uppercase">
            AI &amp; Satellite Disaster Intelligence
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
            Multi-Source Inundation Early Warning
          </span>
        </div>
        <h1 className="font-heading font-extrabold text-xl sm:text-3xl lg:text-[36px] tracking-tight text-[#0b1c30] dark:text-slate-100 leading-tight break-words">
          Flood Risk for Your Area
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm lg:text-base text-slate-600 dark:text-slate-300 font-normal leading-relaxed max-w-4xl break-words">
          Combining satellite synthetic aperture radar (SAR), CWC river tele-gauges, IMD Doppler rainfall, and SRTM 30m terrain physics to forecast inundation extent and human exposure.
        </p>

        {/* Compact Bordered Secondary Reference: Gov Sites */}
        <div className="mt-3 inline-flex flex-wrap items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-[#D7E2EF] dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 text-xs transition-colors max-w-full">
          <span className="font-bold text-[#0b1c30] dark:text-slate-200 text-[11px] tracking-wider uppercase">
            GOV SITES
          </span>
          <span className="text-slate-300 dark:text-slate-600 select-none">·</span>
          <a
            href="https://asdma.assam.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300 hover:text-sky-700 dark:hover:text-sky-400 underline-offset-2 hover:underline transition-colors"
            title="Assam State Disaster Management Authority"
          >
            <span>ASDMA</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
          <span className="text-slate-300 dark:text-slate-600 select-none">·</span>
          <a
            href="https://sachet.ndma.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300 hover:text-sky-700 dark:hover:text-sky-400 underline-offset-2 hover:underline transition-colors"
            title="National Disaster Management Authority - SACHET Early Warning Portal"
          >
            <span>NDMA/SACHET</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        </div>
      </div>

      {/* Primary Hero Interaction: High-Precision Search Experience */}
      <div className="mt-5 max-w-5xl relative w-full min-w-0">
        <form
          onSubmit={handleSearchSubmit}
          className="relative flex flex-col sm:flex-row items-stretch gap-2 sm:gap-0 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-1.5 sm:p-2 shadow-[0_8px_24px_rgba(15,23,42,0.08)] hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-[0_10px_28px_rgba(15,23,42,0.12)] focus-within:border-sky-500 dark:focus-within:border-sky-400 focus-within:ring-4 focus-within:ring-sky-500/10 transition-[border-color,box-shadow] duration-200 w-full"
        >
          <div className="flex items-center flex-1 px-2.5 sm:px-3 py-1 min-w-0">
            <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 mr-2 flex-shrink-0" />
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
              placeholder="Search a district, village, city or PIN code…"
              className="w-full min-w-0 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm sm:text-base font-medium focus:outline-none bg-transparent py-1.5"
            />
          </div>

          <button
            type="submit"
            id="hero-check-flood-risk-btn"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 min-h-[44px] bg-[#0b1c30] hover:bg-[#14263d] dark:bg-sky-600 dark:hover:bg-sky-500 active:bg-[#020617] text-white font-semibold text-xs sm:text-sm rounded-lg transition-colors shadow-sm whitespace-nowrap touch-manipulation"
          >
            <span>Analyze Risk</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Autocomplete Dropdown */}
        {showDropdown && (
          <div
            ref={dropdownRef}
            className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto w-full max-w-full"
          >
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase flex items-center justify-between">
              <span>Assam Districts &amp; River Basins</span>
              <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">Click to Inspect</span>
            </div>
            {filteredSectors.map((sector) => {
              const isSelected = sector.id === currentSector.id;
              return (
                <button
                  key={sector.id}
                  type="button"
                  onClick={() => {
                    onSelectSector(sector.id);
                    setQuery(sector.district);
                    setShowDropdown(false);
                  }}
                  className={`w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-sky-50 dark:hover:bg-slate-800/70 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0 min-w-0 ${
                    isSelected ? 'bg-sky-50/80 dark:bg-slate-800 font-semibold' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
                      <span>{sector.district}</span>
                      <span className="text-xs font-normal text-slate-500 dark:text-slate-400">• {sector.riverName}</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-1.5 sm:gap-2 mt-0.5 font-mono">
                      <span>{sector.stationCode}</span>
                      <span>|</span>
                      <span>Rain: {sector.rainfall.currentRainfall24hMm}mm</span>
                      <span>|</span>
                      <span>Pop: {((sector.populationAtRisk ?? 0) / 1000).toFixed(0)}K</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-center">
                    <span
                      className={`text-[11px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full font-bold uppercase whitespace-nowrap ${
                        sector.hazardLevel === 'CRITICAL' || sector.hazardLevel === 'HIGH'
                          ? 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900'
                          : sector.hazardLevel === 'MODERATE'
                            ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                            : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                      }`}
                    >
                      {sector.hazardLevel}: {sector.vulnerabilityIndex}/100
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* GPS Location & Refined Hotspot Filters */}
      <div className="mt-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs max-w-5xl w-full min-w-0">
        {/* Left: GPS In-Browser Action */}
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 flex-wrap">
          <button
            type="button"
            onClick={onUseLocation}
            id="use-current-location-btn"
            disabled={locationLoading}
            className="inline-flex items-center gap-1.5 font-semibold text-[#006398] dark:text-sky-300 hover:text-[#00476e] dark:hover:text-sky-200 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100/80 dark:hover:bg-sky-900/60 px-3 py-2 min-h-[40px] sm:min-h-0 rounded-md border border-sky-200 dark:border-sky-800 transition-colors flex-shrink-0 touch-manipulation"
          >
            <Navigation className={`w-3.5 h-3.5 ${locationLoading ? 'animate-spin text-sky-600 dark:text-sky-400' : ''}`} />
            <span>{locationLoading ? 'Detecting coordinates...' : 'Use My Location'}</span>
          </button>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
            Allow location access to check flood risk for your current area.
          </span>
        </div>

        {/* Right: Quick Hotspot Filters (Format: ● Location · Score Level) */}
        <div className="flex items-center flex-wrap gap-1.5 w-full lg:w-auto">
          <span className="font-bold text-[10px] tracking-wider text-slate-400 dark:text-slate-500 uppercase mr-1">
            HOTSPOTS:
          </span>
          {hotspots.map((spot) => {
            const isSelected = currentSector.id === spot.id;
            return (
              <button
                key={spot.id}
                onClick={() => {
                  onSelectSector(spot.id);
                  setQuery(spot.label);
                }}
                id={`hotspot-${spot.id}`}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[36px] sm:min-h-0 rounded-md text-xs font-medium border transition-all touch-manipulation ${
                  isSelected
                    ? 'bg-[#0b1c30] text-white border-[#0b1c30] dark:bg-slate-100 dark:text-slate-950 dark:border-white shadow-sm ring-2 ring-sky-500/30 font-semibold'
                    : 'bg-white dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    isSelected ? 'bg-sky-400 dark:bg-sky-600' : spot.dotClass
                  }`}
                />
                <span>{spot.label}</span>
                <span className="opacity-40">·</span>
                <span className={`font-mono text-[11px] ${isSelected ? 'text-slate-200 dark:text-slate-700 font-semibold' : 'text-slate-600 dark:text-slate-400'}`}>
                  {spot.score}
                </span>
                <span
                  className={`text-[10px] font-extrabold ${
                    isSelected ? 'text-sky-300 dark:text-sky-700' : spot.badgeClass
                  }`}
                >
                  {spot.severity}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Analyzing Banner Indicator */}
      {isAnalyzing && (
        <div className="mt-3 p-2.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200 text-xs flex items-center gap-2.5 animate-pulse">
          <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400 animate-spin" />
          <span className="font-semibold">
            Analyzing environmental conditions &amp; running SIH-Hydro spatial-temporal inference for {currentSector.district}...
          </span>
        </div>
      )}

      {/* THE 4 CRITICAL QUESTIONS EXECUTIVE BANNER CARDS */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 w-full min-w-0">
        {/* Q1: WILL IT FLOOD? (Visually Dominant Primary Metric Card) */}
        <div className="relative bg-gradient-to-b from-white to-slate-50/60 dark:from-slate-900 dark:to-slate-900/95 rounded-xl border border-slate-300/90 dark:border-slate-700 p-4 shadow-sm hover:border-slate-400 dark:hover:border-slate-600 transition border-l-4 border-l-red-500 dark:border-l-red-400 flex flex-col justify-between min-w-0">
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 truncate">
                <span className="w-5 h-5 rounded-full bg-[#0b1c30] text-white dark:bg-sky-600 flex items-center justify-center font-bold text-xs flex-shrink-0">1</span>
                <span className="truncate">WILL IT FLOOD?</span>
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wide uppercase flex-shrink-0 ${
                  currentSector.hazardLevel === 'CRITICAL' || currentSector.hazardLevel === 'HIGH'
                    ? 'bg-red-600 text-white'
                    : currentSector.hazardLevel === 'MODERATE'
                      ? 'bg-amber-500 text-white'
                      : 'bg-emerald-600 text-white'
                }`}
              >
                {currentSector.hazardLevel} RISK
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-2 flex-wrap">
              <span className="font-heading font-extrabold text-3xl sm:text-[34px] text-[#0b1c30] dark:text-white leading-none tracking-tight">
                {currentSector.floodProb}%
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Flood probability</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1 text-xs min-w-0">
            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0"></span>
              <span className="truncate">Expected within {currentSector.peakWindow || '18–36 hrs'}</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
              Surge: {currentSector.riverStageDelta} above danger mark
            </div>
          </div>
        </div>

        {/* Q2: WHERE WILL IT HAPPEN? */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between min-w-0">
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 truncate">
                <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs flex-shrink-0">2</span>
                <span className="truncate">WHERE WILL IT HAPPEN?</span>
              </span>
              <MapPin className="w-4 h-4 text-sky-600 dark:text-sky-400 flex-shrink-0" />
            </div>

            <div className="mt-3 flex items-baseline gap-2 flex-wrap">
              <span className="font-heading font-extrabold text-2xl sm:text-[26px] text-[#0b1c30] dark:text-slate-100 leading-none">
                {currentSector.inundationAreaKm2} km²
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Spread Extent</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1 text-xs min-w-0">
            <div className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={zoneSummary.primaryName}>
              {zoneSummary.primaryName}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate" title={zoneSummary.subLine}>
              {zoneSummary.subLine}
            </div>
          </div>
        </div>

        {/* Q3: HOW SEVERE WILL IT BE? */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between min-w-0">
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 truncate">
                <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs flex-shrink-0">3</span>
                <span className="truncate">HOW SEVERE WILL IT BE?</span>
              </span>
              <Droplets className="w-4 h-4 text-blue-600 dark:text-sky-400 flex-shrink-0" />
            </div>

            <div className="mt-3 flex items-baseline gap-2 flex-wrap">
              <span className="font-heading font-extrabold text-2xl sm:text-[26px] text-[#0b1c30] dark:text-slate-100 leading-none">
                {currentSector.vulnerabilityIndex}
                <span className="text-sm font-normal text-slate-400 dark:text-slate-500">/100</span>
              </span>
              <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400">{currentSector.riverStageDelta}</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1 text-xs min-w-0">
            <div className="text-slate-800 dark:text-slate-200 font-medium truncate">
              Depth: {currentSector.waterDepthAvgM}m avg • {currentSector.waterDepthPeakM}m peak
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              Rainfall: {currentSector.rainfall.currentRainfall24hMm}mm ({currentSector.rainfall.intensity})
            </div>
          </div>
        </div>

        {/* Q4: WHO AND WHAT WILL BE AFFECTED? */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between min-w-0">
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 truncate">
                <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs flex-shrink-0">4</span>
                <span className="truncate">WHO &amp; WHAT AFFECTED?</span>
              </span>
              <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
            </div>

            <div className="mt-3 flex items-baseline gap-2 flex-wrap">
              <span className="font-heading font-extrabold text-2xl sm:text-[26px] text-[#0b1c30] dark:text-slate-100 leading-none">
                {((currentSector.populationAtRisk ?? 0) / 1000).toFixed(0)}K
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">People Exposed</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1 text-xs min-w-0">
            <div className="text-slate-800 dark:text-slate-200 font-medium truncate">
              {currentSector.infrastructureCounts.hospitals} Hospitals • {currentSector.infrastructureCounts.schools} Schools
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {currentSector.infrastructureCounts.roads} Roads • {currentSector.infrastructureCounts.bridges} Bridges at risk
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
