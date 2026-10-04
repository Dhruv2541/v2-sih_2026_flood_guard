/**
 * FloodGuard SkeletonChart Component
 *
 * Simulates a hydrograph, hyetograph, or rainfall distribution chart
 * with realistic axes, dashed gridlines, and shimmering SVG waveforms.
 *
 * Requirements:
 * - Responsive, maintains exact dimensions to eliminate Cumulative Layout Shift (CLS).
 * - No fake values while loading.
 * - Screen readers ignore via aria-hidden="true".
 * - Subtle shimmer animation.
 */

import React from 'react';
import { SkeletonChartProps } from './types';

export const SkeletonChart: React.FC<SkeletonChartProps> = ({
  height = 300,
  type = 'area',
  title = 'Hydrological Telemetry Chart',
  className = '',
}) => {
  const numericHeight = typeof height === 'number' ? height : parseInt(String(height), 10) || 300;

  return (
    <div
      aria-hidden="true"
      className={`w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xs flex flex-col justify-between overflow-hidden relative ${className}`}
      style={{ height: numericHeight }}
    >
      {/* Chart Header Placeholder */}
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div className="space-y-1.5">
          <div className="w-48 sm:w-60 h-5 rounded bg-slate-200 dark:bg-slate-800 fg-shimmer" />
          <div className="w-28 sm:w-36 h-3 rounded bg-slate-100 dark:bg-slate-800/60 fg-shimmer" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-16 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 fg-shimmer" />
          <div className="w-16 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 fg-shimmer" />
        </div>
      </div>

      {/* Main Plot Area with Grid & Simulated Graphic */}
      <div className="flex-1 w-full relative flex items-stretch min-h-0">
        {/* Y-Axis tick placeholders */}
        <div className="w-9 flex flex-col justify-between py-2 pr-2 text-right">
          <div className="w-6 h-2 rounded bg-slate-200 dark:bg-slate-800 fg-shimmer ml-auto" />
          <div className="w-7 h-2 rounded bg-slate-200 dark:bg-slate-800 fg-shimmer ml-auto" />
          <div className="w-5 h-2 rounded bg-slate-200 dark:bg-slate-800 fg-shimmer ml-auto" />
          <div className="w-6 h-2 rounded bg-slate-200 dark:bg-slate-800 fg-shimmer ml-auto" />
        </div>

        {/* Plot Area with Grid */}
        <div className="flex-1 relative flex flex-col justify-between border-l border-b border-slate-200 dark:border-slate-800 pl-2 pb-1 overflow-hidden">
          {/* Horizontal dashed gridlines */}
          <div className="w-full border-t border-dashed border-slate-200 dark:border-slate-800/80 my-auto" />
          <div className="w-full border-t border-dashed border-slate-200 dark:border-slate-800/80 my-auto" />
          <div className="w-full border-t border-dashed border-slate-200 dark:border-slate-800/80 my-auto" />

          {/* SVG Wave / Bars simulation */}
          {type === 'area' || type === 'line' ? (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none opacity-30 dark:opacity-20"
              preserveAspectRatio="none"
              viewBox="0 0 500 200"
            >
              <defs>
                <linearGradient id="skeleton-chart-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0,160 Q 70,140 140,110 T 280,60 T 400,90 T 500,140 L 500,200 L 0,200 Z"
                fill="url(#skeleton-chart-grad)"
              />
              <path
                d="M 0,160 Q 70,140 140,110 T 280,60 T 400,90 T 500,140"
                fill="none"
                stroke="#0284c7"
                strokeWidth="2.5"
                strokeDasharray="4 4"
              />
              {/* Danger Mark Reference line */}
              <line
                x1="0"
                y1="80"
                x2="500"
                y2="80"
                stroke="#dc2626"
                strokeWidth="1.5"
                strokeDasharray="6 4"
                opacity="0.5"
              />
            </svg>
          ) : (
            /* Bar chart skeleton */
            <div className="absolute inset-0 flex items-end justify-around px-4 pb-2">
              <div className="w-8 sm:w-12 h-1/3 rounded-t bg-slate-200 dark:bg-slate-800 fg-shimmer" />
              <div className="w-8 sm:w-12 h-2/3 rounded-t bg-slate-200 dark:bg-slate-800 fg-shimmer" />
              <div className="w-8 sm:w-12 h-5/6 rounded-t bg-slate-200 dark:bg-slate-800 fg-shimmer" />
              <div className="w-8 sm:w-12 h-1/2 rounded-t bg-slate-200 dark:bg-slate-800 fg-shimmer" />
              <div className="w-8 sm:w-12 h-1/4 rounded-t bg-slate-200 dark:bg-slate-800 fg-shimmer" />
            </div>
          )}
        </div>
      </div>

      {/* X-Axis Labels */}
      <div className="flex justify-between pl-9 pt-2 text-[10px] text-slate-400">
        <div className="w-10 h-2.5 rounded bg-slate-100 dark:bg-slate-800 fg-shimmer" />
        <div className="w-10 h-2.5 rounded bg-slate-100 dark:bg-slate-800 fg-shimmer" />
        <div className="w-12 h-2.5 rounded bg-slate-100 dark:bg-slate-800 fg-shimmer" />
        <div className="w-10 h-2.5 rounded bg-slate-100 dark:bg-slate-800 fg-shimmer" />
        <div className="w-10 h-2.5 rounded bg-slate-100 dark:bg-slate-800 fg-shimmer" />
      </div>

      {/* Bottom Legend Placeholder */}
      <div className="flex items-center justify-center gap-6 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-sky-400 dark:bg-sky-500 opacity-60" />
          <div className="w-24 h-2.5 rounded bg-slate-200 dark:bg-slate-800 fg-shimmer" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-400 opacity-60" />
          <div className="w-20 h-2.5 rounded bg-slate-200 dark:bg-slate-800 fg-shimmer" />
        </div>
      </div>
    </div>
  );
};
