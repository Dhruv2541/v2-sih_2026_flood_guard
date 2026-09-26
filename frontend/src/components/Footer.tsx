import React from 'react';
import { Info, ShieldCheck } from 'lucide-react';

interface FooterProps {
  onOpenMethodology: () => void;
  onOpenSafetyGuide: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenMethodology,
  onOpenSafetyGuide,
}) => {
  return (
    <footer className="mt-14 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors w-full max-w-full overflow-hidden min-w-0">
      {/* Statutory Notice Strip */}
      <div className="bg-[#eff4ff] dark:bg-slate-800/80 border-b border-sky-100 dark:border-slate-800 py-3.5 px-3 sm:px-6 lg:px-8 min-w-0">
        <div className="max-w-[1536px] mx-auto flex items-start gap-3 text-xs text-sky-950 dark:text-sky-200 font-normal leading-relaxed min-w-0">
          <Info className="w-4 h-4 text-[#006398] dark:text-sky-400 flex-shrink-0 mt-0.5" />
          <p className="min-w-0">
            <strong className="font-semibold text-[#00476e] dark:text-sky-300">Statutory Notice:</strong> FloodGuard is engineered as an open hydrological intelligence initiative to supply public early disaster intelligence. Risk models are algorithmic estimates intended to aid emergency preparedness and augment—not supersede—binding statutory evacuation orders issued by the Government of Assam or local District Magistrates.
          </p>
        </div>
      </div>

      {/* Main Footer Columns */}
      <div className="max-w-[1536px] mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-10 min-w-0">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 text-xs min-w-0">
          {/* Column 1: Institutional Advisory */}
          <div className="md:col-span-5 lg:col-span-4 min-w-0">
            <div className="flex items-center gap-2 mb-2 font-mono font-bold tracking-wider text-slate-800 dark:text-slate-200 uppercase">
              <ShieldCheck className="w-4 h-4 text-slate-600 dark:text-slate-400 flex-shrink-0" />
              <span>INSTITUTIONAL ADVISORY & MANDATE</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              FloodGuard provides AI-based risk estimates using environmental and geographic data from CWC, IMD, and Sentinel SAR. Predictions should be considered alongside official warnings from Assam State Disaster Management Authority (ASDMA) and local administrations.
            </p>
          </div>

          {/* Column 2: Emergency Response Matrix */}
          <div className="md:col-span-4 lg:col-span-3 min-w-0">
            <div className="font-mono font-bold tracking-wider text-slate-800 dark:text-slate-200 uppercase mb-3">
              EMERGENCY RESPONSE MATRIX
            </div>
            <ul className="space-y-2 text-slate-700 dark:text-slate-300">
              <li className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1 gap-2">
                <span className="truncate">State EOC Assam (SEOC):</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100 flex-shrink-0">1070 / 1079</span>
              </li>
              <li className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1 gap-2">
                <span className="truncate">NDRF 1st Bn Guwahati:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100 flex-shrink-0">0361-2849033</span>
              </li>
              <li className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1 gap-2">
                <span className="truncate">SDRF Assam Control:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100 flex-shrink-0">0361-2237011</span>
              </li>
            </ul>
          </div>

          {/* Column 3: Operational Protocol Links */}
          <div className="md:col-span-3 lg:col-span-3 min-w-0">
            <div className="font-mono font-bold tracking-wider text-slate-800 dark:text-slate-200 uppercase mb-3">
              OPERATIONAL PROTOCOL LINKS
            </div>
            <ul className="space-y-2 text-slate-600 dark:text-slate-400 font-medium">
              <li>
                <button
                  onClick={onOpenMethodology}
                  className="hover:text-slate-900 dark:hover:text-slate-100 hover:underline transition-colors py-1 text-left min-h-[36px] flex items-center"
                >
                  Model Methodology
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenSafetyGuide}
                  className="hover:text-slate-900 dark:hover:text-slate-100 hover:underline transition-colors py-1 text-left min-h-[36px] flex items-center"
                >
                  Offline Safety Protocols
                </button>
              </li>
              <li>
                <span className="text-slate-500 dark:text-slate-400 block py-1">
                  Privacy & Open Telemetry (Zero In-Browser Logging)
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Sub-bar */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 dark:text-slate-400 text-[11px]">
          <div>
            © 2025 FloodGuard Assam Hydrological Intelligence System. Public Sector Initiative.
          </div>
          <div className="flex items-center gap-2 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Brahmaputra Basin Hydrometry WGS 84 Real-Time GIS</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
