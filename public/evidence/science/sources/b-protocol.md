# R-01B protocol, before new model computations

2026-11-14. Preserve R-01A outputs and raw inputs. No UI, new clone acquisition,
or 100-clone ensemble. Objective is replication/sensitivity, not a forced seven
days or a preselected award story.

## dGR203 controlled ladder

Primary control: R-01A published rounded coordinate, nominal 5 m SL2 + fixed
80/240 m far field, 2 m height, explicit DE421 ME frame and DE421 trajectories,
geometric centers, horizon 250 km, event solving on 300 s discovery brackets.
Literature-date representation follows R-01A: [2026-11-06 00:00 UTC,
2026-11-28 00:00 UTC). Clipped durations end at the right boundary. A boundary
does not represent a measured terrain transition. Record censoring.

Before outcomes, register one-factor comparisons:

- Temporal: 12 h, 1 h, 10 min discrete left-endpoint cells, plus refined events.
  Discrete cell durations sum true cell widths clipped to the domain; they are
  not proof of uninterrupted visibility between samples. Also report the span
  between first and last true samples as an aggregation diagnostic. Do not
  attribute either convention to QuickMap without evidence.
- Endpoint sensitivity: end Nov 27 00:00, Nov 27 12:00, Nov 28 00:00 UTC. These
  bracket date-label implementations; only the inclusive-calendar-day version
  spans 22 full days. Paper Table 2 reports 22 days but exact timestamps are
  unknown. Integer floor/nearest rounding are diagnostics, never fitted truth.
- Terrain: average nominal SL2 to ceil(20000/60)=334 square cells, preserving
  exact extent; actual resolution 59.88024 m. Keep the far field unchanged.
  This is a reproducible local resolution proxy, not the undocumented QuickMap
  source DEM/pyramid. Evaluate Product104 separately at the same location.
- Horizon cutoff: 150/200/250 km at otherwise fixed nominal assumptions.
- Height: 1/2/5 m, with 2 m the replication baseline.
- Visibility: geometric center, finite spherical-disc any-visible, and
  full-visible. Account for the entire azimuth-dependent skyline, not merely
  center elevation +/- radius. Radii must come from an authoritative source;
  Earth sphere approximation and absence of illuminated-phase weighting must
  be explicit. No equivalence to QuickMap is implied.
- Coordinates: a separately labeled diagnostic at the original archived point
  instead of the published rounded point. This is a position control, not a
  terrain-model factor or a silent replacement of dGR203.
- Ephemeris: assess authoritative DE441 frame/translation compatibility and
  resource requirements. Do not load a mismatched orientation or substitute
  DE440 under a DE441 label. A documented not-run blocker is acceptable.

For each run report Sun, Earth, simultaneous longest duration and start/end,
censoring, differences from the same-domain R-01A control and seven-day
reference, and >=6.5 and >=10 day outcomes for each metric. The 10-day paper
screen is primarily solar illumination; the same threshold on simultaneous
visibility is a separately labeled diagnostic.

Numerical checks: reproduce R-01A same-domain center to 0.1 s; finite-disc
flat-horizon analytic case, zero-radius limit, skyline extrema and any >=
center >= full interval inclusion; compare finite-disc root discovery at
300/150 s and spatial skyline integration as needed. Material numerical
instability blocks scientific interpretation. No causal decomposition of
interacting factors from a one-factor ladder. Named joint replication proxies
may be added using the already registered settings and must be clearly joint.

Verdicts: A only if independently documented implementation choices and
archived results substantially reconcile the discrepancy; B if reproducible
effects explain some gap but material/semantic uncertainty remains; C if no
responsible explanation is supported. A numerical seven-day match alone is
not evidence of the paper's undocumented implementation.

## Multi-site rule, to execute only after the dGR203 audit

Use the original DOI-linked Wueller candidate archive, 2026 published
simultaneous duration and supplied point geometry. Resource/coverage condition:
inside existing SL2 and A304 valid footprints, with the existing far field.
This intentionally restricts inference to available high-resolution coverage.

Select up to two NEW sites per published-duration band [6,7] days (near 6.5)
and [9,11] days (near 10), ranked by absolute distance from the relevant
threshold then lexicographic site name. Exclude dGR203 from new selection but
retain it as a control. Empty slots stay empty; do not widen bands after
seeing outputs. Record all eligible/excluded sites and coverage. Published
durations choose sites, never uncertainty outcomes. Use archived exact point
coordinates for new sites and record that difference from the dGR203 control.

Run nominal comparisons only: existing 5 m/nested center event solution,
approximately 60 m local proxy center, and 5 m finite-disc any-visible; all at
2 m and 250 km in the same 22-day control domain. No new ensembles. Recommend
a later five-clone pilot only if a site crosses 6.5/10 across defensible
configurations, or lies within 0.5 day of a threshold, after numerical checks.
Any prioritization uses model outcomes only after the frozen site list exists.

Taxonomy is provisional: separate model-form/configuration, data-representation,
and operational axes; unsupported axes remain unassessed. No weighted score.

## Post-screen mechanistic control (registered after detecting dGR101 contrast)

The metadata-selected dGR101 has a large 5 m/coarsened difference, so verify
that result numerically before interpretation. Then perform one transparent
post-screen control: keep the observer's absolute radial elevation fixed at
the nominal value while replacing terrain with the coarsened representation.
Compute the required height above the coarse surface algebraically, not by
fitting a duration. Run only if that height is positive. This decomposes
observer-datum shift from changes in nearby terrain shape and is not a new
preselected candidate or a claim of exact QuickMap behavior. Preserve both
the original 2 m comparisons and this separately labeled diagnostic. Extract
bracketing horizon witnesses and existing LDEC/uncertainty samples for
attribution; do not infer measurement benefit or success probability.

The fixed-absolute observer diagnostic unexpectedly moves the coarse result
below 10 days. Preserve that outcome. Validate its solar/simultaneous
conclusions with 150/75-second timing and joint halving of azimuth/radial
sampling, using the same 600-second spatial tolerance; retain Earth-only
checks separately and do not interpret unaccepted Earth-only timing. This is
post-screen validation, not a new selection rule or a fitted model parameter.
