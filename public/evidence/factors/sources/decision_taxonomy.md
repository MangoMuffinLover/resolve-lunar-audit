# Provisional decision-stability taxonomy

Classify a **specified decision**, not a landing site in isolation. Record:
location, UTC domain/start, duration requirement, visibility observable,
observer configuration, model/data/operational grids, numerical tolerances,
censoring and unassessed axes. No weighted score or clone probability.

For a fixed observable/threshold, let C(m,d,o) be the binary result using
model configuration m, data representation d, and operational state o.
For each axis, a flip is an observed change in C while the other axes are
held fixed. Report the actual contrasting configurations and continuous
margin/window change. An untested axis is UNKNOWN, not “no sensitivity.”

| Class | Observable criterion |
|---|---|
| STABLE | Numerically accepted comparisons show no flip across the evaluated axes. Always qualify by the tested grid; unassessed axes remain unknown. Agreement can mean consistently unmet as well as consistently met. |
| MODEL-SENSITIVE | At fixed data and operation, a justified model/fidelity approximation changes the specified decision. Example: 5 m vs a derived 60 m representation of the same parent data, with all other settings fixed. |
| DATA-SENSITIVE | At fixed model and operation, alternative data/terrain realizations change the decision. Examples: official clones or an image-enhanced representation. Different parent products are not independent truth or calibrated probabilities. |
| OPERATIONALLY FRAGILE | At fixed model/data, the tested nearby location or start-time changes the decision. A separately labeled height/capability change can be recorded as configuration sensitivity rather than terrain epistemic error. |
| MIXED | Two or more evaluated model/data/operational axes cause flips, or a registered crossed experiment demonstrates an interaction that cannot be assigned to just one axis. Preserve the axes and examples rather than collapsing them into a score. |
| INCONCLUSIVE | Missing/corrupt/incomparable inputs, unresolved required conventions, numerical nonconvergence or unassigned source semantics prevent a valid decision comparison for the stated question. This does not make independently validated local computations invalid. |

## Keep specification and reporting policy separate

Center-visible, any-disc-visible and full-disc-visible are different physical
observables; incidence-weighted brightness differs from an unobstructed
line of sight. A flip obtained only by replacing one requirement with another
is **specification-sensitive**, recorded as a separate flag. It is not proof
of epistemic model error for an identical requirement.

Likewise, moving a finite analysis-domain endpoint can truncate the reported
longest interval without changing any physical visibility transition. Mark
**domain/censoring-sensitive** as a reporting-policy subtype, not a newly
discovered terrain-driven mission failure. The date window must be justified
for the mission question before selecting an application label.

For this audit, 6.5 days is the historical duration comparison. The paper's
>=10-day favorable screen is solar illumination with operational buffer;
>=10 simultaneous days is an explicitly separate diagnostic. Never transfer
classification flags between these metrics without stating the policy.

## Current evidence limits

R-01A: dGR203 was stable on its tested local-data and operational grids;
that does not assess every configuration or far-field uncertainty. R-01B's
dGR203 fidelity comparisons preserve the 6.5-day simultaneous and 10-day
solar classifications, while domain/sampling choices materially affect
reported durations. Exact historical replication is inconclusive because
source-product semantics and endpoints are unresolved. The following nominal
multi-site screen supplies model comparisons only; it cannot establish
DATA-SENSITIVE or OPERATIONALLY FRAGILE without those axes being run.

These rules and any site labels remain provisional. A larger, registered
crossed dataset and independent validation are required before treating the
taxonomy as a validated classifier for a future application.

The nominal multi-site screen identified a possible MODEL-SENSITIVE case at
dGR101. Its longest intervals are right-censored at November 28: a 5.4-day
clipped interval is not proof the actual Sun sets after 5.4 days. Threshold
labels refer to opportunities contained in the stated midsummer domain.
The modeled Sun-onset times themselves differ by about five days, which is
distinct from a mere choice of endpoint. Retain this qualification with any
future site label. Adaptive radial and azimuth checks preserve both primary
2 m-above-each-ground threshold states. The post-screen fixed-absolute-observer
control preserves the 6.5-day contrast but moves the coarse solar/combined
result below 10 days: the primary 10-day flip is configuration dependent.
This is not evidence of operational fragility without a specified operational
observer/start/position grid.
