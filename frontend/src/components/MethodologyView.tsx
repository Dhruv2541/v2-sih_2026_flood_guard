import React from 'react';
import { MethodologySection } from './MethodologySection';
import { 
  Cpu, 
  Database, 
  Server, 
  Layout, 
  ShieldCheck, 
  BarChart3, 
  Info,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  Radio,
  CloudRain,
  MapPin,
  FileCheck
} from 'lucide-react';

export const MethodologyView: React.FC = () => {
  // Authoritative Data Ingestion Sources Grounded in the Actual FloodGuard Architecture
  const dataSources = [
    {
      source: 'Open-Meteo Meteorological API',
      role: 'Atmospheric Ingestion',
      type: 'Gridded Precipitation API',
      latency: 'Dynamic On-Demand Query',
      params: '24-hour rainfall accumulation (mm), precipitation forecast grids across Brahmaputra catchment coordinates',
      reliability: 'Authoritative Open Weather Standard',
    },
    {
      source: 'Central Water Commission (CWC)',
      role: 'Hydrometric Telemetry',
      type: 'River Gauge Telemetry',
      latency: 'Regular Gauge Monitoring',
      params: 'Water level stage (m, MSL), Danger Level (DL), Warning Level (WL), Highest Flood Level (HFL), water trend',
      reliability: 'Govt. of India Official Standard',
    },
    {
      source: 'Assam State GIS & Watershed Profiles',
      role: 'Spatial Delineation',
      type: 'Topographic Catchment Grids',
      latency: 'Static Baseline (SRTM 30m)',
      params: 'Catchment slope, elevation gradients, 35 district administrative circle boundaries, river confluence buffers',
      reliability: 'Official State Geography',
    },
    {
      source: 'ASDMA Guidelines & Shelter Registry',
      role: 'Emergency Response',
      type: 'Institutional Directives',
      latency: 'Curated Registry',
      params: 'Designated relief shelters, emergency contact numbers, standard operating procedure severity tiers',
      reliability: 'State Disaster Management Authority',
    },
  ];

  return (
    <div className="w-full max-w-[1536px] mx-auto px-3.5 sm:px-6 lg:px-8 py-5 space-y-6 animate-in fade-in duration-200 min-w-0">
      {/* ── Page Header & Architecture Introduction ── */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider text-sky-700 dark:text-sky-400 uppercase mb-1.5">
            <Cpu className="w-4 h-4 text-sky-600 dark:text-sky-400 flex-shrink-0" />
            <span className="truncate">SYSTEM ARCHITECTURE &amp; OPERATIONAL PIPELINE</span>
          </div>
          <h1 className="font-heading font-extrabold text-xl sm:text-2xl sm:text-3xl text-[#0b1c30] dark:text-slate-100 tracking-tight">
            How FloodGuard Works: Architecture &amp; System Flow
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
            FloodGuard is an early-warning flood intelligence platform built for Assam. The system combines open weather telemetry with river gauge monitoring, orchestrating data through server-side machine learning inference and clear risk classifications for citizen safety.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto flex-shrink-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300 text-xs font-mono font-bold">
            <FileCheck className="w-3.5 h-3.5 text-sky-600" />
            <span>SIH Demo Verified</span>
          </div>
        </div>
      </div>

      {/* ── Explicit Three-Tier Architectural Division ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
              Three-Tier Decoupled Architecture
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Strict separation of concerns ensures verifiable results and client-side integrity
            </p>
          </div>
          <span className="hidden sm:inline-block text-[11px] font-mono text-slate-400">
            System Design Principles
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Tier 1: Backend Service */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-300 dark:border-slate-800 shadow-sm space-y-3 transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 flex items-center justify-center">
                  <Server className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  TIER 1 • BACKEND
                </span>
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-slate-100">
                  Backend Service &amp; Business Logic
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  Python / FastAPI Orchestrator
                </p>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                The backend performs all business logic and system orchestration. It queries external APIs, aligns coordinates with Assam catchment basins, executes statutory risk classification rules, and serves typed REST endpoints.
              </p>
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  <span>Queries Open-Meteo &amp; CWC telemetry</span>
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  <span>Owns danger thresholds &amp; risk classification</span>
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  <span>Serves <code className="font-mono text-blue-600 dark:text-blue-400">/api/predict</code> &amp; <code className="font-mono text-blue-600 dark:text-blue-400">/api/alerts</code></span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 text-[10px] font-mono text-slate-400 border-t border-slate-100 dark:border-slate-800">
              Role: Business Logic Authority
            </div>
          </div>

          {/* Tier 2: ML Model */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-300 dark:border-slate-800 shadow-sm space-y-3 transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 flex items-center justify-center">
                  <Cpu className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  TIER 2 • INFERENCE
                </span>
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-slate-100">
                  Machine Learning Model
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  Server-Side Predictive Inference
                </p>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                The ML model performs prediction on the server. Taking multi-variate hydrological features (accumulated precipitation, river stage vs. danger marks, and topographic slopes), it outputs continuous statistical flood probability (0% to 100%).
              </p>
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                  <span>Strictly server-side execution</span>
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                  <span>Outputs calibrated flood probability (0–100%)</span>
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                  <span>Probabilistic inference, never claimed 100% infallible</span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 text-[10px] font-mono text-slate-400 border-t border-slate-100 dark:border-slate-800">
              Role: Predictive Estimation
            </div>
          </div>

          {/* Tier 3: Frontend Client */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-300 dark:border-slate-800 shadow-sm space-y-3 transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
                  <Layout className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  TIER 3 • FRONTEND
                </span>
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-slate-100">
                  Frontend Client Application
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  React 19 / TypeScript / Mapbox / Recharts
                </p>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                The frontend visualizes the resulting data. It never calculates probabilities or derives risk thresholds on the client. It renders Mapbox GIS risk maps, Recharts hydrographs, and emergency alert feeds with resilient error boundaries.
              </p>
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Pure data visualizer &amp; presentation layer</span>
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Zero client-side risk or probability calculation</span>
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Handles loading, empty, error &amp; unavailable states</span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 text-[10px] font-mono text-slate-400 border-t border-slate-100 dark:border-slate-800">
              Role: Presentation &amp; Accessibility
            </div>
          </div>
        </div>
      </div>

      {/* ── 7-Stage End-to-End System Flow Stepper (Interactive MethodologySection) ── */}
      <MethodologySection />

      {/* ── Telemetry & Geospatial Data Sources Table ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-sm overflow-hidden transition-colors w-full max-w-[100vw]">
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-heading font-bold text-base text-slate-900 dark:text-slate-100 truncate">
              Authoritative Telemetry &amp; Geospatial Data Catalog
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">
              Verified physical input streams powering the FloodGuard prediction pipeline
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 whitespace-nowrap self-start sm:self-auto">
            4 Core Integrated Streams
          </span>
        </div>

        <div className="overflow-x-auto w-full touch-pan-x scrollbar-none">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/80 font-bold text-slate-700 dark:text-slate-300 font-mono uppercase text-[11px]">
                <th className="p-3">Data Provider</th>
                <th className="p-3">Pipeline Role</th>
                <th className="p-3">Modality</th>
                <th className="p-3">Observed Environmental Parameters</th>
                <th className="p-3">Authority / Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {dataSources.map((ds, i) => (
                <tr key={i} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                  <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">{ds.source}</td>
                  <td className="p-3 font-mono text-sky-700 dark:text-sky-300">{ds.role}</td>
                  <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{ds.type}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-300 max-w-sm">{ds.params}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                      {ds.reliability}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── SIH Demo Evaluation & Technical Integrity Standards ── */}
      <div className="bg-gradient-to-br from-slate-900 to-[#0b1c30] text-slate-100 rounded-2xl p-5 sm:p-6 shadow-md border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-base sm:text-lg text-white">
                SIH Technical Evaluation &amp; Scientific Integrity
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Adhering to rigorous engineering and transparent scientific standards
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 self-start sm:self-auto">
            Honest Architecture Mandate
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-1.5">
            <div className="font-bold text-white flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Calibrated Probabilities, Not Absolutes</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              FloodGuard models riverine and localized inundation as continuous statistical probabilities (0% to 100%). We do not claim deterministic &quot;100% accuracy&quot; because real-world river basin hydrodynamics are subject to variable embankment breaches and precipitation swings.
            </p>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-1.5">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Server className="w-4 h-4 text-sky-400" />
              <span>Zero Client-Side Calculation</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              The browser acts purely as a consumer presentation layer. All risk classifications (<span className="font-mono text-emerald-300">LOW</span>, <span className="font-mono text-amber-300">MODERATE</span>, <span className="font-mono text-orange-300">HIGH</span>, <span className="font-mono text-rose-300">CRITICAL</span>) originate strictly from backend business logic enforcing official danger mark thresholds.
            </p>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-1.5">
            <div className="font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Resilient State Boundaries</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              If upstream APIs (Open-Meteo or CWC) or the backend server become temporarily unreachable, FloodGuard gracefully renders dedicated Backend Unavailable and Error fallback boundaries rather than fabricating fake live predictions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

