import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { digest, parseCSV, scienceRoot, webRoot } from '../scripts/extract.mjs';
import {
  applicableControls,
  formatEffect,
  matchingComparisons,
} from '../src/lib/factor-contract.ts';

const manifest = JSON.parse(await readFile(path.join(webRoot, 'src/data/factors.v1.json'), 'utf8'));
const records = Object.fromEntries(
  await Promise.all(
    manifest.sites.map(async (site) => [
      site.id,
      JSON.parse(await readFile(path.join(webRoot, 'public', site.href), 'utf8')),
    ]),
  ),
);
const files = {};
for (const [id, source] of Object.entries(manifest.sources)) {
  const content = await readFile(path.join(scienceRoot, source.path), 'utf8');
  files[id] = source.path.endsWith('.csv')
    ? parseCSV(content)
    : source.path.endsWith('.json')
      ? JSON.parse(content)
      : content;
}
function original(ref) {
  if (ref.row) return files[ref.sourceId].find((row) => row.row === ref.row)[ref.field];
  return ref.pointer
    .split('/')
    .slice(1)
    .reduce(
      (value, key) => value[key.replace(/~1/g, '/').replace(/~0/g, '~')],
      files[ref.sourceId],
    );
}
test('every factor measurement retains original raw values, units, flags and exact source locations', () => {
  for (const record of Object.values(records))
    for (const point of Object.values(record.measurements)) {
      for (const key of ['duration', 'start', 'end', 'leftCensored', 'rightCensored']) {
        const datum = point[key],
          raw = original(datum.source);
        assert.equal(datum.original, String(raw));
        const expected =
          datum.unit === 'boolean'
            ? raw === true || raw === 'True'
            : ['s', 'd'].includes(datum.unit)
              ? Number(raw)
              : raw;
        assert.equal(datum.value, expected);
      }
      assert.equal(
        point.days,
        point.duration.unit === 's' ? point.duration.value / 86400 : point.duration.value,
      );
    }
});
test('factor record hashes, exact downloads and all consumed source hashes match', async () => {
  for (const site of manifest.sites) {
    assert.equal(await digest(path.join(webRoot, 'public', site.href)), site.sha256);
    assert.equal((await readFile(path.join(webRoot, 'public', site.href))).byteLength, site.bytes);
    assert.doesNotMatch(
      await readFile(path.join(webRoot, 'public', site.href), 'utf8'),
      /C:\\|refor|NaN|Infinity/,
    );
  }
  for (const source of Object.values(manifest.sources)) {
    assert.equal(await digest(path.join(scienceRoot, source.path)), source.sha256);
    if (source.href)
      assert.deepEqual(
        await readFile(path.join(webRoot, 'public', source.href)),
        await readFile(path.join(scienceRoot, source.path)),
      );
  }
  assert.equal(
    await digest(path.join(scienceRoot, manifest.generator.path)),
    manifest.generator.sha256,
  );
});
test('all 114 paired contrasts remain within their declared site and active context', () => {
  assert.equal(
    Object.values(records).reduce((n, r) => n + r.comparisons.length, 0),
    114,
  );
  for (const record of Object.values(records))
    for (const comparison of record.comparisons) {
      assert.equal(record.scopes[comparison.scope].site, record.site);
      for (const pair of Object.values(comparison.values))
        assert.equal(
          pair.deltaDays,
          record.measurements[pair.after].days - record.measurements[pair.before].days,
        );
      if (comparison.factor === 'temporal' && record.site === 'dGR101')
        assert.ok(
          Object.values(comparison.values).every((pair) => Math.abs(pair.deltaDays) * 86400 < 0.05),
        );
    }
  for (const observer of ['fixed_absolute', 'each_surface_2m'])
    for (const domain of ['registered_domain', 'uncensored_intersecting_registered'])
      for (const factor of ['terrain', 'temporal', 'observer', 'domain']) {
        const rows = matchingComparisons(records.dGR101, {
          site: 'dGR101',
          factor,
          metric: 'simultaneous',
          observer,
          domain,
          variant: 'P90_80m',
        });
        assert.equal(rows.length, 8);
        const controls = applicableControls('dGR101', factor);
        if (controls.observer) assert.ok(rows.every((row) => row.observer === observer));
        if (controls.domain) assert.ok(rows.every((row) => row.domain === domain));
      }
});
test('scientific anchor contrasts preserve observer, domain and observable distinctions', () => {
  const record = records.dGR101;
  const delta = (id, metric = 'simultaneous') =>
    record.comparisons.find((row) => row.id === id).values[metric].deltaDays;
  assert.equal(
    delta('terrain-P90_80m-fixed_absolute-uncensored_intersecting_registered').toFixed(6),
    '5.525453',
  );
  assert.match(
    record.scopes['r01c-terrain-fixed_absolute-uncensored_intersecting_registered'].changed,
    /absolute observer elevation is held fixed/,
  );
  assert.match(
    record.scopes['r01c-terrain-each_surface_2m-uncensored_intersecting_registered'].changed,
    /corresponding absolute observer elevation/,
  );
  assert.equal(delta('observer-P104_5m-uncensored_intersecting_registered').toFixed(6), '4.285738');
  const domain = record.comparisons.find((row) => row.id === 'domain-P78_5m-fixed_absolute');
  assert.equal(record.measurements[domain.values.simultaneous.before].days.toFixed(6), '5.379206');
  assert.equal(record.measurements[domain.values.simultaneous.after].days.toFixed(6), '7.397830');
  assert.match(record.scopes[domain.scope].qualification, /switch episode identity/);
  const semantics = record.comparisons.find((row) => row.factor === 'semantics');
  assert.equal(
    record.measurements[semantics.values.simultaneous.before].days.toFixed(6),
    '5.399979',
  );
  assert.equal(semantics.kind, 'Changed observable');
  assert.match(record.scopes[semantics.scope].experiment, /R-01B primary/);
  assert.equal(
    records.dGR203.measurements['b203-control_center_events-simultaneous'].days.toFixed(6),
    '8.471310',
  );
});
test('the five-clone pilot keeps its seasonal domain and cannot become a dGR101 uncertainty estimate', () => {
  assert.equal(manifest.sites.find((site) => site.id === 'dGR101').coverage.stochastic, 0);
  assert.match(manifest.unassessed.dGR101.stochastic, /No matched official-clone pilot/);
  assert.equal(
    matchingComparisons(records.dGR101, {
      site: 'dGR101',
      factor: 'stochastic',
      observer: 'fixed_absolute',
      domain: 'registered_domain',
    }).length,
    0,
  );
  const rows = records.dGR203.comparisons.filter((row) => row.factor === 'stochastic');
  assert.equal(rows.length, 5);
  assert.deepEqual(
    rows.map((row) => row.variant),
    ['clone_0001', 'clone_0002', 'clone_0003', 'clone_0004', 'clone_0005'],
  );
  for (const row of rows) {
    const scope = records.dGR203.scopes[row.scope],
      before = records.dGR203.measurements[row.values.simultaneous.before];
    assert.match(scope.domain, /Oct 1–Dec 15/);
    assert.equal(before.days.toFixed(6), '13.227474');
    assert.equal(before.start.value, '2026-10-21T00:22:06.709Z');
    assert.match(scope.qualification, /not a calibrated probability/);
    assert.ok(!Object.hasOwn(row, 'classification') && !Object.hasOwn(row, 'confidence'));
  }
});
test('small and large displayed effects retain meaningful units without a score', () => {
  assert.equal(formatEffect(5.525453), '+5.53 d');
  assert.equal(formatEffect(-0.5), '−12.00 h');
  assert.equal(formatEffect(-120 / 86400), '−2.00 min');
  assert.equal(formatEffect(0.0005 / 86400), '+0.500 ms');
  assert.equal(formatEffect(0), '0 s');
});
