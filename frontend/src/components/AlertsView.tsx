import React, { useState } from 'react';
import { ACTIVE_FLOOD_ALERTS } from '../data/assamData';
import { AlertSeverity } from '../types';
import { 
  CircleAlert, 
  TriangleAlert, 
  Info, 
  Clock, 
  MapPin, 
  Phone, 
  Radio, 
  CheckCircle2, 
  Send,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Building,
  Navigation
} from 'lucide-react';

interface AlertsViewProps {
  onSelectSector?: (sectorId: string) => void;
  onOpenGuideModal?: () => void;
  onOpenShelterModal?: () => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  onSelectSector,
  onOpenGuideModal,
  onOpenShelterModal,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | AlertSeverity>('ALL');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('Dhemaji');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [expandedAlerts, setExpandedAlerts] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedAlerts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredAlerts = filterSeverity === 'ALL'
    ? ACTIVE_FLOOD_ALERTS
    : ACTIVE_FLOOD_ALERTS.filter((a) => a.riskLevel === filterSeverity);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    setIsSubscribed(true);
    setTimeout(() => {
      // transient state
    }, 4000);
  };

  return (
    <div className="w-full max-w-[1536px] mx-auto px-3.5 sm:px-6 lg:px-8 py-5 space-y-5 animate-in fade-in duration-200 min-w-0">
      {/* Top Banner & Header */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse flex-shrink-0"></span>
            <span className="text-xs font-mono font-bold tracking-wider text-red-700 dark:text-red-400 uppercase truncate">
              OFFICIAL EMERGENCY WARNING DIRECTIVES
            </span>
          </div>
          <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#0b1c30] dark:text-slate-100">
            Active Flood Alerts &amp; Advisories
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Live public warnings issued in collaboration with ASDMA and Central Water Commission.
          </p>
        </div>

        {/* Severity Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 overflow-x-auto max-w-full touch-pan-x scrollbar-none self-start md:self-auto">
          {(['ALL', 'CRITICAL', 'HIGH', 'MODERATE'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1.5 min-h-[36px] text-xs font-bold rounded-lg transition whitespace-nowrap flex-shrink-0 ${
                filterSeverity === sev
                  ? 'bg-[#0b1c30] dark:bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
              }`}
            >
              {sev === 'ALL' ? 'All Alerts' : sev}
            </button>
          ))}
        </div>
      </div>

      {/* Active Alerts List - Redesigned Around ACTION */}
      <div className="space-y-4">
        {filteredAlerts.map((alert) => {
          const isCritical = alert.riskLevel === 'CRITICAL';
          const isHigh = alert.riskLevel === 'HIGH';
          const isExpanded = !!expandedAlerts[alert.id];

          const SevIcon = isCritical ? CircleAlert : isHigh ? TriangleAlert : Info;
          const sevColorClass = isCritical
            ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/70 border-red-200 dark:border-red-900/60'
            : isHigh
            ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/70 border-orange-200 dark:border-orange-900/60'
            : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/70 border-amber-200 dark:border-amber-900/60';

          const cardBorder = isCritical
            ? 'border-red-300 dark:border-red-900/80 ring-1 ring-red-500/10'
            : isHigh
            ? 'border-orange-300 dark:border-orange-900/80'
            : 'border-slate-200 dark:border-slate-800';

          return (
            <div
              key={alert.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl border ${cardBorder} p-5 sm:p-6 shadow-sm transition-all`}
            >
              {/* Header: Severity Badge + Location */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase font-mono border ${sevColorClass}`}>
                    <SevIcon className="w-3.5 h-3.5 flex-shrink-0 animate-pulse" />
                    <span>{alert.riskLevel} FLOOD WARNING</span>
                  </span>
                  <span className="font-heading font-extrabold text-slate-900 dark:text-white text-base sm:text-lg">
                    {alert.location}
                  </span>
                </div>

                <div className="text-xs text-slate-400 dark:text-slate-500 font-mono flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Issued: {alert.timestamp}</span>
                </div>
              </div>

              {/* Headline & Core Summary */}
              <div className="mt-3.5">
                <h3 className="font-heading font-extrabold text-lg sm:text-xl text-[#0b1c30] dark:text-slate-100 leading-tight">
                  {alert.headline}
                </h3>
                <div className="mt-2 flex items-center gap-4 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 flex-wrap">
                  <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                    <Clock className="w-4 h-4" />
                    <span>Flooding expected within 18–36 hours</span>
                  </span>
                  <span>•</span>
                  <span>
                    <strong>{((alert.affectedPopulation || alert.populationAtRisk) ?? 0).toLocaleString()}</strong> people potentially affected
                  </span>
                </div>
              </div>

              {/* ACTION-FIRST BLOCK: "WHAT YOU SHOULD DO" */}
              <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                <div className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-600 flex-shrink-0"></span>
                  <span>WHAT YOU SHOULD DO:</span>
                </div>

                <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200 mb-3.5">
                  {(alert.actionItems || [alert.recommendedAction]).map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>

                {/* Direct Action Buttons */}
                <div className="flex items-center gap-2.5 flex-wrap pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
                  {onOpenShelterModal && (
                    <button
                      onClick={onOpenShelterModal}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0b1c30] hover:bg-[#14263d] dark:bg-sky-600 dark:hover:bg-sky-500 text-white text-xs font-bold shadow-2xs transition"
                    >
                      <Building className="w-3.5 h-3.5" />
                      <span>View Safe Shelters</span>
                    </button>
                  )}

                  <a
                    href="tel:1070"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-50 dark:bg-red-950/70 hover:bg-red-100 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60 text-xs font-bold transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Emergency Helpline (1070)</span>
                  </a>

                  {onSelectSector && (
                    <button
                      onClick={() => onSelectSector(alert.sectorId || 'dhemaji')}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 text-xs font-semibold transition ml-auto"
                    >
                      <span>View on Map</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Progressive Disclosure: Secondary Information Accordion */}
              <div className="mt-3 pt-2">
                <button
                  onClick={() => toggleExpand(alert.id)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 py-1 transition"
                >
                  <span className="flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span>{isExpanded ? 'Hide technical details' : 'View issuing authority, river & affected roads ↓'}</span>
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {isExpanded && (
                  <div className="mt-2.5 p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs space-y-2 animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <span className="text-slate-400 text-[10px] font-mono font-bold block uppercase">ISSUING AUTHORITY</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{alert.authority || alert.issuedBy || 'ASDMA & CWC'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] font-mono font-bold block uppercase">RIVER BASIN</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{alert.riverBasin || alert.district}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] font-mono font-bold block uppercase">WATER STAGE</span>
                        <span className="font-semibold text-red-600 dark:text-red-400 font-mono">+1.85m above danger level</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300">
                      <strong className="text-slate-800 dark:text-slate-200">Advisory Details: </strong>
                      {alert.description || alert.summary}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Siren & SMS Early Warning Broadcast Registration */}
      <div className="bg-[#0b1c30] dark:bg-slate-900 border border-slate-200/30 dark:border-slate-800 text-white rounded-2xl p-6 shadow-md transition-colors">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-sky-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <Radio className="w-4 h-4" />
            <span>COMMUNITY BROADCAST SUBSCRIPTION</span>
          </div>
          <h3 className="font-heading font-extrabold text-xl tracking-tight">
            Register for Instant SMS Flood Alerts
          </h3>
          <p className="text-slate-300 dark:text-slate-400 text-xs sm:text-sm mt-1 leading-relaxed">
            Get automated mobile alerts if river levels or heavy rainfall cross danger marks in your circle.
          </p>

          <form onSubmit={handleSubscribe} className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full">
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter 10-digit mobile number..."
              className="w-full sm:w-72 px-3.5 py-2.5 min-h-[42px] bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-sky-400"
            />

            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full sm:w-44 px-3 py-2.5 min-h-[42px] bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-sky-400"
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
              className="w-full sm:w-auto px-5 py-2.5 min-h-[42px] bg-sky-500 hover:bg-sky-400 active:scale-[0.98] text-slate-950 font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>Subscribe</span>
            </button>
          </form>

          {isSubscribed && (
            <div className="mt-3 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>
                Alert registration confirmed for {phoneNumber} ({selectedDistrict}).
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
