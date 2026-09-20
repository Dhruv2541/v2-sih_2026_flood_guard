import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

/**
 * useCountUp
 *
 * Smoothly animates a displayed number from its previous value to `target`
 * using an ease-out curve driven by requestAnimationFrame. Used for the
 * flood-probability readout so switching districts feels like a live
 * instrument update rather than a jump-cut.
 *
 * Falls back to an instant jump when `prefers-reduced-motion: reduce` is set.
 */
export function useCountUp(target: number, durationMs = 700): number {
  const reduceMotion = usePrefersReducedMotion();
  const [displayValue, setDisplayValue] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (reduceMotion) {
      setDisplayValue(target);
      fromRef.current = target;
      return;
    }

    const from = fromRef.current;
    if (from === target) return;

    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplayValue(Math.round(from + (target - from) * eased));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = target;
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, durationMs, reduceMotion]);

  return displayValue;
}
