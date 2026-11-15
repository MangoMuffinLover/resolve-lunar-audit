# R-01C finding

**A. RESOLUTION EFFECT CONFIRMED**

Authoritative native NASA grids retain several-day changes in complete simultaneous visibility at a common absolute observer, so synthetic area averaging is not the sole source of the R-01B effect. Removing censoring changes the threshold interpretation; Product 104 and the two observer conventions expose further conditionality. The supported result is a reproducible response to terrain representation, not a certified true window or a universal mission failure.

This verdict concerns the dGR101 native-product response. It does not resolve
the separate dGR203 seven-versus-8.47-day historical replication question;
the frozen R-01B verdict and its source-semantic limitations remain intact.

At the exact archived dGR101 point and fixed absolute observer elevation,
complete simultaneous visibility is 7.397830 d with
Product78 SL2 5 m and 12.923283 d with native Product90
80 m: a 5.525453-day difference.
The SYNTHETIC AREA-AVERAGED 59.88 m CONTROL gives 12.321357 d;
native NASA 60 m gives 11.461184 d. The synthetic
grid is not a native NASA product and is not used to establish a native result.

The R-01B ~5.4 d value was right-censored. Its exact saved control reproduces;
its extended primary-ray physical interval is about 7.42 d. R-01C uses a
refined ray grid and gives 7.397830 d, versus
5.379206 d when clipped to the original registered domain.
Do not claim a physical 6.5-day mission failure from the clipped value.

## Authoritative response with a fixed absolute observer

Reference height is 1535.774658203 m above the
1,737,400 m lunar reference sphere. Required height above each represented
ground is computed algebraically; all evaluated observers remain above ground.
Celestial observer position follows the same absolute radius in this comparison.

| Terrain | Ground m | Fixed height above ground m | Registered both d | Complete Sun d | Complete Earth d | Complete both d |
|---|---:|---:|---:|---:|---:|---:|
| P78 SL2 5 m | 1533.774658 | 2.000000 | 5.379206 | 19.277051 | 12.676291 | 7.397830 |
| P90 native 20 m | 1534.264282 | 1.510376 | 6.433104 | 20.284372 | 12.618590 | 8.358389 |
| P90 native 40 m | 1534.101074 | 1.673584 | 7.431639 | 21.334417 | 13.277439 | 9.676205 |
| P90 native 60 m | 1534.131226 | 1.643433 | 8.955477 | 22.867609 | 13.850744 | 11.461184 |
| P90 native 80 m | 1533.743896 | 2.030762 | 10.416595 | 24.387483 | 13.839009 | 12.923283 |
| P90 native 240 m | 1529.319580 | 6.455078 | 10.424830 | 24.502658 | 14.668155 | 13.293702 |
| P104 SDEM 5 m | 1535.100464 | 0.674194 | 2.535305 | 16.330250 | 9.446125 | 2.987840 |
| SYNTHETIC AREA-AVERAGED 59.88 m CONTROL | 1534.020996 | 1.753662 | 9.929841 | 23.873562 | 13.606962 | 12.321357 |

![Terrain representation response](figures/resolution_response_curve.png)

## Complete transition-bounded intervals

Rows describe the longest physical intervals intersecting the original
Nov 6–28 UTC domain; late solar-episode fields are also retained in the CSV.
All relevant episodes, including the earlier solar interval and both scoped
versions, are retained in all_relevant_intervals.csv.
The earliest relevant transition across models is 2026-10-19T01:33:23.995Z; the latest is
2026-12-12T01:52:04.405Z. Daily expansion discovers these boundaries; full 150/75-second
solutions verify them. No relevant complete interval is domain-censored.
The registered domain remains [2026-11-06T00:00:00Z, 2026-11-28T00:00:00Z).
The shared extended diagnostic envelope is [2026-10-19T00:00:00Z, 2026-12-13T00:00:00Z);
each side grows only until intersecting episodes have actual transitions.
These are terrain-only geometric visibility intervals, not a full mission,
power, eclipsing-source, radiance or communications assessment.

| Terrain | Complete Sun start | Complete Sun end | Complete simultaneous start | Complete simultaneous end |
|---|---|---|---|---|
| P78 SL2 5 m | 2026-11-22T14:53:56.611Z | 2026-12-11T21:32:53.779Z | 2026-11-22T14:53:56.611Z | 2026-11-30T00:26:49.154Z |
| P90 native 20 m | 2026-11-21T13:36:19.821Z | 2026-12-11T20:25:49.604Z | 2026-11-21T13:36:19.821Z | 2026-11-29T22:12:24.658Z |
| P90 native 40 m | 2026-11-20T13:38:26.401Z | 2026-12-11T21:40:00.025Z | 2026-11-20T13:38:26.401Z | 2026-11-30T05:52:10.489Z |
| P90 native 60 m | 2026-11-19T01:04:06.779Z | 2026-12-11T21:53:28.229Z | 2026-11-19T01:04:06.779Z | 2026-11-30T12:08:13.087Z |
| P90 native 80 m | 2026-11-17T14:00:06.219Z | 2026-12-11T23:18:04.782Z | 2026-11-17T14:00:06.219Z | 2026-11-30T12:09:37.905Z |
| P90 native 240 m | 2026-11-17T13:48:14.731Z | 2026-12-12T01:52:04.405Z | 2026-11-17T13:48:14.731Z | 2026-11-30T20:51:10.560Z |
| P104 SDEM 5 m | 2026-11-25T11:09:09.649Z | 2026-12-11T19:04:43.217Z | 2026-11-25T11:09:09.649Z | 2026-11-28T10:51:39.042Z |
| SYNTHETIC AREA-AVERAGED 59.88 m CONTROL | 2026-11-18T01:41:01.708Z | 2026-12-11T22:38:57.505Z | 2026-11-18T01:41:01.708Z | 2026-11-30T09:23:46.930Z |

## Practical 2 m above each represented surface

| Terrain | Absolute observer height m | Registered both d | Complete Sun d | Complete Earth d | Complete both d |
|---|---:|---:|---:|---:|---:|
| P78 SL2 5 m | 1535.774658 | 5.379206 | 19.277051 | 12.676291 | 7.397830 |
| P90 native 20 m | 1536.264282 | 7.337699 | 21.218224 | 13.301577 | 9.582193 |
| P90 native 40 m | 1536.101074 | 8.434506 | 22.364707 | 13.665152 | 10.860553 |
| P90 native 60 m | 1536.131226 | 9.370344 | 23.304672 | 14.220955 | 12.049317 |
| P90 native 80 m | 1535.743896 | 10.416398 | 24.385735 | 13.785108 | 12.897803 |
| P90 native 240 m | 1531.319580 | 8.369530 | 22.246486 | 12.692365 | 10.402839 |
| P104 SDEM 5 m | 1537.100464 | 5.638514 | 19.528334 | 12.107104 | 7.273578 |
| SYNTHETIC AREA-AVERAGED 59.88 m CONTROL | 1536.020996 | 10.417531 | 24.375939 | 14.017491 | 13.001113 |

The physical Product104 simultaneous result is 2.987840 d
at the common absolute elevation but 7.273578 d at 2 m
above its own surface. Its represented ground is
1.325806 m higher than SL2. The fixed
observer therefore lies only 0.674194 m above SDEM
ground. This is a specified observer convention, not evidence of a frame error
or proof that one terrain is right. Its own elevation-difference raster
accounts for this ground change to within
0.000015 m
at the bilinearly sampled observer; do not assume a global datum correction.

## Thresholds and convergence limits

| Terrain | Convention | Registered both >=6.5 | Complete both >=6.5 | Registered solar >=10 | Complete solar >=10 |
|---|---|---|---|---|
| P78 SL2 5 m | fixed_absolute | False | True | False | True |
| P78 SL2 5 m | each_surface_2m | False | True | False | True |
| P90 native 20 m | fixed_absolute | False | True | False | True |
| P90 native 20 m | each_surface_2m | True | True | False | True |
| P90 native 40 m | fixed_absolute | True | True | False | True |
| P90 native 40 m | each_surface_2m | True | True | False | True |
| P90 native 60 m | fixed_absolute | True | True | False | True |
| P90 native 60 m | each_surface_2m | True | True | False | True |
| P90 native 80 m | fixed_absolute | True | True | True | True |
| P90 native 80 m | each_surface_2m | True | True | True | True |
| P90 native 240 m | fixed_absolute | True | True | True | True |
| P90 native 240 m | each_surface_2m | True | True | False | True |
| P104 SDEM 5 m | fixed_absolute | False | False | False | True |
| P104 SDEM 5 m | each_surface_2m | False | True | False | True |
| SYNTHETIC AREA-AVERAGED 59.88 m CONTROL | fixed_absolute | True | True | False | True |
| SYNTHETIC AREA-AVERAGED 59.88 m CONTROL | each_surface_2m | True | True | True | True |

In native-LOLA spacing order, the first registered-domain simultaneous pass
is P90 native 40 m
for the fixed observer and
P90 native 20 m
for 2 m above each surface. All evaluated native-LOLA complete physical intervals meet 6.5 days under both conventions.
The nominal 5-to-native-20 m complete simultaneous difference remains
0.960559 d under a fixed
observer, so a fine-grid duration plateau has not been demonstrated.
The two 5 m products differ by
4.409990 d fixed, versus
0.124252 d
at 2 m above their own surfaces. That convention-dependent agreement does
not establish asymptotic convergence or terrain truth.

The historical 6.5-day simultaneous benchmark and >=10-day SOLAR favorable
screen remain distinct. Complete physical solar windows and clipped
midsummer windows answer different questions. A >=10 simultaneous flag in
the CSV is diagnostic only. Classifications refer to the stated geometry and
domain and do not certify mission feasibility.
The solar flag applies the literature's numerical threshold to geometric
center visibility; it does not replicate undocumented historical QTS
brightness/nonzero acceptance, or retroactively alter the paper's date domain.

Differences among native grids persist at a fixed observer, so the synthetic
average alone cannot explain this response. A finer nominal grid is not a
truth certificate: Product104 complicates the 5 m interpretation and observer
convention materially changes it. Native products also differ in processing
point-cloud lineage and native grid alignment. The response is not assumed monotonic or a formal
asymptotic convergence theorem. Adjacent and all-pairs differences are in
pairwise_changes.csv; remaining 5-to-20 m differences must not be hidden.

## Mechanism and data support

Own-onset bracketing witnesses, observer-relative geometry, original source
pixel positions, the same nominal-onset comparison and simultaneous-end
witnesses are recorded in horizon_witnesses.csv. Aligned profiles are in
mechanism.json and the required figures. A horizon value interpolates rays;
the witness is an interpolated/sample terrain point, not a direct return.
Near-field relief and changing observer height relative to represented ground
must be evaluated together. The end transition can differ as well as onset;
do not assign the whole complete-window change to one solar ridge.

| Terrain | Own onset azimuth deg | Lower bracketing ray deg | Witness range m | Terrain height m | Apparent elevation deg |
|---|---:|---:|---:|---:|---:|
| P78 SL2 5 m | 89.83556 | 89.80000 | 49.125 | 1537.09045 | 1.532116 |
| P90 native 20 m | 102.62243 | 102.60000 | 47.250 | 1536.77686 | 1.213239 |
| P90 native 40 m | 114.74197 | 114.70000 | 33.625 | 1536.31580 | 0.920631 |
| P90 native 60 m | 133.24893 | 133.20000 | 65.750 | 1536.38220 | 0.527858 |
| P90 native 80 m | 151.00980 | 151.00000 | 2017.188 | 1545.69409 | 0.248236 |
| P90 native 240 m | 151.10994 | 151.10000 | 2097.500 | 1546.10205 | 0.247268 |
| P104 SDEM 5 m | 55.33549 | 55.30000 | 22.250 | 1536.69202 | 2.358494 |
| SYNTHETIC AREA-AVERAGED 59.88 m CONTROL | 145.09120 | 145.05000 | 77.125 | 1536.22314 | 0.331609 |

![Critical horizon profiles](figures/critical_horizon_profiles.png)

![Aligned terrain cross-section](figures/terrain_cross_section.png)

At the nominal 5 m onset, the fixed-observer skyline in its solar sector is
1.537878 deg in 5 m and
-0.185233 deg in native 80 m. On the
aligned ray at 49.000 m distance, native 80 m minus nominal 5 m
represented height is -1.647339 m. The native 80 m representation lowers the sampled near-field rise and relocates the controlling solar-onset witness/sector. This is a representation mechanism, not evidence that a real ridge disappears.
For the late simultaneous episode, native 80 m minus nominal onset shift is
-5.037389 d and end shift is 0.488064 d; duration change equals
end shift minus start shift, up to timestamp rounding.

At the nominal lower-bracketing onset witness, nearest-source ancillary
values are: 5 m direct LOLA count 1,
elevation RMS 0.131405 m, native 20 m effective
resolution 15.0052 m, Product104 contributing
illuminated input count 11,
and best input resolution 1.1 m.
Source-grid 3x3 neighborhoods and all other representations are retained in
the support table. Counts per pixel at different spacings are not directly
comparable measurement densities or independent truth samples.

Native count/effective-resolution/elevation-error grids and the Product104
image-count/best-input-resolution/difference fields are sampled around witnesses.
Pixel spacing is not effective independent resolution. The regional Product104
README documents MASK as contributing illuminated input count and BRES in
metres; GLDSIGM versus README GLDISGM is flagged as an inferred filename mapping.
These are descriptive support, not calibrated probabilities or guaranteed
benefits of new measurements. Product104 is not ground truth.

## Numerical evidence and provenance

The software suite reports 29 tests, 0 failures,
and 0 errors. It includes analytic spherical horizons,
observer conventions, native-pixel preservation, incremental interval joining
and bounded-memory raster I/O equivalence. The main scientific comparisons
are additionally checked against real-data spatial/temporal refinements.

Final spatial refinement: maximum relevant transition/duration change
327.157 s, with relevant event-episode counts and both registered
and complete threshold states stable. Temporal 150/75-second check:
0.011926 s maximum change, full event counts stable. The native
80 m versus 5 m complete simultaneous effect is 477399.1 s, about
1459.2 times the largest accepted spatial change.
This ratio describes the tested numerical residual, not a confidence score
or bound on model error. The closest evaluated primary threshold margin is
5779.821 s. Primary/refined results remain on disk; memory-only
interruptions and unchanged-physics resumption are documented separately in
execution_audit.json.

150/200/250 km cutoff checks and the saved dense R-01B profile comparison
are in numerical_audit.json. The maximum relevant cutoff-induced transition/
duration change is 0.000000 s, despite other skyline samples changing
by up to 0.952419 deg. Important witnesses are at least
1219.977 m from the common replacement boundary and outside its
one-local-pixel seam check. Projected coordinate consistency is verified
across all inventoried grids. All physical results remain conditional on the
250 km terrain model, bilinear interpolation, geometric centers and the
specified DE421 chain. No DE441, finite-disc, phase, atmospheric, eclipse,
link-budget or stochastic-clone claim is added here.

Native source windows preserve original pixels and CRS without resampling;
their hashes and original downloaded byte-range hashes are recorded. Full
remote-file digests are unknown where only windows were acquired. Common
local replacement uses the SL2 footprint and unchanged exterior 80/240 m
terrain, with no missing elevation replaced by zero. It does not establish
uniform global-resolution performance. Product provenance and bounds are in
raster_inventory.csv and research/r01c/source_audit.md.

R-01A/B artifacts remain frozen. The separate product decision is in
STRATEGY_GATE.md; no frontend or new clone ensemble was run.
