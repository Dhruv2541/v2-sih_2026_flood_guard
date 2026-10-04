import React, { useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, X, ArrowRight } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { RiskHero } from './components/RiskHero';
import { AssamOverviewMap } from './components/AssamOverviewMap';
import { InteractiveMap } from './components/InteractiveMap';
import { SectorInspector } from './components/SectorInspector';
import { AlertDirectiveBanner } from './components/AlertDirectiveBanner';
import { ActionCards } from './components/ActionCards';
import { Footer } from './components/Footer';
import { ShelterModal } from './components/ShelterModal';
import { GuideModal } from './components/GuideModal';
import { FullMapView } from './components/FullMapView';
import { PredictionsView } from './components/PredictionsView';
import { ImpactView } from './components/ImpactView';
import { AlertsView } from './components/AlertsView';
import { HistoricalView } from './components/HistoricalView';
import { SimulationView } from './components/SimulationView';
import { MethodologyView } from './components/MethodologyView';
import { SelectDistrictPrompt } from './components/SelectDistrictPrompt';
import { ASSAM_SECTORS } from './data/assamData';
import { getRiskLevelConfig } from './lib/riskLevelConfig';
import { useGeolocation } from './hooks/useGeolocation';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null);
  const [isShelterOpen, setIsShelterOpen] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [forecastHour, setForecastHour] = useState<number>(0);

  const analyzingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentSector = selectedSectorId ? ASSAM_SECTORS[selectedSectorId] ?? null : null;

  const handleSelectSector = useCallback((id: string) => {
    if (ASSAM_SECTORS[id]) {
      setIsAnalyzing(true);
      setSelectedSectorId(id);
      if (analyzingTimerRef.current) {
        clearTimeout(analyzingTimerRef.current);
      }
      analyzingTimerRef.current = setTimeout(() => {
        setIsAnalyzing(false);
        analyzingTimerRef.current = null;
      }, 700);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (analyzingTimerRef.current) {
        clearTimeout(analyzingTimerRef.current);
        analyzingTimerRef.current = null;
      }
    };
  }, []);

  const { locationLoading, locationToast, handleUseLocation } = useGeolocation(handleSelectSector);

  const handleCallSeoc = () => {
    window.location.href = 'tel:1070';
  };

  const handleCallNumber = (num: string) => {
    window.location.href = `tel:${num.replace(/[^0-9]/g, '')}`;
  };

  const handleCheckMyRisk = useCallback(() => {
    setActiveTab('overview');
    const input = document.getElementById('flood-risk-search-input');
    if (input) {
      input.focus();
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#f8faff] dark:bg-slate-950 text-[#0b1c30] dark:text-slate-100 flex flex-col font-sans selection:bg-sky-200 selection:dark:bg-sky-900 transition-colors duration-200 w-full max-w-full overflow-x-hidden min-w-0">
      {/* Top Authoritative Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onCheckMyRisk={handleCheckMyRisk}
        onSearchSelect={handleSelectSector}
      />

      {/* Main Content Areas based on Tab */}
      <main className="flex-1 w-full min-w-0">
        {/* Tab 1: Overview Command Center */}
        {activeTab === 'overview' && (
          <div className="pb-12 w-full min-w-0">
            {/* Location Toast — transient feedback for "Use My Location" */}
            {locationToast && (
              <div
                role="status"
                aria-live="polite"
                className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2.5 px-4 py-2.5 rounded-lg shadow-lg border text-sm font-semibold max-w-[calc(100vw-24px)] w-full sm:max-w-sm transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${
                  locationToast.variant === 'error'
                    ? 'bg-red-50 dark:bg-red-950/90 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                    : locationToast.variant === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                    : 'bg-amber-50 dark:bg-amber-950/90 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                }`}
              >
                {locationToast.variant === 'error' && (
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                )}
                {locationToast.variant === 'success' && (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                )}
                {locationToast.variant === 'warning' && (
                  <Info className="w-4 h-4 flex-shrink-0" />
                )}
                <span className="flex-1">{locationToast.message}</span>
                <X className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
              </div>
            )}

            {/* 1. EMERGENCY STATUS / ALERT STRIP (if critical) */}
            {currentSector && ['CRITICAL', 'HIGH'].includes(getRiskLevelConfig(currentSector.hazardLevel).tier) && (
              <div className="fg-page-enter">
                <AlertDirectiveBanner
                  sector={currentSector}
                  onCallSeoc={handleCallSeoc}
                  onOpenShelterMap={() => setIsShelterOpen(true)}
                />
              </div>
            )}

            {/* 2. LOCATION SEARCH & SELECTED DISTRICT (Risk Hero) */}
            <div className="fg-page-enter">
              <RiskHero
                currentSector={currentSector}
                onSelectSector={handleSelectSector}
                onUseLocation={handleUseLocation}
                locationLoading={locationLoading}
                isAnalyzing={isAnalyzing}
                onViewRiskMap={() => setActiveTab('map')}
                onWhatShouldIDo={() => setIsShelterOpen(true)}
                onViewPredictions={() => setActiveTab('predictions')}
              />
            </div>

            {/* 3. BEAUTIFUL ASSAM MAP (Primary Visual) */}
            <div className="max-w-[1536px] mx-auto px-3 sm:px-6 lg:px-8 mt-6 w-full min-w-0 fg-page-enter">
              <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
                <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#0b1c30] dark:text-slate-100 tracking-tight">
                  Assam Flood Risk Map
                </h2>
                <button
                  onClick={() => setActiveTab('map')}
                  className="text-sm font-semibold text-sky-700 dark:text-sky-400 hover:text-sky-900 dark:hover:text-sky-300 transition-colors inline-flex min-h-11 items-center gap-1.5 px-3 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-950/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 dark:focus-visible:ring-sky-400"
                >
                  <span>Open full map view</span>
                  <ArrowRight aria-hidden="true" className="w-4 h-4" />
                </button>
              </div>

              <AssamOverviewMap
                onSelectHotspot={handleSelectSector}
                selectedHotspotId={selectedSectorId ?? undefined}
                height="clamp(400px, 55vh, 560px)"
              />
            </div>

            {/* 4. "WHAT TO DO NOW" ACTIONS */}
            <div className="fg-page-enter">
              <ActionCards
                onOpenGuideModal={() => setIsGuideOpen(true)}
                onCallNumber={handleCallNumber}
              />
            </div>

          </div>
        )}

        {/* Tab 2: Dedicated Full GIS Risk Map View */}
        {activeTab === 'map' && (
          currentSector ? (
            <FullMapView
              currentSector={currentSector}
              onSelectSector={handleSelectSector}
              onOpenDiagnostic={() => setActiveTab('predictions')}
              onViewWeights={() => setActiveTab('predictions')}
            />
          ) : (
            <SelectDistrictPrompt onGoToSearch={handleCheckMyRisk} />
          )
        )}

        {/* Tab 3: Predictions View (Hydrograph, Hyetograph, SHAP explainability) */}
        {activeTab === 'predictions' && (
          currentSector ? (
            <PredictionsView
              currentSector={currentSector}
              onSelectSector={handleSelectSector}
              onOpenDiagnostic={() => setActiveTab('predictions')}
            />
          ) : (
            <SelectDistrictPrompt onGoToSearch={handleCheckMyRisk} />
          )
        )}

        {/* Tab 4: Impact Assessment View (Demographics, Infrastructure, Shelters) */}
        {activeTab === 'impact' && (
          currentSector ? (
            <ImpactView
              currentSector={currentSector}
              onSelectSector={handleSelectSector}
              onOpenShelterModal={() => setIsShelterOpen(true)}
            />
          ) : (
            <SelectDistrictPrompt onGoToSearch={handleCheckMyRisk} />
          )
        )}

        {/* Tab 5: Alerts View (Active Public Directives & SMS Broadcast) */}
        {activeTab === 'alerts' && (
          <AlertsView
            onSelectSector={(id) => {
              handleSelectSector(id);
              setActiveTab('overview');
            }}
            onOpenGuideModal={() => setIsGuideOpen(true)}
            onOpenShelterModal={() => setIsShelterOpen(true)}
          />
        )}

        {/* Tab 6: Historical Analysis View (2018–2025 Longitudinal Study) */}
        {activeTab === 'historical' && (
          <HistoricalView />
        )}

        {/* Tab 7: Methodology & Architecture View */}
        {activeTab === 'methodology' && (
          <MethodologyView />
        )}

        {/* Tab 8: Scenario Simulation View (POST /api/simulate) */}
        {activeTab === 'simulation' && (
          <SimulationView />
        )}
      </main>

      {/* Institutional Advisory & Operational Footer */}
      <Footer
        onOpenMethodology={() => setActiveTab('methodology')}
        onOpenSafetyGuide={() => setIsGuideOpen(true)}
      />

      {/* Shelter Map & Relief Camp Directory Modal */}
      <ShelterModal
        isOpen={isShelterOpen}
        onClose={() => setIsShelterOpen(false)}
        sector={currentSector ?? ASSAM_SECTORS.dhemaji}
      />

      {/* Offline Bilingual Survival Guide Modal */}
      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
