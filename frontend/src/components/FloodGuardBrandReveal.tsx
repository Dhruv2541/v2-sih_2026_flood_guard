/**
 * FloodGuardBrandReveal
 *
 * High-performance, authoritative brand reveal for the FloodGuard navbar.
 *
 * Sequence (~500ms total duration):
 *   0.00s – Logo: Gentle fade-in and scale-in (360ms)
 *   0.02s – Wordmark: Smooth upward entrance (380ms)
 *   0.04s – Hydrodynamic cyan light sweep slides across 'FLOODGUARD' (460ms)
 *   0.12s – Subtitle: Clean upward fade-in (320ms)
 *   0.52s – Settled: All keyframes complete; decorative sweep overlay quietly unmounts.
 *           Zero DOM-swap jitter — the base wordmark remains permanently mounted.
 *
 * Performance & Accessibility:
 *   - 100% GPU compositor execution via CSS keyframes.
 *   - Zero Cumulative Layout Shift (CLS = 0).
 *   - Respects prefers-reduced-motion (skips straight to settled state).
 *   - Session-only persistence: runs once per browser session.
 */

import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';

interface FloodGuardBrandRevealProps {
  className?: string;
  forceAnimate?: boolean;
}

// Module-level flag: persists across client-side navigation / tab changes during
// the single-page session, resetting only on full browser refresh.
let sessionHasAnimated = false;

export const FloodGuardBrandReveal: React.FC<FloodGuardBrandRevealProps> = ({
  className = '',
  forceAnimate = false,
}) => {
  // Check prefers-reduced-motion synchronously
  const prefersReduced =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  const shouldAnimate = forceAnimate || (!sessionHasAnimated && !prefersReduced);
  const [isSettled, setIsSettled] = useState<boolean>(!shouldAnimate);

  useEffect(() => {
    if (!shouldAnimate) {
      setIsSettled(true);
      return;
    }

    sessionHasAnimated = true;

    // Settle cleanly at 520ms: after CSS animations complete,
    // the decorative sweep unmounts without affecting the permanently mounted text.
    const settleTimer = setTimeout(() => {
      setIsSettled(true);
    }, 520);

    return () => {
      clearTimeout(settleTimer);
    };
  }, [shouldAnimate]);

  return (
    <div
      className={`flex items-center gap-2 sm:gap-2.5 select-none flex-shrink-0 ${className}`}
      aria-label="FloodGuard Flood Intelligence & Early Warning"
    >
      {/* ── Logo Emblem ────────────────────────────────────────── */}
      <div
        className={`relative flex items-center justify-center flex-shrink-0 ${
          shouldAnimate && !isSettled ? 'fg-brand-logo' : ''
        }`}
      >
        <Logo
          size={32}
          className="flex-shrink-0 sm:w-9 sm:h-9 transition-transform duration-200 group-hover:scale-105"
        />
      </div>

      {/* ── Brand Text Column ──────────────────────────────────── */}
      <div className="flex flex-col min-w-0">
        {/* Wordmark row: Single permanent DOM node eliminates font-smoothing jumps */}
        <div className="relative inline-flex items-center">
          <span
            className={`font-heading font-extrabold text-lg sm:text-xl text-[#0b1c30] dark:text-slate-100 group-hover:text-[#006398] dark:group-hover:text-sky-400 transition-colors select-none tracking-tight leading-tight ${
              shouldAnimate && !isSettled ? 'fg-brand-wordmark' : ''
            }`}
          >
            FLOODGUARD
          </span>

          {/* Hydrodynamic cyan light sweep overlay (fades out naturally before 520ms) */}
          {shouldAnimate && !isSettled && (
            <span
              aria-hidden="true"
              className="fg-brand-sweep absolute inset-0 font-heading font-extrabold text-lg sm:text-xl tracking-tight leading-tight select-none pointer-events-none"
            >
              FLOODGUARD
            </span>
          )}
        </div>

        {/* Subtitle */}
        <span
          className={`text-[9px] min-[370px]:text-[10px] min-[400px]:text-[11px] sm:text-xs tracking-[0.03em] min-[370px]:tracking-[0.05em] sm:tracking-[0.14em] font-bold text-slate-500 dark:text-slate-400 uppercase -mt-0.5 font-mono truncate max-w-[190px] min-[370px]:max-w-[215px] sm:max-w-none ${
            shouldAnimate && !isSettled ? 'fg-brand-subtitle' : ''
          }`}
        >
          FLOOD INTELLIGENCE & EARLY WARNING
        </span>
      </div>
    </div>
  );
};
