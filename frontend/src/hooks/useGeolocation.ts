/**
 * useGeolocation
 *
 * Encapsulates the "Use My Location" feature:
 *  1. Requests browser coordinates via navigator.geolocation
 *  2. Validates coordinates against Assam bounding box
 *  3. Reverse-geocodes with OpenStreetMap Nominatim
 *  4. Normalises the returned district/county name against ASSAM_SECTORS
 *  5. Calls the provided onSelectSector callback or surfaces a toast message
 *
 * All state is local to this hook – no global app context is modified.
 */

import { useState, useCallback, useRef } from 'react';
import { ASSAM_SECTORS } from '../data/assamData';

// ---------------------------------------------------------------------------
// Assam approximate bounding box (degrees)
// ---------------------------------------------------------------------------
const ASSAM_BOUNDS = {
  latMin: 24.0,
  latMax: 28.0,
  lngMin: 89.5,
  lngMax: 96.0,
};

function isInsideAssam(lat: number, lng: number): boolean {
  return (
    lat >= ASSAM_BOUNDS.latMin &&
    lat <= ASSAM_BOUNDS.latMax &&
    lng >= ASSAM_BOUNDS.lngMin &&
    lng <= ASSAM_BOUNDS.lngMax
  );
}

// ---------------------------------------------------------------------------
// District name normalisation table
// Maps common Nominatim "county" / "state_district" values → ASSAM_SECTORS key
// ---------------------------------------------------------------------------
const DISTRICT_NORMALISATION: Record<string, string> = {
  // Dhemaji
  dhemaji: 'dhemaji',
  // Majuli
  majuli: 'majuli',
  'majuli island': 'majuli',
  // Lakhimpur
  lakhimpur: 'lakhimpur',
  'north lakhimpur': 'lakhimpur',
  // Dibrugarh
  dibrugarh: 'dibrugarh',
  // Tinsukia
  tinsukia: 'tinsukia',
  // Barpeta
  barpeta: 'barpeta',
  // Cachar / Silchar
  cachar: 'cachar',
  silchar: 'cachar',
  'cachar (silchar)': 'cachar',
};

/**
 * Attempts to resolve a Nominatim address object to one of our sector IDs.
 * Returns null if no match is found.
 */
function resolveSectorFromAddress(address: Record<string, string>): string | null {
  // Nominatim may use county, state_district, or city_district depending on zoom
  const candidates = [
    address.county,
    address.state_district,
    address.city,
    address.town,
    address.village,
    address.suburb,
  ]
    .filter(Boolean)
    .map((s) => s!.toLowerCase().trim());

  for (const candidate of candidates) {
    // Direct lookup
    if (DISTRICT_NORMALISATION[candidate]) {
      return DISTRICT_NORMALISATION[candidate];
    }
    // Partial / substring match against normalisation table keys
    for (const [key, sectorId] of Object.entries(DISTRICT_NORMALISATION)) {
      if (candidate.includes(key) || key.includes(candidate)) {
        return sectorId;
      }
    }
  }

  // Last resort: compare against every sector's district field
  for (const sector of Object.values(ASSAM_SECTORS)) {
    const sectorDistrict = sector.district.toLowerCase();
    if (candidates.some((c) => c.includes(sectorDistrict) || sectorDistrict.includes(c))) {
      return sector.id;
    }
  }

  return null;
}

/**
 * Finds the geometrically closest sector to the supplied coordinates.
 * Used as a fallback when Nominatim doesn't yield a direct district match.
 */
function closestSectorByCoords(lat: number, lng: number): string {
  let closestId = Object.keys(ASSAM_SECTORS)[0];
  let minDist = Infinity;
  for (const sector of Object.values(ASSAM_SECTORS)) {
    const d = Math.hypot(sector.coordinates.lat - lat, sector.coordinates.lng - lng);
    if (d < minDist) {
      minDist = d;
      closestId = sector.id;
    }
  }
  return closestId;
}

// ---------------------------------------------------------------------------
// Toast payload
// ---------------------------------------------------------------------------
export type ToastVariant = 'error' | 'success' | 'warning';

export interface LocationToast {
  message: string;
  variant: ToastVariant;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export interface UseGeolocationReturn {
  locationLoading: boolean;
  locationToast: LocationToast | null;
  handleUseLocation: () => void;
}

export function useGeolocation(
  onSelectSector: (sectorId: string) => void,
  toastDurationMs = 4000,
): UseGeolocationReturn {
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationToast, setLocationToast] = useState<LocationToast | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (message: string, variant: ToastVariant) => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setLocationToast({ message, variant });
      toastTimerRef.current = setTimeout(() => setLocationToast(null), toastDurationMs);
    },
    [toastDurationMs],
  );

  const handleUseLocation = useCallback(() => {
    if (locationLoading) return;

    if (!navigator.geolocation) {
      showToast(
        'Geolocation is not supported by your browser.',
        'error',
      );
      return;
    }

    setLocationLoading(true);
    setLocationToast(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;

        // ── Step 1: Bounding-box check ────────────────────────────────────
        if (!isInsideAssam(lat, lng)) {
          setLocationLoading(false);
          showToast('You are not in Assam.', 'error');
          return;
        }

        // ── Step 2: Reverse-geocode with Nominatim ────────────────────────
        let sectorId: string | null = null;
        try {
          const url =
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2` +
            `&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`;

          const resp = await fetch(url, {
            headers: {
              // Nominatim usage policy: provide a descriptive User-Agent
              'Accept-Language': 'en',
            },
          });

          if (resp.ok) {
            const data = await resp.json();

            // Confirm Nominatim also places us in Assam
            const nominatimState: string = (data?.address?.state ?? '').toLowerCase();
            if (nominatimState && nominatimState !== 'assam') {
              setLocationLoading(false);
              showToast('You are not in Assam.', 'error');
              return;
            }

            sectorId = resolveSectorFromAddress(data?.address ?? {});
          }
        } catch {
          // Network / parse error — fall through to coordinate-based fallback
        }

        // ── Step 3: Coordinate fallback (inside Assam, district unresolved) ─
        if (!sectorId) {
          sectorId = closestSectorByCoords(lat, lng);
          const sectorName = ASSAM_SECTORS[sectorId]?.district ?? sectorId;
          setLocationLoading(false);
          showToast(
            `Nearest monitored district: ${sectorName}`,
            'warning',
          );
          onSelectSector(sectorId);
          return;
        }

        // ── Step 4: Exact match ───────────────────────────────────────────
        const sectorName = ASSAM_SECTORS[sectorId]?.district ?? sectorId;
        setLocationLoading(false);
        showToast(`Location detected: ${sectorName}`, 'success');
        onSelectSector(sectorId);
      },

      // ── Geolocation error callback ──────────────────────────────────────
      (error) => {
        setLocationLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            showToast(
              'Location access denied. Please allow location permission and try again.',
              'error',
            );
            break;
          case error.POSITION_UNAVAILABLE:
            showToast('Location information is currently unavailable. Please try again.', 'error');
            break;
          case error.TIMEOUT:
            showToast('Location request timed out. Please check your connection and retry.', 'error');
            break;
          default:
            showToast('Unable to detect your location. Please try again.', 'error');
        }
      },

      // ── Options ─────────────────────────────────────────────────────────
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  }, [locationLoading, onSelectSector, showToast]);

  return { locationLoading, locationToast, handleUseLocation };
}
