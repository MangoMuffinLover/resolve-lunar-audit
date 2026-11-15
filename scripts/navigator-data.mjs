import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extract, scienceRoot, webRoot } from './extract.mjs';
import { extractFactors } from './extract-factors.mjs';
import { extractScience } from './build-science.mjs';

const navigatorOnly = process.argv.includes('--navigator-only');
const explanationsOnly = process.argv.includes('--explanations-only');
await extract({ verifyOnly: navigatorOnly || explanationsOnly });
const python =
  process.env.RESOLVE_PYTHON ||
  path.join(
    scienceRoot,
    process.platform === 'win32' ? '.venv/Scripts/python.exe' : '.venv/bin/python',
  );
async function runProductScript(filename) {
  await new Promise((resolve, reject) => {
    const child = spawn(
      python,
      [
        fileURLToPath(new URL(filename, import.meta.url)),
        '--science-root',
        scienceRoot,
        '--web-root',
        webRoot,
      ],
      {
        stdio: 'inherit',
        windowsHide: true,
        env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
      },
    );
    child.on('error', (error) =>
      reject(
        new Error(
          `Product generation needs the research Python environment. Set RESOLVE_PYTHON if needed. ${error.message}`,
        ),
      ),
    );
    child.on('exit', (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${filename} failed (${code}); do not publish this export.`)),
    );
  });
}
if (!explanationsOnly) await runProductScript('./build-navigator.py');
if (!navigatorOnly) {
  await extractFactors();
  await runProductScript('./build-explanations.py');
  if (!explanationsOnly) await extractScience();
}
