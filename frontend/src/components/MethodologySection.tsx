import React from 'react';
import { Database, Mountain, Cpu, Radio, Shield, CheckCircle2 } from 'lucide-react';

export const MethodologySection: React.FC = () => {
  const steps = [
    {
      step: 'STEP 01',
      title: 'Telemetry Ingestion',
      icon: Database,
      desc: 'Pulls hourly automated rainfall from IMD Doppler stations, river stage levels from 114 CWC river gauges, and SMAP soil moisture indexes.',
    },
    {
      step: 'STEP 02',
      title: 'Terrain Processing',
      icon: Mountain,
      desc: 'High-resolution SRTM 30m Digital Elevation Models (DEM) calculate catchment flow paths, watershed slope runoffs, and topographic wetness indices.',
    },
    {
      step: 'STEP 03',
      title: 'Deep ML Modeling',
      icon: Cpu,
      desc: 'Hydro-v3.2 spatial-temporal model trained on 30 years of historical Brahmaputra surge data predicts inundation zones with 93.4% accuracy.',
    },
    {
      step: 'STEP 04',
      title: 'Public Safety Directives',
      icon: Radio,
      desc: 'Distills complex stage hydrographs into simple 0-100 hazard scores and actionable survival protocols for rural communities and district magistrates.',
    },
  ];

  const partners = [
    { name: 'Central Water Commission (CWC)', icon: '🌊' },
    { name: 'India Meteorological Dept (IMD)', icon: '🌦️' },
    { name: 'ISRO / NRSC Sentinel SAR', icon: '🛰️' },
    { name: 'ASDMA Disaster Cell', icon: '🛡️' },
  ];

  return (
    <section className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 mt-14">
      {/* Header */}
      <div>
        <span className="text-[11px] font-bold tracking-wider text-[#006398] dark:text-sky-400 uppercase font-mono">
          METHODOLOGY & EXPLAINABILITY
        </span>
        <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0b1c30] dark:text-slate-100 tracking-tight mt-1">
          How FloodGuard Predicts Hydrological Hazard
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-normal mt-1 max-w-3xl leading-relaxed">
          We combine physical open-source telemetry with cutting-edge convolutional neural networks, delivering actionable early warnings up to 72 hours before embankment crest breaches.
        </p>
      </div>

      {/* 4 Pipeline Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {steps.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 rounded-lg border border-slate-300/80 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between transition-colors"
            >
              <div>
                <div className="w-9 h-9 rounded bg-[#eff4ff] dark:bg-sky-950/80 text-[#006398] dark:text-sky-300 border border-sky-100 dark:border-sky-800 flex items-center justify-center mb-3">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-[11px] font-bold font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {item.step}
                </div>
                <h3 className="font-heading font-bold text-base text-[#0b1c30] dark:text-slate-100 mt-1">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed font-normal">
                  {item.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Data Feed Integrations Banner */}
      <div className="mt-8 p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 transition-colors">
        <span className="text-[10px] sm:text-[11px] font-bold font-mono tracking-wider text-slate-500 dark:text-slate-400 uppercase text-center md:text-left whitespace-normal md:whitespace-nowrap break-words">
          SCIENTIFIC DATA FEED INTEGRATIONS & MODELING MANDATES
        </span>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs font-semibold text-slate-700 dark:text-slate-300">
          {partners.map((partner, idx) => (
            <div key={idx} className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
              <span>{partner.icon}</span>
              <span>{partner.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
