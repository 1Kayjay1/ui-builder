---
name: design-build
description: Build a new interface or surface with a coherent design system, real application state, accessibility, and visual QA.
---

# Design Build

Activate for new pages, flows, products, or substantial net-new UI.

1. Read the project profile; if absent, use `design-init`.
2. Define the user job, content priority, frequent actions, major regions, density target, and responsive transformations before choosing components.
3. Reuse established tokens and behavior primitives. If no language exists, establish a small coherent token set rather than random values.
4. Research references only when they resolve an actual design question. Extract OBSERVATION → PRINCIPLE → TRANSFERABILITY → DO NOT COPY.
5. Implement semantic structure and real state first. No fake progress, fake metrics, fake charts, or decorative state labels detached from logic.
6. Add interaction feedback, keyboard behavior, focus, loading/error/empty/offline states, then motion.
7. Use the graphics complexity ladder: CSS/SVG → DOM/Canvas → WebGL/Three → WebGPU special case.
8. Run the app. Use `designpack audit <url>` when browser access exists. Repair measurable failures before subjective polish.
9. Inspect all representative viewports and iterate until stop criteria pass.

Load: `principles.md`, `visual-taste.md`, `typography.md`, `color.md`, `tokens.md`, `layout.md`, `responsive.md`, `components.md`, `interactions.md`, `application-state.md`, `accessibility.md`, `performance.md`, `visual-qa.md`.
Load advanced graphics modules only if justified.

Completion: functional states are truthful, target viewports pass, no severity-1 defects remain, and the result is coherent with the profile.
