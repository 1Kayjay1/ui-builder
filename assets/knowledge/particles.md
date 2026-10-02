# Particles and simulation

Use sparingly for spring-driven motion, cursor fields, ambience, flocking/data motion, inertial drag, or procedural transitions. Avoid full physics engines for simple spring behavior. Pause hidden/offscreen systems, cap DPR, reduce count before FPS collapses, sample pointer input, avoid per-particle React state, stabilize memory, and provide static/reduced-motion fallbacks. A 16.7ms 60Hz frame is the whole browser budget, not the particle budget.
