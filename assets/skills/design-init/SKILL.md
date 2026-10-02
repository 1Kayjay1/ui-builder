---
name: design-init
description: Establish or refresh project design intelligence before substantial interface work.
---

# Design Init

Activate when a project lacks a trustworthy `.design/design-profile.json`, when the design language is unclear, or before a broad redesign.

1. Inspect the repository before proposing style. Run `designpack profile --project .` when shell access exists.
2. Read `.design/design-profile.json`, `.design/tokens.json`, and `.design/references.json` if present. Treat explicit project decisions as stronger than inferred defaults.
3. Distinguish evidence from guesses. Repeated code values, computed styles, screenshots, and user direction carry provenance; one-off values do not define the brand.
4. Identify framework, styling approach, component primitives, typography, spacing/radius families, motion, assets, and existing interaction conventions.
5. Record uncertainty rather than inventing precision.
6. Establish the task mode: BUILD, EXTEND, MATCH, POLISH, AUDIT, REDESIGN, or RESEARCH.
7. Load only the knowledge modules needed for the immediate task.

Read first: `.designpack/core/knowledge/principles.md`, `tokens.md`, `visual-taste.md`.
Optional: `reference-research.md`, `accessibility.md`, `performance.md`.

Completion: the project has a usable design profile or an explicit explanation of what could not be inferred. Stop before implementation when the user requested analysis only.
