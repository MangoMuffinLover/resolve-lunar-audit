# RESOLVE — B-07 redesign delivery

The visual redesign is implemented across all six existing routes. The first visit opens the scientific audit directly: **result → audit → MODEL-SENSITIVE → why → physical horizon mechanism**. Feature expansion remains frozen. This delivery implements the B-06R hierarchy; it does not establish human comprehension, physical prediction accuracy or a competition outcome.

## What changed

- **Opening:** a purpose-led headline, one prominent 7.40-day reference result and a visible “Audit this result” action. The result retains its NASA product, observer convention, complete-episode scope and geometric-visibility limitation.
- **Audit:** one matched 7.40 → 12.92-day contrast, its source-derived +5.53-day effect, and an immediate “See why it changes” action. Effects use the unrounded frozen values; subtracting the displayed rounded durations can differ. Reference and synthetic selections receive their own truthful labels.
- **Physical proof:** the paired skyline now appears directly in the main journey, at the same stored UTC snapshot in both records. Both body markers fit the main diagram on phones. Own-event terrain witnesses remain separately labeled because their times and azimuths differ. Detailed horizon, terrain, support and numerical records remain available below.
- **Scientific depth:** observer definitions, reporting boundaries and terrain selections use expandable sections. The P104 observer example, complete-versus-clipped distinction and limited dGR203 negative evidence stay visible in the proof sequence.
- **Navigation:** Audit / Navigator / Evidence form the shared primary navigation. Factors and Explain remain contextual advanced workspaces; every existing route and source download is retained. The guided demo is a supporting route.
- **Presentation:** locally served Manrope typography, a light canvas, dark reference panels, restrained orange, consistent spacing, cards, controls, source dialogs and keyboard focus states. No decorative image substitutes for measured evidence.
- **Evidence page:** seven expandable chapters with working direct fragments, an immediate review-packet download and a concise overview of the positive finding, limited negative finding and absence of terrain-truth validation.

The redesign also exposed a navigation race when factor/observable selections were changed rapidly. Factor and physical-workspace URL updates now compose from the latest browser query, preserving the current context. This follows Next.js's supported native-history integration: [official documentation](https://nextjs.org/docs/app/getting-started/linking-and-navigating#native-history-api).

## Science and data positioning

The scientific method and NASA data provenance remain the substance of the product. Negative findings are retained alongside the representation-sensitive result. Different NASA representations are compared under stated definitions; the interface does not identify one as physical truth, interpret the spread as a probability, or certify a mission. Synthetic averaging remains distinct from native products. A reporting cutoff is not described as a physical transition. Geometric visibility does not establish power availability or a working communications link.

All **587 frozen research files** pass the existing integrity check. The original B-01 contract remains byte-identical, with SHA-256:

`a8a06dd4a5447acd1ee68a56779376d0b01ad081fde95c1d4b762434a521c48d`

No new scientific experiment, backend, 3D engine or npm runtime dependency was added. The local font and its SIL Open Font License are included; source: [Google Fonts / Manrope](https://github.com/google/fonts/tree/main/ofl/manrope).

## Verification

- Production static build, TypeScript and formatting checks pass.
- All 46 existing Node data, source-integrity and preview tests pass.
- All 26 Edge product scenarios passed during the redesign. The five flagship audit scenarios were rerun after the responsive-chart change and passed, including all 32 model/observer/domain selections, missing/corrupt evidence, keyboard focus and mobile/tablet checks.
- Automated axe scans report zero violations in the tested initial, expanded-proof, dialog, mobile and tablet states. Automated scans do not establish complete accessibility conformance.
- At 390 × 844, the initial audit action ends around y=729; after opening the audit, the Why action ends around y=828. Both fit the tested viewport. These are layout measurements, not evidence that someone understands the product within twenty seconds.
- The final extracted portable build passes **12/12 targeted scenarios across Chrome, Firefox and Playwright WebKit**, with zero skipped, unexpected or flaky tests. These cover keyboard/modal behavior, all six demo steps, observer switching, navigator/factor/physical/source context, corrupt-source retry and 320-pixel reflow on all six routes. The phone check also verifies the degree-unit label and both body markers in the main skyline.
- All six live preview routes and the local font return HTTP 200. The font is served as `font/ttf`; the tested journey requests no external assets.

## Portable review build

`RESOLVE-review-site.zip` is refreshed with the redesign. It contains **155 members**, including the manifest; the manifest hashes the other **154** members. ZIP CRC, each member's byte count and SHA-256, the B-01 scientific contract and all frozen source hashes verify successfully. The extracted copy runs with Node, independently of the research workspace.

- Archive bytes: **5,831,156**
- Archive SHA-256: `d9d7f5e11c21b93b5abcc3f0538eeeac2a9fd666754efecdba04c0b6a6338f56`
- Human acceptance in the release manifest: `not_run`
- Public deployment in the release manifest: `false`

The live same-machine preview remains **http://127.0.0.1:3000/**. Implementation records are retained in `docs/B07_REDESIGN.md`, `docs/B07_BROWSER_MATRIX.json`, `docs/REDESIGN_AUDIT_ACCESSIBILITY.json`, `docs/REDESIGN_RESPONSIVE_ACCESSIBILITY.json` and `docs/screenshots/redesign/` in the product workspace.

## Remaining acceptance work

The uncoached twenty-second judge test has **not been run**; no first-time reviewer is available. The interface is ready for that test, but a pass cannot be claimed. Dedicated screen-reader review, actual Safari/iOS device testing, recording and public deployment also remain open. Playwright WebKit on Windows is not a substitute for Safari/iOS testing.

The next product decision should follow observed misunderstanding or a specific scientific gap. Additional features are not justified solely by the absence of a human reviewer.
