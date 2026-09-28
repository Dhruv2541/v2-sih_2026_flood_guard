# Usability Fixes - Implementation Plan

## Quick Start Guide

This document provides a step-by-step implementation order for all 19 usability fixes. See `USABILITY_FIXES.md` for detailed code changes.

---

## Phase 1: Foundation (Design System) - 2 hours

**Goal:** Establish consistent design tokens before making component changes.

### Step 1.1: Update `index.css` with design tokens
- [ ] Add type scale variables (--text-micro, --text-tiny)
- [ ] Add semantic color palette (--text-primary, --text-danger, etc.)
- [ ] Add border radius scale (--radius-sm through --radius-2xl)
- [ ] Update `.mapboxgl-popup-close-button` to 32×32px

**Files:** `frontend/src/index.css`

---

## Phase 2: Critical Affordance Issues - 1 hour

**Goal:** Fix major usability problems that cause user confusion.

### Step 2.1: Fix Status Badge False Affordance (Issue #8)
- [ ] Update `RiskHero.tsx` status badge to border-only style
- [ ] Create `badgeBorderClass` in `riskLevelConfig.ts`
- [ ] Change `rounded-full` to `rounded-lg`

**Impact:** Users stop trying to click non-interactive status labels

### Step 2.2: Fix Card Width Imbalance (Issues #11, #18)
- [ ] Change ActionCards grid to equal columns
- [ ] Add icon to SEOC card for text alignment
- [ ] Standardize padding across all cards

**Impact:** Professional, balanced layout

### Step 2.3: Fix Prediction Toggle (Issues #13, #14)
- [ ] Make toggle inline-flex (not full-width)
- [ ] Add border and hover background
- [ ] Simplify copy

**Impact:** Clear button affordance

---

## Phase 3: Consistency & Redundancy - 1.5 hours

**Goal:** Reduce visual noise and establish component patterns.

### Step 3.1: Create Button Component (Issue #4)
- [ ] Create `frontend/src/components/Button.tsx`
- [ ] Define 5 variants (primary, secondary, danger, ghost, outline)
- [ ] Define 3 sizes (sm, md, lg)
- [ ] Export component

**Impact:** Prevents future button style proliferation

### Step 3.2: Remove Redundant Alert Indicator (Issue #12)
- [ ] Remove bell button from Navbar
- [ ] Keep only nav item badge
- [ ] Test alert navigation flow

**Impact:** Simplified navigation, less cognitive load

### Step 3.3: Consolidate Type Sizes (Issues #1, #5, #6)
- [ ] Replace `text-[9px]` with `.text-micro` throughout
- [ ] Replace `text-[10px]` with `.text-micro` 
- [ ] Replace `text-[11px]` with `text-xs`
- [ ] Audit for other arbitrary font sizes

**Impact:** Consistent typography scale

---

## Phase 4: Polish & Refinement - 1.5 hours

**Goal:** Fix minor spacing, alignment, and readability issues.

### Step 4.1: Typography Improvements (Issue #7)
- [ ] Change banner heading to sentence case
- [ ] Change directive label to sentence case
- [ ] Update tracking values

**Impact:** Improved readability

### Step 4.2: Spacing & Alignment (Issues #16, #19)
- [ ] Remove `justify-between` from risk card
- [ ] Add `ml-8` to action buttons
- [ ] Change ActionCards header to `items-center`
- [ ] Add padding to safety guide button

**Impact:** Better visual grouping

### Step 4.3: Visual Enhancements (Issues #10, #15)
- [ ] Add probability bar with background track
- [ ] Wrap search + NDMA link in container
- [ ] Add ARIA attributes to probability bar

**Impact:** Better data visualization

### Step 4.4: Icon Fix (Issue #9)
- [ ] Find map popup gauge rendering
- [ ] Replace hamburger icon with Radio or Waves
- [ ] Test map interactions

**Impact:** No false menu affordance

---

## Phase 5: Testing & Verification - 1 hour

### Step 5.1: TypeScript & Build
```bash
cd frontend
npm run lint    # Should pass with 0 errors
npm run build   # Should succeed
```

### Step 5.2: Visual Regression Testing
- [ ] Check light mode at 1920×1080
- [ ] Check dark mode at 1920×1080
- [ ] Check mobile at 375×667
- [ ] Check tablet at 768×1024

### Step 5.3: Interaction Testing
- [ ] All buttons have hover states
- [ ] Status badges don't look clickable
- [ ] Map close button is easy to hit
- [ ] Prediction toggle expands/collapses
- [ ] Only one alert indicator in nav
- [ ] Cards have equal widths
- [ ] Text is readable (no text < 12px)

### Step 5.4: Accessibility Testing
- [ ] Tab through all interactive elements
- [ ] Check focus indicators visible
- [ ] Test with screen reader (NVDA/JAWS)
- [ ] Verify ARIA labels present
- [ ] Check color contrast ratios

---

## Files Changed Summary

| File | Issues Fixed | Complexity |
|------|--------------|------------|
| `index.css` | 1, 2, 3, 17 | Medium |
| `Navbar.tsx` | 5, 12 | Low |
| `AlertDirectiveBanner.tsx` | 6, 7 | Low |
| `RiskHero.tsx` | 8, 10, 13, 14, 15, 16 | High |
| `ActionCards.tsx` | 11, 18, 19 | Medium |
| `riskLevelConfig.ts` | 8 | Low |
| `Button.tsx` (NEW) | 4 | Medium |
| Map popup code | 9 | Low |

---

## Rollback Plan

If issues arise, revert changes by file/phase:

```bash
# Revert specific file
git checkout HEAD -- frontend/src/components/RiskHero.tsx

# Revert entire phase
git log --oneline  # Find commit hash
git revert <commit-hash>
```

---

## Success Metrics

**Before:**
- 11 distinct font sizes
- 24 distinct text colors
- 9 distinct border radii
- 22 distinct button styles

**After:**
- ≤ 8 font sizes (via design tokens)
- ≤ 10 text colors (semantic palette)
- 5 border radii (standardized)
- 5 button variants (Button component)

**User Impact:**
- Faster visual scanning (consistent spacing)
- Reduced confusion (clear affordances)
- Better accessibility (12px minimum text)
- Professional appearance (balanced layout)

---

## Migration Notes

### For Future Development

**When adding new components:**
1. Use `<Button variant="..." />` instead of inline styles
2. Reference type scale variables (text-micro, text-xs, etc.)
3. Use semantic colors (--text-primary, --text-danger)
4. Stick to 5 border radii values
5. Maintain 12px minimum for body text

**When creating new buttons:**
```tsx
// ❌ Don't do this:
<button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg">
  Click me
</button>

// ✅ Do this:
<Button variant="primary" size="md">
  Click me
</Button>
```

**When choosing font sizes:**
```tsx
// ❌ Don't do this:
className="text-[13px]"  // Arbitrary size

// ✅ Do this:
className="text-sm"       // 14px from scale
```

---

## FAQs

**Q: Will these changes break existing functionality?**
A: No. These are visual/CSS changes only. No logic or state management is affected.

**Q: Do I need to update tests?**
A: Only if you have visual regression tests. Unit tests should still pass.

**Q: What about backwards compatibility?**
A: The Button component is additive. Old inline buttons still work; migrate gradually.

**Q: How long will implementation take?**
A: ~6-7 hours for one developer. Can be split across multiple people by phase.

**Q: Should I implement all 19 fixes?**
A: Start with Phases 1-3 (critical issues). Phases 4-5 are polish and can be done later.

---

## Support

For questions or issues during implementation:
1. Check `USABILITY_FIXES.md` for detailed code samples
2. Review original audit findings in this document's parent
3. Test incrementally (commit after each phase)
4. Use browser DevTools to verify CSS changes

Good luck! 🚀
