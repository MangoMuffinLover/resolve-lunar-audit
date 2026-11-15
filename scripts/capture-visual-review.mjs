import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { createPreviewServer } from './preview-server.mjs';
const origin = process.env.RESOLVE_PREVIEW_URL || 'http://127.0.0.1:3090';
const folder = 'artifacts/touch-screenshots';
await mkdir(folder, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const scans = [],
  layout = [],
  performanceRuns = [];
let baselineServer;
async function screenshot(page, name, locator) {
  if (locator)
    await locator.screenshot({
      path: `${folder}/${name}.png`,
      style: '.site-header,.skip-link{visibility:hidden!important}',
    });
  else await page.screenshot({ path: `${folder}/${name}.png` });
}
async function scan(page, state) {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  scans.push({
    state,
    violations: result.violations,
    manual_review: result.incomplete.map((v) => ({
      id: v.id,
      targets: v.nodes.map((n) => n.target),
    })),
  });
}
try {
  const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: 'reduce',
    }),
    page = await context.newPage();
  for (const [device, width, height] of [
    ['desktop', 1440, 1000],
    ['mobile', 390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto(origin);
    await page.evaluate(() => document.fonts.ready);
    await screenshot(page, `${device}-hero`);
    await scan(page, `${device}/hero`);
    const audit = await page
      .getByRole('button', { name: 'Audit this result', exact: true })
      .boundingBox();
    await page.getByRole('button', { name: 'Audit this result', exact: true }).click();
    await expect(page.getByTestId('selected-duration')).toHaveText('12.92DAYS');
    await expect(page.getByTestId('fracture-sky')).toBeVisible();
    await screenshot(page, `${device}-audit`, page.getByTestId('model-fracture'));
    await screenshot(page, `${device}-model-sensitive`, page.locator('.fracture-readout'));
    await screenshot(page, `${device}-model-scrubber`, page.getByTestId('model-scrub'));
    await scan(page, `${device}/audit`);
    await page
      .getByRole('button', { name: 'Inspect native 5 metre representation', exact: true })
      .click();
    await screenshot(page, `${device}-5m`, page.getByTestId('model-fracture'));
    await page
      .getByRole('button', { name: 'Inspect native 80 metre representation', exact: true })
      .click();
    await screenshot(page, `${device}-80m`, page.getByTestId('model-fracture'));
    await page.getByRole('button', { name: 'Isolate the Sun', exact: true }).click();
    await screenshot(page, `${device}-same-sun`, page.getByTestId('model-fracture'));
    await page.getByRole('button', { name: 'See why it changes', exact: true }).click();
    await expect(page.getByTestId('near-field-profile')).toBeVisible();
    await expect(page.getByTestId('audit-mechanism')).toBeVisible();
    await screenshot(page, `${device}-physical-step1`, page.getByTestId('physical-reveal'));
    await page.getByRole('button', { name: '2. Compare the 80 m profile', exact: true }).click();
    await screenshot(page, `${device}-physical-step2`, page.getByTestId('physical-reveal'));
    await page.getByRole('button', { name: '3. Locate event witnesses', exact: true }).click();
    await screenshot(page, `${device}-physical-mechanism`, page.getByTestId('physical-reveal'));
    await screenshot(page, `${device}-3d-poster`, page.getByTestId('terrain-study'));
    await page.getByRole('button', { name: 'Explore the terrain in 3D' }).click();
    const terrain = page.getByTestId('terrain-study');
    await expect(
      terrain
        .getByRole('group', { name: '3D camera views' })
        .or(terrain.getByRole('button', { name: 'Retry 3D' })),
    ).toBeVisible();
    if (await terrain.getByRole('group', { name: '3D camera views' }).count()) {
      await screenshot(page, `${device}-3d-oblique`, terrain);
      await scan(page, `${device}/interactive-3D`);
      await terrain.getByRole('button', { name: 'Look across the rim', exact: true }).click();
      await screenshot(page, `${device}-3d-rim`, terrain);
      await terrain.getByRole('button', { name: 'Top view', exact: true }).click();
      await screenshot(page, `${device}-3d-top`, terrain);
    }
    await screenshot(page, `${device}-negative-control`, page.getByTestId('negative-finding'));
    await screenshot(page, `${device}-research-journey`, page.getByTestId('research-journey'));
    await scan(page, `${device}/expanded-proof`);
    await page.getByRole('button', { name: 'Result evidence', exact: true }).click();
    await scan(page, `${device}/source-dialog`);
    await page.keyboard.press('Escape');
    layout.push({
      device,
      width,
      height,
      audit_button: audit,
      horizontal_overflow: await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(
    `${origin}/explain/?comparison=observer-P104_5m-uncensored_intersecting_registered&metric=simultaneous`,
  );
  await expect(page.getByTestId('observer-datum-plot')).toBeVisible();
  await screenshot(page, 'observer-comparison', page.locator('.observer-datum'));
  await page.goto(`${origin}/navigator/`);
  await expect(page.getByTestId('navigator-sky')).toBeVisible();
  await screenshot(page, 'navigator');
  await screenshot(page, 'navigator-geometry', page.locator('.navigator-sky'));
  await scan(page, 'navigator');
  await page.goto(`${origin}/science/`);
  await screenshot(page, 'evidence');
  await screenshot(page, 'evidence-research-journey', page.getByTestId('research-journey'));
  await scan(page, 'evidence');
  await context.close();
  // Restore the reviewed baseline to a temporary artifact directory from Git,
  // then compare two local HTTP exports under identical lab conditions.
  const baseline = path.resolve('artifacts/baseline');
  await mkdir(baseline, { recursive: true });
  const archive = execFileSync(
    'git',
    ['archive', '87cc57f47dc858bbf5dc791c42c9870ab3d411c5', 'site'],
    { maxBuffer: 32 * 1024 * 1024 },
  );
  execFileSync('tar', ['-x', '-C', baseline], { input: archive });
  baselineServer = createPreviewServer(path.join(baseline, 'site'));
  await new Promise((resolve) => baselineServer.listen(0, '127.0.0.1', resolve));
  const baselineOrigin = `http://127.0.0.1:${baselineServer.address().port}`;
  for (const [version, url] of [
    ['baseline', baselineOrigin],
    ['cinematic', origin],
  ])
    for (const [device, width, height] of [
      ['desktop', 1440, 1000],
      ['mobile', 390, 844],
    ]) {
      const c = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' }),
        p = await c.newPage();
      await p.addInitScript(() => {
        window.__resolveLCP = 0;
        window.__resolveCLS = 0;
        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) window.__resolveLCP = e.startTime;
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) if (!e.hadRecentInput) window.__resolveCLS += e.value;
        }).observe({ type: 'layout-shift', buffered: true });
      });
      await p.goto(url);
      await p.evaluate(() => document.fonts.ready);
      await p.waitForTimeout(700);
      const timing = await p.evaluate(() => ({
        fcp_ms: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
        lcp_ms: window.__resolveLCP,
        cls: window.__resolveCLS,
        document_bytes: performance.getEntriesByType('navigation')[0].decodedBodySize,
        resources: performance.getEntriesByType('resource').map((r) => ({
          path: new URL(r.name).pathname,
          bytes: r.decodedBodySize,
          transfer: r.transferSize,
          kind: r.initiatorType,
        })),
      }));
      const start = Date.now();
      await p.getByRole('button', { name: 'Audit this result', exact: true }).click();
      await p.getByTestId('selected-duration').waitFor();
      performanceRuns.push({ version, device, ...timing, audit_latency_ms: Date.now() - start });
      await c.close();
    }
  const motionContext = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: 'no-preference',
    }),
    motionPage = await motionContext.newPage();
  await motionPage.goto(origin);
  await motionPage.evaluate(() => document.fonts.ready);
  await expect(motionPage.getByTestId('fracture-sky')).toBeVisible();
  const before = await motionPage.getByTestId('fracture-sun').boundingBox(),
    referenceBefore = await motionPage.getByTestId('initial-duration').boundingBox();
  await motionPage.evaluate(() => {
    window.__resolveFrames = [];
    const start = performance.now();
    let previous = start;
    function tick(time) {
      window.__resolveFrames.push(time - previous);
      previous = time;
      if (time - start < 4500) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
  await motionPage.getByRole('button', { name: 'Audit this result', exact: true }).click();
  await expect(motionPage.getByTestId('selected-duration')).toHaveText('12.92DAYS');
  await motionPage.waitForTimeout(4500);
  const after = await motionPage.getByTestId('fracture-sun').boundingBox(),
    referenceAfter = await motionPage.getByTestId('initial-duration').boundingBox();
  const frames = await motionPage.evaluate(() => window.__resolveFrames);
  frames.sort((a, b) => a - b);
  await motionContext.close();
  await writeFile(
    'artifacts/performance.json',
    JSON.stringify(
      {
        conditions: `Single cold browser context per run. ${process.platform}, Microsoft Edge ${browser.version()} headless, local loopback, no CPU/network throttling. Memory-constrained local machine. Indicative lab observations, not field Core Web Vitals.`,
        runs: performanceRuns,
        motion: {
          samples: frames.length,
          median_frame_ms: frames[Math.floor(frames.length * 0.5)],
          p95_frame_ms: frames[Math.floor(frames.length * 0.95)],
          sun_before: before,
          sun_after: after,
          reference_before: referenceBefore,
          reference_after: referenceAfter,
        },
      },
      null,
      2,
    ),
  );
  await writeFile('artifacts/accessibility.json', JSON.stringify(scans, null, 2));
  await writeFile('artifacts/mobile-layout.json', JSON.stringify(layout, null, 2));
  console.log(
    JSON.stringify({
      screenshots: folder,
      accessibility_states: scans.length,
      violations: scans.reduce((n, s) => n + s.violations.length, 0),
      layout,
      performance: performanceRuns.map(
        ({ version, device, fcp_ms, lcp_ms, cls, audit_latency_ms }) => ({
          version,
          device,
          fcp_ms,
          lcp_ms,
          cls,
          audit_latency_ms,
        }),
      ),
    }),
  );
  if (scans.some((s) => s.violations.length)) process.exitCode = 1;
} finally {
  if (baselineServer) baselineServer.close();
  await browser.close();
}
