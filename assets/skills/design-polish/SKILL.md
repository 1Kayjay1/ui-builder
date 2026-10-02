---
name: design-polish
description: Improve visual and interaction quality while preserving product behavior and established design language.
---

# Design Polish

Activate when the product works but needs refinement.

1. Read the design profile and inspect the rendered target before editing.
2. Identify the highest-impact defects in hierarchy, spacing, typography, density, grouping, responsive behavior, states, and details.
3. Preserve behavior contracts and architecture. Avoid gratuitous component rewrites.
4. Remove unjustified surface inflation, random radii, decorative gradients/glow, motion-for-motion's-sake, and other generic motifs only when they fail a functional design test.
5. Execute the polish checklist: selection, scrollbars, cursors, hover/pressed/disabled/focus-visible, keyboard traversal, autofill, placeholders, caret, truncation, wrapping, safe areas, formatting, loading/error/empty/offline states.
6. Run multi-viewport visual QA. Fix hard failures before subjective taste changes.
7. Stop when remaining issues are low impact or another pass would mostly churn.

Load: `visual-taste.md`, `polish.md`, `typography.md`, `layout.md`, `responsive.md`, `interactions.md`, `motion.md`, `accessibility.md`, `visual-qa.md`.

Completion: behavior is unchanged unless explicitly requested, measurable gates pass, and polish changes are coherent rather than ornamental.
