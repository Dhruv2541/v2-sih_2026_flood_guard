# FloodGuard Usability Fixes - 19 Issues

## Issues 1-4: Design System Consistency (Global)

### Issue 1: No consistent type scale (11 distinct font sizes)
**Root Cause:** Ad-hoc font size declarations throughout components.

**Fix:** Create a standardized type scale in `index.css`:

```css
/* Add to index.css after @import "tailwindcss"; */

/* Typography Scale - Emergency Dashboard Optimized */
:root {
  /* Limit to 8 purposeful sizes */
  --text-micro: 10px;      /* .text-[10px] → .text-micro */
  --text-tiny: 11px;       /* .text-[11px] → .text-tiny */
  --text-xs: 12px;         /* Keep Tailwind default */
  --text-sm: 14px;         /* Keep Tailwind default */
  --text-base: 16px;       /* Keep Tailwind default */
  --text-lg: 18px;         /* Keep Tailwind default */
  --text-xl: 20px;         /* Keep Tailwind default */
  --text-2xl: 24px;        /* Keep Tailwind default */
}

.text-micro { font-size: var(--text-micro); }
.text-tiny { font-size: var(--text-tiny); }
```

**Action Items:**
- Replace `.text-[9px]` → `.text-micro`
- Replace `.text-[10px]` → `.text-micro`  
- Replace `.text-[11px]` → `.text-tiny`
- Remove other arbitrary values, use closest standard size

---

### Issue 2: Too many text colours (24 distinct)
**Root Cause:** Inconsistent semantic color usage across components.

**Fix:** Define semantic color palette in `index.css`:

```css
/* Add to :root */
:root {
  /* Semantic Text Colors - Limit to 10 */
  --text-primary: #0b1c30;           /* Main headings */
  --text-secondary: #475569;         /* Body text */
  --text-muted: #64748b;             /* Labels */
  --text-link: #0284c7;              /* Interactive */
  --text-success: #059669;           /* Safe/OK */
  --text-warning: #d97706;           /* Caution */
  --text-danger: #ba1a1a;            /* Critical */
  --text-info: #0284c7;              /* Informational */
  --text-accent: #0891b2;            /* Highlights */
  --text-subtle: #94a3b8;            /* De-emphasized */
}

.dark {
  --text-primary: #e7eef8;
  --text-secondary: #cdd9e8;
  --text-muted: #9aaac0;
  --text-link: #38bdf8;
  --text-success: #4ade80;
  --text-warning: #fbbf24;
  --text-danger: #f87171;
  --text-info: #38bdf8;
  --text-accent: #7dd3f2;
  --text-subtle: #7386a0;
}
```

**Action Items:**
- Audit all `text-[color]-[shade]` usage
- Map to semantic variables
- Remove redundant color variations

---

### Issue 3: Inconsistent corner radii (9 distinct)
**Root Cause:** Mixed use of arbitrary rounded values.

**Fix:** Standardize to 5 border radii:

```css
/* Add to :root */
:root {
  /* Border Radius Scale - 5 purposeful sizes */
  --radius-sm: 0.375rem;    /* 6px - small elements */
  --radius-md: 0.5rem;      /* 8px - buttons, inputs */
  --radius-lg: 0.75rem;     /* 12px - cards */
  --radius-xl: 1rem;        /* 16px - modals, sections */
  --radius-2xl: 1.5rem;     /* 24px - hero cards */
}
```

**Action Items:**
- `.rounded` → `.rounded-md` (8px)
- `.rounded-lg` stays (12px)
- `.rounded-xl` stays (16px)
- `.rounded-2xl` stays (24px)
- Remove `.rounded-full` except for badges/avatars

---

### Issue 4: Many button styles (22 distinct)
**Root Cause:** Inline button styling without component patterns.

**Fix:** Create button component variants in new file `frontend/src/components/Button.tsx`:

```typescript
import React from 'react';
import { LucideIcon } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-sky-600 hover:bg-sky-500 text-white shadow-sm',
  secondary: 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700',
  danger: 'bg-red-600 hover:bg-red-500 text-white shadow-sm',
  ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400',
  outline: 'border-2 border-current hover:bg-slate-50 dark:hover:bg-slate-800',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs min-h-[36px]',
  md: 'px-4 py-2.5 text-sm min-h-[44px]',
  lg: 'px-5 py-3 text-base min-h-[48px]',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  children,
  className = '',
  ...props
}) => {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 
        rounded-xl font-semibold transition-all
        active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `.trim()}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
};
```

**Action Items:**
- Replace inline button styles with `<Button variant="..." />` 
- Limit to 5 variants across entire app

---

## Issue 5: Body text is very small (Brand tagline: 10px)

**Root Cause:** `Navbar.tsx` line 89 uses `text-[9px] sm:text-[10px]` for tagline.

**File:** `frontend/src/components/Navbar.tsx`

**Fix:**
```tsx
// Line 89 - Change from:
<span className="text-[9px] sm:text-[10px] tracking-[0.1em] sm:tracking-[0.14em] font-bold text-slate-500 dark:text-slate-400 uppercase -mt-0.5 font-mono truncate">
  DISASTER RISK INTELLIGENCE
</span>

// To:
<span className="text-xs tracking-wider font-bold text-slate-500 dark:text-slate-400 uppercase -mt-0.5 font-mono truncate">
  DISASTER RISK INTELLIGENCE
</span>
```

**Rationale:** Minimum 12px (text-xs) improves readability, especially on mobile. Removed responsive breakpoint since 12px works everywhere.

---

## Issue 6: Body text is very small (Alert directive: 11px)

**Root Cause:** `AlertDirectiveBanner.tsx` line 38 uses `text-[11px]`.

**File:** `frontend/src/components/AlertDirectiveBanner.tsx`

**Fix:**
```tsx
// Line 38 - Change from:
<span
  className={`text-[11px] font-extrabold uppercase tracking-widest ${
    isCriticalOrHigh ? 'text-red-700 dark:text-red-300' : 'text-amber-800 dark:text-amber-300'
  }`}
>
  ASDMA DIRECTIVE LEVEL {sector.hazardLevel === 'CRITICAL' ? '3' : '2'} ACTIVATED
</span>

// To:
<span
  className={`text-xs font-extrabold uppercase tracking-wider ${
    isCriticalOrHigh ? 'text-red-700 dark:text-red-300' : 'text-amber-800 dark:text-amber-300'
  }`}
>
  ASDMA Directive Level {sector.hazardLevel === 'CRITICAL' ? '3' : '2'} Activated
</span>
```

**Rationale:** 
- Increases from 11px to 12px (text-xs)
- Reduces tracking-widest to tracking-wider (less extreme spacing at small size)
- Changes to sentence case (see Issue #7)

---

## Issue 7: Long all-caps text (42 chars in banner heading)

**Root Cause:** `AlertDirectiveBanner.tsx` line 46-50 uses all-caps for heading.

**File:** `frontend/src/components/AlertDirectiveBanner.tsx`

**Fix:**
```tsx
// Lines 46-50 - Change from:
<h2
  className={`font-heading font-extrabold text-lg sm:text-xl tracking-tight leading-snug break-words ${
    isCriticalOrHigh ? 'text-red-900 dark:text-red-200' : 'text-amber-950 dark:text-amber-200'
  }`}
>
  {isCriticalOrHigh ? (
    <span>STAY ALERT • YOUR AREA HAS HIGH FLOOD RISK</span>
  ) : (
    <span>WATCH ADVISORY • RIVER CHANNEL MONITORING ACTIVE</span>
  )}
</h2>

// To:
<h2
  className={`font-heading font-extrabold text-lg sm:text-xl tracking-tight leading-snug break-words ${
    isCriticalOrHigh ? 'text-red-900 dark:text-red-200' : 'text-amber-950 dark:text-amber-200'
  }`}
>
  {isCriticalOrHigh ? (
    <span>Stay Alert • Your Area Has High Flood Risk</span>
  ) : (
    <span>Watch Advisory • River Channel Monitoring Active</span>
  )}
</h2>
```

**Rationale:** Sentence case dramatically improves readability for longer text. Reserve all-caps for short labels (< 20 chars).

---

## Issue 8: HIGH FLOOD RISK badge looks like emergency button

**Root Cause:** `RiskHero.tsx` lines 358-364 use red fill matching SEOC call buttons.

**File:** `frontend/src/components/RiskHero.tsx`

**Fix:**
```tsx
// Line 358-364 - Change from:
<div
  key={currentSector.id}
  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full font-heading font-extrabold text-xs sm:text-sm tracking-wider uppercase shadow-xs risk-badge-entrance ${riskConfig.badgeBg}`}
>
  <RiskIcon className="w-4 h-4 flex-shrink-0" />
  <span>{riskConfig.label}</span>
</div>

// To:
<div
  key={currentSector.id}
  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border-2 font-heading font-extrabold text-xs sm:text-sm tracking-wider uppercase risk-badge-entrance ${riskConfig.badgeBorderClass}`}
>
  <RiskIcon className="w-4 h-4 flex-shrink-0" />
  <span>{riskConfig.label}</span>
</div>
```

**Also update:** `frontend/src/lib/riskLevelConfig.ts`:
```typescript
// Add border-only styling for status badges
export function getRiskLevelConfig(hazardLevel?: string) {
  // ... existing code ...
  
  // Add new property to return object:
  badgeBorderClass: 
    tier === 'CRITICAL' 
      ? 'border-red-600 text-red-700 dark:border-red-400 dark:text-red-300 bg-red-50 dark:bg-red-950/30'
      : tier === 'HIGH'
      ? 'border-red-500 text-red-600 dark:border-red-400 dark:text-red-300 bg-red-50 dark:bg-red-950/30'
      : tier === 'MODERATE'
      ? 'border-amber-500 text-amber-700 dark:border-amber-400 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30'
      : 'border-emerald-500 text-emerald-700 dark:border-emerald-400 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30',
}
```

**Rationale:**
- Border-only badges (vs solid fill) clearly distinguish non-interactive status
- Keeps color coding (red = danger) but removes button affordance
- rounded-lg (not rounded-full) further differentiates from pill-shaped buttons

---

## Issue 9: Hamburger menu icon for gauge name

**Root Cause:** Interactive map popups use menu icon (three lines) for static label.

**File:** Need to find the map popup rendering code (likely `InteractiveMap.tsx` or `AssamOverviewMap.tsx`)

**Fix:** Replace the three-line icon with a location/station icon:

```tsx
// Find this pattern in map popup code:
<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <line x1="3" y1="12" x2="21" y2="12"/>
  <line x1="3" y1="6" x2="21" y2="6"/>
  <line x1="3" y1="18" x2="21" y2="18"/>
</svg>

// Replace with lucide-react Radio icon (station signifier):
import { Radio } from 'lucide-react';
<Radio className="w-3 h-3" />

// Or alternatively use Waves icon for river gauge:
import { Waves } from 'lucide-react';
<Waves className="w-3 h-3" />
```

**Rationale:** Radio/Waves icons clearly communicate "monitoring station" without false menu affordance.

---

## Issue 10: Orange probability bar lacks background track

**Root Cause:** `RiskHero.tsx` flood probability display (line ~375) shows value without visual scale.

**File:** `frontend/src/components/RiskHero.tsx`

**Fix:**
```tsx
// Find "FLOOD PROBABILITY" section around line 372 - add visual bar:

<div>
  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
    FLOOD PROBABILITY
  </span>
  
  {/* Add probability bar visualization */}
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
  
  <div className="flex items-baseline gap-3">
    {/* existing percentage display */}
  </div>
</div>
```

**Rationale:** Background track provides visual reference for the percentage value, making it function as a proper gauge rather than decorative text.

---

## Issue 11 & 18: Third SEOC card is narrower / text misaligned

**Root Cause:** `ActionCards.tsx` uses `grid-cols-[1fr_1fr_300px]` making third column fixed-width.

**File:** `frontend/src/components/ActionCards.tsx`

**Fix:**
```tsx
// Line 20 - Change from:
<div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_300px] gap-4">

// To:
<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
```

**Also fix text alignment in third card** by adding consistent icon space:

```tsx
// Line 29 - Change the aside element from:
<aside className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-5 flex flex-col justify-between">
  <div>
    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Emergency support</span>
    <h3 className="mt-2 font-heading text-lg font-bold text-slate-900 dark:text-slate-100">{emergency.name}</h3>
    {/* ... */}
  </div>
</aside>

// To (add icon for alignment):
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
  {/* button stays same */}
</aside>
```

**Rationale:**
- Equal-width columns create balanced layout
- Adding icon aligns heading baseline with first two cards
- Consistent padding (p-5 sm:p-6) matches other cards

---

## Issue 12: Redundant alert indicators (nav badge + bell button)

**Root Cause:** `Navbar.tsx` shows alert count on "Alerts" nav item AND separate bell button.

**File:** `frontend/src/components/Navbar.tsx`

**Fix:** Remove the notification bell button, keep only nav item badge:

```tsx
// Around line 150-180, find and REMOVE the bell button:
{/* DELETE THIS ENTIRE SECTION: */}
<button
  id="nav-notification-indicator"
  className="relative min-w-[38px] min-h-[38px] sm:min-w-[42px] sm:min-h-[42px] flex items-center justify-center p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
  onClick={() => setIsAlertDrawerOpen(!isAlertDrawerOpen)}
  aria-label="Active Flood Risk Alerts"
>
  <Bell className="w-5 h-5" />
  {criticalAlertCount > 0 && (
    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
  )}
</button>
```

**Keep only the nav item** with badge (it already exists in primaryNavItems array).

**Rationale:** Single source of alert information reduces confusion. Users know to click "Alerts" nav item.

---

## Issue 13 & 14: "Show prediction details" toggle is too wide and unclear

**Root Cause:** `RiskHero.tsx` line ~436 uses full-width button without button affordance.

**File:** `frontend/src/components/RiskHero.tsx`

**Fix:**
```tsx
// Line ~436 - Change from:
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

**Rationale:**
- `inline-flex` makes button width fit content (not full-width)
- Border + background on hover = clear button affordance
- Simplified copy (removed "technical" and "& telemetry ↓")
- Kept chevron icon for expansion indicator

---

## Issue 15: Search bar and NDMA link lack visual cohesion

**Root Cause:** `RiskHero.tsx` lines ~110-235 place disparate elements side-by-side without container.

**File:** `frontend/src/components/RiskHero.tsx`

**Fix:**
```tsx
// Line ~110 - Wrap both elements in shared container:
<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
  {/* Search Input Bar */}
  <div className="relative w-full lg:max-w-xl group">
    {/* existing search form */}
  </div>

  {/* NDMA Link */}
  <a
    href="https://sachet.ndma.gov.in/"
    target="_blank"
    rel="noopener noreferrer"
    className="group flex w-full min-w-0 items-center gap-3 rounded-xl border border-sky-200/70 bg-sky-50/60 px-3 py-2 text-sky-800 transition-colors hover:border-sky-300 hover:bg-sky-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 dark:border-sky-800/60 dark:bg-sky-950/30 dark:text-sky-200 dark:hover:border-sky-700 dark:hover:bg-sky-900/40 dark:focus-visible:ring-sky-400 dark:focus-visible:ring-offset-slate-950 lg:max-w-md"
  >
    {/* existing link content */}
  </a>
</div>
```

**Rationale:** Shared container with subtle background unifies the elements as a functional search/alert section.

---

## Issue 16: Large whitespace between risk data and action buttons

**Root Cause:** `RiskHero.tsx` line ~368 uses `justify-between` in flex container.

**File:** `frontend/src/components/RiskHero.tsx`

**Fix:**
```tsx
// Line ~368 - Change from:
<div className="py-6 flex flex-col md:flex-row md:items-end justify-between gap-6">

// To:
<div className="py-6 flex flex-col md:flex-row md:items-end gap-6">
```

**And adjust button container:**
```tsx
// Line ~398 - Change from:
<div className="flex items-center gap-3 flex-wrap">

// To:
<div className="flex items-center gap-3 flex-wrap md:ml-8">
```

**Rationale:** 
- Removing `justify-between` eliminates forced spacing
- Adding `md:ml-8` (2rem left margin on desktop) provides comfortable separation without excessive gap
- Buttons stay near the data they relate to

---

## Issue 17: Map close button is too small (22px vs 32px controls)

**Root Cause:** Mapbox default close button styling.

**File:** Need to check `InteractiveMap.tsx`, `AssamOverviewMap.tsx`, or `index.css` for `.mapboxgl-popup-close-button`

**Fix in `index.css`:**
```css
/* Find and update .mapboxgl-popup-close-button rules */
.fg-map-popup .mapboxgl-popup-close-button {
  color: var(--fg-muted);
  font-size: 20px;
  top: 8px;
  right: 8px;
  width: 32px;        /* Increase from 22px */
  height: 32px;       /* Increase from 22px */
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  padding: 0;
  transition: all 0.15s ease;
  line-height: 1;
}
```

**Rationale:** 32×32px matches zoom control size, improves touch target per WCAG AAA (minimum 44×44px, this meets AA at 32×32px).

---

## Issue 19: "Open full safety guide" button vertically misaligned

**Root Cause:** `ActionCards.tsx` line 12 button baseline doesn't match heading center.

**File:** `frontend/src/components/ActionCards.tsx`

**Fix:**
```tsx
// Line 7-13 - Change from:
<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
  <div>
    <span className="text-[11px] font-semibold tracking-[0.13em] text-sky-600 dark:text-sky-400 uppercase">Safety actions</span>
    <h2 id="actions-heading" className="mt-1 font-heading font-bold text-xl sm:text-2xl text-[#0b1c30] dark:text-slate-100 tracking-tight">What to do now</h2>
  </div>
  <button onClick={onOpenGuideModal} className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500">
    Open full safety guide <ArrowRight className="w-[18px] h-[18px]" />
  </button>
</div>

// To:
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
  <div>
    <span className="text-xs font-semibold tracking-wider text-sky-600 dark:text-sky-400 uppercase">Safety actions</span>
    <h2 id="actions-heading" className="mt-1 font-heading font-bold text-xl sm:text-2xl text-[#0b1c30] dark:text-slate-100 tracking-tight">What to do now</h2>
  </div>
  <button 
    onClick={onOpenGuideModal} 
    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/50 rounded-lg transition-colors"
  >
    <span>Open full safety guide</span>
    <ArrowRight className="w-4 h-4" />
  </button>
</div>
```

**Rationale:**
- Changed `sm:items-end` to `sm:items-center` for vertical centering
- Added padding and hover state to button for better affordance
- Removed `min-h-11` which was causing misalignment
- Fixed label text size (text-[11px] → text-xs)

---

## Summary of Changes by File

### `frontend/src/index.css`
- Add type scale variables
- Add semantic color palette
- Update `.mapboxgl-popup-close-button` to 32×32px

### `frontend/src/components/Navbar.tsx`
- Issue #5: Brand tagline to text-xs (12px)
- Issue #12: Remove bell notification button

### `frontend/src/components/AlertDirectiveBanner.tsx`
- Issue #6: Directive label to text-xs (12px)
- Issue #7: Heading to sentence case

### `frontend/src/components/RiskHero.tsx`
- Issue #8: Status badge to border-only style
- Issue #10: Add probability bar with background track
- Issue #13/14: Prediction toggle to inline button with affordance
- Issue #15: Wrap search + NDMA link in shared container
- Issue #16: Remove justify-between, add ml-8 to buttons

### `frontend/src/components/ActionCards.tsx`
- Issue #11/18: SEOC card to equal width (grid-cols-3), add icon for alignment
- Issue #19: Button vertical alignment (items-center, add padding)

### `frontend/src/lib/riskLevelConfig.ts`
- Issue #8: Add `badgeBorderClass` property to config

### `frontend/src/components/Button.tsx` (NEW FILE)
- Issue #4: Create reusable Button component (5 variants)

### Map popup rendering (find in InteractiveMap or AssamOverviewMap)
- Issue #9: Replace hamburger icon with Radio or Waves icon

---

## Implementation Priority

**High Priority (Major severity):**
1. Issue #8 - Status badge affordance
2. Issue #11/18 - Card width alignment
3. Issue #4 - Button component (prevents future inconsistency)

**Medium Priority (Consistency):**
4. Issues #1-3 - Design system (type scale, colors, radii)
5. Issue #12 - Remove redundant alert indicator
6. Issues #13-14 - Prediction toggle affordance

**Low Priority (Minor/Suggestions):**
7. Issues #5-7 - Text size and case
8. Issues #15-17, #19 - Spacing and alignment refinements
9. Issue #9 - Icon replacement
10. Issue #10 - Probability bar enhancement

---

## Testing Checklist

After implementing fixes:
- [ ] Verify no TypeScript errors: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] All buttons have hover states
- [ ] Text is readable at 12px minimum
- [ ] Cards have equal widths
- [ ] Status badges don't look clickable
- [ ] Alert notifications unified (no bell button)
- [ ] Map close button is 32×32px
- [ ] Prediction toggle looks like button
- [ ] Vertical alignment correct in all sections
- [ ] Light and dark modes both work
- [ ] Mobile responsive (320px+)
