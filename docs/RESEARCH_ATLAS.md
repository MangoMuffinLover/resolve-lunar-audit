# Robustness Evaluation of South-Polar Observation and Lunar Visibility Estimates (RESOLVE)

Research atlas refinement

The published terrain-atlas implementation was developed from `d2eee030c645997a0a6f8b4d915a90c76c7a9717`. The owner approved publication of this candidate on 15 November 2026.

## Presentation

The interface uses white research panels, a slate-blue observation area, a consistent blue interaction color, and amber for the Sun and model-sensitivity result. A compact research identity replaces the dark navigation bar. Figure framing, explicit axis quantities, line-style legends, selected states and spacing distinguish evidence from controls.

The opening skyline now includes elevation guides at 0°, 2° and 4°. The near-field chart separately labels radial height and surface range. Its 49 m bracket is drawn between the exact retained profile samples; the short label rounds the height difference to 1.647 m, while the caption preserves 1.647339 m. The original profiles, horizon values, event times, azimuths and result values are unchanged.

## Blender terrain atlas

The Blender scene retains the identical native Product 90 mesh. It adds grazing illustrative light, a readable dGR101 marker, a 4 km ruler in the native map plane, and 250 m radial-height contours. Contours follow the triangulated mesh; they are display interpolation, not additional measurements. A positive offset equal to 40 contour intervals keeps Blender's modulo operation consistent below the reference sphere. No terrain subdivision, generated texture, displacement noise or vertical exaggeration is added.

The render uses Cycles, 64 samples and a 1600 × 1000 transparent image. Denoising is disabled because its memory allocation failed on this machine. The site pin and its shadow are cartographic decorations, not a physical object or observer-height model. Cut edges close the sample patch and are explicitly identified as display boundaries. Lighting does not represent the modeled Sun.

The interactive renderer uses the same mesh and matching contour treatment, with derivative-based antialiasing where supported. Boundary faces use a separate dark material. A projected site label follows the preset camera positions. The accompanying reading guide explains the marker, contours, cut edges and why this regional 80 m view cannot resolve the nearby 49 m feature.

## Interaction and integrity

Each explanatory step still waits for a click, tap or keyboard action and holds until the next choice. Camera moves retain their 2.6-second easing; reduced motion remains supported. The viewer remains lazy-loaded, verifies its mesh hash, and retains its still-image fallback. No new dependency is installed.

Source and terrain integrity, TypeScript, formatting, production export, browser flows, accessibility scans, text boundaries, desktop/mobile screenshots and touch interaction are checked for this pass. Final results are recorded in the user-facing delivery report. Automated checks do not establish an independent twenty-second human comprehension result or NASA endorsement.
