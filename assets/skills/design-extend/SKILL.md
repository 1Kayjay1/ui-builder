---
name: design-extend
description: Add product capability while preserving established design language, architecture, and interaction contracts.
---

# Design Extend

Activate when adding a feature to an existing product.

1. Read `.design/design-profile.json` and inspect neighboring components before coding.
2. Preserve established navigation, density, tokens, primitives, and state patterns unless the new requirement proves they are insufficient.
3. Map the new feature into existing regions and interaction conventions before inventing new surfaces.
4. Prefer semantic/native behavior, then vetted headless primitives, then a registry component, then custom implementation.
5. Treat visible state as a contract with real application logic. Include failure and rollback paths where relevant.
6. Test constrained widths as transformations, not merely stacked desktop UI.
7. Run deterministic QA and visual critique.

Load: `principles.md`, `tokens.md`, `layout.md`, `responsive.md`, `components.md`, `interactions.md`, `application-state.md`, `polish.md`, `visual-qa.md`.

Completion: the feature feels native to the existing product, unrelated architecture remains intact, and QA passes.
