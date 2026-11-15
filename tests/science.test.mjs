import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { digest, parseCSV, scienceRoot, webRoot } from '../scripts/extract.mjs';
import { controlRows, benchmarkState } from '../src/lib/science-contract.ts';

const json = async (root, file) => JSON.parse(await readFile(path.join(root, file), 'utf8'));
const data = await json(webRoot, 'src/data/science.v1.json');
const control = await json(webRoot, `public${data.control.href}`);
const original = (id) => readFile(path.join(scienceRoot, data.sources[id].path), 'utf8');

test('science review packet and all 20 public sources preserve frozen bytes and generator identity', async () => {
  const freeze = await json(webRoot, 'evidence/science-freeze.json');
  const baseline = new Map(freeze.files.map((f) => [f.path, f.sha256]));
  assert.equal(Object.keys(data.sources).length, 20);
  for (const source of Object.values(data.sources)) {
    assert.equal(source.sha256, baseline.get(source.path));
    assert.equal(await digest(path.join(scienceRoot, source.path)), source.sha256);
    assert.equal(await digest(path.join(webRoot, 'public', source.href)), source.sha256);
    const bytes = await readFile(path.join(webRoot, 'public', source.href));
    assert.equal(bytes.byteLength, source.bytes);
    assert.doesNotMatch(bytes.toString('utf8'), /[A-Za-z]:[\\/](?!\/)|\/Users\/|\/home\//);
  }
  assert.deepEqual(await json(webRoot, 'public/evidence/science/review-packet.v1.json'), data);
  assert.deepEqual(await json(webRoot, 'evidence/science-sources.json'), data);
  assert.equal(
    await digest(path.join(webRoot, 'scripts/build-science.mjs')),
    data.generator.sha256,
  );
  assert.equal(await digest(path.join(webRoot, 'public', data.control.href)), data.control.sha256);
  assert.equal(data.integrity.files, freeze.files.length);
  assert.equal(
    await digest(path.join(webRoot, 'public', data.integrity.href)),
    data.integrity.sha256,
  );
});

test('numerical summaries retain worst retained residuals, source pointers and their acceptance scope', async () => {
  const summary = JSON.parse(await original('c-summary'));
  const ladder = JSON.parse(await original('c-ladder'));
  for (const [field, kind] of [
    ['spatial', 'refined'],
    ['temporal', '150_vs_75s'],
  ]) {
    const checks = ladder.checks.filter((c) => c.check === kind);
    const value = data.validation[field];
    assert.equal(
      value.value,
      Math.max(...checks.map((c) => c.maximum_transition_or_duration_change_s)),
    );
    assert.equal(value.value, summary[value.pointer.slice(1)]);
    assert.equal(data.validation[`${field}Checks`], checks.length);
    assert.ok(
      checks.every(
        (c) =>
          c.passed &&
          (kind === 'refined'
            ? c.threshold_states_stable && c.event_episode_counts_equal
            : c.event_counts_equal),
      ),
    );
  }
  assert.ok(data.validation.spatial.value > 60 && data.validation.spatial.value < 600);
  assert.ok(data.validation.temporal.value < 1);
  assert.ok(data.validation.effect.value * 86400 > data.validation.spatial.value * 1000);
  assert.deepEqual(data.validation.savedVerification, JSON.parse(await original('c-verification')));
  const numeric = JSON.parse(await original('c-numerical'));
  assert.equal(data.validation.cutoffChecks, numeric.cutoff_checks.length);
  assert.ok(numeric.cutoff_checks.every((c) => c.passed));
  assert.ok(numeric.cutoff_checks.some((c) => !c.all_horizon_samples_identical));
  for (const c of numeric.cutoff_checks)
    for (const check of c.checks) assert.equal(check.maximum_transition_or_duration_change_s, 0);
  assert.equal(data.validation.seamCheck, numeric.no_critical_boundary_seam_witness);
});

test('dGR203 control keeps five seasonal clones separate from twelve registered modeling checks', () => {
  const pilot = controlRows(control, 'pilot'),
    modeling = controlRows(control, 'modeling');
  assert.equal(pilot.length, 5);
  assert.equal(modeling.length, 12);
  assert.equal(new Set([...pilot, ...modeling].map((c) => c.id)).size, 17);
  for (const rows of [pilot, modeling])
    for (const metric of ['sun', 'earth', 'simultaneous']) {
      const before = control.measurements[rows[0].values[metric].before];
      for (const row of rows)
        assert.equal(control.measurements[row.values[metric].before].days, before.days);
    }
  assert.equal(control.measurements[pilot[0].values.simultaneous.before].days, 13.227474147332487);
  assert.equal(control.measurements[modeling[0].values.simultaneous.before].days, 8.47131030132787);
  for (const row of [...pilot, ...modeling]) {
    assert.match(
      benchmarkState('simultaneous', control.measurements[row.values.simultaneous.after].days),
      /^Meets 6.5/,
    );
    assert.equal(
      benchmarkState('earth', control.measurements[row.values.earth.after].days),
      'No historical Earth-only benchmark',
    );
  }
  for (const row of modeling)
    assert.match(
      benchmarkState('sun', control.measurements[row.values.sun.after].days),
      /^Below 10/,
    );
});

test('all control displayed durations resolve to exact frozen CSV rows for each observable', async () => {
  const tables = {
    'pilot-table': parseCSV(await original('pilot')),
    'r01b-ladder': parseCSV(await original('b-ladder')),
  };
  for (const comparison of control.comparisons)
    for (const pair of Object.values(comparison.values)) {
      for (const key of [pair.before, pair.after]) {
        const point = control.measurements[key],
          source = point.duration.source;
        const row = tables[source.sourceId].find((r) => r.row === source.row);
        assert.equal(point.duration.original, row[source.field]);
        assert.equal(point.days, Number(row[source.field]));
      }
    }
});

test('product raster and kernel identities retain audited hashes with explicit partial-source scope', async () => {
  const audit = await json(webRoot, 'src/data/audit.v1.json');
  const manifest = await json(scienceRoot, data.researchManifest.path);
  assert.equal(
    await digest(path.join(scienceRoot, data.researchManifest.path)),
    data.researchManifest.sha256,
  );
  assert.deepEqual(data.geometry, audit.geometry);
  for (const product of data.products) {
    const r = audit.representations.find((r) => r.id === product.id);
    assert.equal(product.raster, r.sourceRaster);
    assert.equal(product.sha256, r.rasterSha256);
    assert.equal(product.sha256, await digest(path.join(scienceRoot, product.raster)));
    if (product.id.startsWith('P90_'))
      assert.match(product.hashScope, /whole remote COG hash unknown/);
    if (product.kind === 'synthetic-control') assert.equal(product.nasaUrl, null);
  }
  for (const kernel of data.kernels) {
    const k = manifest.kernels.find((k) => k.path === kernel.path);
    assert.equal(kernel.sha256, k.sha256);
    assert.equal(await digest(path.join(scienceRoot, kernel.path)), kernel.sha256);
    assert.equal(kernel.url, k.retrieval_receipt?.url || null);
  }
});

test('research history retains the negative result, unassigned historical discrepancy and pre-outcome protocol', async () => {
  assert.deepEqual(
    data.studies.map((s) => s.id),
    ['R-01A', 'R-01B', 'R-01C'],
  );
  assert.match(await original('a-finding'), /0 of 90/);
  assert.match(await original('a-finding'), /13\.227474/);
  assert.match(await original('b-report'), /1\.000000-day residual remains/);
  assert.match(await original('c-protocol'), /before native-product visibility outcomes/);
  assert.match(await original('c-finding'), /fine-grid duration plateau has not been demonstrated/);
  assert.match(
    data.studies[0].limit,
    /do not cover all terrain uncertainty or calibrate a probability/,
  );
  assert.match(data.studies[1].limit, /cause remains unassigned/);
  assert.match(data.studies[2].limit, /prevent a terrain-truth/);
});
