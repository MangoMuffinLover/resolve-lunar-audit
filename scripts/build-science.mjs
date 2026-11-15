import { readFile, writeFile, mkdir, copyFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { digest, extract, scienceRoot, webRoot } from './extract.mjs';

const readJSON = async (root, file) => JSON.parse(await readFile(path.join(root, file), 'utf8'));
const sourcePaths = {
  'a-finding': ['results/R01_FINDING.md', 'R-01A negative finding'],
  'b-report': ['results/R01B_FINAL_REPORT.md', 'R-01B final research report'],
  'c-finding': ['results/r01c/R01C_FINDING.md', 'R-01C finding'],
  'c-report': ['results/r01c/R01C_FINAL_REPORT.md', 'R-01C final report'],
  'a-protocol': ['research/r01/protocol/hypotheses.md', 'R-01A hypothesis and decision protocol'],
  'a-method': ['research/r01/protocol/methodology.md', 'R-01A method'],
  'b-protocol': ['research/r01b/protocol.md', 'R-01B retained protocol'],
  'c-protocol': ['research/r01c/protocol.md', 'R-01C protocol before native-product outcomes'],
  'c-reproduce': ['research/r01c/README.md', 'R-01C full research reproduction instructions'],
  'frame-audit': ['research/r01b/ephemeris_audit.md', 'Ephemeris and frame audit'],
  'literature-audit': [
    'research/r01b/literature_audit.md',
    'Historical replication: known, inferred and unknown',
  ],
  'source-audit': ['research/r01c/source_audit.md', 'Native NASA source audit'],
  'c-summary': ['data/processed/r01c/r01c_summary.json', 'R-01C machine-readable summary'],
  'c-numerical': ['data/processed/r01c/numerical_audit.json', 'R-01C numerical audit'],
  'c-verification': [
    'data/processed/r01c/final_verification.json',
    'R-01C saved final verification',
  ],
  'c-ladder': [
    'data/processed/r01c/ladder_final.json',
    'All retained refinement checks and solutions',
  ],
  limitations: ['results/limitations.md', 'R-01A limitations'],
  response: ['results/r01c/resolution_response.csv', 'Exact R-01C result CSV'],
  'b-ladder': ['results/tables/model_fidelity_ladder.csv', 'Exact R-01B factor CSV'],
  pilot: ['results/tables/terrain_ensemble_pilot.csv', 'Exact five-clone pilot CSV'],
};

export async function extractScience() {
  await extract({ verifyOnly: true });
  const freeze = await readJSON(webRoot, 'evidence/science-freeze.json');
  const frozen = new Map(freeze.files.map((f) => [f.path, f.sha256]));
  const sources = {};
  const output = path.join(webRoot, 'public/evidence/science');
  await mkdir(path.join(output, 'sources'), { recursive: true });
  for (const [id, [relative, label]] of Object.entries(sourcePaths)) {
    const full = path.join(scienceRoot, relative);
    const sha256 = await digest(full);
    if (frozen.get(relative) !== sha256)
      throw new Error(`Unfrozen or changed science source: ${relative}`);
    const text = await readFile(full, 'utf8');
    if (/[A-Za-z]:[\\/](?!\/)|\/Users\/|\/home\//.test(text))
      throw new Error(`Private absolute path in public source: ${id}`);
    const href = `/evidence/science/sources/${id}${path.extname(relative)}`;
    sources[id] = { path: relative, label, sha256, bytes: (await stat(full)).size, href };
    await copyFile(full, path.join(webRoot, 'public', href));
  }
  const [audit, factors, summary, numerical, verification, ladder, researchManifest] =
    await Promise.all([
      readJSON(webRoot, 'src/data/audit.v1.json'),
      readJSON(webRoot, 'src/data/factors.v1.json'),
      readJSON(scienceRoot, sourcePaths['c-summary'][0]),
      readJSON(scienceRoot, sourcePaths['c-numerical'][0]),
      readJSON(scienceRoot, sourcePaths['c-verification'][0]),
      readJSON(scienceRoot, sourcePaths['c-ladder'][0]),
      readJSON(scienceRoot, 'data/processed/r01c/r01c_manifest.json'),
    ]);
  if (
    !numerical.passed ||
    !verification.passed ||
    !ladder.passed ||
    !ladder.checks.every((c) => c.passed)
  )
    throw new Error('Saved scientific acceptance checks failed');
  const control = factors.sites.find((s) => s.id === 'dGR203');
  if ((await digest(path.join(webRoot, 'public', control.href))) !== control.sha256)
    throw new Error('Control record does not match factor manifest');
  const ref = (sourceId, pointer, value, unit) => ({ value, unit, sourceId, pointer });
  const max = (kind) =>
    Math.max(
      ...ladder.checks
        .filter((c) => c.check === kind)
        .map((c) => c.maximum_transition_or_duration_change_s),
    );
  if (
    max('refined') !== summary.spatial_max_change_s ||
    max('150_vs_75s') !== summary.temporal_max_change_s
  )
    throw new Error('Summary and retained numerical checks disagree');
  const payload = {
    schema: 'resolve.science.v1',
    sources,
    control,
    studies: [
      {
        id: 'R-01A',
        title: 'The first hypothesis was not supported.',
        site: 'dGR203',
        finding:
          'In the evaluated seasonal pilot, nominal terrain and all five official clones retained the historical 6.5-day simultaneous-center classification. The separate Product 104 check also retained it.',
        limit:
          'The negative result concerns this decision and tested configurations. Five local clones do not cover all terrain uncertainty or calibrate a probability. The selected fixed-start grid is a separate question.',
        findingSource: 'a-finding',
        protocolSource: 'a-protocol',
      },
      {
        id: 'R-01B',
        title: 'The evidence changed the question.',
        site: 'dGR203 / dGR101',
        finding:
          'Small tested terrain effects at dGR203 did not generalize to dGR101. A separate nominal screen revealed a large response to a synthetic terrain representation at dGR101.',
        limit:
          'The historical seven-versus-8.47-day discrepancy was partly reproduced numerically; its original cause remains unassigned. The observer convention also changed some threshold outcomes.',
        findingSource: 'b-report',
        protocolSource: 'b-protocol',
      },
      {
        id: 'R-01C',
        title: 'Native NASA products retained the response.',
        site: 'dGR101',
        finding:
          'The large complete simultaneous-visibility response survived native NASA terrain products at a common absolute observer. Synthetic averaging alone does not explain it.',
        limit:
          'Removing reporting clipping changes the earlier threshold interpretation. Different product lineages, observer conventions and residual fine-grid differences prevent a terrain-truth or achieved-convergence claim.',
        findingSource: 'c-finding',
        protocolSource: 'c-protocol',
      },
    ],
    geometry: audit.geometry,
    footprint: researchManifest.geometry.outside_local_footprint,
    products: audit.representations.map((r) => ({
      id: r.id,
      label: r.label,
      kind: r.type,
      spacing_m: r.spacing.value,
      nasaUrl: r.nasaUrl,
      raster: r.sourceRaster,
      sha256: r.rasterSha256,
      hashScope: r.id.startsWith('P90_')
        ? 'Acquired native window raster; whole remote COG hash unknown'
        : 'Evaluated local raster bytes',
      description: r.description,
    })),
    kernels: researchManifest.kernels.map((k) => ({
      path: k.path,
      sha256: k.sha256,
      bytes: k.bytes,
      url: k.retrieval_receipt?.url || null,
    })),
    validation: {
      spatial: ref('c-summary', '/spatial_max_change_s', summary.spatial_max_change_s, 's'),
      temporal: ref('c-summary', '/temporal_max_change_s', summary.temporal_max_change_s, 's'),
      effect: ref(
        'c-summary',
        '/native80_minus5_complete_simultaneous_days',
        summary.native80_minus5_complete_simultaneous_days,
        'days',
      ),
      spatialChecks: ladder.checks.filter((c) => c.check === 'refined').length,
      temporalChecks: ladder.checks.filter((c) => c.check === '150_vs_75s').length,
      cutoffChecks: numerical.cutoff_checks.length,
      cutoffPassed: numerical.cutoff_checks.every((c) => c.passed),
      seamCheck: numerical.no_critical_boundary_seam_witness,
      savedVerification: verification,
    },
    integrity: {
      files: freeze.files.length,
      href: '/evidence/science/frozen-hashes.v1.json',
      sha256: await digest(path.join(webRoot, 'evidence/science-freeze.json')),
    },
    researchManifest: {
      path: 'data/processed/r01c/r01c_manifest.json',
      sha256: await digest(path.join(scienceRoot, 'data/processed/r01c/r01c_manifest.json')),
    },
    generator: {
      path: 'web/scripts/build-science.mjs',
      sha256: await digest(fileURLToPath(import.meta.url)),
    },
  };
  await copyFile(
    path.join(webRoot, 'evidence/science-freeze.json'),
    path.join(output, 'frozen-hashes.v1.json'),
  );
  const json = JSON.stringify(payload) + '\n';
  await Promise.all([
    writeFile(path.join(webRoot, 'src/data/science.v1.json'), json),
    writeFile(path.join(webRoot, 'evidence/science-sources.json'), json),
    writeFile(path.join(output, 'review-packet.v1.json'), json),
  ]);
  console.log(
    `B-05: ${Object.keys(sources).length} frozen review sources; dGR203 scoped control; numerical, product and kernel provenance packaged without a new scientific run.`,
  );
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await extractScience();
