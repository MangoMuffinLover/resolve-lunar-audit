import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createDemoData } from '../src/lib/demo-contract.ts';
import { physicsIndex, physicsUTC } from '../src/lib/explanation-contract.ts';
import { digest, parseCSV, webRoot, scienceRoot } from '../scripts/extract.mjs';

const read = async (name) => JSON.parse(await readFile(path.join(webRoot, name), 'utf8'));
const audit = await read('src/data/audit.v1.json'),
  explanation = await read('src/data/explain.v1.json'),
  science = await read('src/data/science.v1.json'),
  navigator = await read('src/data/navigator.v1.json');
const data = createDemoData(audit, explanation, science, navigator);

test('demo anchors retain exact source cases and never mix observer or complete/registered scope', () => {
  for (const name of ['baseline', 'native80', 'sdemFixed', 'sdemSurface', 'clipped']) {
    const item = data[name];
    assert.deepEqual(item, audit.cases[`${item.id}:${item.observer}:${item.domain}`]);
  }
  assert.equal(data.baseline.simultaneous.days.value.toFixed(2), '7.40');
  assert.equal(data.native80.simultaneous.days.value.toFixed(2), '12.92');
  assert.equal(
    (data.native80.simultaneous.days.value - data.baseline.simultaneous.days.value).toFixed(2),
    '5.53',
  );
  for (const item of [data.baseline, data.native80, data.sdemFixed]) {
    assert.equal(item.observer, 'fixed_absolute');
    assert.equal(item.domain, 'uncensored_intersecting_registered');
    assert.equal(item.simultaneous.leftCensored.value, false);
    assert.equal(item.simultaneous.rightCensored.value, false);
  }
});

test('demo common clock has the same body geometry and different stored visibility outcomes', async () => {
  const models = [];
  for (const file of [data.physical.before, data.physical.after]) {
    assert.equal(await digest(path.join(webRoot, 'public', file.href)), file.sha256);
    const model = await read(`public${file.href}`);
    assert.equal(model.model, file.model);
    assert.equal(model.observer, 'fixed_absolute');
    models.push(model);
  }
  const index = physicsIndex(data.physical.manifest, data.physical.snapshotUTC);
  assert.equal(physicsUTC(data.physical.manifest, index), data.physical.snapshotUTC);
  const a = models[0].snapshots[index],
    b = models[1].snapshots[index];
  for (const field of [0, 1, 5, 6]) assert.equal(a[field], b[field]);
  assert.equal(a[10], false);
  assert.equal(b[10], true);
  assert.ok(a[3] < 0 && b[3] > 0);
});

test('own-onset demonstration witnesses retain lower source rays at distinct events and sectors', async () => {
  const rows = parseCSV(
    await readFile(path.join(scienceRoot, audit.sources.witnesses.path), 'utf8'),
  );
  for (const w of [data.witnesses.before, data.witnesses.after]) {
    const row = rows.find((r) => r.row === w.surface_range_m.source.row);
    assert.equal(row.bracketing_ray, 'lower');
    assert.equal(row.diagnostic, 'own_late_solar_onset');
    assert.equal(row.observer_convention, 'fixed_absolute');
    assert.equal(w.surface_range_m.original, row.surface_range_m);
    assert.equal(w.time_utc.original, row.time_utc);
    assert.notEqual(w.time_utc.value, data.physical.snapshotUTC);
  }
  assert.equal(data.witnesses.before.surface_range_m.value, 49.125);
  assert.ok(data.witnesses.after.surface_range_m.value > 2000);
  assert.notEqual(
    data.witnesses.before.target_azimuth_deg.value,
    data.witnesses.after.target_azimuth_deg.value,
  );
});

test('observer and reporting demonstrations change their declared variable without inventing transitions', () => {
  assert.equal(data.sdemFixed.id, data.sdemSurface.id);
  assert.equal(data.sdemFixed.ground.value, data.sdemSurface.ground.value);
  assert.equal(data.sdemFixed.simultaneous.days.value.toFixed(2), '2.99');
  assert.equal(data.sdemSurface.simultaneous.days.value.toFixed(2), '7.27');
  assert.equal(data.sdemFixed.aboveGround.value, 0.6741943359375);
  assert.equal(data.sdemSurface.aboveGround.value, 2);
  assert.notEqual(data.sdemFixed.absoluteHeight.value, data.sdemSurface.absoluteHeight.value);
  assert.equal(data.clipped.simultaneous.rightCensored.value, true);
  assert.equal(data.baseline.simultaneous.rightCensored.value, false);
  assert.equal(data.clipped.simultaneous.end.value, '2026-11-28T00:00:00.000Z');
  assert.equal(data.clipped.simultaneous.start.value, data.baseline.simultaneous.start.value);
});

test('demo control, downloadable results, validation and navigator link remain tied to delivered evidence', async () => {
  assert.equal(data.control.id, 'dGR203');
  assert.equal(await digest(path.join(webRoot, 'public', data.control.href)), data.control.sha256);
  assert.equal(
    await digest(path.join(webRoot, 'public', data.responseSource.href)),
    data.responseSource.sha256,
  );
  assert.equal(
    await digest(path.join(webRoot, 'public', data.pilotSource.href)),
    data.pilotSource.sha256,
  );
  assert.deepEqual(data.navigator.sites, ['dGR101', 'dGR201', 'dGR204']);
  assert.equal(data.navigator.end, '2026-11-28T00:00:00.000Z');
  assert.deepEqual(data.validation.spatial, science.validation.spatial);
  assert.deepEqual(data.validation.temporal, science.validation.temporal);
});

test('demo data rejects absent or mismatched evidence before publishing a scripted claim', () => {
  const absent = structuredClone(audit);
  delete absent.cases['P90_80m:fixed_absolute:uncensored_intersecting_registered'];
  assert.throws(() => createDemoData(absent, explanation, science, navigator), /identity mismatch/);
  const wrong = structuredClone(audit);
  wrong.cases['P104_5m:each_surface_2m:uncensored_intersecting_registered'].observer =
    'fixed_absolute';
  assert.throws(() => createDemoData(wrong, explanation, science, navigator), /identity mismatch/);
  const wrongControl = structuredClone(science);
  wrongControl.control.id = 'dGR101';
  assert.throws(
    () => createDemoData(audit, explanation, wrongControl, navigator),
    /evidence unavailable/,
  );
});
