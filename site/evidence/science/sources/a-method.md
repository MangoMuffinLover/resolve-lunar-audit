# R-01A methodology and execution gates

## Sources and fixed assumptions

Original request is retained in `docs/request.txt`. See hypotheses.md for
the preregistered candidate, interval, decision criterion, observer height,
numerical gate and operational grid. No mission score or frontend is produced.
Data are obtained from NASA PGDA 78/90/104, publication-linked Zenodo 17084058,
PGDA-linked Zenodo 17954508, and official JPL NAIF directory listings.
Received byte ranges, complete-file SHA-256 receipts and publisher checksums
where available distinguish metadata inspection from full data acquisition.

## Coverage and coordinate evidence

Read actual TIFF CRS, affine and shape without reading DEM pixels. Establish
east-positive longitude by inverse projection of the named dGR203 point from
the original publication's shapefile using its own .prj. Use Table A1 rounded
coordinates for the primary run. Reproject from each raster's geographic CRS
with always_xy, with round-trip and wrong-sign regression tests. A failed
coverage or convention gate stops all subsequent computation.

## Geometric horizon

Read scaled float elevations and mask nodata. Bilinearly interpolate elevation
at the unsnapped observer coordinate. Local radial up, east, north are an
orthonormal right-handed triad. For each true azimuth A, the surface unit
direction at geodesic range s is `u cos(s/R) + (e sin(A)+n cos(A)) sin(s/R)`.
Convert its spherical latitude/longitude into raster coordinates with PROJ.
This is a 3D great-circle construction, not a hand-derived projection.

Sample at 2.5 m steps out to 26 km and 40 m beyond to 250 km. Use the local
5 m terrain wherever valid, continuing explicitly into Product-90 80 m terrain.
No missing terrain is treated as zero. The largest distance from the candidate
to any local-raster corner is less than 26 km. Compute point elevation as
`atan2((R+z) cos(s/R) - (R+z_observer+h), (R+z) sin(s/R))`.
The maximum over each ray is its horizon. Store range, height, geodetic point,
raster fractional centre index, exact source and maximum elevation.

**Coverage correction before any successful visibility run:** the 80 m DEM's
valid latitude-limited footprint ends just before 250 km on a few rays despite
bounding-box inclusion. The initial run stopped there. Continue those nodata
samples into Product-90 `LDEM_60S_240MPP_ADJ.TIF` in the same frame/CRS; retain
the actual source for any witness. Do not change the maximum range to avoid
the missing data.

Periodic linear interpolation supplies the horizon between azimuth rays.
Both bracketing witnesses must be retained when attributing an interpolated
event; neither is an exactly solved continuous ridge crest. Report azimuth
and radial discretization sensitivity. Finite regional extent and unmodeled
far-field uncertainty remain limitations even after cutoff convergence.

## Celestial geometry and events

Use explicitly MOON_ME_DE421 and DE421 trajectory/orientation kernels. Primary
SPICE correction is NONE. Sun/Earth vectors subtract the topocentric observer
position, converted to km only at SPICE boundary. UTC is converted by the LSK
to ET/TDB. Clearances use center-of-disc elevation minus horizon; strictly
positive is visible. Save UTC, ET, azimuth/elevation and continuous clearance.

Discovery grid initially 600 s; sign-change brackets are refined with Brent's
method to 0.05 s absolute tolerance. Simultaneous clearance is the minimum
of Sun/Earth clearance. Save all intervals and boundary censoring. A 300 s
comparison tests discovery-grid sensitivity; neither scan can prove the
absence of arbitrarily short unsampled events. No refraction, finite disc,
power-system or radio-link claims enter the primary result.

The terminal 200/250 km comparison gates distance convergence; 100/150 km
comparisons are truncation diagnostics and can legitimately differ.

## Nominal validation before pilot

Check frame rotations, plausible Sun/Earth ranges, coordinates and valid
observer terrain. Compare 600/300 s, 0.2/0.1 degree azimuth, and 100/150/200/250
km distance limits and 2.5/1.25 m near-field radial steps. Refine if the
10-minute duration gate fails. Heights 1/5 m are sensitivity runs and do not
replace the 2 m primary. Literature comparison is after calculation and must
distinguish its 60 m, 12-hour, 150 km, 2 m and DE441-related choices.

## Terrain and operational axes

Download only first five official clones after the nominal gate. Inspect
whether `_err.tif` contains additive errors or already perturbed elevations;
filenames alone do not establish semantics. Barker et al. (2021), section 4,
defines a clone as nominal plus simulated Z error. A file whose values are
Z errors must be added exactly once; a clone elevation must not be added
again. If authoritative semantics cannot be established, stop and report.

**Pilot preflight evidence:** NASA labels the `_err.tif` files as clones; the
first complete file has nearly the same -1860 to +1765 m elevation domain as
nominal, with metre/submetre differences rather than near-zero absolute
values. It is an already perturbed terrain surface, not a residual field.
`data/interim/clone_semantics.json` preserves this diagnostic. Use the supplied
clone directly. Validate each remaining file against this interpretation and
stop on mismatch; never add nominal twice or switch semantics to fit results.

For a terrain-only comparison, freeze the celestial direction series at the
nominal observer Cartesian position for that operational coordinate. Terrain
can change the inferred local terrain height in the horizon construction;
the observer remains 2 m above each representation's sampled surface. The
metre-scale topocentric-parallax change is excluded from the terrain-only
metric by this explicit convention. Reuse the identical times and root
algorithm, benchmark and geometry definition for every representation.

Evaluate the modest location/start grid separately. The season-wide longest
window and fixed-start 6.5-day feasibility are different outputs. Avoid
optimizing the anchor after seeing outcomes. Classify each operational state
over terrain agreement and operational variation, without weights.

Only material terrain disagreement enables witness clustering and auxiliary
LDEC, Z/slope uncertainty and Product-104 quality overlays. Attribution is
descriptive; no causal uncertainty-reduction or probability assertion follows.

Stop at any scientific blocker. Missing computations get explicit not-run
status, not zero durations, fabricated CSV rows, or scientific-looking figures.
