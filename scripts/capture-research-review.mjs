import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const origin = process.env.RESOLVE_PREVIEW_URL || 'http://127.0.0.1:3010';
const folder = 'artifacts/research-atlas';
await mkdir(folder, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const scans = [],
  errors = [],
  states = [];
try {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  async function capture(name, locator) {
    if (locator)
      await locator.screenshot({
        path: `${folder}/${name}.png`,
        style: '.site-header,.skip-link{visibility:hidden!important}',
      });
    else await page.screenshot({ path: `${folder}/${name}.png` });
  }
  async function scan(state) {
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    scans.push({
      state,
      violations: result.violations,
      manual_review: result.incomplete.map((v) => v.id),
    });
  }
  for (const [device, width, height] of [
    ['desktop', 1440, 1000],
    ['mobile', 390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto(origin);
    await page.evaluate(() => document.fonts.ready);
    await capture(`${device}-opening`);
    await scan(`${device}/opening`);
    await page.getByRole('button', { name: 'Audit this result', exact: true }).click();
    await expect(page.getByTestId('selected-duration')).toHaveText('12.92DAYS');
    await capture(`${device}-audit`, page.getByTestId('model-fracture'));
    await scan(`${device}/audit`);
    await page.getByRole('button', { name: 'See why it changes', exact: true }).click();
    await expect(page.getByTestId('near-field-profile')).toBeVisible();
    await page.getByRole('button', { name: '2. Compare the 80 m profile', exact: true }).click();
    await expect(page.locator('.profile-difference')).toBeVisible();
    await capture(`${device}-profile`, page.locator('.near-field-figure'));
    await capture(`${device}-terrain`, page.getByTestId('terrain-study'));
    await page.getByRole('button', { name: 'Explore the terrain in 3D' }).click();
    await expect(page.locator('.terrain-webgl')).toHaveClass(/is-ready/);
    await capture(`${device}-interactive`, page.getByTestId('terrain-study'));
    await page.getByRole('button', { name: 'Top view', exact: true }).click();
    await expect(page.locator('.terrain-viewport')).toHaveAttribute('data-state', 'settled');
    await capture(`${device}-top`, page.getByTestId('terrain-study'));
    await scan(`${device}/expanded`);
    states.push({
      device,
      overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const route of ['navigator', 'science']) {
    await page.goto(`${origin}/${route}/`);
    await page.evaluate(() => document.fonts.ready);
    await capture(route);
    await scan(route);
  }
} finally {
  await browser.close();
}
await writeFile(`${folder}/verification.json`, JSON.stringify({ scans, errors, states }, null, 2));
console.log(
  JSON.stringify(
    {
      scans: scans.length,
      violations: scans.flatMap((s) =>
        s.violations.map((v) => ({
          state: s.state,
          id: v.id,
          targets: v.nodes.map((n) => n.target),
        })),
      ),
      errors,
      states,
    },
    null,
    2,
  ),
);
if (errors.length || scans.some((s) => s.violations.length) || states.some((s) => s.overflow))
  process.exitCode = 1;
