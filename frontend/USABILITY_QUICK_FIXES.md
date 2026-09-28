# Usability Quick Fixes - Copy & Paste

This is a condensed reference for rapid implementation. For full context, see `USABILITY_FIXES.md`.

---

## 🔥 Critical Fixes (Do These First)

### Fix #8: Status Badge False Affordance
**File:** `frontend/src/components/RiskHero.tsx` (line ~358)

```tsx
// Change from:
className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full font-heading font-extrabold text-xs sm:text-sm tracking-wider uppercase shadow-xs risk-badge-entrance ${riskConfig.badgeBg}`}

// To:
className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border-2 font-heading font-extrabold text-xs sm:text-sm tracking-wider uppercase risk-badge-entrance ${riskConfig.badgeBorderClass}`}
```

**Also add to** `frontend/src/lib/riskLevelConfig.ts`:
```typescript
badgeBorderClass: 
  tier === 'CRITICAL' 
    ? 'border-red-600 text-red-700 dark:border-red-400 dark:text-red-300 bg-red-50 dark:bg-red-950/30'
    : tier === 'HIGH'
    ? 'border-red-500 text-red-600 dark:border-red-400 dark:text-red-300 bg-red-50 dark:bg-red-950/30'
    : tier === 'MODERATE'
    ? 'border-amber-500 text-amber-700 dark:border-amber-400 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30'
    : 'border-emerald-500 text-emerald-700 dark:border-emerald-400 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30',
```

---

### Fix #11: Card Width Imbalance
**File:** `frontend/src/components/ActionCards.tsx` (line 20)

```tsx
// Change from:
<div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_300px] gap-4">

// To:
<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
```

---

### Fix #12: Remove Redundant Bell Button
**File:** `frontend/src/components/Navbar.tsx` (find and delete ~lines 150-180)

```tsx
// DELETE THIS ENTIRE BUTTON:
<button
  id="nav-notification-indicator"
  className="relative min-w-[38px] min-h-[38px]..."
  onClick={() => setIsAlertDrawerOpen(!isAlertDrawerOpen)}
>
  <Bell className="w-5 h-5" />
  {criticalAlertCount > 0 && <span className="absolute..." />}
</button>
```

---

## 📏 Text Size Fixes

### Fix #5: Brand Tagline
**File:** `frontend/src/components/Navbar.tsx` (line ~89)

```tsx
// Change from:
className="text-[9px] sm:text-[10px] tracking-[0.1em] sm:tracking-[0.14em]..."

// To:
className="text-xs tracking-wider..."
```

---

### Fix #6: Alert Directive
**File:** `frontend/src/components/AlertDirectiveBanner.tsx` (line ~38)

```tsx
// Change from:
<span className="text-[11px] font-extrabold uppercase tracking-widest...">
  ASDMA DIRECTIVE LEVEL {sector.hazardLevel === 'CRITICAL' ? '3' : '2'} ACTIVATED
</span>

// To:
<span className="text-xs font-extrabold uppercase tracking-wider...">
  ASDMA Directive Level {sector.hazardLevel === 'CRITICAL' ? '3' : '2'} Activated
</span>
```

---

### Fix #7: Sentence Case for Long Text
**File:** `frontend/src/components/AlertDirectiveBanner.tsx` (line ~46)

```tsx
// Change from:
{isCriticalOrHigh ? (
  <span>STAY ALERT • YOUR AREA HAS HIGH FLOOD RISK</span>
) : (
  <span>WATCH ADVISORY • RIVER CHANNEL MONITORING ACTIVE</span>
)}

// To:
{isCriticalOrHigh ? (
  <span>Stay Alert • Your Area Has High Flood Risk</span>
) : (
  <span>Watch Advisory • River Channel Monitoring Active</span>
)}
```

---

## 🎛️ Toggle & Button Fixes

### Fix #13-14: Prediction Toggle
**File:** `frontend/src/components/RiskHero.tsx` (line ~436)

```tsx
// Change from:
<button
  onClick={() => setShowDetails(!showDetails)}
  className="w-full flex items-center justify-between text-xs font-semibold..."
>
  <span className="flex items-center gap-1.5">
    <Activity className="w-3.5 h-3.5..." />
    <span>{showDetails ? 'Hide technical prediction details' : 'Show prediction details & telemetry ↓'}</span>
  </span>
  {showDetails ? <ChevronUp .../> : <ChevronDown .../>}
</button>

// To:
<button
  onClick={() => setShowDetails(!showDetails)}
  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all"
>
  <Activity className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
  <span>{showDetails ? 'Hide prediction details' : 'Show prediction details'}</span>
  {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
</button>
```

---

## 📐 Spacing Fixes

### Fix #16: Reduce Whitespace Between Data & Buttons
**File:** `frontend/src/components/RiskHero.tsx`

```tsx
// Line ~368 - Change from:
<div className="py-6 flex flex-col md:flex-row md:items-end justify-between gap-6">

// To:
<div className="py-6 flex flex-col md:flex-row md:items-end gap-6">

// Line ~398 - Change from:
<div className="flex items-center gap-3 flex-wrap">

// To:
<div className="flex items-center gap-3 flex-wrap md:ml-8">
```

---

### Fix #19: Vertical Button Alignment
**File:** `frontend/src/components/ActionCards.tsx` (line ~7)

```tsx
// Change from:
<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">

// To:
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">

// And update button:
<button 
  onClick={onOpenGuideModal} 
  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/50 rounded-lg transition-colors"
>
  <span>Open full safety guide</span>
  <ArrowRight className="w-4 h-4" />
</button>
```

---

## 🎨 Visual Enhancement Fixes

### Fix #10: Add Probability Bar Background
**File:** `frontend/src/components/RiskHero.tsx` (after "FLOOD PROBABILITY" label)

```tsx
<span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
  FLOOD PROBABILITY
</span>

{/* ADD THIS: */}
<div className="mt-3 mb-2 h-2 w-48 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
  <div 
    className={`h-full rounded-full transition-all duration-700 ${
      animatedFloodProb >= 70 ? 'bg-red-500' : 
      animatedFloodProb >= 40 ? 'bg-amber-500' : 
      'bg-emerald-500'
    }`}
    style={{ width: `${animatedFloodProb}%` }}
    role="progressbar"
    aria-valuenow={animatedFloodProb}
    aria-valuemin={0}
    aria-valuemax={100}
    aria-label={`Flood probability ${animatedFloodProb} percent`}
  />
</div>

<div className="flex items-baseline gap-3 mt-1">
  {/* existing percentage display */}
</div>
```

---

### Fix #15: Unified Search Container
**File:** `frontend/src/components/RiskHero.tsx` (line ~110)

```tsx
// Wrap entire section in container:
<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
  {/* Search Input Bar */}
  <div className="relative w-full lg:max-w-xl group">
    {/* existing search form */}
  </div>

  {/* NDMA Link */}
  <a href="https://sachet.ndma.gov.in/" ... >
    {/* existing link content */}
  </a>
</div>
```

---

### Fix #17: Map Close Button Size
**File:** `frontend/src/index.css`

```css
.fg-map-popup .mapboxgl-popup-close-button {
  color: var(--fg-muted);
  font-size: 20px;
  top: 8px;
  right: 8px;
  width: 32px;        /* Change from 22px */
  height: 32px;       /* Change from 22px */
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  padding: 0;
  transition: all 0.15s ease;
  line-height: 1;
}
```

---

### Fix #18: SEOC Card Text Alignment
**File:** `frontend/src/components/ActionCards.tsx` (SEOC card section)

```tsx
// Change from:
<aside className="rounded-2xl border... p-5 flex flex-col justify-between">
  <div>
    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Emergency support</span>
    <h3 className="mt-2 font-heading text-lg font-bold...">{emergency.name}</h3>
    <p className="mt-1 text-sm...">{emergency.available}</p>
  </div>
  {/* button */}
</aside>

// To:
<aside className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-5 sm:p-6 flex flex-col justify-between">
  <div>
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400">
        <Phone className="w-5 h-5" />
      </span>
      <div>
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Emergency support</span>
        <h3 className="mt-0.5 font-heading text-lg font-bold text-slate-900 dark:text-slate-100">{emergency.name}</h3>
      </div>
    </div>
    <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{emergency.available}</p>
  </div>
  {/* button */}
</aside>
```

---

## 🎯 Design System (index.css)

### Add to `frontend/src/index.css`:

```css
/* After @import "tailwindcss"; */

/* Typography Scale */
:root {
  --text-micro: 10px;
  --text-tiny: 11px;
}

.text-micro { font-size: var(--text-micro); }
.text-tiny { font-size: var(--text-tiny); }

/* Semantic Colors */
:root {
  --text-primary: #0b1c30;
  --text-secondary: #475569;
  --text-muted: #64748b;
  --text-link: #0284c7;
  --text-success: #059669;
  --text-warning: #d97706;
  --text-danger: #ba1a1a;
}

.dark {
  --text-primary: #e7eef8;
  --text-secondary: #cdd9e8;
  --text-muted: #9aaac0;
  --text-link: #38bdf8;
  --text-success: #4ade80;
  --text-warning: #fbbf24;
  --text-danger: #f87171;
}

/* Border Radius Scale */
:root {
  --radius-sm: 0.375rem;    /* 6px */
  --radius-md: 0.5rem;      /* 8px */
  --radius-lg: 0.75rem;     /* 12px */
  --radius-xl: 1rem;        /* 16px */
  --radius-2xl: 1.5rem;     /* 24px */
}
```

---

## ✅ Quick Test Checklist

After implementing, verify:

```bash
# 1. TypeScript check
npm run lint

# 2. Build check
npm run build

# 3. Visual checks (browser)
- [ ] No text smaller than 12px
- [ ] Status badge has border (not solid fill)
- [ ] Three cards have equal width
- [ ] No bell button in nav
- [ ] Prediction toggle looks like button
- [ ] Map close button is 32×32px
- [ ] Safety guide button aligned with heading
```

---

## 📝 Files Changed Summary

1. ✅ `index.css` - Design tokens, map close button
2. ✅ `Navbar.tsx` - Tagline size, remove bell
3. ✅ `AlertDirectiveBanner.tsx` - Text size, sentence case
4. ✅ `RiskHero.tsx` - Badge, toggle, spacing, probability bar
5. ✅ `ActionCards.tsx` - Card width, alignment, button
6. ✅ `riskLevelConfig.ts` - Badge border class

---

## 🚨 Common Mistakes to Avoid

1. **Don't** change `rounded-full` on actual buttons (keep pill shape for buttons)
2. **Don't** remove `justify-between` from other layouts (only the one in RiskHero)
3. **Don't** change all text-[11px] blindly (check context first)
4. **Don't** forget to add Phone import in ActionCards.tsx
5. **Don't** skip testing after each change

---

## 🔄 Rollback (if needed)

```bash
# Undo last change
git checkout HEAD -- <filename>

# Undo specific file
git checkout HEAD -- frontend/src/components/RiskHero.tsx

# Undo all changes (nuclear)
git reset --hard HEAD
```

---

## 📚 Full Documentation

- **Detailed fixes:** `USABILITY_FIXES.md`
- **Implementation plan:** `USABILITY_IMPLEMENTATION_PLAN.md`
- **Visual reference:** `USABILITY_FIXES_VISUAL_REFERENCE.md`
- **Executive summary:** `USABILITY_AUDIT_SUMMARY.md`

---

**Time estimate:** 2-3 hours for critical fixes (Issues #8, #11, #12, #5-7, #13-14)

**Good luck! 🚀**
