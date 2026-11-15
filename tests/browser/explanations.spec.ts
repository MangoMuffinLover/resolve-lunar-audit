import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
const manifest = JSON.parse(await readFile('src/data/explain.v1.json', 'utf8'));
const folder = 'docs/screenshots/b04';
test.beforeAll(() => mkdir(folder, { recursive: true }).then(() => {}));

test('factor comparison → common-clock geometry → discrete product steps → exact factor return', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/factors/');
  await expect(page.getByTestId('factor-delta')).toContainText('+5.53 d');
  await page.getByRole('link', { name: 'Explain this comparison' }).click();
  await expect(page.getByTestId('matched-physical-explanation')).toBeVisible();
  await expect(page.getByTestId('explain-effect')).toHaveText('+5.53 d');
  await expect(page.getByTestId('explain-utc')).toHaveText('22 Nov, 15:00 UTC');
  await page.getByRole('checkbox', { name: 'Show sampled paths' }).check();
  await expect(page.locator('.explain-sun-path')).toHaveAttribute('d', /^M.+/);
  await page.getByTestId('explain-date').selectOption('2026-11-17');
  await page.getByTestId('explain-time').selectOption('14:30');
  await expect(page.locator('.explain-physical-state')).toContainText(
    'Before: Sun and Earth not both above',
  );
  await expect(page.locator('.explain-physical-state')).toContainText(
    'After: Sun and Earth both above',
  );
  const sun = await page.getByTestId('explain-sun-before').getAttribute('cx');
  const product = page.getByRole('slider', { name: 'Step through stored native LOLA products' });
  await product.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByTestId('explain-comparison-select')).toHaveValue(
    'terrain-P90_60m-fixed_absolute-uncensored_intersecting_registered',
  );
  await expect(page.getByTestId('matched-physical-explanation')).toBeVisible();
  await expect(page.getByTestId('explain-utc')).toHaveText('17 Nov, 14:30 UTC');
  expect(await page.getByTestId('explain-sun-before').getAttribute('cx')).toBe(sun);
  await page.getByRole('link', { name: 'Return to the exact factor comparison' }).click();
  await expect(page.getByTestId('factor-detail')).toContainText('P90 native 60 m');
  expect(errors).toEqual([]);
});

test('observer and reporting changes keep physical geometry separate from clipped interval claims', async ({
  page,
}) => {
  await page.goto('/explain/?comparison=observer-P104_5m-uncensored_intersecting_registered');
  await expect(page.getByTestId('matched-physical-explanation')).toBeVisible();
  await expect(page.getByTestId('explain-effect')).toHaveText('+4.29 d');
  await expect(page.locator('.observer-datum')).toContainText('0.6741943359375');
  await expect(page.locator('.observer-datum')).toContainText(
    'absolute observer elevation changes',
  );
  await expect(page.getByTestId('explain-sun-after')).toBeVisible();
  await page.goto('/explain/?comparison=domain-P78_5m-fixed_absolute');
  await expect(page.getByTestId('matched-physical-explanation')).toBeVisible();
  await page.getByTestId('explain-date').selectOption('2026-11-29');
  await page.getByTestId('explain-time').selectOption('00:00');
  await expect(page.getByTestId('explain-policy-note')).toContainText(
    'beyond the registered Nov 28 cutoff',
  );
  await expect(page.locator('.explain-physical-state')).toContainText(
    'Before: Sun and Earth both above',
  );
  await expect(page.locator('.endpoint-attribution')).toContainText(
    'Reporting boundary — not a physical set',
  );
  await expect(page.locator('.endpoint-attribution')).toContainText('Earth visibility end');
  await page.getByText('Inspect the saved terrain sections', { exact: true }).click();
  await expect(page.getByTestId('explain-terrain-section')).toBeVisible();
  await page.getByLabel('Saved sector').selectOption('native_80m_critical');
  await expect(page.getByTestId('explain-terrain-section')).toHaveAccessibleName(/151[.]0097/);
  await page.locator('.observer-datum').screenshot({
    path: `${folder}/observer-datum.png`,
    style: '.topbar,.skip-link{visibility:hidden}',
  });
});

test('unsupported studies and corrupt physical records never borrow a different skyline', async ({
  page,
}) => {
  const physicalRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/evidence/explain/')) physicalRequests.push(request.url());
  });
  await page.goto('/explain/?site=dGR203&comparison=clone_0001');
  await expect(page.getByTestId('explain-context-only')).toContainText('no R-01C skyline');
  await expect(page.getByTestId('explain-effect')).toHaveText('−2.65 min');
  await expect(page.getByTestId('matched-physical-explanation')).not.toBeVisible();
  expect(physicalRequests).toEqual([]);
  let broken = true;
  await page.route('**/evidence/explain/P90_80m_fixed_absolute.v1.json', (route) =>
    broken ? route.fulfill({ status: 200, body: '{}' }) : route.continue(),
  );
  await page.goto('/explain/');
  await expect(page.locator('.explain-error')).toContainText(
    'No previous comparison’s horizon is shown',
  );
  await expect(page.getByTestId('common-clock-sky')).not.toBeVisible();
  broken = false;
  await page.getByRole('button', { name: 'Retry physical evidence' }).click();
  await expect(page.getByTestId('common-clock-sky')).toBeVisible();
  await page.goto('/explain/?site=dGR201&comparison=unknown');
  await expect(page.locator('.explain-error')).toContainText('No physical model is substituted');
  await expect(page.getByTestId('common-clock-sky')).not.toBeVisible();
});

test('physical controls, saved sections and evidence reflow accessibly across desktop/mobile/tablet', async ({
  page,
}) => {
  const scans = [];
  for (const [label, width, height] of [
    ['desktop', 1440, 1000],
    ['mobile', 390, 844],
    ['tablet', 834, 1112],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/explain/');
    await expect(page.getByTestId('matched-physical-explanation')).toBeVisible();
    const clock = page.getByRole('slider', { name: 'Move through stored snapshots' });
    await clock.focus();
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowRight');
    await expect(page.getByTestId('explain-utc')).toHaveText('06 Nov, 00:30 UTC');
    await page.getByRole('checkbox', { name: 'Full 360° horizon' }).check();
    await page.getByText('Inspect the saved terrain sections', { exact: true }).click();
    await expect(page.getByTestId('explain-terrain-section')).toBeVisible();
    await page.getByText('Sources, exact records & interpretation limits', { exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const scan = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(scan.violations).toEqual([]);
    scans.push({
      viewport: label,
      violations: scan.violations,
      manualReview: scan.incomplete.map((item) => ({
        id: item.id,
        targets: item.nodes.map((node) => node.target),
      })),
    });
    await page.screenshot({ path: `${folder}/${label}.png`, fullPage: true });
  }
  await writeFile('docs/B04_ACCESSIBILITY.json', JSON.stringify(scans, null, 2));
});
