# R-01B final research report

**Verdict B for the literature discrepancy. CONTINUE a bounded model-fidelity
research program.** The dGR203 gap is partially reproduced numerically, not
historically attributed. A separately preregistered nominal screen identifies
dGR101 as provisionally MODEL-SENSITIVE within the registered midsummer domain.
These are separate findings. All numbers below are deterministic calculations,
not calibrated probabilities or statements of terrain truth.

## 1. Explanation status: seven versus 8.47 days

The R-01A same-domain control is reproduced within 0.1 second: Sun
8.47131030, Earth 11.15055916, simultaneous
8.47131030 days, using [November 6 00:00, November 28
00:00 UTC), 2026. This is an inferred representation of 22 full calendar
days; the paper supplies November 6–27 labels, not exact UTC endpoints.

The author archive explicitly stores consecutive 12-hour increments, divided
by two for days. Applying this rule on our registered domain gives
8.000000 days: a reduction of
0.471310 days, about
32.0%
of the 1.471310-day gap. A material **1.000000-day residual remains**.
These controlled effects are not proof of the historical implementation.

Ending instead on November 27 00:00 and using 12-hour increments gives exactly
seven days. This registered joint diagnostic has 21 elapsed days, whereas the
paper reports 22 days. It is not selected as truth or evidence that the
authors used that endpoint. The first/last-sample span gives 7.5 days on the
22-day domain; the archive supports increment counting instead of that rule.

The original combined raster confirms 14 increments at dGR203. The same-grid
Sun-only raster has zero there, while the published point gives seven solar
days; 45,472 of 122,500 combined pixels exceed the solar values. Under common
validity/domain/semantics this conflicts with simultaneous being a subset of
solar visibility. The source cause is unassigned; masks/export versions or
different semantics may matter. This blocks exact historical replication.
See [literature audit](../research/r01b/literature_audit.md) for the complete
KNOWN/INFERRED/UNKNOWN table and [original archive](https://doi.org/10.5281/zenodo.17084058).

## 2. Effect sizes by dimension

Independent absolute shifts from the dGR203 control; these maxima are not
additive, variance components, or uncertainty bounds. Changed observables and
reporting policies are distinguished from approximation error.

| Dimension | Max absolute Sun shift (days) | Earth shift | Simultaneous shift |
|---|---:|---:|---:|
| aggregation | 0.971310 | 0.650559 | 0.971310 |
| coordinate_representation | 0.002957 | 0.057016 | 0.002957 |
| domain_endpoint | 1.000000 | 1.000000 | 1.000000 |
| illumination_product | 0.000000 | 0.883457 | 0.000000 |
| local_spatial_resolution | 0.001392 | 0.159385 | 0.001392 |
| observer_height | 0.004491 | 0.394172 | 0.004491 |
| range | 0.000000 | 0.000000 | 0.000000 |
| temporal | 0.471310 | 0.150559 | 0.471310 |
| terrain_representation | 0.001391 | 0.208291 | 0.001391 |
| visibility_semantics | 0.086210 | 0.646284 | 0.086210 |

Temporal simultaneous estimates are 8.000000 days (12 h), 8.458333 (1 h),
8.465278 (10 min), and 8.471310 (events). The ~60 m terrain is an
area-weighted 334-by-334 local proxy with actual 59.88024 m cells and the same
20 km extent; 80/240 m far-field data are held fixed. In terrain comparisons,
celestial geometry is frozen at the nominal observer, while the horizon ray
origin is 2 m above each represented local ground. The post-screen control
below explicitly removes the latter absolute-elevation difference.
Product104 is an
alternative terrain representation, not independent truth. Height 1/5 m is
sensitivity only; 2 m remains the replication control. Finite discs use a
spherical skyline-distance construction and geometric spherical Sun/Earth
caps. Earth oblateness, phase and radiance weighting are not included.

Exact DE441 comparison is **not run; effect UNKNOWN**. A matched lunar
orientation/ME421 cartographic chain and the historical QTS configuration
have not been validated. DE440 is not relabeled DE441. See the
[frame audit](../research/r01b/ephemeris_audit.md).

Every ladder row includes Sun/Earth/simultaneous start, end, censoring,
differences from the same-domain R-01A control, and both duration flags in
[model_fidelity_ladder.csv](tables/model_fidelity_ladder.csv). The seven-day
Earth-only difference is empty because there is no corresponding published
Earth-only seven-day benchmark. Solar and simultaneous comparisons to seven
are explicitly labeled. [Independent effect bars](figures/model_fidelity_waterfall.png)
and [modeled intervals](figures/model_agreement_interval.png) accompany it.

## 3. Largest changes

At dGR203 the largest tested simultaneous reporting effect is the one-day
domain-end change, followed by the 0.471310-day 12-hour sampling effect.
The any/full-disc definitions change simultaneous duration by about two
hours; these are different physical acceptance criteria. Earth-only effects
are larger: spherical any/full-disc definitions shift the longest Earth
window by up to about 0.65 day, and the brightness/incidence diagnostic can
shift it by about 0.88 day. Do not infer that all effects are small from the
simultaneous column alone.

Across the nominal screen, the largest tested simultaneous fidelity contrast
is dGR101: primary 5 m 5.399979 versus
averaged ~60 m 10.417650 days.
On accepted common radial factor 0.0625, the values are
5.376877 and 10.417310 days
(difference 5.040433 days).
This is much larger than the tested dGR203 resolution effect and was not
used to select the site.

The nominal Sun-onset bracketing witness is about 49 m from the observer.
Smoothing nearby relief is a plausible computed mechanism. The coarse
observer ground is 0.246338 m
higher. Holding absolute observer radius fixed algebraically gives a coarse
height of 1.753662 m and a simultaneous
window of 9.930407 days. The 6.5-day contrast
persists, but **the 10-day solar/combined outcome is now unmet**. Relative to
the primary coarse 2 m result, this 0.246 m observer-datum control changes
the duration by about 0.487 day. Thus the primary 10-day flip depends on
observer-ground representation as well as terrain smoothing; it is not
robust to a fixed absolute observer elevation. This control is not an
exact QuickMap model or independent truth validation. Witness locations and
nearest LDEC/Z-RMS/slope-RMS values are in
[model_sensitive_witnesses.csv](tables/model_sensitive_witnesses.csv).
Those ancillary samples do not establish measurement benefit or causal data
uncertainty. The fixed-height primary diagnostic uses the primary ray grid;
halving both azimuth and radial steps gives
9.929922 simultaneous days and
preserves its solar/simultaneous threshold states. Its validation is recorded
separately in [observer_control_validation.json](../data/processed/r01b/observer_control_validation.json).
Earth-only spatial timing check status for this additional diagnostic is
NOT ACCEPTED; no Earth-only timing inference is made from this diagnostic.
Accepted common-grid refinements validate the original 2 m center-model
threshold comparison independently.

## 4. Small or undetected effects

At dGR203, reducing horizon cutoff from 250 to 200 or 150 km produces no
detected change in these longest intervals. Local coarsening, Product104,
1/2/5 m observer height and coordinate representation each shift the
simultaneous duration by less than 0.005 day (7.2 minutes). This is a
site/metric/domain-specific negative result, not a general accuracy claim.
The 10-minute discrete estimate is about 8.7 minutes below event solving.
No untested DE441 effect is classified as negligible. The dGR101 result
directly rules out generalizing the small local-resolution effect to all
candidate points.

## 5. Threshold outcomes and provisional taxonomy

The 6.5-day historical duration benchmark is separate from the paper's
at-least-10-day **solar** favorable screen with operational buffer. A 10-day
simultaneous flag is retained as an additional diagnostic, not substituted
for the paper's solar policy.

| Specified comparison | Provisional result | Scope |
|---|---|---|
| dGR203, simultaneous >=6.5 and solar >=10 | STABLE on tested R-01B fidelity grid | Simultaneous consistently meets 6.5; solar consistently misses 10 |
| dGR101, 5 m vs ~60 m center, simultaneous >=6.5 | MODEL-SENSITIVE | Unmet vs met within the registered domain |
| dGR101, same 2 m-above-each-ground center comparison, solar >=10 | MODEL-SENSITIVE on that configuration | Unmet vs met; fixing absolute observer elevation removes this 10-day flip |
| dGR204 and dGR201, nominal resolution comparison | STABLE on tested axis | Both meet simultaneous 6.5 and miss solar 10 |
| Exact historical QuickMap replication | INCONCLUSIVE | Endpoint, source/band semantics and reference chain unresolved |
| New-site data realization / operational axes | UNASSESSED | No new clone or nearby-position/start-time experiment run |

Decisive late intervals are clipped at November 28. A 5.4-day contained
interval does not mean a physical sunset after 5.4 days, or that the site
cannot support a 6.5-day mission outside this date window. The models predict
Sun onset at different times by about five days, which is distinct from
merely choosing a reporting endpoint. A mission application must first justify
this domain. Center/any/full-disc or brightness requirements are specification
choices, not automatically epistemic errors for the same observable.

The [taxonomy](../research/r01b/decision_taxonomy.md) defines STABLE,
MODEL-SENSITIVE, DATA-SENSITIVE, OPERATIONALLY FRAGILE, MIXED and INCONCLUSIVE
using observed axis-specific decision flips and explicit unassessed axes.
There is no arbitrary weighted score. The rules remain provisional.

## 6. Remaining QuickMap unknowns

Exact UTC timestamps and 12-hour phase; historical software/build; the DEM
stack, pyramid level, interpolation, output alignment versus ray-traced
resolution; selected brightness/incidence/obstruction band; point-source
sampling and disc/phase treatment; non-zero tolerance; Earth acceptance and
combination logic; source masks/export lineage; actual trajectory/orientation
kernels; and the underlying per-time sequence remain unavailable.

The current [ACT-linked QTS tutorial](https://docs.google.com/document/d/1-rHFrKKnIDlUEakjfWYyHsDHWZwVfHGKwOkRK9Yd6Y8/edit)
documents stacked terrain, point sources and distinct output masks/brightness
products. It does not establish the configuration of
[Wueller et al.](https://doi.org/10.1029/2025JE009434). An output-aligned full
60 m proxy was not run because that footprint extends beyond the local SL2
coverage and would introduce another edge/source policy. Pixel-center
position was tested independently.

## 7. Defensible RESOLVE thesis

Yes, as a falsifiable and conditional research thesis: identify which
representation, physical requirement and operational assumptions control a
specified decision, while checking numerical stability and provenance.
dGR101 supplies a model-fidelity example; dGR203 supplies negative local-data
and fidelity results. Neither demonstrates that one representation is
accurate, that stochastic terrain error controls decisions, or that collecting
more data improves a mission outcome. A rigorous next study needs independent
reference checks and registered crossed model/data/operation comparisons.

## 8. Preregistered candidate selection

After the dGR203 audit, freeze the original candidate archive inventory.
Require valid existing SL2 and A304 local coverage. Select at most two new
points in published 2026 simultaneous-duration bands [6,7] and [9,11] days,
rank by distance to 6.5 or 10, then lexical site name. Exclude dGR203 from new
selection but retain it as control. Do not refill empty slots or widen bands
after outcomes. This is a coverage-limited purposive screen, not a random
sample of the south pole.

| Selected site | Published simultaneous days | Selection boundary | East longitude | Latitude |
|---|---:|---:|---:|---:|
| dGR101 | 7 | 6.5 | -68.014609265 | -88.513411639 |
| dGR204 | 7 | 6.5 | -74.333028927 | -88.137705050 |
| dGR201 | 9 | 10 | -68.864740763 | -88.389073356 |

Only one eligible new site fills the 10-day band. Published values select
points; they are not used as calibrated truth. Original exact point geometry
is used for new sites, while the dGR203 primary control retains its published
rounded coordinate. The frozen [inventory](../data/processed/r01b/multisite_selection.json)
records coverage/exclusions and the pre-screen dGR203 audit hash.

## 9. Recommended next pilots

**dGR101 first:** five official clones, with both center-model resolutions
crossed against the same realizations, to test whether data changes or
interactions preserve the domain-specific resolution contrast. Register the
primary center-visible requirement, mission domain, threshold and numerical
grid before the pilot; do not choose any-disc because it improves a flag.
**dGR201 second:** nominal intervals lie within 0.5 day of the solar/combined
10-day boundary. dGR204 has no trigger under the fixed rule. dGR203 remains
a useful negative control with its existing five-clone R-01A result.

These are future recommendations. No new-site clone ensemble or 100-clone
download has been run. A source-configuration clarification is needed before
claiming exact literature replication. No frontend was built.

## 10. Continue or pivot

**CONTINUE**, with a bounded model/decision-audit research scope. Pivot the
claim away from pre-established stochastic terrain limitation. Prioritize
source-semantic clarification, independent geometry/terrain validation,
and the registered dGR101/dGR201 pilots. Keep the domain-specific finding
separate from the unresolved literature discrepancy and from mission-wide
feasibility. No award or success probability is inferred.

## Validation and reproducibility

The full suite reports **22 tests, 0 failures,
0 errors**. Checks cover coordinates, spherical geometry,
source integrity, interval censoring, finite-disc analytic and independent
dense-search cases, set inclusion, exact UTC half-open sampling and the
20-increment/10-day threshold regression.

Screen center results pass 300/150-second discovery checks with matching
event counts. Actual decision-changing resolution comparisons receive
azimuth and adaptive radial checks. 6 intermediate metric
checks exceeded the registered 600-second spatial tolerance; they are
preserved, not discarded or relabeled passes. Subsequent accepted terminal
checks have maximum absolute duration change 373.610 seconds and
preserve all 6.5/10-day states. Acceptance concerns the tested refinements,
not a proof against every unresolved spatial feature. Primary and refined
values are both retained in
[multisite_validation.json](../data/processed/r01b/multisite_validation.json).
The accepted common-grid center profiles also pass a 150/75-second temporal
check, and all three screened any-disc profiles pass 300/150-second checks,
with matching event counts and duration changes below one second. See
[final_temporal_validation.json](../data/processed/r01b/final_temporal_validation.json).
The [refined table](tables/multisite_refined_fidelity.csv) includes final
75-second solutions, timestamps, censoring and both threshold flags.

See [reproduction commands](../docs/R01B_README.md),
[protocol](../research/r01b/protocol.md),
[manifest](../data/manifests/r01b_manifest.json), and
[machine-readable summary](machine_readable/r01b_summary.json).
R-01A artifacts are retained. Its horizon routine gained only a configurable
ray-batch size with the previous default, allowing finer R-01B sampling to
stay within memory; no R-01A scientific outputs were recalculated or replaced.
