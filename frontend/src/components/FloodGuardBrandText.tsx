/**
 * FloodGuardBrandText
 *
 * Telemetry-inspired one-shot reveal animation for the FLOODGUARD navbar brandmark.
 *
 * Reveal sequence (runs once per page session):
 *  0.00 s  — text starts: y +8 px, opacity 0, blur 6 px, letter-spacing 0.25 em
 *  0.00 s  — text animates to: y 0, opacity 1, blur 0, letter-spacing tracking-tight
 *            duration 1.1 s, cubic-bezier(0.16, 1, 0.3, 1)
 *  0.55 s  — shimmer sweep begins: cyan→blue gradient slides L→R across letters
 *            duration 0.65 s, ease-in-out, fades to 0 before settling
 *
 * CLS protection:
 *  The outer <span> is overflow-hidden with explicit line-height so the
 *  initial y-offset never shifts surrounding layout elements.
 *
 * Reduced motion:
 *  Respects (prefers-reduced-motion: reduce) — skips straight to final state.
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface FloodGuardBrandTextProps {
  className?: string;
}

// Module-level flag — animation fires only once per browser session regardless
// of React re-mounts (e.g., HMR, strict-mode double-invoke).
let sessionHasAnimated = false;

// Shared easing curve: fast start, smooth settle — matches hydrologic surge feel.
const SPRING_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const FloodGuardBrandText: React.FC<FloodGuardBrandTextProps> = ({
  className = '',
}) => {
  // Skip animation if already played this session or user prefers reduced motion.
  const prefersReduced =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  const shouldAnimate = !sessionHasAnimated && !prefersReduced;

  // Track whether shimmer overlay should be rendered.
  const [showShimmer, setShowShimmer] = useState(false);

  useEffect(() => {
    if (!shouldAnimate) return;

    sessionHasAnimated = true;

    // Shimmer fires mid-reveal (0.55 s in) and self-removes after it completes.
    const shimmerStart = setTimeout(() => setShowShimmer(true), 550);
    const shimmerEnd = setTimeout(() => setShowShimmer(false), 550 + 700);

    return () => {
      clearTimeout(shimmerStart);
      clearTimeout(shimmerEnd);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    /*
     * Outer wrapper:
     *  - overflow-hidden clips the y-offset start state so it never shifts siblings.
     *  - leading-none + inline-flex keeps it tight to the navbar row.
     *  - relative lets the shimmer span sit on top via absolute positioning.
     */
    <span
      className={`relative inline-flex overflow-hidden leading-none ${className}`}
      style={{ verticalAlign: 'baseline' }}
    >
      {/* ── Primary text — carries the reveal animation ────────────────────── */}
      <motion.span
        className="font-heading font-extrabold text-lg sm:text-xl text-[#0b1c30] dark:text-slate-100 group-hover:text-[#006398] dark:group-hover:text-sky-400 transition-colors select-none"
        style={{
          // letterSpacing is animated via style, not a Tailwind class, so Framer
          // Motion can interpolate it smoothly.
          display: 'inline-block',
          willChange: 'transform, opacity, filter, letter-spacing',
        }}
        initial={
          shouldAnimate
            ? {
                opacity: 0,
                y: 8,
                filter: 'blur(6px)',
                letterSpacing: '0.22em',
              }
            : {
                opacity: 1,
                y: 0,
                filter: 'blur(0px)',
                letterSpacing: '-0.025em', // tracking-tight
              }
        }
        animate={{
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          letterSpacing: '-0.025em', // matches Tailwind tracking-tight
        }}
        transition={
          shouldAnimate
            ? {
                duration: 1.1,
                ease: SPRING_EASE,
              }
            : { duration: 0 }
        }
      >
        FLOODGUARD
      </motion.span>

      {/* ── Shimmer sweep — cyan→blue gradient that slides across the letters ── */}
      {showShimmer && (
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 inline-block font-heading font-extrabold text-lg sm:text-xl select-none pointer-events-none"
          style={{
            background:
              'linear-gradient(105deg, transparent 20%, rgba(125,211,252,0.85) 45%, rgba(56,189,248,0.95) 55%, rgba(96,165,250,0.8) 65%, transparent 80%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundSize: '200% 100%',
            letterSpacing: '-0.025em',
          }}
          initial={{ backgroundPositionX: '-100%', opacity: 0 }}
          animate={{
            backgroundPositionX: ['−100%', '160%'],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 0.65,
            ease: 'easeInOut',
            times: [0, 0.15, 0.75, 1],
          }}
        >
          FLOODGUARD
        </motion.span>
      )}
    </span>
  );
};
