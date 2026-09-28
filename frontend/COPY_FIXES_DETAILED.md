# FloodGuard Copy & Microcopy Fixes - 5 Issues

## Issue #1: Technical Acronym "GIS" (MINOR)

**Root Cause:** Technical acronym "GIS" (Geographic Information System) is used in a public-facing button, which may not be familiar to all users, especially in emergency situations.

**File:** `frontend/src/App.tsx`  
**Line:** 139

---

### Current Code:
```tsx
<button
  onClick={() => setActiveTab('map')}
  className="text-sm font-semibold text-sky-700 dark:text-sky-400 hover:text-sky-900 dark:hover:text-sky-300 transition inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-950/50"
>
  <span>Open Full GIS View</span>
  <span>→</span>
</button>
```

### Fixed Code:
```tsx
<button
  onClick={() => setActiveTab('map')}
  className="text-sm font-semibold text-sky-700 dark:text-sky-400 hover:text-sky-900 dark:hover:text-sky-300 transition inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-950/50"
>
  <span>Open Full Map View</span>
  <span>→</span>
</button>
```

**What Changed:**
- "Open Full GIS View" → "Open Full Map View"

**Rationale:**
- "Map View" is universally understood
- Maintains clarity about what the user will see
- "Full" indicates comprehensive/detailed view
- No loss of functionality or meaning

---

## Issue #2: Technical Term "Telemetry" (SUGGESTION)

**Root Cause:** The word "telemetry" is technical jargon from engineering/monitoring systems. In an emergency context, users need immediately clear language about what data they'll see.

**File:** `frontend/src/components/RiskHero.tsx`  
**Line:** 431

---

### Current Code:
```tsx
<button
  onClick={() => setShowDetails(!showDetails)}
  className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white py-1 transition"
>
  <span className="flex items-center gap-1.5">
    <Activity className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
    <span>{showDetails ? 'Hide technical prediction details' : 'Show prediction details & telemetry ↓'}</span>
  </span>
  {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
</button>
```

### Fixed Code:
```tsx
<button
  onClick={() => setShowDetails(!showDetails)}
  className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white py-1 transition"
>
  <span className="flex items-center gap-1.5">
    <Activity className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
    <span>{showDetails ? 'Hide prediction details' : 'Show prediction details & data sources'}</span>
  </span>
  {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
</button>
```

**What Changed:**
- "Show prediction details & telemetry ↓" → "Show prediction details & data sources"
- "Hide technical prediction details" → "Hide prediction details"
- Removed "↓" arrow (redundant with chevron icon)
- Removed "technical" (implicit that details are technical)

**Rationale:**
- "Data sources" is clearer than "telemetry"
- Simplified hide state (removed redundant "technical")
- More concise, equally informative
- Arrow removed since ChevronDown icon already indicates expansion

---

## Issue #3: Engineering Jargon "CHANNEL EMBANKMENT THREAT" (MINOR)

**Root Cause:** Technical hydrological engineering terminology in emergency status message. In high-stress situations, residents need immediate comprehension, not technical accuracy.

**File:** `frontend/src/data/assamData.ts`  
**Line:** 275

---

### Current Code:
```typescript
statusSummary: 'SEVERE CHANNEL EMBANKMENT THREAT',
```

### Fixed Code:
```typescript
statusSummary: 'Severe River Bank Breach Risk',
```

**What Changed:**
- "SEVERE CHANNEL EMBANKMENT THREAT" → "Severe River Bank Breach Risk"
- Changed from ALL CAPS to Title Case (better readability per usability guidelines)

**Rationale:**
- "Channel embankment" is technical engineering term (levee/dike)
- "River bank breach" is plain language everyone understands
- "Risk" is clearer than "threat" in emergency context
- Title Case improves readability (also addresses usability audit issue #7)
- Maintains urgency while being immediately comprehensible

**Alternative Option (if ALL CAPS is required):**
```typescript
statusSummary: 'SEVERE RIVER BANK BREACH RISK',
```

---

## Issue #4: Repetitive Text & Visible Accessibility Hint (MINOR)

**Root Cause:** 
1. Word "official" appears twice in close proximity ("Official NDMA... View official")
2. Screen-reader-only text "(opens in a new tab)" is incorrectly visible in UI

**File:** `frontend/src/components/RiskHero.tsx`  
**Lines:** 240-247

---

### Current Code:
```tsx
<a
  href="https://sachet.ndma.gov.in/"
  target="_blank"
  rel="noopener noreferrer"
  className="group flex w-full min-w-0 items-center gap-3 rounded-xl border border-sky-200/70 bg-sky-50/60 px-3 py-2 text-sky-800 transition-colors hover:border-sky-300 hover:bg-sky-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 dark:border-sky-800/60 dark:bg-sky-950/30 dark:text-sky-200 dark:hover:border-sky-700 dark:hover:bg-sky-900/40 dark:focus-visible:ring-sky-400 dark:focus-visible:ring-offset-slate-950 lg:max-w-md"
>
  <ExternalLink aria-hidden="true" className="h-4 w-4 shrink-0 text-sky-700 dark:text-sky-300" />
  <span className="min-w-0">
    <span className="block text-xs font-semibold group-hover:underline underline-offset-4">
      Official NDMA Disaster Alerts
    </span>
    <span className="mt-0.5 block text-xs leading-relaxed text-slate-600 dark:text-slate-300">
      View official disaster warnings and public alerts from NDMA Sachet.
    </span>
  </span>
  <span className="sr-only">(opens in a new tab)</span>
</a>
```

### Fixed Code:
```tsx
<a
  href="https://sachet.ndma.gov.in/"
  target="_blank"
  rel="noopener noreferrer"
  className="group flex w-full min-w-0 items-center gap-3 rounded-xl border border-sky-200/70 bg-sky-50/60 px-3 py-2 text-sky-800 transition-colors hover:border-sky-300 hover:bg-sky-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 dark:border-sky-800/60 dark:bg-sky-950/30 dark:text-sky-200 dark:hover:border-sky-700 dark:hover:bg-sky-900/40 dark:focus-visible:ring-sky-400 dark:focus-visible:ring-offset-slate-950 lg:max-w-md"
>
  <ExternalLink aria-hidden="true" className="h-4 w-4 shrink-0 text-sky-700 dark:text-sky-300" />
  <span className="min-w-0">
    <span className="block text-xs font-semibold group-hover:underline underline-offset-4">
      NDMA Disaster Alerts
    </span>
    <span className="mt-0.5 block text-xs leading-relaxed text-slate-600 dark:text-slate-300">
      View national warnings and public alerts from NDMA Sachet.
    </span>
  </span>
  <span className="sr-only">(opens in new tab)</span>
</a>
```

**What Changed:**
1. "Official NDMA Disaster Alerts" → "NDMA Disaster Alerts"
2. "View official disaster warnings" → "View national warnings"
3. "(opens in a new tab)" → "(opens in new tab)"

**Rationale:**
- Removed redundant "official" (NDMA is inherently official government agency)
- "National" emphasizes authoritative source without repetition
- Shortened screen-reader text (common convention is "opens in new tab" without "a")
- Note: The `sr-only` class should make this invisible; if it's showing, that's a CSS issue

**If "(opens in new tab)" is actually visible (CSS bug):**
The issue is likely that `sr-only` class is not defined or not working. The text should remain as screen-reader-only. If it's visible, check that Tailwind's `sr-only` utility is working:

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

---

## Issue #5: Technical Footer Text (SUGGESTION)

**Root Cause:** Footer uses developer/engineering terminology ("Open Telemetry", "Zero In-Browser Logging") that's unnecessary and confusing for general users. This is implementation detail, not user benefit.

**File:** `frontend/src/components/Footer.tsx`  
**Line:** 84

---

### Current Code:
```tsx
<li>
  <span className="text-slate-500 dark:text-slate-400 block py-1">
    Privacy & Open Telemetry (Zero In-Browser Logging)
  </span>
</li>
```

### Fixed Code (Option A - Recommended):
```tsx
<li>
  <span className="text-slate-500 dark:text-slate-400 block py-1">
    Privacy Policy & Data Handling
  </span>
</li>
```

### Fixed Code (Option B - If highlighting privacy is key):
```tsx
<li>
  <span className="text-slate-500 dark:text-slate-400 block py-1">
    Privacy Policy · No User Tracking
  </span>
</li>
```

### Fixed Code (Option C - Most standard):
```tsx
<li>
  <span className="text-slate-500 dark:text-slate-400 block py-1">
    Privacy & Data Usage
  </span>
</li>
```

**What Changed:**
- "Privacy & Open Telemetry (Zero In-Browser Logging)" → "Privacy Policy & Data Handling"

**Rationale:**
- "Open Telemetry" is technical observability framework name
- "Zero In-Browser Logging" is implementation detail
- Standard footer language: "Privacy Policy", "Data Handling", "Data Usage"
- If privacy is key differentiator, say "No User Tracking" (user benefit, not implementation)
- Users care about "Are you tracking me?" not "How are you not tracking me?"

**Recommended: Option A** - Professional, standard, clear.

---

## Summary of Changes

| Issue | File | Line | Change | Priority |
|-------|------|------|--------|----------|
| #1 | `App.tsx` | 139 | "GIS View" → "Map View" | Minor |
| #2 | `RiskHero.tsx` | 431 | "telemetry" → "data sources" | Suggestion |
| #3 | `assamData.ts` | 275 | "EMBANKMENT THREAT" → "River Bank Breach Risk" | Minor |
| #4 | `RiskHero.tsx` | 240-247 | Remove redundant "official", fix sr-only | Minor |
| #5 | `Footer.tsx` | 84 | Simplify technical privacy text | Suggestion |

---

## Implementation Checklist

### Issue #1: GIS → Map View
- [ ] Open `frontend/src/App.tsx`
- [ ] Find line 139
- [ ] Change "Open Full GIS View" to "Open Full Map View"
- [ ] Save file
- [ ] Test: Button still opens map tab

### Issue #2: Telemetry → Data Sources
- [ ] Open `frontend/src/components/RiskHero.tsx`
- [ ] Find line 431
- [ ] Update show state: "Show prediction details & data sources"
- [ ] Update hide state: "Hide prediction details"
- [ ] Save file
- [ ] Test: Toggle still expands/collapses details

### Issue #3: Channel Embankment → River Bank Breach
- [ ] Open `frontend/src/data/assamData.ts`
- [ ] Find line 275 (Majuli sector)
- [ ] Change to "Severe River Bank Breach Risk" (Title Case)
- [ ] Save file
- [ ] Test: Status displays correctly in RiskHero card

### Issue #4: Repetitive NDMA Text
- [ ] Open `frontend/src/components/RiskHero.tsx`
- [ ] Find lines 240-247
- [ ] Remove "Official" from heading (line 240)
- [ ] Change "official disaster warnings" to "national warnings" (line 243)
- [ ] Verify sr-only text is not visible (CSS check)
- [ ] Save file
- [ ] Test: Link still works, opens in new tab

### Issue #5: Footer Privacy Text
- [ ] Open `frontend/src/components/Footer.tsx`
- [ ] Find line 84
- [ ] Change to "Privacy Policy & Data Handling"
- [ ] Save file
- [ ] Test: Footer displays correctly

---

## Testing Commands

```bash
# TypeScript check
npm run lint

# Production build
npm run build

# Development server
npm run dev
# Visit http://localhost:3001/
```

---

## Visual Verification

### Issue #1
- [ ] Look for map button above Assam map
- [ ] Text should say "Open Full Map View"
- [ ] Click it - should open full map tab

### Issue #2
- [ ] Select a district (e.g., Majuli)
- [ ] Scroll to risk card details section
- [ ] Toggle button should say "Show prediction details & data sources"
- [ ] When expanded: "Hide prediction details"

### Issue #3
- [ ] Select Majuli district
- [ ] Look at main risk status in hero card
- [ ] Should say "Severe River Bank Breach Risk"
- [ ] NOT "SEVERE CHANNEL EMBANKMENT THREAT"

### Issue #4
- [ ] Look at NDMA alerts link (top of page, near search)
- [ ] Should say "NDMA Disaster Alerts" (not "Official NDMA...")
- [ ] Description should say "View national warnings..." (not "View official...")
- [ ] "(opens in new tab)" should NOT be visible (only to screen readers)

### Issue #5
- [ ] Scroll to page footer
- [ ] Look for privacy text
- [ ] Should say "Privacy Policy & Data Handling"
- [ ] NOT "Privacy & Open Telemetry (Zero In-Browser Logging)"

---

## Accessibility Verification

All changes maintain or improve accessibility:

- ✅ No ARIA attribute changes needed
- ✅ Screen reader compatibility maintained
- ✅ Link targets unchanged (`target="_blank"`)
- ✅ Keyboard navigation unaffected
- ✅ Focus states preserved
- ✅ Semantic HTML unchanged

**Specific check for Issue #4:**
- Verify `sr-only` class hides "(opens in new tab)" from visual users
- Screen readers should still announce it
- If visible, check Tailwind CSS configuration

---

## Copy Style Guidelines

### General Principles:
1. **Avoid technical jargon** - Use plain language
2. **Be concise** - Remove redundant words
3. **Emergency context** - Prioritize immediate comprehension
4. **User benefits** - Not implementation details

### Technical → Plain Language:
| Technical Term | Plain Language |
|----------------|----------------|
| GIS | Map / Interactive Map |
| Telemetry | Data sources / Sensor data |
| Channel embankment | River bank |
| Open Telemetry | (Don't mention) |
| In-browser logging | User tracking |

### Emergency Dashboard Copy:
- **DO:** Use words residents know
- **DO:** Be direct and actionable  
- **DO:** Test with non-technical users
- **DON'T:** Use acronyms without explanation
- **DON'T:** Assume technical literacy
- **DON'T:** Expose implementation details

---

## Rollback Instructions

If needed, revert changes:

```bash
# Revert individual file
git checkout HEAD -- frontend/src/App.tsx

# Revert all copy changes
git checkout HEAD -- frontend/src/App.tsx
git checkout HEAD -- frontend/src/components/RiskHero.tsx
git checkout HEAD -- frontend/src/data/assamData.ts
git checkout HEAD -- frontend/src/components/Footer.tsx
```

---

## Time Estimate

- **Reading this guide:** 10 minutes
- **Making all changes:** 15 minutes
- **Testing:** 10 minutes
- **Total:** 35 minutes

---

## Success Criteria

**You're done when:**
- ✅ No TypeScript errors (`npm run lint`)
- ✅ Build succeeds (`npm run build`)
- ✅ All 5 text changes visible in browser
- ✅ All functionality still works (buttons, links, toggles)
- ✅ No accessibility regressions
- ✅ "(opens in new tab)" not visible (only for screen readers)

---

## Questions?

**Q: Why Title Case for "River Bank Breach Risk" instead of ALL CAPS?**  
A: Better readability (addresses usability audit issue #7). If you must keep ALL CAPS for consistency, use "SEVERE RIVER BANK BREACH RISK".

**Q: Won't users not know what "data sources" means?**  
A: It's more intuitive than "telemetry". The expanded content shows model confidence, rainfall, gauge data - these are sources. Alternative: "Show detailed predictions" (removes "& data sources" entirely).

**Q: Is removing "official" from NDMA alerts a problem?**  
A: No. NDMA is the National Disaster Management Authority - it's inherently official. The redundancy adds clutter without value.

**Q: Should I change ALL sectors in assamData.ts?**  
A: This fix only addresses the Majuli sector (line 275). Audit other sectors for similar technical language and update as needed. Use grep: `grep -n "statusSummary" frontend/src/data/assamData.ts`

---

**Ready to implement! Start with high-impact changes (#1, #3, #4). 🚀**
