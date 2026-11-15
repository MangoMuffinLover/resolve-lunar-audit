import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const origin = process.env.RESOLVE_PREVIEW_URL || 'http://127.0.0.1:3010';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const records = [];
async function inspect(page, width, state) {
  const result = await page.evaluate(() => {
    const failures = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode,
        parent = node.parentElement;
      if (
        !node.textContent.trim() ||
        !parent ||
        parent.closest('script,style,.skip-link,.sr-only,.visually-hidden')
      )
        continue;
      if (getComputedStyle(parent).visibility === 'hidden') continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      const owner =
        parent.closest(
          'button,.fracture-selected-result,.fracture-reference-result,.ray-pair article,.terrain-study,.physical-reveal,.model-fracture,main',
        ) || document.body;
      const limit = owner.getBoundingClientRect();
      for (const rect of range.getClientRects()) {
        if (rect.width === 0 || rect.height === 0) continue;
        if (
          rect.left < Math.max(0, limit.left) - 1.5 ||
          rect.right > Math.min(innerWidth, limit.right) + 1.5
        )
          failures.push({
            text: node.textContent.trim().slice(0, 100),
            owner: owner.className,
            left: rect.left,
            right: rect.right,
            allowed: [limit.left, limit.right],
          });
      }
    }
    return { horizontal_overflow: document.documentElement.scrollWidth > innerWidth, failures };
  });
  records.push({ width, state, ...result });
}
try {
  const context = await browser.newContext({ reducedMotion: 'reduce' }),
    page = await context.newPage();
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(origin);
    await page.evaluate(() => document.fonts.ready);
    await inspect(page, width, 'opening');
    await page.getByRole('button', { name: 'Audit this result', exact: true }).click();
    await inspect(page, width, 'comparison');
    await page.getByRole('button', { name: 'Isolate the Sun', exact: true }).click();
    await inspect(page, width, 'fixed-sun');
    await page.getByRole('button', { name: 'See why it changes', exact: true }).click();
    await expect(page.getByTestId('near-field-profile')).toBeVisible();
    await page.getByRole('button', { name: '3. Locate event witnesses', exact: true }).click();
    await inspect(page, width, 'physical-and-3D');
  }
} finally {
  await browser.close();
}
await mkdir('artifacts', { recursive: true });
await writeFile('artifacts/margin-audit.json', JSON.stringify(records, null, 2));
const failed = records.filter((r) => r.horizontal_overflow || r.failures.length);
console.log(JSON.stringify({ states: records.length, failed }, null, 2));
if (failed.length) process.exitCode = 1;
