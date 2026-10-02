---
name: design-audit
description: Audit an interface with evidence across layout, accessibility, interaction truth, responsiveness, performance, and visual coherence without redesigning by default.
---

# Design Audit

Activate for reviews, QA, pre-release checks, or requests to find design problems.

1. Do not redesign by default. Gather evidence first.
2. Run `designpack audit <url>` when browser access exists. Use static analysis when it does not.
3. Separate measurable findings from visual judgment. Measurable failures outrank aesthetic preference.
4. Check overflow, clipping, offscreen controls, duplicate IDs, console/network failures, target-size candidates, focus, contrast, token drift, scrollbars, and viewport failures.
5. Trace important visible states to real logic. Flag fake progress, unreachable error states, optimistic actions without rollback, and decorative fake data.
6. Review hierarchy, density, monotony, over-decoration, whitespace, typography fit, and design-language consistency.
7. Report severity, location, evidence, and repair direction.

Load: `visual-qa.md`, `accessibility.md`, `performance.md`, `application-state.md`, `polish.md`, `security.md`.

Completion: findings are evidence-backed and prioritized; no code is changed unless the user asked for repair.
