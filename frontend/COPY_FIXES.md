# FloodGuard Copy & Microcopy Fixes - 4 Issues

## Issue #1: Conflicting Directive Levels (CRITICAL)

**Root Cause:** Logic error in `AlertDirectiveBanner.tsx` line 44. The component shows "LEVEL 2" for HIGH hazard when the data (`assamData.ts` line 286) clearly states "ASDMA DIRECTIVE LEVEL 3" in the `asdmaDirective` field.

**Current Logic:**
```tsx
ASDMA DIRECTIVE LEVEL {sector.hazardLevel === 'CRITICAL' ? '3' : '2'} ACTIVATED
```

This means:
- CRITICAL → Level 3 ✓
- HIGH → Level 2 ✗ (Should be Level 3 based on data)

**Evidence from Data File:**
```typescript
// frontend/src/data/assamData.ts line 286
hazardLevel: 'HIGH',
asdmaDirective: 'ASDMA DIRECTIVE LEVEL 3: River island ferry services suspended...'
```

---

### Fix #1A: Correct the Logic

**File:** `frontend/src/components/AlertDirectiveBanner.tsx`  
**Line:** 44

**Change from:**
```tsx
<span
  className={`text-[11px] font-extrabold uppercase tracking-widest ${
    isCriticalOrHigh ? 'text-red-700 dark:text-red-300' : 'text-amber-800 dark:text-amber-300'
  }`}
>
  ASDMA DIRECTIVE LEVEL {sector.hazardLevel === 'CRITICAL' ? '3' : '2'} ACTIVATED
</span>
```

**To:**
```tsx
<span
  className={`text-xs font-extrabold uppercase tracking-wider ${
    isCriticalOrHigh ? 'text-red-700 dark:text-red-300' : 'text-amber-800 dark:text-amber-300'
  }`}
>
  {sector.hazardLevel === 'CRITICAL' 
    ? 'ASDMA Directive Level 3 Activated'
    : sector.hazardLevel === 'HIGH'
    ? 'ASDMA Directive Level 3 Activated'
    : 'ASDMA Directive Level 2 Activated'}
</span>
```

**Rationale:**
- Both CRITICAL and HIGH trigger Level 3
- MODERATE triggers Level 2
- Uses sentence case (addresses usability issue #6 from previous audit)
- Extracts logic into explicit conditional for clarity

---

### Fix #1B: Better Solution - Use Data from Source

**Even better approach:** Extract the level number directly from `asdmaDirective` field to ensure single source of truth:

```tsx
<span
  className={`text-xs font-extrabold uppercase tracking-wider ${
    isCriticalOrHigh ? 'text-red-700 dark:text-red-300' : 'text-amber-800 dark:text-amber-300'
  }`}
>
  {(() => {
    const match = sector.asdmaDirective.match(/LEVEL (\d+)/i);
    const level = match ? match[1] : '2';
    return `ASDMA Directive Level ${level} Activated`;
  })()}
</span>
```

**Rationale:**
- Parses level number from the `asdmaDirective` field
- Eliminates hardcoded logic
- Single source of truth (the data file)
- If pattern doesn't match, defaults to Level 2

---

### Fix #1C: Recommended Solution (Simplest)

**Most practical fix:**

```tsx
<span
  className={`text-xs font-extrabold uppercase tracking-wider ${
    isCriticalOrHigh ? 'text-red-700 dark:text-red-300' : 'text-amber-800 dark:text-amber-300'
  }`}
>
  ASDMA Directive Level {isCriticalOrHigh ? '3' : '2'} Activated
</span>
```

**Rationale:**
- Uses existing `isCriticalOrHigh` boolean (defined line 16)
- Both CRITICAL and HIGH → Level 3
- MODERATE → Level 2
- Clean, readable, matches data
- Also fixes text case (sentence case, as per usability audit #6)

---

## Issue #2: Technical Jargon "SEVERE CHANNEL EMBANKMENT THREAT" (MAJOR)

**Root Cause:** The `statusSummary` field in `assamData.ts` line 275 uses hydrological engineering terminology that residents won't understand in an emergency.

**Current Text:**
```typescript
statusSummary: 'SEVERE CHANNEL EMBANKMENT THREAT',
```

**Context:** This text appears in:
1. `RiskHero.tsx` line 332 - Main risk card
2. `PredictionsView.tsx` line 146 - Status display

---

### Fix #2: Replace with Plain Language

**File:** `frontend/src/data/assamData.ts`  
**Line:** 275 (Majuli sector)

**Change from:**
```typescript
statusSummary: 'SEVERE CHANNEL EMBANKMENT THREAT',
```

**To Option A (Recommended):**
```typescript
statusSummary: 'High Risk of River Bank Breach',
```

**To Option B (More Direct):**
```typescript
statusSummary: 'Severe Flooding Risk from River',
```

**To Option C (Most Clear):**
```typescript
statusSummary: 'River Banks May Break - High Flood Risk',
```

**Rationale:**
- "Channel embankment" → "River bank" (common language)
- "Threat" → "Risk" or "May break" (clearer consequence)
- Removes technical jargon (embankment = engineering term for levee/dike)
- Emergency-appropriate: direct, actionable language

---

### Fix #2 Recommended: Option A

```typescript
// frontend/src/data/assamData.ts line 275
statusSummary: 'High Risk of River Bank Breach',
```

**Why:**
- Clear consequence (breach = break)
- "River bank" is universally understood
- "High Risk" matches the hazardLevel: 'HIGH'
- Professional but accessible
- Maintains urgency without panic

---

### Check Other Sectors for Similar Issues

Search the data file for other technical terms:

```bash
# Grep for potential jargon:
- "embankment"
- "confluence" 
- "backwater"
- "stage"
- "surge"
```

**Found:** Line 283 also mentions "Embankment seepage" in warningMessage. Consider:
- "Embankment seepage" → "Water leaking through river banks"
- "Backwater pressure" → "Water backing up"

---

## Issue #3: Technical Acronym "GIS" (MINOR)

**Root Cause:** `App.tsx` line 139 uses "GIS" (Geographic Information System) which is developer/GIS-specialist terminology.

**Current Text:**
```tsx
<span>Open Full GIS View</span>
```

---

### Fix #3: Use Plain Language

**File:** `frontend/src/App.tsx`  
**Line:** 139

**Change from:**
```tsx
<button
  onClick={() => setActiveTab('map')}
  className="text-sm font-semibold text-sky-700 dark:text-sky-400 hover:text-sky-900 dark:hover:text-sky-300 transition inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-950/50"
>
  <span>Open Full GIS View</span>
  <span>→</span>
</button>
```

**To Option A (Recommended):**
```tsx
<button
  onClick={() => setActiveTab('map')}
  className="text-sm font-semibold text-sky-700 dark:text-sky-400 hover:text-sky-900 dark:hover:text-sky-300 transition inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-950/50"
>
  <span>Open Full Map View</span>
  <span>→</span>
</button>
```

**To Option B (More Descriptive):**
```tsx
<span>Open Interactive Map</span>
```

**To Option C (Most Explicit):**
```tsx
<span>Open Full Interactive Map</span>
```

**Rationale:**
- "GIS" is technical acronym (Geographic Information System)
- "Map View" or "Interactive Map" is universally understood
- Maintains meaning: user knows they'll see a detailed map
- "Full" indicates expanded/detailed version

---

### Fix #3 Recommended: Option A

```tsx
// frontend/src/App.tsx line 139
<span>Open Full Map View</span>
```

**Why:**
- Simple, clear, direct
- "Map View" implies interactive capability
- "Full" indicates comprehensive/expanded
- Matches user mental model
- No information loss

---

## Issue #4: Technical Footer Text (SUGGESTION)

**Root Cause:** `Footer.tsx` line 84 uses developer-focused terminology ("Open Telemetry", "In-Browser Logging") that's unnecessary for public-facing footer.

**Current Text:**
```tsx
<span className="text-slate-500 dark:text-slate-400 block py-1">
  Privacy & Open Telemetry (Zero In-Browser Logging)
</span>
```

**Context:** Footer compliance/policy section, non-interactive text.

---

### Fix #4: Simplify to User-Focused Language

**File:** `frontend/src/components/Footer.tsx`  
**Line:** 84

**Change from:**
```tsx
<li>
  <span className="text-slate-500 dark:text-slate-400 block py-1">
    Privacy & Open Telemetry (Zero In-Browser Logging)
  </span>
</li>
```

**To Option A (Recommended):**
```tsx
<li>
  <span className="text-slate-500 dark:text-slate-400 block py-1">
    Privacy & Data Usage
  </span>
</li>
```

**To Option B (More Standard):**
```tsx
<li>
  <span className="text-slate-500 dark:text-slate-400 block py-1">
    Privacy Policy
  </span>
</li>
```

**To Option C (Most Specific):**
```tsx
<li>
  <span className="text-slate-500 dark:text-slate-400 block py-1">
    Privacy & Data Protection
  </span>
</li>
```

**To Option D (If Need to Highlight):**
```tsx
<li>
  <span className="text-slate-500 dark:text-slate-400 block py-1">
    Privacy & Data Usage (No Browser Tracking)
  </span>
</li>
```

**Rationale:**
- "Open Telemetry" is technical observability framework
- "In-Browser Logging" is developer terminology
- General users don't need to know implementation details
- Standard footer language: "Privacy Policy", "Data Usage"
- If privacy is a selling point, say "No Tracking" (user benefit)

---

### Fix #4 Recommended: Option A

```tsx
// frontend/src/components/Footer.tsx line 84
<span className="text-slate-500 dark:text-slate-400 block py-1">
  Privacy & Data Usage
</span>
```

**Why:**
- Standard, expected footer language
- Implies both policy and practices
- Clean, professional
- Removes technical noise
- If this links to a page, the page can explain "zero tracking"

---

### Fix #4 Alternative: If Non-Tracking is Key Feature

If you want to highlight the privacy-first approach:

```tsx
<span className="text-slate-500 dark:text-slate-400 block py-1">
  Privacy Policy · No User Tracking
</span>
```

**Why:**
- Communicates user benefit (no tracking)
- Uses plain language
- Maintains professional tone
- Separates policy link from feature claim

---

## Summary of Changes

| Issue | File | Line | Change | Priority |
|-------|------|------|--------|----------|
| #1 | `AlertDirectiveBanner.tsx` | 44 | Fix directive level logic | CRITICAL |
| #2 | `assamData.ts` | 275 | Plain language status | MAJOR |
| #3 | `App.tsx` | 139 | "GIS" → "Map View" | MINOR |
| #4 | `Footer.tsx` | 84 | Simplify privacy text | SUGGESTION |

---

## Testing Checklist

### Issue #1: Directive Level
- [ ] CRITICAL sector shows "Level 3"
- [ ] HIGH sector shows "Level 3"
- [ ] MODERATE sector shows "Level 2"
- [ ] Text matches `asdmaDirective` field
- [ ] No console errors

### Issue #2: Status Summary
- [ ] Risk card shows plain language
- [ ] "River bank breach" is clear
- [ ] Emergency tone maintained
- [ ] Works in both RiskHero and PredictionsView

### Issue #3: GIS Button
- [ ] Button says "Map View" or "Interactive Map"
- [ ] Click still opens map tab
- [ ] Tooltip (if any) still works

### Issue #4: Footer Privacy
- [ ] Footer shows simplified text
- [ ] Professional appearance maintained
- [ ] No broken links (if it's a link)

---

## Copy Guidelines for Future

### Emergency Dashboard Copy Principles:

1. **Use Plain Language**
   - ❌ "Channel embankment threat"
   - ✅ "River bank may break"

2. **Avoid Technical Jargon**
   - ❌ "GIS", "Telemetry", "Confluence"
   - ✅ "Map", "Data", "Where rivers meet"

3. **Be Direct in Emergencies**
   - ❌ "Moderate precipitation accumulation"
   - ✅ "Heavy rain expected"

4. **Use Consistent Levels**
   - Match UI text to data source
   - Single source of truth

5. **Test with Non-Experts**
   - Would a stressed resident understand this?
   - Would a non-technical user know what to do?

### Vocabulary Substitutions:

| Technical Term | Plain Language |
|----------------|----------------|
| Channel embankment | River bank |
| Confluence | Where rivers meet |
| Backwater | Water backing up |
| Stage | Water level |
| Surge | Rapid rise |
| Inundation | Flooding |
| Telemetry | Data collection |
| GIS | Map / Interactive map |
| In-browser logging | Browser tracking |

---

## Accessibility Notes

All fixes maintain or improve accessibility:

- ✅ No ARIA changes needed (text content only)
- ✅ Screen readers will read clearer text
- ✅ Cognitive load reduced (plain language)
- ✅ No color/contrast changes
- ✅ Semantic HTML unchanged

---

## Implementation Order

**Do these first (Critical):**
1. Fix #1 - Directive level conflict

**Do next (Major):**
2. Fix #2 - Status summary jargon

**Do when convenient (Minor/Suggestion):**
3. Fix #3 - GIS button text
4. Fix #4 - Footer simplification

**Total time:** ~30 minutes for all fixes

---

## Rollback Plan

All changes are text-only and easily reversible:

```bash
# If needed, revert specific file:
git checkout HEAD -- frontend/src/components/AlertDirectiveBanner.tsx

# Or revert all copy changes:
git checkout HEAD -- frontend/src/data/assamData.ts
git checkout HEAD -- frontend/src/App.tsx
git checkout HEAD -- frontend/src/components/Footer.tsx
git checkout HEAD -- frontend/src/components/AlertDirectiveBanner.tsx
```

---

## Additional Recommendations

### Scan for More Technical Terms:

Run these searches to find similar issues:

```bash
# Technical hydrology terms
grep -r "confluence\|embankment\|backwater\|stage\|discharge" frontend/src/

# Technical UI terms  
grep -r "GIS\|telemetry\|logging\|viewport" frontend/src/

# Developer jargon
grep -r "in-browser\|client-side\|server-side" frontend/src/
```

### Create a Copy Style Guide

Document these principles in `frontend/COPY_STYLE_GUIDE.md`:
- Plain language requirements
- Approved terminology
- Jargon substitutions
- Emergency communication tone

---

## Questions?

**Q: Won't "river bank breach" sound less serious than "embankment threat"?**  
A: No. "Breach" is more visceral and understandable. Technical language can create false security ("I don't understand it, so it doesn't apply to me").

**Q: Is "GIS" wrong if that's the accurate term?**  
A: It's accurate for GIS professionals, but this is a public emergency dashboard. User comprehension > technical accuracy.

**Q: Should we keep technical terms in alt text or tooltips?**  
A: No. Screen reader users also need plain language. Technical details belong in methodology docs, not UI.

**Q: What about "ASDMA" - is that jargon?**  
A: It's the official authority name (Assam State Disaster Management Authority). Keep it, but could add "Assam Disaster Authority" in parentheses on first use.

---

**Ready to implement!** 🚀

Start with Fix #1 (critical directive level conflict), then proceed through the rest.
