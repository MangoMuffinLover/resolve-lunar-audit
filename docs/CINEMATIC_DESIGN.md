# Deliberate motion and Blender terrain — local candidate

The interaction is RESULT → AUDIT → MODEL-SENSITIVE → WHY → PHYSICAL HORIZON MECHANISM. Each scientific step waits for a click, tap or keyboard action, then holds indefinitely. There is no timed model ladder, automatic Sun isolation, scroll-triggered story reveal or automatic 3D orbit. The local touch/3D branch builds on reviewed local cinematic commit `658acaf5d18cf6fc9b3ff1207561754cfc891562`; the public baseline remains `87cc57f47dc858bbf5dc791c42c9870ab3d411c5`.

## Interaction and motion

Audit reveals the native 80 m contrast: 7.40 → 12.92 days, +5.53 days and MODEL-SENSITIVE. The six-stop model control selects one exact stored product per action. Sun isolation remains until the reader chooses a different state. Why opens the physical explanation. Its three buttons separately expose the reference profile, the 80 m profile and the separate own-event witnesses. They can be revisited in any order.

Terrain crossfades and the result underline use 2.2-second eased transitions. Profile/ray drawing and camera moves use 2.6 seconds. Numbers remain fully readable and never count through invented scientific values. The camera eases in and out, then stops rendering; resize and later user choices redraw it. Reduced motion makes transitions immediate and preserves every control and source value. Pointer feedback remains short; no long delay blocks the next action.

Sun and Earth positions are copied from the same stored UTC snapshot. The 49.125 m and 2.017 km terrain witnesses retain their different azimuths and times; they are not two points on one simultaneous ray. Source records, all 32 model/observer/domain cases, the 114 scoped factor comparisons and all six routes remain available.

## Blender asset and scientific provenance

Blender 5.2.1 LTS built the terrain mesh and rendered its still fallback. The source is the already-retained NASA Product 90 native `LDEM_80S_80MPP_ADJ.TIF` window, SHA-256 `30af111aaaf97552df2445d40601d373665fd344a4d262689ac7d8fedd21e441`. A 161 × 161 set of native 80 m sample centres spans 12.8 km. No resampling, displacement noise, generated imagery, invented craters, subdivision or vertical exaggeration is applied. Smooth vertex shading changes lighting, not mesh positions. Display-only perimeter skirts close the edge of the sample patch.

The surface uses the native polar-stereographic map plane and relative radial heights. It is a terrain display, not a new spherical-geometry or horizon calculation. The muted site pin denotes plan position; its drawn height is not the scientific observer elevation. Camera and lighting are illustrative and do not depict the modeled Sun. The horizon evidence supplies the audit; this view supplies spatial context.

`public/visuals/terrain/provenance.json` records the source hash, native-pixel window, coordinate reference system, scale, Blender version, binary layout and asset hashes. `scripts/prepare-terrain-study.py` reads the original raster with the research environment's existing rasterio/NumPy/pyproj. `scripts/blender-terrain-study.py` runs in Blender background mode. `scripts/finalize-terrain-study.py` compresses the poster with Pillow and freezes its file references. These are offline asset tools, not website runtime requirements.

The interactive viewer lazily imports its own small WebGL renderer and verifies the mesh hash only after activation. No new npm dependency or 3D engine is installed. Three camera buttons support touch and keyboard input. The activation control stays present so keyboard focus is retained, and can return to the still render. Missing/invalid assets or WebGL context loss preserve the Blender fallback and expose Retry. Retry creates a fresh canvas. Active and fallback images have separate accessibility visibility.

## Layout and verification

The design uses explicit viewport widths, wrapping controls, responsive number sizes and minimum 48 px interactive targets. Text-range checks cover opening, audit, Sun isolation and the expanded physical/3D view at 320, 390, 768, 1024 and 1440 px. A narrow-width aspect-ratio overflow was corrected by setting the 3D viewport's width explicitly; the page does not hide that defect with global overflow clipping.

Cross-browser scenarios cover one-action/one-state holds, geometry invariance, touch-sized controls, reduced motion, source dialogs, retries, 3D views and fallback. The complete retained Edge product suite checks the wider source/evidence flow. Four display-integrity tests check frozen sky copies, the B-01 contract, scoped factor cards and Blender asset hashes/grid structure. Original product/evidence files and full research hashes are checked independently. The delivery report contains final counts, screenshots and measured local performance.

## Publication and limits

This candidate remains local at the owner's request. No branch push, external CI, Vercel deployment or cross-chat handoff is authorized for this candidate. No independent human twenty-second comprehension result, dedicated screen-reader review or actual Safari/iOS device result is claimed. WebKit on Windows is a distinct test environment. Local performance observations are not field Core Web Vitals. The project does not establish terrain truth, mission safety, power availability, link performance, probability or NASA endorsement.
