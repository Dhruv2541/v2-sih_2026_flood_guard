import { useEffect, useState } from 'react';

/**
 * Tracks the user's `prefers-reduced-motion` OS/browser setting.
 *
 * CSS alone already collapses most decorative animations globally (see
 * `index.css`), but a few effects are driven from JavaScript (e.g. the
 * flood-probability count-up in `useCountUp`) and need to know whether to
 * skip their animation loop entirely rather than just running faster.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  return reduced;
}
