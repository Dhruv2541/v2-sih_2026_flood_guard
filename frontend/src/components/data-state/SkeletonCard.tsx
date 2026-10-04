/**
 * FloodGuard SkeletonCard Component
 *
 * Provides smooth, accessible shimmer placeholders for metric cards, alert banners,
 * table rows, and infrastructure lists while data is loading.
 *
 * Requirements:
 * - Responsive layout matching FloodGuard design language.
 * - No fake values while loading.
 * - Screen readers ignore visual skeletons via aria-hidden="true".
 * - Subtle shimmer animation.
 */

import React from 'react';
import { SkeletonCardProps } from './types';

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  variant = 'metric',
  count = 1,
  className = '',
}) => {
  const items = Array.from({ length: Math.max(1, count) }, (_, i) => i);

  if (variant === 'metric') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full ${className}`} aria-hidden="true">
        {items.map((key) => (
          <div
            key={key}
            className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden"
          >
            {/* Top row: label + icon square placeholder */}
            <div className="flex items-center justify-between mb-3">
              <div className="w-24 h-3.5 rounded bg-slate-200 dark:bg-slate-800 fg-shimmer" />
              <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 fg-shimmer" />
            </div>
            {/* Primary numeric placeholder (blank bar, NO fake numbers) */}
            <div className="w-28 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 fg-shimmer mb-2.5" />
            {/* Subtitle / badge */}
            <div className="flex items-center gap-2">
              <div className="w-16 h-4 rounded bg-slate-200 dark:bg-slate-800 fg-shimmer" />
              <div className="w-20 h-3 rounded bg-slate-100 dark:bg-slate-800/60 fg-shimmer" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'alert') {
    return (
      <div className={`space-y-4 w-full ${className}`} aria-hidden="true">
        {items.map((key) => (
          <div
            key={key}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-800 fg-shimmer" />
                <div className="w-24 h-5 rounded-full bg-slate-200 dark:bg-slate-800 fg-shimmer" />
                <div className="w-36 h-4 rounded bg-slate-200 dark:bg-slate-800 fg-shimmer" />
              </div>
              <div className="w-24 h-4 rounded bg-slate-100 dark:bg-slate-800 fg-shimmer" />
            </div>

            <div className="w-3/4 h-5 rounded bg-slate-200 dark:bg-slate-800 fg-shimmer" />
            <div className="w-full h-3.5 rounded bg-slate-100 dark:bg-slate-800/80 fg-shimmer" />
            <div className="w-5/6 h-3.5 rounded bg-slate-100 dark:bg-slate-800/80 fg-shimmer" />

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="w-28 h-4 rounded bg-slate-200 dark:bg-slate-800 fg-shimmer" />
                <div className="w-24 h-4 rounded bg-slate-200 dark:bg-slate-800 fg-shimmer" />
              </div>
              <div className="w-28 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 fg-shimmer" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'table-row') {
    return (
      <tbody className={className} aria-hidden="true">
        {items.map((key) => (
          <tr key={key} className="border-b border-slate-100 dark:border-slate-800">
            <td className="py-3 px-4">
              <div className="w-28 h-4 rounded bg-slate-200 dark:bg-slate-800 fg-shimmer" />
            </td>
            <td className="py-3 px-4">
              <div className="w-20 h-4 rounded bg-slate-100 dark:bg-slate-800/80 fg-shimmer" />
            </td>
            <td className="py-3 px-4">
              <div className="w-16 h-4 rounded bg-slate-200 dark:bg-slate-800 fg-shimmer" />
            </td>
            <td className="py-3 px-4">
              <div className="w-16 h-4 rounded bg-slate-100 dark:bg-slate-800/80 fg-shimmer" />
            </td>
            <td className="py-3 px-4">
              <div className="w-12 h-4 rounded bg-slate-200 dark:bg-slate-800 fg-shimmer" />
            </td>
            <td className="py-3 px-4">
              <div className="w-16 h-4 rounded bg-slate-100 dark:bg-slate-800/80 fg-shimmer" />
            </td>
            <td className="py-3 px-4">
              <div className="w-12 h-4 rounded bg-slate-200 dark:bg-slate-800 fg-shimmer" />
            </td>
            <td className="py-3 px-4">
              <div className="w-20 h-5 rounded-full bg-slate-200 dark:bg-slate-800 fg-shimmer" />
            </td>
          </tr>
        ))}
      </tbody>
    );
  }

  if (variant === 'list') {
    return (
      <div className={`space-y-3 w-full ${className}`} aria-hidden="true">
        {items.map((key) => (
          <div
            key={key}
            className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3 shadow-xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 fg-shimmer flex-shrink-0" />
              <div className="space-y-1.5 min-w-0">
                <div className="w-36 h-4 rounded bg-slate-200 dark:bg-slate-800 fg-shimmer" />
                <div className="w-24 h-3 rounded bg-slate-100 dark:bg-slate-800/60 fg-shimmer" />
              </div>
            </div>
            <div className="w-16 h-6 rounded-md bg-slate-200 dark:bg-slate-800 fg-shimmer flex-shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  // Detail card variant
  return (
    <div
      className={`bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 w-full ${className}`}
      aria-hidden="true"
    >
      <div className="flex items-center justify-between">
        <div className="w-48 h-6 rounded bg-slate-200 dark:bg-slate-800 fg-shimmer" />
        <div className="w-24 h-7 rounded-lg bg-slate-200 dark:bg-slate-800 fg-shimmer" />
      </div>
      <div className="w-full h-4 rounded bg-slate-100 dark:bg-slate-800 fg-shimmer" />
      <div className="w-5/6 h-4 rounded bg-slate-100 dark:bg-slate-800 fg-shimmer" />
      <div className="w-3/4 h-4 rounded bg-slate-100 dark:bg-slate-800 fg-shimmer" />
      <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800/80 fg-shimmer" />
        <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800/80 fg-shimmer" />
        <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800/80 fg-shimmer" />
      </div>
    </div>
  );
};
