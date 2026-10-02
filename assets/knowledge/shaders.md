# Shaders

Complexity ladder: CSS/SVG first, Canvas/DOM second, WebGL2/Three when GPU rendering materially helps, WebGPU only for a justified supported case. Good uses include large procedural backgrounds, dense particles, image distortion, displacement, dither/noise, and spatial effects. Never render critical semantic UI only into canvas. Declare renderer, quality tiers, max DPR, reduced-motion fallback, offscreen pause, interaction requirement, and fallback.
