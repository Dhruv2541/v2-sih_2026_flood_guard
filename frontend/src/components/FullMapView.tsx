import React, { useState, useMemo } from 'react';
import { InteractiveMap } from './InteractiveMap';
import { SectorInspector } from './SectorInspector';
import { SectorData } from '../types';
import { ASSAM_SECTORS } from '../data/assamData';
import { mockRegionRiskData } from '../data/mockRiskData';
import { Clock, Waves, Compass, Layers, MapPin, Droplets, Users, ShieldAlert, Eye, ChevronRight, ChevronLeft } from 'lucide-react';

interface FullMapViewProps {
  currentSector: SectorData;
  onSelectSector: (sectorId: string) => void;
  onOpenDiagnostic: () => void;
  onViewWeights: () => void;
}

export const FullMapView: React.FC<FullMapViewProps> = ({
  currentSector,
  onSelectSector,
  onOpenDiagnostic,
  onViewWeights,
}) => {
  const [forecastHour, setForecastHour] = useState<number>(0);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(true);
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(false);

  // Dynamically patch the current sector with live mock RegionRisk data (memoized to avoid Mapbox thrashing)
  const dynamicSector = useMemo(() => {
    const regionRisk = mockRegionRiskData.find(r => r.region_id === currentSector.id);
    return regionRisk ? {
      ...currentSector,
      floodProb: regionRisk.flood_probability,
      hazardLevel: regionRisk.risk_level as any,
      vulnerabilityIndex: regionRisk.flood_probability,
    } : currentSector;
  }, [currentSector]);

  return (
    <div className="relative w-full h-[calc(100dvh-112px)] md:h-[calc(100vh-64px)] overflow-hidden bg-slate-950 flex select-none animate-in fade-in duration-300 min-w-0">
      
      {/* Background GIS Map */}
      <div className="absolute inset-0 z-0">
        <InteractiveMap
          currentSector={dynamicSector}
          onSelectSector={onSelectSector}
          onOpenDiagnostic={onOpenDiagnostic}
          forecastHour={forecastHour}
          onForecastHourChange={setForecastHour}
        />
      </div>

      {/* Floating Collapsible Inspector Panel (Right Side) */}
      <div 
        className={`absolute top-4 right-4 z-20 transition-transform duration-500 ease-in-out w-[calc(100vw-32px)] sm:w-[380px] h-[calc(100%-120px)] sm:h-[calc(100%-80px)] flex ${
          isInspectorOpen ? 'translate-x-0' : 'translate-x-[115%]'
        }`}
      >
        <div className="relative w-full h-full">
          {/* Toggle Button attached to the side of the panel */}
          <button
            onClick={() => setIsInspectorOpen(!isInspectorOpen)}
            className="absolute -left-11 top-4 bg-slate-900/90 backdrop-blur-md border border-slate-700 min-w-[44px] min-h-[44px] p-2 rounded-l-xl text-slate-300 hover:text-white shadow-lg transition-colors flex items-center justify-center pointer-events-auto cursor-pointer"
            aria-label={isInspectorOpen ? "Close Inspector" : "Open Inspector"}
          >
            {isInspectorOpen ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
          
          <div className="w-full h-full shadow-2xl rounded-2xl overflow-hidden backdrop-blur-md bg-white/10 dark:bg-slate-900/80 border border-slate-700/60 pointer-events-auto flex flex-col">
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent rounded-2xl">
              <SectorInspector
                sector={dynamicSector}
                onOpenDiagnostic={onOpenDiagnostic}
                onViewWeights={onViewWeights}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Toggle Button for when panel is closed */}
      {!isInspectorOpen && (
        <button
          onClick={() => setIsInspectorOpen(true)}
          className="absolute top-8 right-0 bg-slate-900/90 backdrop-blur-md border border-slate-700 border-r-0 min-w-[44px] min-h-[44px] p-2 rounded-l-xl text-slate-300 hover:text-white shadow-lg transition-colors flex items-center justify-center pointer-events-auto z-20 cursor-pointer"
          aria-label="Open Inspector"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* Floating Legend / Guide (Bottom Left - stacked above mobile timeline bar) */}
      <div className="absolute bottom-20 sm:bottom-6 left-4 z-20 pointer-events-auto flex flex-col-reverse items-start gap-2">
        <button
          onClick={() => setIsLegendOpen(!isLegendOpen)}
          className={`flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-xl backdrop-blur-md shadow-md text-xs font-bold transition-all border cursor-pointer ${
            isLegendOpen
              ? 'bg-[#0b1c30] text-white border-[#0b1c30] dark:bg-sky-600 dark:border-sky-500 shadow-sky-500/10'
              : 'bg-white/95 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 border-slate-200/90 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Compass className="w-4 h-4 text-sky-500" />
          <span>Legend</span>
        </button>

        {isLegendOpen && (
          <div className="w-64 sm:w-80 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-300 dark:border-slate-700/60 shadow-xl animate-in slide-in-from-bottom-2 fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
                Map Symbology
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Scale: 1:50k</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-green-500 border border-green-600"></span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">LOW &bull; Low Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-yellow-500 border border-yellow-600"></span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">MODERATE &bull; Moderate Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-orange-500 border border-orange-600"></span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">HIGH &bull; High Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-red-500 border border-red-600"></span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">SEVERE &bull; Severe Risk</span>
              </div>
              <div className="flex items-center gap-2 col-span-1 sm:col-span-2 mt-1">
                <span className="w-3.5 h-3.5 rounded bg-sky-400/60 border border-sky-600 border-dashed"></span>
                <span className="text-slate-700 dark:text-slate-300 font-medium text-[10px]">Predicted Inundation Spread Overlay</span>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
