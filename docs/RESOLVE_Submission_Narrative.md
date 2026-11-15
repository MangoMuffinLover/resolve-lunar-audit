# Robustness Evaluation of South-Polar Observation and Lunar Visibility Estimates (RESOLVE)

**A decision-convergence auditor for lunar landing-window models**

## High-Level Summary

Robustness Evaluation of South-Polar Observation and Lunar Visibility Estimates (RESOLVE) is a decision-convergence auditing framework built for the NASA Space Apps Challenge 2026 Lunar Landing Site Navigator challenge. It connects site and date exploration with a second question:

**Does the modeled answer remain stable when defensible modeling choices change?**

At the lunar south-polar candidate site dGR101, NASA Product 78 SL2 5 m terrain produces a **7.40-day** complete simultaneous geometric Sun/Earth-center visibility window. NASA Product 90 native 80 m terrain produces **12.92 days** under the same fixed absolute observer convention. The difference, calculated from unrounded results, is **+5.53 days**.

RESOLVE lets users audit that comparison, inspect its terrain-horizon mechanism, explore observer and reporting assumptions, navigate supported sites, and trace displayed scientific results to frozen evidence.

The contribution is an inspectable audit of model sensitivity. It does not identify a physically correct terrain product or certify a mission.

## The Problem

Near the lunar south pole, the Sun and Earth can lie close to the local terrain horizon. Small changes in represented relief or observer position can therefore change modeled visibility transitions.

A precise-looking duration can depend on terrain representation, observer definition, temporal sampling, visibility semantics and reporting scope. A single number does not reveal how strongly those choices affect the result.

## Our Solution

RESOLVE combines a bounded Lunar Landing Site Navigator with a transparent decision audit. Users can:

- explore supported sites and dates and compare saved scenarios;
- inspect stored Sun and Earth positions relative to modeled terrain horizons;
- compare visibility results across evaluated NASA terrain representations;
- investigate scoped effects of modeling choices;
- trace differences to horizon profiles, terrain cross-sections and event witnesses;
- inspect observer conventions, reporting boundaries, numerical checks and source provenance.

The central interaction is **result → audit → MODEL-SENSITIVE → why → physical horizon mechanism**. Each explanatory step waits for a click, tap or keyboard action, giving reviewers time to inspect it.

RESOLVE reports **MODEL-SENSITIVE** for supported, explicitly scoped comparisons. It does not generate a confidence score from uncalibrated evidence.

## Scientific Method

The investigation began with a hypothesis that was not supported in the tested pilot.

**R-01A** tested whether local stochastic terrain uncertainty would reverse the evaluated dGR203 6.5-day simultaneous-center visibility classification. Nominal terrain and the first five official Product-78 clones retained the seasonal classification. The negative finding concerns that decision and tested configurations; the nominal seasonal duration was not especially close to the threshold.

**R-01B** changed the research question. A retained pre-outcome site-screening protocol identified strong representation sensitivity at dGR101 using a synthetic coarse-terrain control. A subsequent observer diagnostic separated the effect of changing represented ground from the effect of changing absolute observer position.

**R-01C** tested the response using authoritative native NASA terrain products, a common absolute observer, complete transition-bounded intervals and numerical refinement. The several-day response persisted.

This progression—hypothesis, retained negative result, revised question and native-product testing—forms RESOLVE's scientific foundation. The products share observations and geodetic ancestry, so their comparison is not independent validation against physical ground truth.

## NASA Data and Resources Used

- **[NASA PGDA Product 78](https://pgda.gsfc.nasa.gov/products/78):** high-resolution LOLA south-polar terrain, measurement counts, uncertainty products and official terrain clones.
- **[NASA PGDA Product 90](https://pgda.gsfc.nasa.gov/products/90):** native multi-resolution south-polar LOLA terrain products.
- **[NASA PGDA Product 104](https://pgda.gsfc.nasa.gov/products/104):** image-enhanced south-polar terrain produced using Shape-from-Shading with a LOLA geodetic prior.
- **[NASA/JPL NAIF SPICE](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/fk/satellites/moon_080317.tf) and DE421:** geometric Sun/Earth positions and the explicit MOON_ME_DE421 lunar frame.
- **[Published candidate-site research](https://doi.org/10.1029/2025JE009434) and its [archived coordinates](https://doi.org/10.5281/zenodo.17084058):** literature comparison and candidate selection.

Scientific results retain provenance to frozen artifacts, exact source records and recorded checksums. Pixel spacing is distinguished from effective terrain knowledge, and native products remain distinct from the synthetic control.

## Key Result

For dGR101, under the primary fixed-absolute-observer convention and complete simultaneous-window definition:

| Terrain representation | Complete simultaneous visibility |
| --- | ---: |
| NASA Product 78 SL2 5 m | **7.40 days** |
| NASA Product 90 native 80 m | **12.92 days** |
| Difference from unrounded results | **+5.53 days** |

This is a **modeled representation response, not an accuracy ranking**.

At the nominal 5 m solar-onset sector, the modeled horizon is approximately **+1.538°** in P78 and **−0.185°** in native P90 80 m. Along the aligned ray at 49 m, P90 represents the surface approximately **1.647339 m lower**.

The P78 own-event solar-onset witness is approximately **49.125 m** away; the P90 80 m own-event witness is approximately **2.017 km** away. These witnesses occur at **different event times and azimuths** and are not two points on one ray. The complete-window contrast also includes a changed end boundary, so it cannot be attributed entirely to one solar-onset feature.

## Impact

RESOLVE demonstrates the value of showing a model's assumptions alongside its output. For the evaluated cases, it makes a precise visibility duration more informative by exposing whether the result changes materially under defensible choices.

The interface can help scientists, planning teams, educators and the public inspect those dependencies and follow the evidence. Extending the finding to additional sites or operational decisions requires further evidence.

## Limitations

RESOLVE models geometric Sun/Earth-center visibility above terrain horizons. It does not calculate electrical power availability, communications-link performance, landing safety or mission-success probability.

No terrain product is designated ground truth, and no fine-grid convergence plateau has been established. Product lineages differ in more than pixel spacing. The local terrain replacement retains a fixed coarser far-field continuation.

The five-clone dGR203 pilot does not calibrate a probability distribution. The exact DE441 effect and the separate historical dGR203 literature discrepancy remain unresolved. The evaluated sites and configurations do not support universal claims for the lunar south pole.

## Project Links

- [Live project](https://resolve-lunar-audit.vercel.app/)
- [Guided interactive demonstration](https://resolve-lunar-audit.vercel.app/demo/)
- [Scientific evidence](https://resolve-lunar-audit.vercel.app/science/)
- [Source code](https://github.com/MangoMuffinLover/resolve-lunar-audit)
- [Technical Research Note — manuscript PDF](https://resolve-lunar-audit.vercel.app/docs/RESOLVE_Technical_Research_Note.pdf)
- [Editable LaTeX source bundle](https://resolve-lunar-audit.vercel.app/docs/RESOLVE_Technical_Research_Note_source.zip)

## Use of AI

OpenAI ChatGPT and Codex assisted with research, software development, analysis, drafting and quality assurance.

Scientific results were produced through reproducible computational workflows using cited NASA datasets and retained source artifacts. AI-generated code and interpretations were checked against frozen data, provenance records and numerical verification rather than treated as evidence by themselves.

The project distinguishes calculated evidence from narrative explanation and preserves negative findings and unresolved limitations.
