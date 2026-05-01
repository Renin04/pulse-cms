# Pulse Renderer Styling Guide

> Living contract for renderer CSS, theme work, and visual consistency.
> This file should evolve as Phase 3 grows.

**Status:** Active (introduced before R3-5)  
**Last Updated:** 2026-04-05  
**Owner:** Renderer track (Phase 3)

---

## 1) Visual Direction (What style we use)

Pulse uses a **Neutral Editorial** style:

- clean, professional, content-first
- minimal visual noise in chrome/UI
- strong readability over decorative effects
- predictable behavior across mobile/tablet/desktop

### CKEditor-style, explained

When we say “CKEditor-inspired,” we mean:

- restrained UI chrome (controls are visible, not loud)
- typography-first content area (publishing feel, not app-dashboard feel)
- stable spacing rhythm and clear hierarchy
- subtle states (hover/focus/active) with high usability
- accessibility-first defaults, not afterthoughts

This is **inspiration, not cloning**. Pulse keeps its own token system and APIs.

---

## 2) Non-Negotiable Principles

1. **Token-first CSS**
   - No hardcoded visual values in block/layout CSS if a token should exist.
   - Use `--pulse-*` variables for color, spacing, sizing, radius, shadow, motion.

2. **Layered styling**
   - Tokens define primitives.
   - Layout defines structure.
   - Blocks define local visuals.
   - Themes override tokens, not component internals.

3. **Accessibility baseline**
   - visible focus states
   - minimum contrast-safe defaults
   - reduced-motion support for animation features

4. **Deterministic output**
   - SSR/static output must not depend on runtime browser state.
   - class/attribute naming should be stable for identical inputs.

5. **Low-coupling contract**
   - Theme files should not require editing renderer runtime logic for normal use.

---

## 3) CSS Architecture Order

Implement and import styles in this order:

1. `tokens.css` (global design tokens)
2. `layout.css` (page/container/layout primitives)
3. block-level style files (e.g. `blocks/*.css`)
4. `themes.css` (light/dark/minimal token overrides)
5. custom override layer (consumer CSS)

Rule: later layers may override earlier layers, but avoid deep selector wars.

---

## 4) Naming Convention

### Classes

- Prefix all renderer classes with `pulse-`.
- Use stable, readable modifiers.

Examples:
- `.pulse-layout`
- `.pulse-layout--single`
- `.pulse-layout--tablet`
- `.pulse-block`
- `.pulse-block--heading`

### CSS Variables

- Prefix all variables with `--pulse-`.
- Group by domain:
  - `--pulse-color-*`
  - `--pulse-space-*`
  - `--pulse-font-*`
  - `--pulse-radius-*`
  - `--pulse-shadow-*`
  - `--pulse-motion-*`
  - `--pulse-layout-*`

---

## 5) Breakpoint Contract (Phase 3 baseline)

Current baseline:

- `mobile`: `0+`
- `tablet`: `768+`
- `desktop`: `1024+`
- `wide`: `1440+`

These names are part of the renderer contract.  
If values change later, update this file and tests together.

---

## 6) Spacing & Typography Baseline

### Spacing scale (initial)

Use this scale first: `4, 8, 12, 16, 20, 24, 32, 40`.

### Typography defaults (initial)

- prioritize legibility over stylization
- heading and body rhythm must remain consistent across breakpoints
- line-height should stay comfortable for long-form reading

Font-family decisions can evolve in R3-10/R3-11, but should remain token-driven.

---

## 7) Theme Rules (important for upcoming sessions)

1. Theme files should mainly override tokens.
2. Block/layout CSS should consume tokens, not raw color literals.
3. Dark mode must avoid pure black/white extremes by default.
4. Custom CSS override path should be explicit and documented.

---

## 8) Motion Rules

- Keep default transitions subtle and meaningful.
- Avoid decorative motion on core reading flow.
- Always provide reduced-motion safe behavior when motion is introduced.

---

## 9) Do / Don’t

### Do

- add tokens before adding repeated raw values
- keep selectors shallow and intention-revealing
- write regression tests for class/attribute and breakpoint behavior
- keep output stable across SSR/static runs

### Don’t

- hardcode colors/spacing repeatedly inside block files
- rely on high-specificity selector fights
- couple theme logic to one block implementation
- introduce style behavior that cannot be tested or documented

---

## 10) Update Protocol (Living Document)

Whenever a session changes renderer styling contracts:

1. update this `STYLING_GUIDE.md`
2. update relevant tests
3. update `docs/memory/CONTEXT_SNAPSHOT.md`
4. append session note in `docs/memory/CONVERSATION_LOG.md`

For major style-direction shifts, log a decision in `backlog/DECISIONS.md`.

---

## 11) Changelog

- **2026-04-05**: Initial guide created (R3 pre-R3-5 governance checkpoint).
- **2026-04-05**: Added R3-5 layout mode contract usage (`multi-column`, `grid`, `manga`, `full-width`, `sticky`) and spacing-control variable usage in implementation (`--pulse-layout-*`).
