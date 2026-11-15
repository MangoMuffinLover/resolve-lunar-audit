import { chromium, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
const origin = process.env.RESOLVE_PREVIEW_URL || 'http://127.0.0.1:3010';
await mkdir('artifacts/touch-motion', { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: 'no-preference',
    recordVideo: { dir: 'artifacts/touch-motion', size: { width: 390, height: 844 } },
  });
  const page = await context.newPage(),
    errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(origin);
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole('button', { name: 'Audit this result', exact: true }).tap();
  await page.waitForTimeout(2500);
  await expect(page.getByTestId('selected-duration')).toHaveText('12.92DAYS');
  const underlineSeconds = await page
    .getByTestId('selected-duration')
    .evaluate((el) => getComputedStyle(el, '::after').animationDuration);
  await page.getByRole('button', { name: 'Isolate the Sun', exact: true }).tap();
  await page.waitForTimeout(2500);
  await expect(page.locator('.sun-insight')).toBeVisible();
  await page.getByRole('button', { name: 'See why it changes', exact: true }).tap();
  await page.getByRole('button', { name: '2. Compare the 80 m profile', exact: true }).tap();
  await page.waitForTimeout(2800);
  await page.getByRole('button', { name: '3. Locate event witnesses', exact: true }).tap();
  await page.waitForTimeout(2800);
  const study = page.getByTestId('terrain-study');
  await study.getByRole('button', { name: 'Explore the terrain in 3D' }).tap();
  await expect(study.getByRole('group', { name: '3D camera views' })).toBeVisible();
  await page.waitForTimeout(1500);
  await study.scrollIntoViewIfNeeded();
  const canvas = study.locator('canvas'),
    hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
  const first = hash(await canvas.screenshot());
  await page.waitForTimeout(700);
  const second = hash(await canvas.screenshot());
  await page.evaluate(() => {
    window.__terrainFrames = [];
    let previous = performance.now(),
      start = previous;
    function frame(time) {
      window.__terrainFrames.push(time - previous);
      previous = time;
      if (time - start < 3000) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
  const start = Date.now();
  await study.getByRole('button', { name: 'Look across the rim', exact: true }).tap();
  await expect(study.locator('.terrain-viewport')).toHaveAttribute('data-state', 'moving');
  await expect(study.locator('.terrain-viewport')).toHaveAttribute('data-state', 'settled');
  const duration = Date.now() - start;
  const rim = hash(await canvas.screenshot());
  await study.getByRole('button', { name: 'Top view', exact: true }).tap();
  await expect(study.locator('.terrain-viewport')).toHaveAttribute('data-state', 'settled');
  const top = hash(await canvas.screenshot());
  const frames = await page.evaluate(() => window.__terrainFrames);
  frames.sort((a, b) => a - b);
  await page.waitForTimeout(1000);
  await study.getByRole('button', { name: 'Use still render', exact: true }).tap();
  await expect(study.locator('canvas')).toHaveCount(0);
  await expect(study.locator('img')).not.toHaveClass(/is-hidden/);
  const video = page.video();
  await context.close();
  await video.saveAs('artifacts/touch-motion/reviewer-tap-tour.webm');
  const result = {
    touch_enabled: true,
    viewport: [390, 844],
    result_underline_duration: underlineSeconds,
    camera_transition_ms: duration,
    configured_camera_duration_ms: 2600,
    idle_canvas_hashes: [first, second],
    idle_canvas_unchanged: first === second,
    camera_view_hashes: { oblique: first, rim, top },
    camera_views_differ: first !== rim && rim !== top,
    frame_samples: frames.length,
    median_frame_ms: frames[Math.floor(frames.length * 0.5)],
    p95_frame_ms: frames[Math.floor(frames.length * 0.95)],
    console_errors: errors,
  };
  await writeFile('artifacts/touch-motion-verification.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
  if (!result.idle_canvas_unchanged || !result.camera_views_differ || errors.length)
    process.exitCode = 1;
} finally {
  await browser.close();
}
