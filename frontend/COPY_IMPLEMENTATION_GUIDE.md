# Copy Fixes - Quick Implementation Guide

5 simple text changes to improve clarity. Total time: ~15 minutes.

---

## Issue #1: "GIS" → "Map View" ✏️

**File:** `frontend/src/App.tsx` (line 139)

```tsx
// FIND:
<span>Open Full GIS View</span>

// REPLACE WITH:
<span>Open Full Map View</span>
```

---

## Issue #2: "Telemetry" → "Data Sources" ✏️

**File:** `frontend/src/components/RiskHero.tsx` (line 431)

```tsx
// FIND:
<span>{showDetails ? 'Hide technical prediction details' : 'Show prediction details & telemetry ↓'}</span>

// REPLACE WITH:
<span>{showDetails ? 'Hide prediction details' : 'Show prediction details & data sources'}</span>
```

**What changed:**
- Removed "↓" arrow (redundant with chevron icon)
- "telemetry" → "data sources"
- Removed "technical" from hide state

---

## Issue #3: "Channel Embankment" → "River Bank Breach" ✏️

**File:** `frontend/src/data/assamData.ts` (line 275)

```typescript
// FIND:
statusSummary: 'SEVERE CHANNEL EMBANKMENT THREAT',

// REPLACE WITH:
statusSummary: 'Severe River Bank Breach Risk',
```

**Note:** Changed to Title Case for better readability. If you need ALL CAPS, use:
```typescript
statusSummary: 'SEVERE RIVER BANK BREACH RISK',
```

---

## Issue #4: Remove Redundant "Official" ✏️

**File:** `frontend/src/components/RiskHero.tsx` (lines 240-247)

```tsx
// FIND:
<span className="block text-xs font-semibold group-hover:underline underline-offset-4">
  Official NDMA Disaster Alerts
</span>
<span className="mt-0.5 block text-xs leading-relaxed text-slate-600 dark:text-slate-300">
  View official disaster warnings and public alerts from NDMA Sachet.
</span>
<span className="sr-only">(opens in a new tab)</span>

// REPLACE WITH:
<span className="block text-xs font-semibold group-hover:underline underline-offset-4">
  NDMA Disaster Alerts
</span>
<span className="mt-0.5 block text-xs leading-relaxed text-slate-600 dark:text-slate-300">
  View national warnings and public alerts from NDMA Sachet.
</span>
<span className="sr-only">(opens in new tab)</span>
```

**What changed:**
- Removed redundant "Official" from heading
- "official disaster warnings" → "national warnings"
- "(opens in a new tab)" → "(opens in new tab)"

---

## Issue #5: Simplify Footer Privacy Text ✏️

**File:** `frontend/src/components/Footer.tsx` (line 84)

```tsx
// FIND:
<span className="text-slate-500 dark:text-slate-400 block py-1">
  Privacy & Open Telemetry (Zero In-Browser Logging)
</span>

// REPLACE WITH (Option A - Recommended):
<span className="text-slate-500 dark:text-slate-400 block py-1">
  Privacy Policy & Data Handling
</span>

// OR Option B (if highlighting no-tracking):
<span className="text-slate-500 dark:text-slate-400 block py-1">
  Privacy Policy · No User Tracking
</span>
```

---

## Quick Test Checklist ✅

After making changes:

```bash
# 1. TypeScript check
npm run lint

# 2. Build check  
npm run build

# 3. Visual check
npm run dev
# Open http://localhost:3001/
```

**Visual verification:**
- [ ] Map button says "Map View" (not "GIS View")
- [ ] Toggle says "data sources" (not "telemetry")
- [ ] Status says "River Bank Breach Risk" (not "EMBANKMENT THREAT")
- [ ] NDMA link says "NDMA Disaster Alerts" (no redundant "Official")
- [ ] Footer says "Privacy Policy..." (not "Open Telemetry...")

---

## Files Changed Summary

```
✏️  App.tsx              - Line 139  (GIS → Map)
✏️  RiskHero.tsx         - Line 431  (telemetry → data sources)
✏️  RiskHero.tsx         - Lines 240-247 (remove redundant "official")
✏️  assamData.ts         - Line 275 (embankment → river bank)
✏️  Footer.tsx           - Line 84  (simplify privacy text)
```

**Total:** 5 files, simple text changes only

---

## Before/After

| Location | Before | After |
|----------|--------|-------|
| Map button | "Open Full GIS View" | "Open Full Map View" |
| Toggle button | "Show...telemetry ↓" | "Show...data sources" |
| Status text | "CHANNEL EMBANKMENT THREAT" | "River Bank Breach Risk" |
| NDMA link | "Official NDMA...official warnings" | "NDMA...national warnings" |
| Footer | "Privacy & Open Telemetry..." | "Privacy Policy & Data Handling" |

---

## Troubleshooting

**Problem:** Can't find line numbers  
**Solution:** Use Ctrl+F (Cmd+F) to search for the text

**Problem:** Changes not showing  
**Solution:** Stop dev server, rebuild: `npm run dev`

**Problem:** "(opens in new tab)" is visible  
**Solution:** This should be hidden by `sr-only` class. Check Tailwind config.

**Problem:** TypeScript errors  
**Solution:** Make sure you didn't accidentally change variable names or structure

---

## Rollback

```bash
# Undo all copy changes
git checkout HEAD -- frontend/src/App.tsx
git checkout HEAD -- frontend/src/components/RiskHero.tsx  
git checkout HEAD -- frontend/src/data/assamData.ts
git checkout HEAD -- frontend/src/components/Footer.tsx
```

---

**Time estimate: 15 minutes** ⏱️  
**Difficulty: Easy** ✅  
**Impact: High** 🎯
