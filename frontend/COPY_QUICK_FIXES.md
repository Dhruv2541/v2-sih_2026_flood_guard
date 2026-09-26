# Copy Fixes - Quick Implementation Guide

Copy-paste ready fixes for all 4 copy issues. See `COPY_FIXES.md` for full rationale.

---

## Issue #1: Directive Level Conflict (CRITICAL) ⚠️

**File:** `frontend/src/components/AlertDirectiveBanner.tsx`  
**Line:** ~44

### Find this code:
```tsx
<span
  className={`text-[11px] font-extrabold uppercase tracking-widest ${
    isCriticalOrHigh ? 'text-red-700 dark:text-red-300' : 'text-amber-800 dark:text-amber-300'
  }`}
>
  ASDMA DIRECTIVE LEVEL {sector.hazardLevel === 'CRITICAL' ? '3' : '2'} ACTIVATED
</span>
```

### Replace with:
```tsx
<span
  className={`text-xs font-extrabold uppercase tracking-wider ${
    isCriticalOrHigh ? 'text-red-700 dark:text-red-300' : 'text-amber-800 dark:text-amber-300'
  }`}
>
  ASDMA Directive Level {isCriticalOrHigh ? '3' : '2'} Activated
</span>
```

**What changed:**
- `text-[11px]` → `text-xs` (better size, see usability fixes)
- `tracking-widest` → `tracking-wider` (less extreme)
- `sector.hazardLevel === 'CRITICAL' ? '3' : '2'` → `isCriticalOrHigh ? '3' : '2'`
- ALL CAPS → Sentence Case (better readability)

**Why:** Both CRITICAL and HIGH should show Level 3. The old code showed Level 2 for HIGH, conflicting with the data.

---

## Issue #2: Technical Jargon "SEVERE CHANNEL EMBANKMENT THREAT" (MAJOR) 🔧

**File:** `frontend/src/data/assamData.ts`  
**Line:** ~275

### Find this code:
```typescript
statusSummary: 'SEVERE CHANNEL EMBANKMENT THREAT',
```

### Replace with:
```typescript
statusSummary: 'High Risk of River Bank Breach',
```

**Why:** "Channel embankment" is hydrological engineering jargon. "River bank breach" is clear, urgent, and understandable to all residents.

---

## Issue #3: "GIS" Technical Acronym (MINOR) 📍

**File:** `frontend/src/App.tsx`  
**Line:** ~139

### Find this code:
```tsx
<button
  onClick={() => setActiveTab('map')}
  className="text-sm font-semibold text-sky-700 dark:text-sky-400 hover:text-sky-900 dark:hover:text-sky-300 transition inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-950/50"
>
  <span>Open Full GIS View</span>
  <span>→</span>
</button>
```

### Replace with:
```tsx
<button
  onClick={() => setActiveTab('map')}
  className="text-sm font-semibold text-sky-700 dark:text-sky-400 hover:text-sky-900 dark:hover:text-sky-300 transition inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-950/50"
>
  <span>Open Full Map View</span>
  <span>→</span>
</button>
```

**What changed:**
- "Open Full GIS View" → "Open Full Map View"

**Why:** GIS (Geographic Information System) is technical. "Map View" is universally understood.

---

## Issue #4: Technical Footer Text (SUGGESTION) 📄

**File:** `frontend/src/components/Footer.tsx`  
**Line:** ~84

### Find this code:
```tsx
<li>
  <span className="text-slate-500 dark:text-slate-400 block py-1">
    Privacy & Open Telemetry (Zero In-Browser Logging)
  </span>
</li>
```

### Replace with:
```tsx
<li>
  <span className="text-slate-500 dark:text-slate-400 block py-1">
    Privacy & Data Usage
  </span>
</li>
```

**What changed:**
- "Privacy & Open Telemetry (Zero In-Browser Logging)" → "Privacy & Data Usage"

**Why:** "Open Telemetry" and "In-Browser Logging" are developer terms. Standard footer language is clearer.

**Alternative (if you want to highlight privacy):**
```tsx
<span className="text-slate-500 dark:text-slate-400 block py-1">
  Privacy Policy · No User Tracking
</span>
```

---

## Quick Test Commands

After making changes:

```bash
# TypeScript check
npm run lint

# Build check
npm run build

# Visual check
npm run dev
# Then visit http://localhost:3001/
```

---

## Visual Verification Checklist

### Issue #1: Directive Level
1. Select a HIGH risk district (e.g., Majuli)
2. Check alert banner shows "ASDMA Directive Level 3 Activated"
3. Select a CRITICAL risk district
4. Check it also shows "Level 3"
5. Select a MODERATE district
6. Check it shows "Level 2"

### Issue #2: Status Summary
1. Select Majuli district (HIGH risk)
2. Look at the main risk card
3. Verify it says "High Risk of River Bank Breach"
4. NOT "SEVERE CHANNEL EMBANKMENT THREAT"

### Issue #3: GIS Button
1. Scroll to map section
2. Look for button above map
3. Verify it says "Open Full Map View"
4. Click it - should open full map tab

### Issue #4: Footer
1. Scroll to bottom of page
2. Look at footer links/text
3. Verify it says "Privacy & Data Usage"
4. NOT "Privacy & Open Telemetry (Zero In-Browser Logging)"

---

## Files Changed Summary

```
✏️  AlertDirectiveBanner.tsx  - Line 44  (directive level)
✏️  assamData.ts             - Line 275 (status summary)
✏️  App.tsx                  - Line 139 (GIS button)
✏️  Footer.tsx               - Line 84  (footer text)
```

**Total:** 4 files, 4 single-line changes

---

## Time Estimate

- **Reading this guide:** 5 minutes
- **Making changes:** 10 minutes
- **Testing:** 10 minutes
- **Total:** 25 minutes

---

## Before/After Quick Reference

| Issue | Before | After |
|-------|--------|-------|
| #1 | "LEVEL 2 ACTIVATED" (HIGH) | "Level 3 Activated" (HIGH) |
| #2 | "SEVERE CHANNEL EMBANKMENT THREAT" | "High Risk of River Bank Breach" |
| #3 | "Open Full GIS View" | "Open Full Map View" |
| #4 | "Privacy & Open Telemetry (Zero In-Browser Logging)" | "Privacy & Data Usage" |

---

## Rollback (if needed)

```bash
# Undo all copy changes
git checkout HEAD -- frontend/src/components/AlertDirectiveBanner.tsx
git checkout HEAD -- frontend/src/data/assamData.ts
git checkout HEAD -- frontend/src/App.tsx
git checkout HEAD -- frontend/src/components/Footer.tsx
```

---

## Common Mistakes to Avoid

1. ❌ Don't change the logic structure - only the text/conditionals
2. ❌ Don't change CSS classes except where noted (#1 text-xs)
3. ❌ Don't forget to test HIGH vs CRITICAL vs MODERATE levels
4. ❌ Don't skip the build check - ensures no TypeScript errors

---

## Need Help?

**Problem:** "I can't find line 44 in AlertDirectiveBanner.tsx"  
**Solution:** Search for "ASDMA DIRECTIVE LEVEL" in the file

**Problem:** "I can't find 'SEVERE CHANNEL EMBANKMENT'"  
**Solution:** Search in assamData.ts for "statusSummary"

**Problem:** "GIS button not found"  
**Solution:** Search App.tsx for "Open Full GIS"

**Problem:** "Changes not showing"  
**Solution:** Stop dev server (Ctrl+C), rebuild: `npm run dev`

---

**Ready to fix! Start with Issue #1 (critical). 🚀**
