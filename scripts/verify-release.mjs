import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(path.join(root, 'release-manifest.json'), 'utf8'));
if (manifest.schema !== 'resolve.public-release.v1') throw new Error('Unknown release manifest');
const scientificHash = 'a8a06dd4a5447acd1ee68a56779376d0b01ad081fde95c1d4b762434a521c48d';
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
if (sha(await readFile(path.join(root, 'src/data/audit.v1.json'))) !== scientificHash)
  throw new Error('Original B-01 scientific contract changed');
const noteName = 'RESOLVE_Technical_Research_Note';
const note = JSON.parse(
  await readFile(path.join(root, `docs/${noteName}.provenance.json`), 'utf8'),
);
if (![3, 4].includes(note.pages) || note.new_scientific_calculations !== false)
  throw new Error('Technical note scope changed');
for (const entry of [
  note.pdf,
  note.editable_source,
  note.latex_source,
  note.figure_file,
  note.source_bundle,
  note.builder,
  ...note.inputs,
]) {
  const bytes = await readFile(path.join(root, entry.path));
  if (sha(bytes) !== entry.sha256 || bytes.length !== entry.bytes)
    throw new Error(`Technical note provenance mismatch: ${entry.path}`);
}
for (const filename of [
  `${noteName}.pdf`,
  `${noteName}.md`,
  `${noteName}.provenance.json`,
  `${noteName}_source.zip`,
]) {
  if (
    sha(await readFile(path.join(root, 'docs', filename))) !==
    sha(await readFile(path.join(root, 'public/docs', filename)))
  )
    throw new Error(`Technical note public copy is stale: ${filename}`);
}
const seen = new Set();
for (const entry of manifest.files) {
  if (seen.has(entry.path)) throw new Error('Duplicate release entry');
  seen.add(entry.path);
  const filename = path.resolve(root, entry.path);
  const relative = path.relative(root, filename);
  if (path.isAbsolute(relative) || relative.startsWith('..'))
    throw new Error('Unsafe release path');
  const bytes = await readFile(filename);
  // The hosting build can normalize its configuration file. Keep the effective
  // release settings strict without treating whitespace as a site-data change.
  if (entry.path === 'vercel.json') {
    const config = JSON.parse(bytes.toString('utf8'));
    const expected = {
      framework: null,
      installCommand: 'node --version',
      buildCommand: 'node scripts/verify-release.mjs',
      outputDirectory: 'site',
      trailingSlash: true,
    };
    for (const [key, value] of Object.entries(expected))
      if (config[key] !== value) throw new Error(`Hosting release setting changed: ${key}`);
    continue;
  }
  if (bytes.length !== entry.bytes || sha(bytes) !== entry.sha256)
    throw new Error(`Release integrity mismatch: ${entry.path}`);
}
for (const route of ['', 'navigator', 'factors', 'explain', 'science', 'demo'])
  if (!(await stat(path.join(root, 'site', route, 'index.html'))).isFile())
    throw new Error(`Missing static route: /${route}`);
async function verifyOutputDirectory(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error('Symbolic link in deployment output');
    if (entry.isDirectory()) await verifyOutputDirectory(filename);
    else if (!seen.has(path.relative(root, filename).split(path.sep).join('/')))
      throw new Error('Unrecorded deployment output file');
  }
}
await verifyOutputDirectory(path.join(root, 'site'));
for (const name of ['audit', 'explain', 'factors', 'navigator', 'science']) {
  const filename = `src/data/${name}.v1.json`;
  if (!seen.has(filename)) throw new Error('Missing product-data record');
}
if (
  !(await readFile(path.join(root, 'site/index.html'), 'utf8')).includes(
    'Before you trust the window',
  )
)
  throw new Error('The shipped homepage is not the reviewed redesign');
console.log(
  `Verified ${seen.size} release files and all six routes; original scientific contract unchanged.`,
);
