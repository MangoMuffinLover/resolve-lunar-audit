# R-01C final report

1. **Verdict:** A — RESOLUTION EFFECT CONFIRMED. Authoritative native NASA grids retain several-day changes in complete simultaneous visibility at a common absolute observer, so synthetic area averaging is not the sole source of the R-01B effect. Removing censoring changes the threshold interpretation; Product 104 and the two observer conventions expose further conditionality. The supported result is a reproducible response to terrain representation, not a certified true window or a universal mission failure.
2. **Uncensored physical windows:** nominal 5 m Sun 19.277051 d,
Earth 12.676291 d, simultaneous 7.397830 d.
Complete starts/ends for every model are in R01C_FINDING.md and resolution_response.csv.
3. **Authoritative terrains:** Product78 SL2 5 m; Product90 native 20/40/60/80/240 m;
Product104 A304 SDEM 5 m. The synthetic 59.88 m control is separate. Raster names,
bounds, CRS, radius, hashes, inclusion and support grids are in raster_inventory.csv.
4. **Response table:** resolution_response.csv and figures/resolution_response_curve.png;
all-pairs differences are in pairwise_changes.csv. No monotonic convergence is assumed.
5. **Fixed absolute results:** reference height 1535.774658203 m
above the reference sphere. Native 5/20/40/60/80/240 m complete simultaneous days:
7.397830, 8.358389, 9.676205, 11.461184, 12.923283, 13.293702.
6. **2 m above each surface:** same terrains give complete simultaneous days:
7.397830, 9.582193, 10.860553, 12.049317, 12.897803, 10.402839.
7. **Product104:** complete simultaneous 2.987840 d fixed,
7.273578 d practical 2 m. Its higher local ground and terrain
shape must both be retained; agreement under one convention is not truth validation.
8. **Witness evolution:** horizon_witnesses.csv, witness_data_support.csv,
figures/critical_horizon_profiles.png and figures/terrain_cross_section.png.
9. **Numerics:** 29 software tests pass with 0 failures;
final spatial max 327.157 s; temporal max 0.011926 s;
stable relevant spatial episode counts and temporal full event counts. See numerical_audit.json
and the retained stage summaries for all comparisons, not only successful checks.
10. **Classifications:** the full scoped observer-specific table is in R01C_FINDING.md.
Do not conflate simultaneous 6.5 d and solar 10 d, or clipped and complete windows.
11. **Limits:** different product lineages, interpolated terrain, common local footprint,
fixed exterior terrain, geometric centers, unvalidated truth and no probabilistic ensemble.
Native pixel spacing differs from effective terrain knowledge. Partial source COG hashes
are scoped to acquired windows/ranges, not invented whole-source digests.
12. **Effect versus numeric residual:** native 80-minus-5 m complete simultaneous
contrast 477399.1 s versus 327.157 s largest accepted spatial change.
This is a descriptive deterministic comparison, not a confidence score.
13. **Product thesis:** conditional model-convergence auditing survives; a claim of
known true landing duration or achieved resolution convergence does not follow.
14. **Recommendation:** BUILD. See STRATEGY_GATE.md. Stop at this gate.

The detailed scientific conclusion is [R01C_FINDING.md](R01C_FINDING.md).
Reproduction commands are in ../../research/r01c/README.md and provenance is in
../../data/processed/r01c/r01c_manifest.json. No earlier artifacts were overwritten.
