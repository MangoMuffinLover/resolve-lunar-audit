import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { createPreviewServer } from './preview-server.mjs';

const { values } = parseArgs({
  options: { root: { type: 'string' }, port: { type: 'string', default: '3000' } },
});
const port = Number(values.port);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error('Port must be an integer from 1 to 65535');
const root = values.root
  ? path.resolve(values.root)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../out');
if (!(await stat(path.join(root, 'index.html'))).isFile())
  throw new Error('Static export index.html is missing');
const server = createPreviewServer(root);
server.on('error', (error) => {
  console.error(`Preview could not start: ${error.code}`);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => console.log(`RESOLVE preview: http://127.0.0.1:${port}/`));
