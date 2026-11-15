# R-01 hypotheses and decision rules

H0: at a fixed published dGR203 location, observer height and celestial geometry,
the evaluated terrain representations preserve the mission-relevant visibility
conclusion. H1: terrain representations can materially change that conclusion.
Both outcomes are valid; a blocked or numerically unresolved run is inconclusive.

Primary research benchmark: a 6.5 Earth-day continuous center-visible Sun AND
Earth interval, not a present-day NASA requirement or operational certification.
Material decision disagreement means opposite classifications against that fixed
duration. Report duration changes in seconds even without a classification flip.
Do not select a different threshold, coordinate, height or date to induce a flip.

The search domain is 2026-10-01T00:00:00Z through 2026-12-15T00:00:00Z,
surrounding the published November 6–27 midsummer interval. Longest windows
clipped by search endpoints are censored and must be flagged. Report a separate
November 6–28 UTC literature-domain cross-check if computation proceeds.

Primary observer is 2 m above local terrain, chosen before geometry computation
to permit a stated comparison with Wueller et al. (2026), section 2.3; sensitivity
heights 1 m and 5 m. Same height above sampled terrain for every representation.
Primary directions are geometric centers with SPICE correction NONE (the request's
"apparent geometric" wording is otherwise ambiguous). Light-time/apparent or
finite-disc experiments are separate future sensitivity analyses.

Pilot uses the first five official SL2 clones in published ordering, after nominal
validation. No outcome-based clone selection. Counts are descriptive ensemble
counts, not calibrated success probabilities. Product 104 is separately evaluated
only after its frame and vertical metadata have been reconciled.

Operational experiment: projected x/y offsets (0,0), (+/-10,0), (0,+/-10) m;
mission start shifts -12, 0, +12 hours around a predeclared anchor (2026-11-10
00:00Z). A fixed start must keep both centers visible throughout all 6.5 days.
This is distinct from optimizing the longest window over the entire season.
ROBUST: no terrain or operational classification differences. OPERATIONALLY
FRAGILE: operational differences only. KNOWLEDGE-LIMITED: terrain differences
only. MIXED: both. These labels are conditional on the small evaluated grid.

Numerical checks precede terrain comparison: 10 vs 5 minute discovery, 0.2 vs
0.1 degree azimuth, and 100/150/200/250 km maximum distance. Event roots to
0.1 s do not imply physical accuracy. If discretization changes the decision
or duration by more than 10 minutes, refine or report unresolved and stop the
pilot. The tolerance is an engineering gate, not a measured terrain error bar.

Before the first successful run: 100 and 150 km are truncation diagnostics;
terminal distance convergence is the 200 vs 250 km comparison. A short cutoff
changing a result establishes why longer-range terrain is needed, rather than
invalidating a sufficiently converged longer-range solution.
