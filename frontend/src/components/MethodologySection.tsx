/**
 * MethodologySection Component
 *
 * Visualizes the 7-stage FloodGuard System Flow Architecture for the SIH Demo:
 *
 * Weather Data (Open-Meteo)
 *         ↓
 * River & Environmental Data (CWC)
 *         ↓
 * Assam Regions
 *         ↓
 * ML Model
 *         ↓
 * Flood Probability
 *         ↓
 * Risk Classification
 *         ↓
 * Alerts / Visualizations
 */

import React, { useState } from 'react';
import {
  CloudRain,
  Radio,
  MapPin,
  Cpu,
  BarChart3,
  ShieldAlert,
  Layers,
  ArrowDown,
  CheckCircle2,
  ChevronRight,
  Database,
  ExternalLink,
} from 'lucide-react';

interface PipelineStep {
  id: string;
  stepNumber: string;
  title: string;
  source: string;
  tier: 'DATA INGESTION' | 'FEATURE MAPPING' | 'AI/ML INFERENCE' | 'BUSINESS LOGIC' | 'PRESENTATION';
  tierColor: string;
  icon: React.ComponentType<{ className?: string }>;
  summary: string;
  technicalDetails: string[];
  samplePayload: Record<string, unknown>;
}

export const MethodologySection: React.FC = () => {
  const [activeStepId, setActiveStepId] = useState<string>('step-4');

  const pipelineSteps: PipelineStep[] = [
    {
      id: 'step-1',
      stepNumber: '01',
      title: 'Weather Data',
      source: 'Open-Meteo Meteorological API',
      tier: 'DATA INGESTION',
      tierColor: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-300 dark:border-sky-800',
      icon: CloudRain,
      summary:
        'Pulls gridded precipitation accumulation, hourly rainfall telemetry, and atmospheric moisture parameters across Brahmaputra catchment coordinates.',
      technicalDetails: [
        'Open-Meteo weather API endpoints queried by backend workers.',
        'Observed 24-hour rainfall accumulation in millimeters (mm).',
        'Forecast precipitation grids across northern foothill river basins.',
      ],
      samplePayload: {
        api_source: 'open-meteo',
        latitude: 27.48,
        longitude: 94.58,
        precipitation_24h_mm: 142.0,
        forecast_precipitation_mm: 175.5,
      },
    },
    {
      id: 'step-2',
      stepNumber: '02',
      title: 'River & Environmental Data',
      source: 'Central Water Commission (CWC)',
      tier: 'DATA INGESTION',
      tierColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800',
      icon: Radio,
      summary:
        'Ingests hydrometric telemetry across 114 river gauge stations on the Brahmaputra, Barak, and tributary networks.',
      technicalDetails: [
        'Water stage (current water level in meters, MSL reference).',
        'Statutory Danger Level (DL) and Warning Level (WL) benchmarks.',
        'Historical Highest Flood Level (HFL) and rising/falling trend indicator.',
      ],
      samplePayload: {
        station: 'Jiadhal Gauge #04',
        river: 'Jiadhal',
        current_stage_m: 104.85,
        danger_level_m: 103.00,
        trend: 'rising',
        delta_over_danger_m: 1.85,
      },
    },
    {
      id: 'step-3',
      stepNumber: '03',
      title: 'Assam Regions',
      source: 'Spatial Catchment & Watershed Topography',
      tier: 'FEATURE MAPPING',
      tierColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800',
      icon: MapPin,
      summary:
        'Associates sensor telemetry with specific geographic catchments, digital elevation profiles, and administrative circles across 35 Assam districts.',
      technicalDetails: [
        'Spatial demarcation of Upper Assam, Central Valley, and Barak Valley zones.',
        'Catchment slope and Digital Elevation Model (SRTM 30m) wetness context.',
        'Circle and revenue boundary mapping for local disaster cells.',
      ],
      samplePayload: {
        district: 'Dhemaji',
        subdivision: 'Upper Assam Valley',
        coordinates: [94.5822, 27.4812],
        catchment_id: 'assam-dhemaji-01',
      },
    },
    {
      id: 'step-4',
      stepNumber: '04',
      title: 'ML Model',
      source: 'Hydrological Inference Engine (Backend)',
      tier: 'AI/ML INFERENCE',
      tierColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300 dark:border-purple-800',
      icon: Cpu,
      summary:
        'Backend predictive machine learning model processes multi-variate feature vectors (precipitation + river delta + terrain slope) to evaluate non-linear flood probability.',
      technicalDetails: [
        'Operates strictly on the server/backend—no browser-side model execution.',
        'Ingests verified physical inputs without fabricated synthetic numbers.',
        'Trained on historical monsoon patterns and ground station hydrographs.',
      ],
      samplePayload: {
        features: {
          rainfall_24h_mm: 142.0,
          river_delta_m: 1.85,
          topographic_slope: 0.042,
        },
        model_version: 'xgb-hydro-assam-v2',
        inference_latency_ms: 12.4,
      },
    },
    {
      id: 'step-5',
      stepNumber: '05',
      title: 'Flood Probability',
      source: 'Statistical Inundation Probability Output',
      tier: 'AI/ML INFERENCE',
      tierColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800',
      icon: BarChart3,
      summary:
        'Continuous probabilistic estimation (0% to 100%) indicating the statistical likelihood of river overtopping or localized inundation.',
      technicalDetails: [
        'Normalized probability value emitted directly by ML inference.',
        'Accompanied by model confidence score and estimated inundation spread.',
        'Strictly probabilistic—never claimed as a deterministic 100% certainty.',
      ],
      samplePayload: {
        flood_probability: 87.6,
        model_confidence: 93.4,
        peak_water_depth_m: 2.85,
        inundation_area_km2: 142.8,
      },
    },
    {
      id: 'step-6',
      stepNumber: '06',
      title: 'Risk Classification',
      source: 'Backend Business Logic Rules',
      tier: 'BUSINESS LOGIC',
      tierColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800',
      icon: ShieldAlert,
      summary:
        'Backend business logic assigns authoritative risk classification based on government danger level thresholds and statutory criteria.',
      technicalDetails: [
        'Backend owns classification—frontend never calculates thresholds.',
        'LOW (< 40%) • MODERATE (40%–69%) • HIGH (70%–84%) • CRITICAL (≥ 85%).',
        'Direct link to ASDMA standard operating procedures and alert directives.',
      ],
      samplePayload: {
        risk_level: 'CRITICAL',
        directive: 'ASDMA DIRECTIVE LEVEL 3 ACTIVATED',
        statutory_authority: 'State Emergency Operations Centre',
        evacuation_recommended: true,
      },
    },
    {
      id: 'step-7',
      stepNumber: '07',
      title: 'Alerts / Visualizations',
      source: 'Frontend Presentation & Public Delivery',
      tier: 'PRESENTATION',
      tierColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
      icon: Layers,
      summary:
        'Frontend visualizes the backend results through interactive Mapbox GIS, Recharts hydrographs, warning directive feeds, and safe shelter rosters.',
      technicalDetails: [
        'Strict consumer role: renders received values without recalculation.',
        'Accessible high-contrast UI, screen-reader support, and offline bilingual survival guides.',
        'Graceful state boundary handling: Loading, Empty, Error, and Backend Unavailable.',
      ],
      samplePayload: {
        rendered_components: [
          'Mapbox Vector Risk Map',
          'Predictions Hydrograph & SHAP Explainability',
          'Emergency Directives Feed (GET /api/alerts)',
          'Safe Shelter Roster & Relief Directory',
        ],
        frontend_role: 'Pure Presentation & Accessibility',
      },
    },
  ];

  const activeStep = pipelineSteps.find((s) => s.id === activeStepId) || pipelineSteps[3];
  const StepIcon = activeStep.icon;

  return (
    <div className="space-y-6">
      {/* ── Subtitle & SIH Evaluation Header ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 block">
              7-STAGE END-TO-END DATA PIPELINE
            </span>
            <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#0b1c30] dark:text-slate-100 mt-0.5">
              System Flow: From Atmospheric Telemetry to Citizen Directives
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-sky-50 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 self-start sm:self-auto">
            <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
            <span>SIH Verified Architecture</span>
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2.5 max-w-3xl leading-relaxed">
          FloodGuard connects authoritative meteorological feeds with river gauge telemetry, routing features through server-side machine learning to deliver actionable public safety directives without client-side risk calculations.
        </p>
      </div>

      {/* ── Visual Flow Diagram (7 Sequential Stages) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side (7 cols): The Sequential Pipeline Stepper */}
        <div className="lg:col-span-7 space-y-3">
          {pipelineSteps.map((step, idx) => {
            const isSelected = step.id === activeStepId;
            const Icon = step.icon;
            const isLast = idx === pipelineSteps.length - 1;

            return (
              <div key={step.id} className="relative">
                {/* Step Card */}
                <div
                  onClick={() => setActiveStepId(step.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setActiveStepId(step.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-left ${
                    isSelected
                      ? 'bg-sky-50/80 dark:bg-sky-950/40 border-sky-500 dark:border-sky-400 shadow-md ring-2 ring-sky-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Step Icon Avatar */}
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-[#0b1c30] text-white dark:bg-sky-500 dark:text-slate-950'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500">
                          STAGE {step.stepNumber}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase border ${step.tierColor}`}
                        >
                          {step.tier}
                        </span>
                      </div>
                      <h3 className="font-heading font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate mt-0.5">
                        {step.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                        {step.source}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${
                        isSelected ? 'rotate-90 text-sky-600 dark:text-sky-400' : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  </div>
                </div>

                {/* Animated Directional Flow Arrow between stages */}
                {!isLast && (
                  <div className="flex justify-center my-1">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-400 dark:text-slate-500">
                      <ArrowDown className="w-3 h-3 animate-bounce" />
                      <span>transfers to</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Side (5 cols): Interactive Stage Deep-Dive & Payload Inspector */}
        <div className="lg:col-span-5 sticky top-20 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 transition-colors">
            {/* Stage Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center flex-shrink-0">
                  <StepIcon className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                    Stage {activeStep.stepNumber} Inspection
                  </span>
                  <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white leading-tight">
                    {activeStep.title}
                  </h3>
                </div>
              </div>

              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${activeStep.tierColor}`}
              >
                {activeStep.tier}
              </span>
            </div>

            {/* Operational Summary */}
            <div>
              <h4 className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                SYSTEM ROLE
              </h4>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                {activeStep.summary}
              </p>
            </div>

            {/* Technical Specifications */}
            <div>
              <h4 className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">
                KEY TECHNICAL SPECIFICATIONS
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                {activeStep.technicalDetails.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 flex-shrink-0 mt-1.5" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Live Data Schema / Sample Payload */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-mono font-bold text-slate-400 uppercase">
                  Data Contract Representation
                </span>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  JSON Schema
                </span>
              </div>
              <pre className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800 max-h-48 scrollbar-none">
                {JSON.stringify(activeStep.samplePayload, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
