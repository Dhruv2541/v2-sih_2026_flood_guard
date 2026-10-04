import React, { useState, useRef, useEffect } from 'react';
import { 
  Home, 
  Map, 
  Bell, 
  History, 
  Menu, 
  X, 
  AlertTriangle, 
  Activity, 
  BarChart3, 
  Info, 
  PhoneCall, 
  ChevronRight,
  ShieldAlert,
  Sliders,
} from 'lucide-react';
import { ACTIVE_FLOOD_ALERTS } from '../data/assamData';
import { ThemeToggle } from './ThemeToggle';
import { Logo } from './Logo';
import { FloodGuardBrandReveal } from './FloodGuardBrandReveal';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onCheckMyRisk: () => void;
  onSearchSelect?: (sectorId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onCheckMyRisk,
}) => {
  const [isAlertDrawerOpen, setIsAlertDrawerOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAnalyticsDropdownOpen, setIsAnalyticsDropdownOpen] = useState(false);

  const analyticsDropdownRef = useRef<HTMLDivElement>(null);
  const alertDrawerRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click with proper event listener cleanup
  useEffect(() => {
    if (!isAlertDrawerOpen && !isAnalyticsDropdownOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        isAnalyticsDropdownOpen &&
        analyticsDropdownRef.current &&
        !analyticsDropdownRef.current.contains(target)
      ) {
        setIsAnalyticsDropdownOpen(false);
      }
      if (
        isAlertDrawerOpen &&
        alertDrawerRef.current &&
        !alertDrawerRef.current.contains(target)
      ) {
        setIsAlertDrawerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAlertDrawerOpen, isAnalyticsDropdownOpen]);

  const criticalAlertCount = ACTIVE_FLOOD_ALERTS.filter(
    (a) => a.riskLevel === 'CRITICAL' || a.riskLevel === 'HIGH'
  ).length;


  // 4 Primary Core Navigation Items (Simple, Icon-Driven)
  const primaryNavItems = [
    { id: 'overview', label: 'Home', icon: Home },
    { id: 'map', label: 'Risk Map', icon: Map },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'historical', label: 'History', icon: History },
  ];

  // Secondary Deep Analytical Sections (Progressive Disclosure)
  const secondaryNavItems = [
    { id: 'predictions', label: 'Predictions & Hydrograph', icon: Activity, desc: 'Water level timeline & AI explainability' },
    { id: 'impact', label: 'Impact & Infrastructure', icon: BarChart3, desc: 'Schools, hospitals & vulnerable populations' },
    { id: 'simulation', label: 'Scenario Simulation', icon: Sliders, desc: 'Hypothetical flood stress testing' },
    { id: 'methodology', label: 'How It Works / Architecture', icon: Info, desc: 'Open-Meteo, CWC river telemetry & ML pipeline' },
  ];

  const isSecondaryActive = secondaryNavItems.some((item) => item.id === activeTab);

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
    setIsAnalyticsDropdownOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-slate-950/40 backdrop-blur-md dark:backdrop-blur-2xl border-b border-slate-200/80 dark:border-white/5 shadow-sm dark:shadow-[0_4px_30px_rgba(0,0,0,0.1)] transition-colors">
        <div className="max-w-[1536px] mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Brand Identity */}
          <div 
            onClick={() => handleNavClick('overview')}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group select-none flex-shrink-0"
            id="brand-logo-floodguard"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleNavClick('overview')}
          >
            <FloodGuardBrandReveal />
          </div>

          {/* Desktop Center: Clean Primary Navigation + Analytics & Tools Dropdown */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`relative px-3.5 py-2 min-h-[40px] text-xs lg:text-sm font-semibold transition-all flex items-center gap-2 rounded-lg cursor-pointer ${
                    isActive
                      ? 'text-[#0b1c30] dark:text-white bg-slate-100/90 dark:bg-slate-800'
                      : 'text-slate-600 dark:text-slate-400 hover:text-[#0b1c30] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600 dark:text-sky-400' : 'opacity-70'}`} />
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 ? (
                    <span className="px-1.5 py-0.2 bg-red-600 text-white text-[10px] font-extrabold rounded-full animate-pulse">
                      {item.badge}
                    </span>
                  ) : null}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2.5px] bg-[#0b1c30] dark:bg-sky-400 rounded-full" />
                  )}
                </button>
              );
            })}

            {/* Desktop Analytics & Tools Dropdown */}
            <div className="relative" ref={analyticsDropdownRef}>
              <button
                id="nav-dropdown-analytics"
                type="button"
                onClick={() => setIsAnalyticsDropdownOpen(!isAnalyticsDropdownOpen)}
                className={`relative px-3 py-2 min-h-[40px] text-xs lg:text-sm font-semibold transition-all flex items-center gap-1.5 rounded-lg cursor-pointer ${
                  isSecondaryActive
                    ? 'text-[#0b1c30] dark:text-white bg-slate-100/90 dark:bg-slate-800'
                    : 'text-slate-600 dark:text-slate-400 hover:text-[#0b1c30] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
                aria-expanded={isAnalyticsDropdownOpen}
                aria-label="Deep Analysis & Tools Navigation"
              >
                <Sliders className={`w-4 h-4 ${isSecondaryActive ? 'text-sky-600 dark:text-sky-400' : 'opacity-70'}`} />
                <span>Analytics &amp; Tools</span>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isAnalyticsDropdownOpen ? 'rotate-90' : ''}`} />
                {isSecondaryActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-[2.5px] bg-[#0b1c30] dark:bg-sky-400 rounded-full" />
                )}
              </button>

              {isAnalyticsDropdownOpen && (
                <div 
                  className="absolute left-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  id="analytics-dropdown-menu"
                >
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 px-2.5 py-1">
                    Deep Intelligence Modules
                  </div>
                  {secondaryNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        id={`nav-link-${item.id}`}
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full text-left px-2.5 py-2.5 rounded-lg transition flex items-start gap-2.5 min-h-[44px] cursor-pointer ${
                          isActive
                            ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-200 font-bold'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-sky-600 dark:text-sky-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs font-semibold">{item.label}</div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5">{item.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Right Side: Theme Toggle, Notifications, Primary CTA, and Mobile Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            {/* Theme Toggle (Desktop & Tablet) */}
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            {/* Notification Bell with Dropdown */}
            <div className="relative" ref={alertDrawerRef}>
              <button
                onClick={() => setIsAlertDrawerOpen(!isAlertDrawerOpen)}
                id="nav-notification-indicator"
                className="relative min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:border-slate-700"
                title="Active Flood Risk Alerts"
                aria-label="Active Flood Risk Alerts"
              >
                <Bell className="w-5 h-5" />
                {criticalAlertCount > 0 && (
                  <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                  </span>
                )}
              </button>

              {/* Notification Flyout */}
              {isAlertDrawerOpen && (
                <div 
                  className="absolute right-0 mt-2 w-[min(24rem,calc(100vw-24px))] bg-white dark:bg-slate-900/60 dark:backdrop-blur-2xl rounded-xl shadow-xl border border-slate-200 dark:border-white/10 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  id="notification-flyout"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <span className="font-bold text-sm text-[#0b1c30] dark:text-slate-100">Live Warning Bulletins</span>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 rounded">
                      {ACTIVE_FLOOD_ALERTS.length} Active
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto mt-2">
                    {ACTIVE_FLOOD_ALERTS.slice(0, 3).map((alert) => (
                      <div 
                        key={alert.id} 
                        className="py-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded px-1 transition"
                        onClick={() => {
                          setIsAlertDrawerOpen(false);
                          handleNavClick('alerts');
                        }}
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{alert.location}</span>
                          <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                            alert.riskLevel === 'CRITICAL' ? 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300' :
                            alert.riskLevel === 'HIGH' ? 'bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300' :
                            'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                          }`}>
                            {alert.riskLevel}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{alert.headline}</p>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">{alert.timestamp}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setIsAlertDrawerOpen(false);
                        handleNavClick('alerts');
                      }}
                      className="text-xs text-sky-700 dark:text-sky-400 hover:text-sky-900 dark:hover:text-sky-300 font-bold p-1 min-h-[36px]"
                    >
                      View All Alerts →
                    </button>
                    <button
                      onClick={() => setIsAlertDrawerOpen(false)}
                      className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1 min-h-[36px]"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Primary Action Button: "Check My Risk" (min 44px touch target) */}
            <button
              onClick={onCheckMyRisk}
              id="nav-check-risk-btn"
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 min-h-[44px] rounded-lg bg-[#0b1c30] dark:bg-sky-600 hover:bg-[#152840] dark:hover:bg-sky-500 active:scale-[0.98] text-white text-xs sm:text-sm font-bold tracking-wide transition-all shadow-xs hover:shadow whitespace-nowrap cursor-pointer dark:border dark:border-sky-400/25 dark:shadow-[0_0_12px_rgba(2,132,199,0.25)]"
            >
              <span className="w-2 h-2 rounded-full bg-sky-400 dark:bg-white animate-pulse flex-shrink-0"></span>
              <span>Check My Risk</span>
            </button>

            {/* Mobile / Tablet Menu Button (Hamburger - min 44px touch target) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              id="nav-mobile-menu-btn"
              aria-label="Open Navigation Menu"
              className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Quick Tab Bar (Always Visible on Mobile: Home, Map, Alerts, History - min 44px touch target) */}
        <div className="md:hidden flex items-center justify-around border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 px-1 py-1 text-xs">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex-1 min-h-[44px] py-1 flex flex-col items-center justify-center gap-0.5 rounded-md transition cursor-pointer ${
                  isActive
                    ? 'text-sky-600 dark:text-sky-400 font-bold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="relative">
                  <Icon className="w-4 h-4" />
                  {item.badge && item.badge > 0 ? (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-600" />
                  ) : null}
                </div>
                <span className="text-[11px] leading-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Mobile Slide-Over Menu Drawer */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 md:hidden bg-slate-950/40 backdrop-blur-md dark:bg-[#02050a]/60 dark:backdrop-blur-xl flex justify-end animate-in fade-in duration-150"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div 
            className="w-[85%] max-w-sm bg-white dark:bg-slate-950/80 dark:backdrop-blur-3xl border-l border-white/5 h-full shadow-2xl p-5 flex flex-col justify-between overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Logo size={28} />
                  <span className="font-heading font-extrabold text-slate-900 dark:text-white text-base">
                    FloodGuard Menu
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="min-w-[44px] min-h-[44px] p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Primary Pages */}
              <div className="mt-4 space-y-1.5">
                <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase px-3 py-1 font-mono">
                  Primary Pages
                </div>
                {primaryNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full min-h-[44px] flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
                        isActive
                          ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && item.badge > 0 ? (
                        <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded-full">
                          {item.badge}
                        </span>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Extended Intelligence (Progressive Disclosure) */}
              <div className="mt-5 space-y-1.5">
                <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase px-3 py-1 font-mono">
                  Deep Intelligence & Analysis
                </div>
                {secondaryNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full min-h-[44px] text-left px-3 py-2.5 rounded-lg transition cursor-pointer ${
                        isActive
                          ? 'bg-slate-100 dark:bg-slate-800 font-bold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                        <Icon className="w-4 h-4 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 pl-6.5 mt-0.5">
                        {item.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drawer Bottom Actions: Theme & Emergency Contact */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between px-1 min-h-[44px]">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Interface Appearance</span>
                <ThemeToggle />
              </div>

              <a
                href="tel:1070"
                className="w-full min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-bold text-xs shadow-xs transition"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call State Emergency: 1070</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
