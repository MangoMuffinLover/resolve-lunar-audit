import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const types = {
  '.ttf': 'font/ttf',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.csv': 'text/csv; charset=utf-8',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
};

export function createPreviewServer(rootPath) {
  const root = path.resolve(rootPath);
  return http.createServer(async (req, res) => {
    const send = (status, content, type = 'text/plain; charset=utf-8', extra = {}) => {
      res.writeHead(status, {
        'Content-Type': type,
        'Content-Length': Buffer.byteLength(content),
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache',
        ...extra,
      });
      res.end(req.method === 'HEAD' ? undefined : content);
    };
    if (!['GET', 'HEAD'].includes(req.method))
      return send(405, 'Read-only preview', undefined, { Allow: 'GET, HEAD' });
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    } catch {
      return send(400, 'Invalid path');
    }
    if (pathname.includes('\0')) return send(400, 'Invalid path');
    let file = path.resolve(root, '.' + pathname);
    const relative = path.relative(root, file);
    if (relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative))
      return send(403, 'Outside preview root');
    try {
      if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
      const content = await readFile(file);
      return send(200, content, types[path.extname(file)] || 'application/octet-stream', {
        'Cache-Control': relative.startsWith('_next' + path.sep + 'static' + path.sep)
          ? 'public,max-age=31536000,immutable'
          : 'no-cache',
      });
    } catch (error) {
      if (!['ENOENT', 'ENOTDIR', 'EISDIR'].includes(error.code))
        return send(500, 'Preview read failed');
      try {
        return send(404, await readFile(path.join(root, '404.html')), types['.html']);
      } catch {
        return send(404, 'Not found');
      }
    }
  });
}
