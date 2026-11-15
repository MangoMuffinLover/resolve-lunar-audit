import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { digest, parseCSV, scienceRoot, webRoot } from '../scripts/extract.mjs';
import { endpointAssociation, physicsIndex, physicsUTC } from '../src/lib/explanation-contract.ts';

const manifest = JSON.parse(await readFile(path.join(webRoot, 'src/data/explain.v1.json'), 'utf8'));
const factorRecords = Object.fromEntries(
  await Promise.all(
    manifest.factor_sites.map(async (site) => [
      site.id,
      JSON.parse(await readFile(path.join(webRoot, 'public', site.href), 'utf8')),
    ]),
  ),
);
const model = async (key) =>
  JSON.parse(await readFile(path.join(webRoot, 'public', manifest.models[key].href), 'utf8'));
const sourceJSON = async (id) =>
  JSON.parse(await readFile(path.join(scienceRoot, manifest.sources[id].path), 'utf8'));

test('physical mapping preserves all 114 study contexts, with exactly 96 matched C pairs', () => {
  assert.equal(Object.keys(manifest.pairs).length, 114);
  assert.equal(Object.keys(manifest.models).length, 16);
  assert.equal(Object.values(manifest.pairs).filter((p) => p.supported).length, 96);
  for (const [site, record] of Object.entries(factorRecords))
    for (const row of record.comparisons) {
      const pair = manifest.pairs[`${site}:${row.id}`];
      assert.equal(pair.site, site);
      assert.equal(pair.comparison, row.id);
      assert.equal(
        pair.supported,
        site === 'dGR101' && ['terrain', 'observer', 'domain', 'temporal'].includes(row.factor),
      );
      if (!pair.supported) {
        assert.equal(pair.before, null);
        assert.equal(pair.after, null);
        continue;
      }
      assert.ok(manifest.models[pair.before] && manifest.models[pair.after]);
      if (row.factor === 'observer') {
        assert.equal(pair.before, `${row.variant}_fixed_absolute`);
        assert.equal(pair.after, `${row.variant}_each_surface_2m`);
      } else if (row.factor === 'terrain') {
        assert.equal(pair.before, `P78_5m_${row.observer}`);
        assert.equal(pair.after, `${row.variant}_${row.observer}`);
      } else assert.equal(pair.before, pair.after);
    }
});

test('all physical records, sources, factor links and section references match recorded hashes', async () => {
  for (const [key, file] of Object.entries(manifest.models)) {
    const p = path.join(webRoot, 'public', file.href);
    assert.equal(await digest(p), file.sha256);
    assert.equal((await readFile(p)).byteLength, file.bytes);
    const raw = await readFile(p, 'utf8');
    assert.doesNotMatch(raw, /C:\\|refor|NaN|Infinity/);
    assert.equal(JSON.parse(raw).key, key);
  }
  for (const source of Object.values(manifest.sources))
    assert.equal(await digest(path.join(scienceRoot, source.path)), source.sha256);
  for (const site of manifest.factor_sites)
    assert.equal(await digest(path.join(webRoot, 'public', site.href)), site.sha256);
  const old = JSON.parse(await readFile(path.join(webRoot, 'src/data/audit.v1.json'), 'utf8'));
  for (const [id, file] of Object.entries(manifest.sections)) {
    assert.equal(file.href, old.sectionFiles[id].url);
    assert.equal(await digest(path.join(webRoot, 'public', file.href)), file.sha256);
  }
  assert.equal(
    await digest(path.join(scienceRoot, manifest.generator.path)),
    manifest.generator.sha256,
  );
});

test('skylines, observer elevations and both bracketing event witnesses retain exact frozen fields', async () => {
  const csv = Object.fromEntries(
    await Promise.all(
      ['response', 'witnesses'].map(async (id) => [
        id,
        parseCSV(await readFile(path.join(scienceRoot, manifest.sources[id].path), 'utf8')),
      ]),
    ),
  );
  const verify = (datum) => {
    const original = csv[datum.source.sourceId].find((row) => row.row === datum.source.row)[
      datum.source.field
    ];
    assert.equal(datum.original, original);
    assert.equal(
      datum.value,
      ['UTC', 'product ID'].includes(datum.unit) ? original : Number(original),
    );
  };
  for (const key of Object.keys(manifest.models)) {
    const data = await model(key),
      original = await sourceJSON(data.source_refs.horizon);
    assert.deepEqual(
      data.skyline,
      original.witnesses.map((w) => [w.azimuth_deg, w.horizon_elevation_deg]),
    );
    for (const datum of [data.ground, data.absolute, data.above_ground]) verify(datum);
    assert.ok(Math.abs(data.absolute.value - data.ground.value - data.above_ground.value) < 1e-9);
    for (const event of [data.solar_onset, data.simultaneous_end]) {
      for (const datum of Object.values(event.at)) verify(datum);
      assert.deepEqual(
        event.rays.map((ray) => ray.bracket),
        ['lower', 'upper'],
      );
      for (const ray of event.rays)
        for (const [field, datum] of Object.entries(ray)) if (field !== 'bracket') verify(datum);
      assert.ok(
        Date.parse(physicsUTC(manifest, event.sample_before_index)) <
          Date.parse(event.at.time_utc.value),
      );
      assert.ok(
        Date.parse(physicsUTC(manifest, event.sample_after_index)) >
          Date.parse(event.at.time_utc.value),
      );
    }
  }
});

test('19,200 snapshots match both saved event solutions; common absolute geometry stays identical', async () => {
  const reference = await model('P78_5m_fixed_absolute');
  const visible = (utc, windows) =>
    windows.some((w) => Date.parse(w.start_utc) <= utc && utc < Date.parse(w.end_utc));
  let checks = 0;
  for (const [key, meta] of Object.entries(manifest.models)) {
    const data = await model(key),
      solution = await sourceJSON(data.source_refs.solution);
    assert.equal(data.snapshots.length, 1200);
    for (const [i, sample] of data.snapshots.entries()) {
      const utc = Date.parse(physicsUTC(manifest, i));
      assert.equal(sample.length, 11);
      for (const [target, offset] of [
        ['sun', 0],
        ['earth', 5],
      ]) {
        assert.ok(Number.isFinite(sample[offset]));
        assert.ok(sample[offset] >= 0 && sample[offset] < 360);
        assert.ok(sample[offset + 1] >= -9 && sample[offset + 1] <= 9);
        assert.ok(Math.abs(sample[offset + 1] - sample[offset + 2] - sample[offset + 3]) < 1e-12);
        assert.equal(sample[offset + 4], sample[offset + 3] > 0);
        for (const v of [solution.uncensored.visibility, solution.final_75s_visibility]) {
          assert.equal(sample[offset + 4], visible(utc, v.intervals[target]));
          checks++;
        }
      }
      assert.equal(sample[10], sample[4] && sample[9]);
      for (const v of [solution.uncensored.visibility, solution.final_75s_visibility]) {
        assert.equal(sample[10], visible(utc, v.intervals.simultaneous));
        checks++;
      }
      if (meta.observer === 'fixed_absolute')
        for (const field of [0, 1, 5, 6])
          assert.equal(sample[field], reference.snapshots[i][field]);
    }
  }
  assert.equal(checks, 115200);
  assert.ok(
    manifest.validation.every(
      (v) => v.mismatches === 0 && v.independent_geometry_max_error_deg < 1e-10,
    ),
  );
});

test('endpoint attribution prioritizes censoring and retains Sun-onset/Earth-end distinctions', async () => {
  const record = factorRecords.dGR101,
    row = record.comparisons.find((c) => c.id === 'domain-P78_5m-fixed_absolute');
  const before = record.measurements[row.values.simultaneous.before],
    after = record.measurements[row.values.simultaneous.after];
  const nominal = await model('P78_5m_fixed_absolute'),
    coarse = await model('P90_80m_fixed_absolute');
  assert.match(endpointAssociation(before, nominal).end, /Reporting boundary/);
  assert.match(endpointAssociation(after, nominal).start, /Sun onset/);
  assert.match(endpointAssociation(after, nominal).end, /Earth visibility end/);
  assert.equal(nominal.solar_onset.rays[0].surface_range_m.value, 49.125);
  assert.equal(coarse.solar_onset.rays[0].surface_range_m.value, 2017.1875);
  assert.notEqual(nominal.solar_onset.at.time_utc.value, coarse.solar_onset.at.time_utc.value);
  const at29 = physicsIndex(manifest, '2026-11-29T00:00:00.000Z');
  assert.equal(nominal.snapshots[at29][10], true);
  assert.equal(before.rightCensored.value, true);
  const fixed = await model('P104_5m_fixed_absolute'),
    surface = await model('P104_5m_each_surface_2m');
  assert.equal(fixed.above_ground.value.toFixed(6), '0.674194');
  assert.equal(surface.above_ground.value, 2);
  assert.notEqual(fixed.absolute.value, surface.absolute.value);
});

test('common-clock indexing is bounded to exact stored UTC slots', () => {
  assert.equal(manifest.domain.sample_count, 1200);
  assert.equal(manifest.domain.step_s, 1800);
  assert.equal(physicsUTC(manifest, 0), '2026-11-06T00:00:00.000Z');
  assert.equal(physicsUTC(manifest, 1199), '2026-11-30T23:30:00.000Z');
  assert.equal(physicsIndex(manifest, '2026-11-22T15:00:00.000Z'), 798);
  for (let i = 0; i < 1200; i++) assert.equal(physicsIndex(manifest, physicsUTC(manifest, i)), i);
});
