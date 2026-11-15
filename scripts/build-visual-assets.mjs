// Display-only extraction. No DEM, SPICE, event solving or scientific mutation.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const manifest = JSON.parse(await readFile('src/data/explain.v1.json', 'utf8'));
const utc = '2026-11-17T14:30:00.000Z';
const index =
  (Date.parse(utc) - Date.parse(manifest.domain.start_utc)) / (manifest.domain.step_s * 1000);
if (!Number.isInteger(index)) throw new Error('Display clock must be an existing stored snapshot');
await mkdir('public/visuals', { recursive: true });
await mkdir('src/visuals', { recursive: true });
const refs = {},
  sources = [];
let initial;
for (const observer of ['fixed_absolute', 'each_surface_2m']) {
  const models = {};
  for (const [key, ref] of Object.entries(manifest.models).filter(
    ([, v]) => v.observer === observer,
  )) {
    const bytes = await readFile(`public${ref.href}`);
    if (sha(bytes) !== ref.sha256) throw new Error(`Frozen source hash mismatch: ${key}`);
    const value = JSON.parse(bytes);
    models[value.model] = {
      key,
      label: value.label,
      // Preserve every stored point within this explicit display crop.
      skyline: value.skyline.filter(([az]) => az >= 40 && az <= 170),
      sample: value.snapshots[index],
    };
    sources.push({
      path: ref.href,
      sha256: ref.sha256,
      bytes: bytes.length,
      skyline_crop_degrees: [40, 170],
      snapshot_index: index,
    });
  }
  const value = { schema: 'resolve.visual.sky.v1', observer, utc, models };
  const bytes = Buffer.from(JSON.stringify(value));
  const href = `/visuals/sky-${observer}.v1.json`;
  await writeFile(`public${href}`, bytes);
  refs[observer] = { href, bytes: bytes.length, sha256: sha(bytes) };
  if (observer === 'fixed_absolute') initial = { ...models.P78_5m, utc };
  console.log(`${observer}: ${bytes.length} bytes / ${gzipSync(bytes).length} gzip bytes`);
}
await writeFile('src/visuals/initial.json', JSON.stringify(initial));
await writeFile(
  'src/visuals/manifest.json',
  JSON.stringify({ refs, sections: manifest.sections, utc }),
);
await writeFile(
  'public/visuals/provenance.json',
  JSON.stringify(
    {
      schema: 'resolve.visual.provenance.v1',
      description:
        'Display-only angular skylines copied from verified frozen records. No terrain mesh, imagery, shading-derived claim or new scientific calculation. SVG coordinates are presentation projections. Crossfades are visual transitions; analytical states are discrete products.',
      utc,
      sources,
    },
    null,
    2,
  ) + '\n',
);

const factors = JSON.parse(await readFile('public/evidence/factors/dGR203.v1.json', 'utf8'));
await writeFile(
  'src/visuals/assumptions.json',
  JSON.stringify(
    ['time_12h', 'disc_any'].map((id) => {
      const comparison = factors.comparisons.find((row) => row.id === id),
        pair = comparison.values.simultaneous;
      return {
        comparison,
        scope: factors.scopes[comparison.scope],
        before: factors.measurements[pair.before],
        after: factors.measurements[pair.after],
      };
    }),
  ),
);
