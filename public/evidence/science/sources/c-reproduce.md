# Reproduce R-01C

Work in the existing workspace with `.venv/Scripts/python.exe`. Do not rerun
the R-01A/B pipelines or regenerate their manifests: those artifacts are
frozen by `data/processed/r01c/frozen_r01ab.json`.

Original execution sequence (one heavy DEM process at a time):

```powershell
.\.venv\Scripts\python.exe scripts/r01c_freeze.py
.\.venv\Scripts\python.exe scripts/r01c_native.py
.\.venv\Scripts\python.exe scripts/r01c_uncensor_controls.py
.\.venv\Scripts\python.exe scripts/r01c_data_audit.py
.\.venv\Scripts\python.exe scripts/r01c_ladder.py
.\.venv\Scripts\python.exe scripts/r01c_mechanism.py
.\.venv\Scripts\python.exe scripts/r01c_numeric.py
.\.venv\Scripts\python.exe -m pytest -q --junitxml=research/r01c/pytest.xml
```

The native retrieval needs network access to the official NASA PGDA server.
It reads original COG byte ranges through an audited local proxy and saves
unresampled native pixel windows plus original blocks/receipts. It does not
download the multigigabyte remote rasters. An offline rerun can reuse the
verified native windows and ranges, skipping the online retrieval command.

`r01c_ladder.py` caches model/solution stages only within R-01C. To reproduce
from scratch, use a separate workspace copy with the R-01A/B artifacts and
the verified raw inputs, without generated R-01C horizon/solution caches.
Do not silently reuse caches after changing protocol or input bytes.

Reports require an explicit scientific verdict, product-gate recommendation
and evidence-based rationale, chosen after examining complete outputs:

```powershell
$r01cRationale = 'Authoritative native NASA grids retain several-day changes in complete simultaneous visibility at a common absolute observer, so synthetic area averaging is not the sole source of the R-01B effect. Removing censoring changes the threshold interpretation; Product 104 and the two observer conventions expose further conditionality. The supported result is a reproducible response to terrain representation, not a certified true window or a universal mission failure.'
.\.venv\Scripts\python.exe scripts/r01c_report.py --verdict A --gate BUILD --rationale $r01cRationale
.\.venv\Scripts\python.exe scripts/r01c_verify.py
.\.venv\Scripts\python.exe scripts/r01c_manifest.py
.\.venv\Scripts\python.exe scripts/r01c_verify.py --check-manifest
```

The completed run selected these arguments after reviewing outputs; they
are not an automatic verdict rule. The command used
for the completed run is recorded in `r01c_summary.json`; do not choose
parameters or thresholds to obtain a particular verdict. If numerical checks
fail, the report tool rejects a non-INCONCLUSIVE scientific verdict.

Inspect all three required PNGs after generating reports and record visual
QA before the final manifest. The final manifest verifies every frozen
R-01A/B file, evaluated raster hash, native downloaded block and code/output
hash. Whole-source COG digests remain unknown where only windows were acquired.

The initial saved R-01B uncensoring controls used repeated full-domain
solves; the ladder evaluates added days incrementally and verifies the
joined result against a direct full-domain temporal refinement. Analytic
tests also check this join. These implement the same interval definition.

The initial long ladder run hit the memory limit before its last two refined
surfaces. It resumed from completed caches with a 32 MiB GDAL cache, streamed
checksums, bounded row-mask operations, smaller ray batches and an on-demand
read of the same 240 m continuation. The native arrays/interpolation and
scientific grids are unchanged; an equivalence test checks the new I/O.
See execution_audit.json. Run raster processes sequentially.

Key distinctions:

- Original registered-domain result versus complete transition-bounded
  episodes intersecting that domain. Do not swap them in a mission claim.
- Primary fixed absolute observer versus 2 m above each represented ground.
- Native NASA pixel spacing versus effective terrain knowledge.
- Product104 versus nominal LOLA, with neither designated ground truth.
- SYNTHETIC AREA-AVERAGED 59.88 m CONTROL versus native NASA 60 m terrain.
- Simultaneous >=6.5 historical benchmark versus solar >=10 threshold.
- Deterministic numerical refinement shifts versus probabilistic model error.

No frontend, clone ensemble or work beyond the R-01C gate is authorized by
the reproducibility commands or a BUILD recommendation.
