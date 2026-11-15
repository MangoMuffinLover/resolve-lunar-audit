# RESOLVE

**Before you trust the window, audit the model.**

RESOLVE audits whether a modeled lunar Sun/Earth visibility result survives defensible changes in terrain representation, observer convention and reporting scope. It is a NASA Space Apps 2026 project, not a NASA-endorsed mission planning system.

The flagship dGR101 case starts at **7.40 days**. Another native NASA terrain representation gives **12.92 days** under the same absolute observer convention. RESOLVE preserves the matched definitions, traces the physical horizon mechanism and exposes the exact frozen source values. It does not determine which terrain prediction is physical truth. Effects are computed from unrounded source values.

## Explore

| Route         | Purpose                                                                     |
| ------------- | --------------------------------------------------------------------------- |
| `/`           | Result → audit → model-sensitive finding → physical explanation             |
| `/navigator/` | Three supported sites and stored November 2026 geometry                     |
| `/factors/`   | 114 scoped comparisons across six factor families                           |
| `/explain/`   | Matched paired skylines, observer conventions and event witnesses           |
| `/science/`   | Negative evidence, methods, NASA provenance, numerical limits and downloads |
| `/demo/`      | Six manual steps through the scientific argument                            |

## Run the exact published release

With Node.js 22 or later, no dependency installation is needed:

```sh
node scripts/verify-release.mjs
node scripts/serve.mjs --root site --port 3000
```

Open `http://127.0.0.1:3000/`. Serve over HTTP; opening HTML files directly does not support the evidence checks.

`site/` is the reviewed static export. Vercel verifies its release hashes and serves that exact folder. It does not run scientific calculations or require Python, SPICE, raw terrain rasters, credentials, a database or a backend. Framework auto-detection and dependency installation are overridden in `vercel.json` for this release.

## Rebuild the interface from frozen product records

```sh
npm ci
npm run build
npm run preview:rebuilt
```

The rebuild uses the included `src/data/` and `public/evidence/` records and produces `out/`. It does not regenerate science. To publish a changed interface, copy the reviewed `out/` into `site/`, regenerate `release-manifest.json` with reviewed SHA-256 entries and commit both together. The deployment verifier rejects stale or altered release files. No automatic release refresh accepts changed scientific input.

The retained `data`, `build:research`, `verify:science` and `test:research` commands belong to the original complete research workspace. They require its parent research folders and Python environment, which are not included in this website release. This repository provides the complete shipped interface, frozen product records and served evidence, not the complete raw research environment or original DEM collection. The evidence page documents the underlying sources and reproduction requirements.

## Verification and acceptance

The reviewed interface passed 46 original Node data/source/preview checks, 26 Edge product scenarios, a five-scenario audit rerun after the responsive chart change and 12 targeted Chrome/Firefox/WebKit scenarios against the final portable build. All 587 original frozen research files verified unchanged in the full local workspace. The released B-01 contract remains SHA-256 `a8a06dd4a5447acd1ee68a56779376d0b01ad081fde95c1d4b762434a521c48d`.

The owner reviewed the website positively. This is owner feedback, not an uncoached first-time comprehension result. No independent reviewer is currently available. Automated verification and agent review continue; the human twenty-second test is not claimed passed. Dedicated screen-reader and Safari/iOS device review remain outstanding. Playwright WebKit on Windows is not Safari/iOS device testing.

`npm test` verifies this release's file hashes and routes. Browser scenarios are under `tests/readiness/`; set `RESOLVE_PREVIEW_URL` to the served release before `npm run test:browsers`. The local preview suite binds to port 3000 by default.

## Scientific limits and attribution

The result concerns geometric Sun/Earth centers above modeled horizons. It does not establish available electrical power, a working communications link, landing safety, a probability of success or mission certification. Reporting clipping is distinct from a physical transition. Synthetic averaging is separate from native NASA products. The dGR203 five-clone negative result is limited to the tested perturbations.

NASA LOLA/PDS terrain and NAIF/SPICE product identities, URLs, checksums, frames, kernels and retained reports are accessible through `/science/`. Upstream Next.js, React and React DOM notices are in `licenses/`; the locally served Manrope font includes its SIL Open Font License in `public/fonts/OFL.txt` and `site/fonts/OFL.txt`. No NASA endorsement is implied. No general software license has been assigned to original project code in this release.
