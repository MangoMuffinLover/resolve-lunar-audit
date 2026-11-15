import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseCSV, digest, scienceRoot, webRoot } from '../scripts/extract.mjs';
import { fixed, signed, distance, position, linePath, utc } from '../src/lib/format.ts';

const data = JSON.parse(await readFile(path.join(webRoot, 'src/data/audit.v1.json'), 'utf8'));
const csv = {};
for (const id of ['response', 'pairwise', 'intervals', 'inventory', 'witnesses', 'support'])
  csv[id] = parseCSV(await readFile(path.join(scienceRoot, data.sources[id].path), 'utf8'));
const get = (id, observer = 'fixed_absolute', domain = 'uncensored_intersecting_registered') =>
  data.cases[`${id}:${observer}:${domain}`];
const expected = {
  P78_5m: [7.39783, 7.39783, 5.379206, 5.379206],
  P90_20m: [8.358389, 9.582193, 6.433104, 7.337699],
  P90_40m: [9.676205, 10.860553, 7.431639, 8.434506],
  P90_60m: [11.461184, 12.049317, 8.955477, 9.370344],
  P90_80m: [12.923283, 12.897803, 10.416595, 10.416398],
  P90_240m: [13.293702, 10.402839, 10.42483, 8.36953],
  P104_5m: [2.98784, 7.273578, 2.535305, 5.638514],
  SYNTHETIC_59p88m: [12.321357, 13.001113, 9.929841, 10.417531],
};
test('all 32 result cases agree with the independent brief and preserve CSV lexemes', () => {
  assert.equal(Object.keys(data.cases).length, 32);
  for (const [id, values] of Object.entries(expected)) {
    let i = 0;
    for (const domain of ['uncensored_intersecting_registered', 'registered_domain'])
      for (const observer of ['fixed_absolute', 'each_surface_2m']) {
        const c = get(id, observer, domain),
          r = csv.response.find(
            (r) =>
              r.configuration === id && r.observer_convention === observer && r.scope === domain,
          );
        assert.equal(c.simultaneous.days.value.toFixed(6), values[i++].toFixed(6));
        assert.equal(c.simultaneous.days.original, r.simultaneous_days);
        assert.equal(c.simultaneous.days.value, Number(r.simultaneous_days));
        assert.equal(c.delta.original, r.simultaneous_delta_5m_days);
        for (const metric of ['simultaneous', 'sun', 'earth'])
          assert.equal(c[metric].start.original, r[`${metric}_start_utc`]);
      }
  }
});
test('complete intervals and registered-domain clipping stay separate', () => {
  for (const id of Object.keys(expected))
    for (const observer of ['fixed_absolute', 'each_surface_2m']) {
      const full = get(id, observer),
        clipped = get(id, observer, 'registered_domain');
      assert.equal(full.simultaneous.rightCensored.value, false);
      assert.equal(full.simultaneous.leftCensored.value, false);
      assert.equal(clipped.simultaneous.rightCensored.value, true);
      assert.equal(clipped.simultaneous.end.value, '2026-11-28T00:00:00.000Z');
      assert.ok(full.simultaneous.days.value > clipped.simultaneous.days.value);
      // The timeline uses the episode containing the saved simultaneous window.
      for (const name of ['sun', 'earth']) {
        assert.ok(clipped.timeline[name].start.value <= clipped.simultaneous.start.value);
        assert.ok(clipped.timeline[name].end.value >= clipped.simultaneous.end.value);
      }
    }
  assert.equal(
    get('P78_5m', 'fixed_absolute', 'registered_domain').timeline.sun.start.value,
    '2026-11-22T14:53:56.611Z',
  );
});
test('NASA identity and synthetic-control hierarchy cannot swap', () => {
  const native = data.representations.filter((r) => r.type === 'native-lola');
  assert.equal(native.length, 6);
  assert.deepEqual(
    native.map((r) => r.product.value),
    ['78', '90', '90', '90', '90', '90'],
  );
  assert.deepEqual(
    native.map((r) => r.spacing.value),
    [5, 20, 40, 60, 80, 240],
  );
  const sdem = data.representations.find((r) => r.type === 'separate-sdem');
  assert.equal(sdem.id, 'P104_5m');
  assert.equal(sdem.product.value, '104');
  assert.equal(sdem.spacing.value, 5);
  const synthetic = data.representations.find((r) => r.type === 'synthetic-control');
  assert.equal(synthetic.label, 'Synthetic area-averaged control');
  assert.equal(synthetic.spacing.value.toFixed(2), '59.88');
  assert.equal(synthetic.spacing.original, '59.880239520958085');
  assert.equal(synthetic.nasaUrl, null);
  assert.equal(synthetic.product.value, '');
});
test('classification is scoped to the evaluated result and no product is ranked as truth', async () => {
  assert.equal(data.classification, 'MODEL-SENSITIVE');
  assert.equal(
    data.classificationScope,
    'Classification applies to this site + observable + analysis definition + evaluated model set.',
  );
  const ui = (
    await Promise.all(
      ['decision-audit', 'horizon-experience', 'representation-ladder', 'evidence-drawer'].map(
        (n) => readFile(path.join(webRoot, `src/components/${n}.tsx`), 'utf8'),
      ),
    )
  )
    .join('\n')
    .replace(/\s+/g, ' ');
  assert.doesNotMatch(
    ui,
    /ground truth|wrong map|unsafe landing|mission will fail|probability of mission success|trust score/i,
  );
  assert.match(
    ui,
    /does not establish which terrain representation|do not establish which terrain representation/,
  );
});
test('fixed/practical observer definitions retain P104 conditionality', () => {
  assert.equal(get('P104_5m').aboveGround.original, '0.6741943359375');
  assert.equal(get('P104_5m', 'each_surface_2m').aboveGround.value, 2);
  assert.equal(data.reportedComparisons.sdemGroundOffset.original, '1.325806');
  assert.equal(data.reportedComparisons.aligned80Minus5Height.original, '-1.647339');
});
test('each numeric, boolean and UTC datum resolves to its original source location', async () => {
  const documents = new Map();
  let count = 0;
  async function walk(v) {
    if (!v || typeof v !== 'object') return;
    if ('original' in v && 'unit' in v && v.source) {
      count++;
      const s = v.source,
        info = data.sources[s.sourceId];
      assert.ok(info, `Source ${s.sourceId}`);
      assert.ok(v.unit);
      if (s.row) {
        const row = csv[s.sourceId].find((r) => r.row === s.row);
        assert.equal(v.original, row[s.field]);
      } else if (s.line) {
        const text = await readFile(path.join(scienceRoot, info.path), 'utf8');
        assert.ok(text.split(/\r?\n/)[s.line - 1].includes(v.original));
      } else {
        if (!documents.has(s.sourceId))
          documents.set(
            s.sourceId,
            JSON.parse(await readFile(path.join(scienceRoot, info.path), 'utf8')),
          );
        let original = documents.get(s.sourceId);
        for (const segment of s.pointer.split('/').slice(1)) original = original[segment];
        assert.equal(v.original, JSON.stringify(original));
      }
      assert.equal(
        typeof v.value === 'number'
          ? Number(v.original)
          : typeof v.value === 'boolean'
            ? v.original === 'True'
            : v.original,
        v.value,
      );
    }
    for (const child of Object.values(v)) await walk(child);
  }
  await walk(data);
  assert.ok(count > 1000);
});
test('all consumed source hashes and exact downloads match frozen originals', async () => {
  for (const info of Object.values(data.sources)) {
    assert.equal(await digest(path.join(scienceRoot, info.path)), info.sha256, info.path);
    if (info.href) assert.equal(await digest(path.join(webRoot, 'public', info.href)), info.sha256);
  }
});
test('all 16 angular profiles retain source samples and observer identity', async () => {
  for (const [id, profile] of Object.entries(data.profileFiles)) {
    const exported = JSON.parse(await readFile(path.join(webRoot, 'public', profile.url), 'utf8'));
    const original = JSON.parse(
      await readFile(path.join(scienceRoot, data.sources[profile.source.sourceId].path), 'utf8'),
    );
    assert.equal(exported.id, original.product);
    assert.equal(exported.observer, original.observer_convention);
    assert.ok(id.endsWith(exported.observer));
    assert.equal(exported.rays.length, profile.count);
    assert.ok(exported.rays.length > 2500);
    for (const [az, h, i] of exported.rays) {
      assert.equal(az, original.witnesses[i].azimuth_deg);
      assert.equal(h, original.witnesses[i].horizon_elevation_deg);
      assert.ok(az >= 40 && az <= 170);
    }
  }
});
test('terrain sections are frozen heights, with original indices and no regenerated angles', async () => {
  const original = JSON.parse(
    await readFile(path.join(scienceRoot, data.sources.mechanism.path), 'utf8'),
  );
  for (const [id, meta] of Object.entries(data.sectionFiles)) {
    const exported = JSON.parse(await readFile(path.join(webRoot, 'public', meta.url), 'utf8'));
    for (const section of exported.sections) {
      const p = original.profiles.find(
        (p) => p.configuration.id === id && p.direction === section.direction,
      );
      for (const [r, h, i] of section.samples) {
        assert.equal(r, p.range_m[i]);
        assert.equal(h, p.height_m[i]);
      }
      assert.equal(section.apparent_elevation_deg, undefined);
    }
  }
});
test('support fields remain descriptive and source-specific', () => {
  assert.deepEqual(
    data.support.map((s) => Number(s.datum.value.toFixed(s.digits))),
    [1, 0.131405, 15.0052, 11, 1.1],
  );
  const w = data.witnesses.find(
    (w) =>
      w.id === 'P78_5m' &&
      w.observer === 'fixed_absolute' &&
      w.diagnostic === 'own_late_solar_onset',
  );
  assert.equal(w.surface_range_m.value, 49.125);
});
test('display formatting changes presentation only, including metres to kilometres', () => {
  const value = get('P78_5m').simultaneous.days;
  const original = value.original;
  assert.equal(fixed(value.value), '7.40');
  assert.equal(value.original, original);
  assert.equal(distance(2017.1875), '2.017 km');
  assert.equal(distance(49.125), '49.125 m');
  assert.equal(signed(get('P90_80m').delta.value), '+5.53');
  assert.equal(signed(-1.25), '−1.25');
  assert.equal(position(7.5, 0, 15), 0.5);
  assert.equal(
    linePath(
      [
        [0, 1],
        [1, 2],
      ],
      (v) => v * 10,
      (v) => v * 20,
    ),
    'M0.00,20.00L10.00,40.00',
  );
  assert.equal(utc('2026-11-22T14:53:56.611Z', true), '22 Nov, 14:53');
});
test('public scientific contract excludes local usernames and absolute machine paths', async () => {
  assert.doesNotMatch(JSON.stringify(data), /C:\\\\|C:\\Users|refor/);
  for (const info of Object.values(data.profileFiles))
    assert.doesNotMatch(
      await readFile(path.join(webRoot, 'public', info.url), 'utf8'),
      /refor|C:\\\\/,
    );
});
test('CSV parsing preserves quoted delimiters, newlines and original decimal tokens', () => {
  assert.deepEqual(parseCSV('label,value\r\n"a,b",0.00100\r\n"line\n""two""",2\r\n'), [
    { row: 2, label: 'a,b', value: '0.00100' },
    { row: 3, label: 'line\n"two"', value: '2' },
  ]);
});
