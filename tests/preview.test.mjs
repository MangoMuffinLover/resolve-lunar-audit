import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createPreviewServer } from '../scripts/preview-server.mjs';

async function fixture(t) {
  const parent = path.resolve(tmpdir());
  const root = await mkdtemp(path.join(parent, 'resolve-preview-'));
  await mkdir(path.join(root, 'demo'));
  await mkdir(path.join(root, '_next/static'), { recursive: true });
  await writeFile(path.join(root, 'index.html'), '<h1>Result</h1>');
  await writeFile(path.join(root, 'demo/index.html'), '<h1>Demo</h1>');
  await writeFile(path.join(root, '404.html'), '<h1>Unknown route</h1>');
  await writeFile(path.join(root, '_next/static/example.js'), 'console.log(1)');
  await writeFile(path.join(root, 'record.json'), '{}');
  const server = createPreviewServer(root);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    assert.equal(path.dirname(path.resolve(root)), parent);
    assert.ok(path.basename(root).startsWith('resolve-preview-'));
    await rm(root, { recursive: true, force: true });
  });
  return `http://127.0.0.1:${server.address().port}`;
}

test('portable preview serves routes and query contexts with correct types and HEAD lengths', async (t) => {
  const base = await fixture(t);
  const get = await fetch(base + '/demo/?comparison=example');
  assert.equal(get.status, 200);
  assert.equal(await get.text(), '<h1>Demo</h1>');
  assert.match(get.headers.get('content-type'), /text\/html/);
  const head = await fetch(base + '/demo/', { method: 'HEAD' });
  assert.equal(head.headers.get('content-length'), get.headers.get('content-length'));
  assert.equal(await head.text(), '');
  assert.match(
    (await fetch(base + '/record.json')).headers.get('content-type'),
    /application\/json/,
  );
});
test('unknown routes retain an explicit 404 instead of substituting a valid scientific page', async (t) => {
  const base = await fixture(t),
    response = await fetch(base + '/not-a-study/');
  assert.equal(response.status, 404);
  assert.equal(await response.text(), '<h1>Unknown route</h1>');
});
test('preview rejects malformed paths, encoded traversal and write methods', async (t) => {
  const base = await fixture(t);
  assert.equal((await fetch(base + '/%ZZ')).status, 400);
  assert.equal((await fetch(base + '/%00')).status, 400);
  assert.equal((await fetch(base + '/..%2foutside.txt')).status, 403);
  const post = await fetch(base + '/', { method: 'POST' });
  assert.equal(post.status, 405);
  assert.equal(post.headers.get('allow'), 'GET, HEAD');
});
test('only static framework assets receive immutable caching while evidence remains revalidated', async (t) => {
  const base = await fixture(t);
  assert.match(
    (await fetch(base + '/_next/static/example.js')).headers.get('cache-control'),
    /immutable/,
  );
  assert.equal((await fetch(base + '/record.json')).headers.get('cache-control'), 'no-cache');
});
