# R-01C protocol, before native-product visibility outcomes

2026-11-14. Final pre-frontend gate. No frontend, new clone ensemble, new site,
adaptive site search, AI, scores or communications subsystem. Preserve all
R-01A/B artifacts and verify their hashes before/after this experiment.

## Frozen question and controls

dGR101 east longitude -68.01460926527753 deg, latitude -88.5134116385092 deg.
Primary observable: geometric Sun/Earth centers, simultaneous intersection.
Frame/ephemeris remain explicit MOON_ME_DE421 / DE421 / SPICE NONE, radius
1,737,400 m. Thresholds: simultaneous >=6.5 days; solar >=10 days. Report
other metric flags as diagnostics only. No fitted thresholds or confidence
score. Reproduce R-01B cached profiles/event solutions first, writing only
new files. Keep the registered [Nov 6 00:00, Nov 28 00:00 UTC) results.

Implementation note before native visibility outcomes: daily extensions can
evaluate only the added day and join contiguous visible intervals, rather
than recomputing every previous sample. Test this against a direct full-domain
solve. Refinements reuse the union of baseline diagnostic envelopes and
extend further only if needed; compare the same intersecting physical
episodes, and compare temporal event counts on identical full domains.

## Native-product comparison

Inspect Product90 authoritative 20/40/60/80 m DEMs; include existing 240 m
as an explicitly coarser diagnostic. Product78 SL2 5 m is the reference;
Product104 A304 SDEM is a separate cross-check, never truth. The R-01B
average is permanently labeled SYNTHETIC AREA-AVERAGED 59.88 m CONTROL.
No new 10/30/120 m products are needed to answer the prescribed ladder.

Primary controlled replacement is the same SL2 local footprint in every
case, x [-58500,-38500], y [13000,33000] m. Crop native COG pixels with
padding for bilinear interpolation, without resampling or using overviews;
apply the common footprint mask during ray tracing. Outside that footprint,
use the unchanged existing 80 m then 240 m nested far field. This isolates
local representation and documents coverage policy. Also assess whether
the controlling witness is inside that footprint and whether far-field
cutoff can affect conclusions. Do not claim pole-wide uniform resolution.
If an apparent contrast is controlled at the replacement seam, it requires
a separately labeled footprint check before interpretation.

Use HTTP range retrieval of original COG blocks when practical. Preserve
range bytes, source metadata and SHA256 of every downloaded block and native
window raster. Full remote-file SHA256 remains UNKNOWN unless the full file
is downloaded or an authoritative digest is supplied; window hashes must
never be passed off as whole-source hashes. Source grid, scale/offset,
nodata, radius, bounds, native pixel spacing, documentation and inclusion
must be recorded. Pixel spacing is not effective independent resolution.
Retrieve count/effective-resolution/error native windows separately.

Primary observer is the absolute radius defined by nominal 5 m ground +2 m.
For each representation compute required above-ground height algebraically.
If that observer is below represented ground, flag the physical inconsistency;
do not silently move it or treat a negative height as a valid above-ground
landing configuration. The practical alternative is exactly 2 m above EACH
ground; recompute celestial observer position consistently for that alternative.
Report the two conventions separately.

## Uncensored diagnostics

For each profile start with the registered domain expanded by one day at
each end. Extend a clipped side in one-day increments until all physical
intervals intersecting the original domain are bounded by transitions.
The shared diagnostic envelope is the union required by all models; include
small discovery margins and verify no relevant interval remains clipped.
Track the late solar episode associated with R-01B divergence separately
from the longest intersecting episode. Do not select a later lunar cycle
merely because it gives a larger duration. Retain registered-domain and
uncensored-intersecting-domain metrics, timestamps and censoring separately.

## Numerical method and acceptance

Implement new R-01C code without altering frozen R-01A/B code. Use bilinear
native DEM interpolation, exact spherical curvature, and consistent grids.
Initial R-01C ray grid: 0.1 deg azimuth; radial sampling 0.25 m from 1.25 m
to 1 km, 0.625 m to 5 km, 2.5 m to 26 km, 20 m to 250 km. Compute both
observer conventions from the same terrain samples. Refine radial distances
by two and azimuth by two on every important comparison; retain primary and
refined results, not just a success flag. If needed refine further. Aim for
<=60 s changes in interval transitions/durations; 600 s is a hard ceiling,
with threshold states and relevant event counts invariant. Physical effects
must be substantially larger than accepted numerical residuals; a threshold
within remaining residual is inconclusive. Event discovery 150/75 s with
matching event counts and <=1 s root/duration differences; refine further
if necessary. Compare 150/200/250 km cutoffs, and extend only if cutoff
dominates a controlling witness. Report numerical errors as deterministic
checks, not probabilistic uncertainty.

Compare R-01C nominal 5 m against the saved dense R-01B radial profiles as
an additional engine check. Finite-disc runs are not needed for the primary
question; retain R-01B any-disc only as a labeled historical diagnostic.

## Mechanism, response and verdict

Record each model's own onset bracketing witnesses and evaluate all models
at the same nominal critical azimuth and time. Plot aligned surface-height
and apparent-elevation cross-sections without resampling source grids into
an allegedly native new product. Identify smoothing/shifting/relocation only
where witnesses/profiles support it. Sample original LDEC/error and Product104
mask/best-image-resolution/difference as descriptive evidence, never truth
probability or guaranteed measurement benefit.

W(r) is a descriptive terrain-representation response, not assumed monotonic
or a formal mathematical convergence proof across different processing
lineages. Report successive and all-pairs changes, distance from 5 m, native
and synthetic controls separately. Select exactly one scientific verdict:
A confirmed / B weakened / C synthetic-coarsening artifact / D inconclusive.
Write a separate strategy gate answering BUILD / CHECK / PIVOT. Stop at R-01C;
even a BUILD recommendation does not authorize implementation.
