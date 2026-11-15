import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const json = async (p) => JSON.parse(await readFile(p, 'utf8'));
const manifest = await json('src/visuals/manifest.json');
const original = await json('src/data/explain.v1.json');
test('all display records retain exact frozen skylines, snapshot positions and provenance', async () => {
  for (const [observer, ref] of Object.entries(manifest.refs)) {
    const bytes = await readFile(`public${ref.href}`);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), ref.sha256);
    const bundle = JSON.parse(bytes);
    assert.equal(bundle.observer, observer);
    assert.equal(bundle.utc, manifest.utc);
    const index =
      (Date.parse(bundle.utc) - Date.parse(original.domain.start_utc)) /
      (original.domain.step_s * 1000);
    assert.ok(Number.isInteger(index));
    for (const [id, model] of Object.entries(bundle.models)) {
      const sourceRef = original.models[`${id}_${observer}`],
        sourceBytes = await readFile(`public${sourceRef.href}`);
      assert.equal(createHash('sha256').update(sourceBytes).digest('hex'), sourceRef.sha256);
      const source = JSON.parse(sourceBytes);
      assert.deepEqual(
        model.skyline,
        source.skyline.filter(([az]) => az >= 40 && az <= 170),
      );
      assert.deepEqual(model.sample, source.snapshots[index]);
      if (observer === 'fixed_absolute')
        for (const at of [0, 1, 5, 6])
          assert.equal(model.sample[at], bundle.models.P78_5m.sample[at]);
    }
  }
});
test('the source contract remains byte identical to the reviewed scientific baseline', async () => {
  const bytes = await readFile('src/data/audit.v1.json');
  assert.equal(
    createHash('sha256').update(bytes).digest('hex'),
    'a8a06dd4a5447acd1ee68a56779376d0b01ad081fde95c1d4b762434a521c48d',
  );
});
test('assumption cards preserve their original source pair and separate study context', async () => {
  const source = await json('public/evidence/factors/dGR203.v1.json');
  const cards = await json('src/visuals/assumptions.json');
  for (const card of cards) {
    const original = source.comparisons.find((row) => row.id === card.comparison.id);
    assert.deepEqual(card.comparison, original);
    assert.deepEqual(card.scope, source.scopes[original.scope]);
    assert.deepEqual(card.before, source.measurements[original.values.simultaneous.before]);
    assert.deepEqual(card.after, source.measurements[original.values.simultaneous.after]);
  }
});
