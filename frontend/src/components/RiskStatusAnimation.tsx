import React from 'react';
import type { RiskAnimationVariant } from '../lib/riskLevelConfig';

interface RiskStatusAnimationProps {
  variant: RiskAnimationVariant;
}

/**
 * RiskStatusAnimation
 *
 * Purely decorative, risk-aware ambient layer for the selected-area card in
 * `RiskHero`. Renders as an absolutely-positioned overlay (`inset-0`) behind
 * the card's real content, so it never affects layout or reflows text.
 *
 * - critical / high: a restrained red edge glow (opacity pulse only, no
 *   size/blur animation) plus a faint rising water-line texture near the
 *   bottom edge.
 * - moderate: a steady (non-pulsing) amber edge glow plus a slow-moving
 *   amber contour line.
 * - low: a calm, static teal/green halo plus two very slow, staggered
 *   ripple rings.
 *
 * All motion is transform/opacity only (compositor-friendly, no layout or
 * box-shadow-size animation). Global CSS (`index.css`) already forces
 * near-instant, single-iteration animations under
 * `prefers-reduced-motion: reduce`, so this component doesn't need its own
 * reduced-motion branching — it just settles on the animation's resting
 * frame instead of looping.
 */
export const RiskStatusAnimation: React.FC<RiskStatusAnimationProps> = ({ variant }) => {
  const isAlert = variant === 'critical' || variant === 'high';

  return (
    <div className="absolute inset-0 rounded-2xl overflow-hidden" aria-hidden="true">
      {/* Edge glow ring */}
      <div
        className={
          variant === 'critical' || variant === 'high'
            ? 'absolute inset-0 rounded-2xl risk-glow-alert'
            : variant === 'moderate'
            ? 'absolute inset-0 rounded-2xl risk-glow-moderate'
            : 'absolute inset-0 rounded-2xl risk-glow-low'
        }
      />

      {/* Lower-edge water texture */}
      {isAlert && (
        <svg
          className="risk-water-line text-red-500/25 dark:text-red-400/20"
          viewBox="0 0 200 24"
          preserveAspectRatio="none"
        >
          <path
            d="M0 14 Q 12.5 6, 25 14 T 50 14 T 75 14 T 100 14 T 125 14 T 150 14 T 175 14 T 200 14 V24 H0 Z"
            fill="currentColor"
          />
        </svg>
      )}

      {variant === 'moderate' && (
        <svg
          className="risk-contour-line text-amber-500/20 dark:text-amber-400/15"
          viewBox="0 0 200 16"
          preserveAspectRatio="none"
        >
          <path
            d="M0 10 Q 12.5 4, 25 10 T 50 10 T 75 10 T 100 10 T 125 10 T 150 10 T 175 10 T 200 10 V16 H0 Z"
            fill="currentColor"
          />
        </svg>
      )}

      {variant === 'low' && (
        <>
          <span className="risk-ripple-ring risk-ripple-ring-1" />
          <span className="risk-ripple-ring risk-ripple-ring-2" />
        </>
      )}
    </div>
  );
};
