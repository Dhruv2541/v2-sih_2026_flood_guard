import React, { useState, useMemo } from 'react';
import { AlertSeverity, BackendAlert } from '../types';
import { AlertItem } from '../api/alerts';
import {
  DataStateBoundary,
  SkeletonCard,
  EmptyState,
  ErrorState,
  BackendUnavailable,
  DataState,
} from './data-state';
import {
  Clock,
  Phone,
  Radio,
  Send,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Building,
  Database,
  AlertTriangle,
} from 'lucide-react';
import {
  getAlertSeverityPresentation,
  normalizeBackendAlert,
  DEFAULT_MOCK_ALERTS,
} from '../lib/alertAdapter';

export interface AlertsViewProps {
  /** Optional alert records from backend endpoint GET /api/alerts?min_severity=Moderate */
  alerts?: BackendAlert[] | AlertItem[] | Record<string, unknown>[];
  /** Current data state: LOADING | SUCCESS | EMPTY | ERROR | BACKEND_UNAVAILABLE */
  dataState?: DataState;
  /** Error message if in ERROR or BACKEND_UNAVAILABLE state */
  errorMessage?: string;
  /** Retry callback */
  onRetry?: () => void | Promise<void>;
  /** Callback when sector/region is selected to view on map */
  onSelectSector?: (sectorId: string) => void;
  /** Modal triggers */
  onOpenGuideModal?: () => void;
  onOpenShelterModal?: () => void;
  /** Explicit flag if development mock data is being viewed */
  isDevelopmentMock?: boolean;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts: propAlerts,
  dataState: propDataState,
  errorMessage,
  onRetry,
  onSelectSector,
  onOpenShelterModal,
  isDevelopmentMock,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | AlertSeverity>('ALL');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('Dhemaji');
  const [showDispatchNotice, setShowDispatchNotice] = useState(false);
  const [expandedAlerts, setExpandedAlerts] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedAlerts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Normalize incoming backend alerts (or fall back to isolated development mock layer)
  const normalizedAlerts: BackendAlert[] = useMemo(() => {
    if (propAlerts && Array.isArray(propAlerts) && propAlerts.length > 0) {
      return propAlerts.map((a) => normalizeBackendAlert(a as Record<string, unknown>));
    }
    return DEFAULT_MOCK_ALERTS;
  }, [propAlerts]);

  const isMock =
    isDevelopmentMock !== undefined
      ? isDevelopmentMock
      : normalizedAlerts.some((a) => a.is_mock);

  // Filter alerts by backend-provided severity (never calculating severity)
  const filteredAlerts = useMemo(() => {
    if (filterSeverity === 'ALL') return normalizedAlerts;
    const filterUpper = filterSeverity.toUpperCase();
    return normalizedAlerts.filter((a) =>
      a.severity.toUpperCase().includes(filterUpper)
    );
  }, [normalizedAlerts, filterSeverity]);

  // Determine effective data state
  const effectiveDataState: DataState =
    propDataState !== undefined
      ? propDataState
      : filteredAlerts.length === 0
      ? 'EMPTY'
      : 'SUCCESS';

  // Handle SMS broadcast submission honestly (without pretending it registered)
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    // Transparently show that the dispatch service is not connected to a backend endpoint
    setShowDispatchNotice(true);
  };

  return (
    <div className="w-full max-w-[1536px] mx-auto px-3.5 sm:px-6 lg:px-8 py-5 space-y-5 animate-in fade-in duration-200 min-w-0">
      {/* ────────────────────────────────────────────────────────────────
          1. TOP BANNER & SEVERITY FILTER
          ──────────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse flex-shrink-0" />
            <span className="text-xs font-mono font-bold tracking-wider text-red-700 dark:text-red-400 uppercase truncate">
              EMERGENCY WARNING DIRECTIVES FEED
            </span>
            {isMock && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                <Database className="w-3 h-3" />
                <span>DEV MOCK • SIMULATED DIRECTIVES</span>
              </span>
            )}
          </div>
          <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#0b1c30] dark:text-slate-100">
            Active Flood Alerts &amp; Advisories
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Authoritative public warning directives issued for monitored Brahmaputra catchments.
          </p>
        </div>

        {/* Severity Filter Buttons (min-h-[44px] touch target) */}
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 overflow-x-auto max-w-full touch-pan-x scrollbar-none self-start md:self-auto">
          {(['ALL', 'CRITICAL', 'HIGH', 'MODERATE'] as const).map((sev) => {
            const isActive = filterSeverity === sev;
            return (
              <button
                key={sev}
                type="button"
                onClick={() => setFilterSeverity(sev)}
                aria-pressed={isActive}
                className={`px-3.5 py-2 min-h-[44px] text-xs font-bold rounded-lg transition whitespace-nowrap flex-shrink-0 cursor-pointer flex items-center justify-center ${
                  isActive
                    ? 'bg-[#0b1c30] dark:bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                }`}
              >
                {sev === 'ALL' ? 'All Alerts' : sev}
              </button>
            );
          })}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────
          2. DATA STATE BOUNDARY CONTROLLER
          ──────────────────────────────────────────────────────────────── */}
      <DataStateBoundary
        state={effectiveDataState}
        loadingComponent={<SkeletonCard variant="alert" count={3} />}
        emptyComponent={
          <EmptyState
            title="No active flood alerts."
            description="There are currently no emergency flood warning directives matching the selected filter."
            actionLabel={filterSeverity !== 'ALL' ? 'Show All Warnings' : undefined}
            onAction={filterSeverity !== 'ALL' ? () => setFilterSeverity('ALL') : undefined}
          />
        }
        errorComponent={
          <ErrorState
            title="Unable to load flood data."
            message={errorMessage || 'Could not retrieve emergency warning directives from the alert service.'}
            onRetry={onRetry}
          />
        }
        backendUnavailableComponent={
          <BackendUnavailable
            title="FloodGuard backend is currently unavailable."
            message="Alert dissemination server is unreachable. Emergency siren and directive feeds are currently offline."
            onRetry={onRetry}
          />
        }
      >
        {/* ────────────────────────────────────────────────────────────
            3. ALERT LIST CARDS
            ──────────────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {filteredAlerts.map((alert) => {
            const isExpanded = !!expandedAlerts[alert.id];
            const presentation = getAlertSeverityPresentation(alert.severity);
            const SevIcon = presentation.icon;

            return (
              <div
                key={alert.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border ${presentation.cardBorder} p-5 sm:p-6 shadow-sm transition-all`}
              >
                {/* Header: Severity Badge + Region + Timestamp */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Severity Badge: Authoritative backend severity */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase font-mono border ${presentation.badgeClass}`}
                    >
                      <SevIcon className="w-3.5 h-3.5 flex-shrink-0 animate-pulse" />
                      <span>{presentation.label}</span>
                    </span>

                    {/* Region */}
                    <span className="font-heading font-extrabold text-slate-900 dark:text-white text-base sm:text-lg">
                      {alert.region}
                    </span>

                    {alert.is_mock && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        DEV MOCK
                      </span>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="text-xs text-slate-400 dark:text-slate-500 font-mono flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>Issued: {alert.timestamp}</span>
                  </div>
                </div>

                {/* Message & Core Summary */}
                <div className="mt-3.5">
                  <h3 className="font-heading font-extrabold text-lg sm:text-xl text-[#0b1c30] dark:text-slate-100 leading-tight">
                    {alert.message}
                  </h3>

                  {alert.affected_population !== undefined && (
                    <div className="mt-2 flex items-center gap-4 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 flex-wrap">
                      <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                        <Clock className="w-4 h-4" />
                        <span>High risk inundation zone</span>
                      </span>
                      <span>•</span>
                      <span>
                        <strong>{alert.affected_population.toLocaleString()}</strong> residents potentially impacted
                      </span>
                    </div>
                  )}
                </div>

                {/* ACTION-FIRST BLOCK: "WHAT YOU SHOULD DO" (when action items provided) */}
                {alert.action_items && alert.action_items.length > 0 && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                    <div className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-600 flex-shrink-0" />
                      <span>WHAT YOU SHOULD DO:</span>
                    </div>

                    <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200 mb-3.5">
                      {alert.action_items.map((action, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Direct Action Buttons (min-h-[44px] touch targets) */}
                    <div className="flex items-center gap-2.5 flex-wrap pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
                      {onOpenShelterModal && (
                        <button
                          type="button"
                          onClick={onOpenShelterModal}
                          className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg bg-[#0b1c30] hover:bg-[#14263d] dark:bg-sky-600 dark:hover:bg-sky-500 text-white text-xs font-bold shadow-2xs transition cursor-pointer"
                        >
                          <Building className="w-3.5 h-3.5" />
                          <span>View Safe Shelters</span>
                        </button>
                      )}

                      <a
                        href="tel:1070"
                        className="flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-lg bg-red-50 dark:bg-red-950/70 hover:bg-red-100 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60 text-xs font-bold transition"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Emergency Helpline (1070)</span>
                      </a>

                      {onSelectSector && alert.sector_id && (
                        <button
                          type="button"
                          onClick={() => onSelectSector(alert.sector_id!)}
                          className="flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 text-xs font-semibold transition ml-auto cursor-pointer"
                        >
                          <span>View on Map</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Progressive Disclosure: Technical Authority Details */}
                <div className="mt-3 pt-2">
                  <button
                    type="button"
                    onClick={() => toggleExpand(alert.id)}
                    className="w-full flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 py-1 transition"
                  >
                    <span>
                      {isExpanded ? 'Hide technical authority details' : 'View issuing authority & advisory details ↓'}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {isExpanded && (
                    <div className="mt-2.5 p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs space-y-2 animate-in fade-in duration-150">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <span className="text-slate-400 text-[10px] font-mono font-bold block uppercase">
                            ISSUING AUTHORITY
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {alert.authority || alert.issued_by || 'ASDMA & Central Water Commission'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] font-mono font-bold block uppercase">
                            RIVER BASIN
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {alert.river_basin || alert.region}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] font-mono font-bold block uppercase">
                            DIRECTIVE STATUS
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            Active Statutory Watch
                          </span>
                        </div>
                      </div>

                      {(alert.description || alert.summary) && (
                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300">
                          <strong className="text-slate-800 dark:text-slate-200">Advisory Details: </strong>
                          {alert.description || alert.summary}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DataStateBoundary>

      {/* ────────────────────────────────────────────────────────────────
          4. COMMUNITY BROADCAST NOTIFICATION REGISTRATION
          Clearly identified as NOT connected to a backend endpoint.
          ──────────────────────────────────────────────────────────────── */}
      <div className="bg-[#0b1c30] dark:bg-slate-900 border border-slate-200/30 dark:border-slate-800 text-white rounded-2xl p-6 shadow-md transition-colors">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <div className="flex items-center gap-1.5 text-sky-400 text-xs font-mono font-bold uppercase tracking-wider">
              <Radio className="w-4 h-4" />
              <span>COMMUNITY BROADCAST SUBSCRIPTION</span>
            </div>
            {/* Explicit offline/unconnected badge */}
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              DISPATCH SERVICE OFFLINE • DEMO ONLY
            </span>
          </div>

          <h3 className="font-heading font-extrabold text-xl tracking-tight">
            Register for Automated SMS Flood Alerts
          </h3>
          <p className="text-slate-300 dark:text-slate-400 text-xs sm:text-sm mt-1 leading-relaxed">
            Get automated mobile alerts if river levels or heavy rainfall cross danger marks in your circle.
          </p>

          <form onSubmit={handleSubscribe} className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full">
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                setShowDispatchNotice(false);
              }}
              placeholder="Enter 10-digit mobile number..."
              className="w-full sm:w-72 px-3.5 py-2.5 min-h-[44px] bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-sky-400"
            />

            <select
              value={selectedDistrict}
              onChange={(e) => {
                setSelectedDistrict(e.target.value);
                setShowDispatchNotice(false);
              }}
              className="w-full sm:w-44 px-3 py-2.5 min-h-[44px] bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-sky-400 cursor-pointer"
            >
              <option value="Dhemaji">Dhemaji</option>
              <option value="Majuli">Majuli</option>
              <option value="Lakhimpur">Lakhimpur</option>
              <option value="Dibrugarh">Dibrugarh</option>
              <option value="Tinsukia">Tinsukia</option>
              <option value="Barpeta">Barpeta</option>
            </select>

            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] bg-sky-500 hover:bg-sky-400 active:scale-[0.98] text-slate-950 font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 flex-shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Subscribe</span>
            </button>
          </form>

          {/* Honest notification informing the user that backend dispatch is not connected */}
          {showDispatchNotice && (
            <div className="mt-3 p-3.5 rounded-xl bg-amber-950/80 border border-amber-500/60 text-amber-200 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold text-amber-300">
                  SMS Notification Dispatcher Not Connected
                </strong>
                <p className="mt-0.5 text-amber-200/90 leading-relaxed">
                  The automated carrier SMS gateway endpoint is currently under development. Mobile number ({phoneNumber}) for {selectedDistrict} was not queued into telecom gateways. For binding statutory orders, contact the State Emergency Operations Centre at{' '}
                  <a href="tel:1070" className="underline font-bold text-amber-100 hover:text-white">
                    1070
                  </a>{' '}
                  or monitor ASDMA radio bulletins.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
