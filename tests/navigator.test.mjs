import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { digest, scienceRoot, webRoot } from '../scripts/extract.mjs';
import { snapshotIndex, snapshotUTC } from '../src/lib/navigator-contract.ts';

const manifest = JSON.parse(
  await readFile(path.join(webRoot, 'src/data/navigator.v1.json'), 'utf8'),
);
const records = await Promise.all(
  manifest.sites.map(async (site) =>
    JSON.parse(await readFile(path.join(webRoot, 'public', site.href), 'utf8')),
  ),
);

test('navigator coverage is bounded to three actual sites and exact 30-minute UTC snapshots', () => {
  assert.deepEqual(
    manifest.sites.map((site) => site.id),
    ['dGR101', 'dGR201', 'dGR204'],
  );
  assert.equal(manifest.domain.start_utc, '2026-11-06T00:00:00.000Z');
  assert.equal(manifest.domain.end_utc, '2026-11-28T00:00:00.000Z');
  assert.equal(manifest.domain.sample_count, 1056);
  assert.equal(manifest.geometry.frame, 'MOON_ME_DE421');
  assert.equal(manifest.geometry.aberration, 'NONE');
  for (const record of records) {
    assert.equal(record.samples.length, 1056);
    assert.equal(record.site.observer_height_m, 2);
    for (const [index, sample] of record.samples.entries()) {
      assert.equal(sample.utc, snapshotUTC(manifest, index));
      assert.equal(snapshotIndex(manifest, sample.utc), index);
      assert.ok(Date.parse(sample.utc) < Date.parse(manifest.domain.end_utc));
    }
  }
  assert.match(manifest.sites[1].validation, /No R-01C/);
  assert.match(manifest.sites[2].validation, /No R-01C/);
});

test('navigator records and all provenance sources match recorded hashes', async () => {
  for (const site of manifest.sites) {
    const p = path.join(webRoot, 'public', site.href);
    assert.equal(await digest(p), site.sha256);
    assert.equal((await readFile(p)).byteLength, site.bytes);
    assert.doesNotMatch(await readFile(p, 'utf8'), /C:\\|refor|NaN|Infinity/);
  }
  for (const info of Object.values(manifest.sources))
    assert.equal(await digest(path.join(scienceRoot, info.path)), info.sha256);
  assert.equal(
    await digest(path.join(scienceRoot, manifest.generator.path)),
    manifest.generator.sha256,
  );
});

test('navigator skylines and intervals copy the exact matching frozen models', async () => {
  for (const record of records) {
    const site = manifest.sites.find((site) => site.id === record.site.id);
    const model = JSON.parse(
      await readFile(path.join(scienceRoot, manifest.sources[site.horizon_source].path), 'utf8'),
    );
    const raw = JSON.parse(
      await readFile(path.join(scienceRoot, manifest.sources[site.visibility_source].path), 'utf8'),
    );
    const visibility = site.visibility_pointer ? raw.registered : raw;
    assert.deepEqual(
      record.skyline,
      model.witnesses.map((ray) => [ray.azimuth_deg, ray.horizon_elevation_deg]),
    );
    assert.deepEqual(record.intervals, visibility.intervals);
    assert.deepEqual(record.longest, visibility.longest);
    assert.equal(site.latitude_deg, model.latitude_deg);
    assert.equal(site.longitude_east_deg, model.longitude_east_deg);
    assert.equal(site.ground_height_m, model.observer_terrain_height_m);
  }
});

test('every stored snapshot agrees with frozen event intervals and strict center clearance', () => {
  for (const record of records)
    for (const sample of record.samples) {
      const overlap = sample.overlap;
      const current = record.intervals.simultaneous.findIndex(
        (w) => w.start_et_s <= sample.et_tdb_s && sample.et_tdb_s < w.end_et_s,
      );
      const next = record.intervals.simultaneous.findIndex((w) => w.start_et_s > sample.et_tdb_s);
      assert.equal(overlap.kind, current >= 0 ? 'current' : next >= 0 ? 'next' : 'none');
      assert.equal(overlap.interval_index, current >= 0 ? current : next >= 0 ? next : null);
      assert.equal(
        overlap.remaining_s,
        current >= 0 ? record.intervals.simultaneous[current].end_et_s - sample.et_tdb_s : null,
      );
      for (const target of ['sun', 'earth']) {
        const position = sample[target];
        assert.ok(Number.isFinite(position.azimuth_deg));
        assert.ok(position.azimuth_deg >= 0 && position.azimuth_deg < 360);
        assert.ok(
          Math.abs(position.elevation_deg - position.horizon_deg - position.clearance_deg) < 1e-12,
        );
        assert.equal(position.visible, position.clearance_deg > 0);
        assert.equal(
          position.visible,
          record.intervals[target].some(
            (w) => w.start_et_s <= sample.et_tdb_s && sample.et_tdb_s < w.end_et_s,
          ),
        );
      }
      assert.equal(sample.simultaneous_visible, sample.sun.visible && sample.earth.visible);
      assert.equal(
        sample.simultaneous_visible,
        record.intervals.simultaneous.some(
          (w) => w.start_et_s <= sample.et_tdb_s && sample.et_tdb_s < w.end_et_s,
        ),
      );
    }
  assert.equal(
    manifest.verification.reduce((sum, r) => sum + r.frozen_interval_checks, 0),
    9504,
  );
  assert.ok(
    manifest.verification.every(
      (r) => r.clearance_event_mismatches === 0 && r.independent_geometry_max_error_deg < 1e-10,
    ),
  );
});

test('dGR101 navigator durations agree with B-01 registered results without replacing its complete episode', async () => {
  const audit = JSON.parse(await readFile(path.join(webRoot, 'src/data/audit.v1.json'), 'utf8'));
  const clipped = audit.cases['P78_5m:fixed_absolute:registered_domain'];
  const complete = audit.cases['P78_5m:fixed_absolute:uncensored_intersecting_registered'];
  assert.equal(
    (records[0].longest.simultaneous.duration_s / 86400).toFixed(6),
    clipped.simultaneous.days.value.toFixed(6),
  );
  assert.ok(records[0].longest.simultaneous.right_censored);
  assert.equal(complete.simultaneous.days.value.toFixed(2), '7.40');
});
