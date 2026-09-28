/**
 * FloodGuardBrandReveal — "Rising Water Reveal"
 *
 * One-shot page-load branding animation inside the existing navbar identity.
 * Plays only on the initial application mount (module-level session flag).
 * Does not replay on tab/route changes.
 */

import React, { useEffect, useState } from 'react';
import { Logo } from './Logo';

interface FloodGuardBrandRevealProps {
  className?: string;
}

let sessionHasAnimated = false;

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export const FloodGuardBrandReveal: React.FC<FloodGuardBrandRevealProps> = ({
  className = '',
}) => {
  const reduced = prefersReducedMotion();
  const shouldPlayFull = !sessionHasAnimated && !reduced;
  const shouldPlayReduced = !sessionHasAnimated && reduced;

  const [mode, setMode] = useState<'play' | 'reduced' | 'settled'>(() => {
    if (sessionHasAnimated) return 'settled';
    if (reduced) return 'reduced';
    return 'play';
  });

  useEffect(() => {
    if (sessionHasAnimated) return;
    sessionHasAnimated = true;

    const settleAt = shouldPlayFull ? 1600 : shouldPlayReduced ? 450 : 0;
    if (!settleAt) {
      setMode('settled');
      return;
    }

    const timer = window.setTimeout(() => setMode('settled'), settleAt);
    return () => window.clearTimeout(timer);
  }, [shouldPlayFull, shouldPlayReduced]);

  return (
    <div
      className={`fg-brand-reveal fg-brand-reveal--${mode} flex items-center gap-2 sm:gap-2.5 min-w-0 ${className}`}
    >
      <div className="fg-brand-logo-cell relative flex-shrink-0">
        <div className="fg-brand-logo">
          <Logo size={32} className="flex-shrink-0 sm:w-9 sm:h-9 transition-transform group-hover:scale-105" />
        </div>
        <span className="fg-brand-ripple fg-brand-ripple--a" aria-hidden="true" />
        <span className="fg-brand-ripple fg-brand-ripple--b" aria-hidden="true" />
      </div>

      <div className="flex flex-col min-w-0">
        <div className="flex items-center">
          <span className="fg-brand-wordmark-clip relative inline-flex overflow-hidden leading-none align-baseline">
            <span className="fg-brand-wordmark font-heading font-extrabold text-lg sm:text-xl text-[#0b1c30] dark:text-slate-100 group-hover:text-[#006398] dark:group-hover:text-sky-400 transition-colors select-none tracking-tight">
              FLOODGUARD
            </span>
            <span className="fg-brand-water" aria-hidden="true">
              <svg
                className="fg-brand-wave"
                viewBox="0 0 160 16"
                preserveAspectRatio="none"
                focusable="false"
              >
                <defs>
                  <linearGradient id="fgBrandWaterFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(186, 230, 253, 0.55)" />
                    <stop offset="38%" stopColor="rgba(56, 189, 248, 0.32)" />
                    <stop offset="100%" stopColor="rgba(12, 74, 110, 0.18)" />
                  </linearGradient>
                </defs>
                <path
                  className="fg-brand-wave-path"
                  fill="url(#fgBrandWaterFill)"
                  d="M0 9 C12 3 22 3 34 9 C46 15 56 15 68 9 C80 3 90 3 102 9 C114 15 126 15 138 9 C146 5 154 5 160 8 V16 H0 Z"
                />
                <path
                  fill="none"
                  stroke="rgba(125, 211, 252, 0.55)"
                  strokeWidth="1"
                  d="M0 9 C12 3 22 3 34 9 C46 15 56 15 68 9 C80 3 90 3 102 9 C114 15 126 15 138 9 C146 5 154 5 160 8"
                />
              </svg>
              <span className="fg-brand-water-body" />
            </span>
            <span className="fg-brand-droplet fg-brand-droplet--1" aria-hidden="true" />
            <span className="fg-brand-droplet fg-brand-droplet--2" aria-hidden="true" />
            <span className="fg-brand-droplet fg-brand-droplet--3" aria-hidden="true" />
          </span>
        </div>
        <span className="fg-brand-subtitle text-[8.5px] xs:text-[9px] sm:text-[10px] tracking-wide sm:tracking-[0.14em] font-bold text-slate-500 dark:text-slate-400 uppercase -mt-0.5 font-mono whitespace-nowrap">
          FLOOD INTELLIGENCE & EARLY WARNING
        </span>
      </div>
    </div>
  );
};
