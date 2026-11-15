import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const folder = 'docs/screenshots/b03';
test.beforeAll(() => mkdir(folder, { recursive: true }).then(() => {}));

test('B-01 context survives the factor link and matched observer/domain comparisons update', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Audit this result', exact: true }).click();
  await page.getByText('Explore terrain representations', { exact: true }).click();
  await page.getByTestId('model-P104_5m').click();
  await page.getByText('Analysis definitions', { exact: true }).click();
  await page.getByTestId('observer-select').selectOption('each_surface_2m');
  await page.getByTestId('domain-select').selectOption('registered_domain');
  await page.getByRole('link', { name: 'Compare modeling choices' }).click();
  await expect(page.getByTestId('factor-detail')).toContainText('P104 SDEM 5 m');
  await expect(page.getByTestId('factor-observer')).toHaveValue('each_surface_2m');
  await expect(page.getByTestId('factor-domain')).toHaveValue('registered_domain');
  await page.getByTestId('factor-observer').selectOption('fixed_absolute');
  await page.getByTestId('factor-domain').selectOption('uncensored_intersecting_registered');
  await page.getByTestId('comparison-P90_80m').click();
  await expect(page.getByTestId('factor-delta')).toContainText('+5.53 d');
  await page.getByTestId('factor-observer').selectOption('each_surface_2m');
  await expect(page.getByTestId('factor-delta')).toContainText('+5.50 d');
  await page.getByTestId('factor-family-observer').click();
  await expect(page.getByTestId('factor-observer')).toBeDisabled();
  await page.getByTestId('comparison-P104_5m').click();
  await expect(page.getByTestId('factor-delta')).toContainText('+4.29 d');
  await page.getByTestId('factor-family-domain').click();
  await expect(page.getByTestId('factor-domain')).toBeDisabled();
  await page.getByTestId('factor-observer').selectOption('fixed_absolute');
  await page.getByTestId('comparison-P78_5m').click();
  await expect(page.getByTestId('factor-detail')).toContainText('5.38 d');
  await expect(page.getByTestId('factor-detail')).toContainText('7.40 d');
  await page.getByText('Inspect exact values, definitions & sources', { exact: true }).click();
  await expect(page.locator('.factor-evidence')).toContainText('5.379205887415619');
  const source = page.getByRole('link', { name: 'Download exact source file' }).first();
  expect((await page.request.get((await source.getAttribute('href'))!)).ok()).toBe(true);
  expect(errors).toEqual([]);
});

test('numerics, changed observables and the separate five-clone pilot keep their own scopes', async ({
  page,
}) => {
  await page.goto('/factors/');
  await expect(page.getByTestId('factor-delta')).toContainText('+5.53 d');
  await page.getByTestId('factor-family-temporal').click();
  await expect(page.getByTestId('factor-detail')).toContainText(/numerical convergence/i);
  await expect(page.getByTestId('factor-delta')).toContainText('ms');
  await page.getByTestId('factor-family-semantics').click();
  await expect(page.getByTestId('factor-detail')).toContainText('R-01B primary');
  await expect(page.getByTestId('factor-detail')).toContainText('5.40 d');
  await expect(page.getByTestId('factor-detail')).toContainText('different physical observables');
  await page.getByTestId('factor-family-stochastic').click();
  await expect(page.getByTestId('factor-unassessed')).toContainText(
    'No matched official-clone pilot',
  );
  await expect(page.getByTestId('factor-detail')).not.toBeVisible();
  await page.getByRole('button', { name: 'Inspect the separate dGR203 five-clone pilot' }).click();
  await expect(page.getByTestId('factor-scope-domain')).toContainText('Oct 1–Dec 15');
  await expect(page.getByTestId('factor-detail')).toContainText('13.23 d');
  await expect(page.getByTestId('factor-detail')).toContainText('not a calibrated probability');
  await expect(page.locator('.factor-comparison-list button')).toHaveCount(5);
  await page.getByTestId('factor-metric').selectOption('earth');
  await expect(page.getByTestId('factor-delta')).toContainText('h');
  await page.getByTestId('factor-family-temporal').click();
  await page.getByTestId('factor-metric').selectOption('simultaneous');
  await expect(page.getByTestId('factor-scope-domain')).toContainText('Nov 6–28');
  await expect(page.getByTestId('factor-detail')).toContainText('8.47 d');
  await expect(page.getByTestId('factor-detail')).toContainText('8.00 d');
});

test('unsupported contexts and corrupted evidence never reuse another site result', async ({
  page,
}) => {
  await page.goto('/factors/?site=dGR201');
  await expect(page.locator('.factor-error')).toContainText(
    'requested audit context is unavailable',
  );
  await expect(page.getByTestId('factor-detail')).not.toBeVisible();
  await page.getByRole('button', { name: 'Reset to supported audit' }).click();
  await expect(page.getByTestId('factor-detail')).toBeVisible();
  let broken = true;
  await page.route('**/evidence/factors/dGR203.v1.json', (route) =>
    broken ? route.fulfill({ status: 200, body: '{}' }) : route.continue(),
  );
  await page.getByTestId('factor-site').selectOption('dGR203');
  await expect(page.locator('.factor-error')).toContainText('No previous site’s result is shown');
  await expect(page.getByTestId('factor-detail')).not.toBeVisible();
  broken = false;
  await page.getByRole('button', { name: 'Retry audit evidence' }).click();
  await expect(page.getByTestId('factor-detail')).toContainText('R-01B dGR203');
});

test('factor audit supports keyboard selection and responsive accessible evidence views', async ({
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
    await page.goto('/factors/');
    await expect(page.getByTestId('factor-detail')).toBeVisible();
    if (width < 600) {
      await page
        .getByTestId('factor-comparison-select')
        .selectOption('terrain-P104_5m-fixed_absolute-uncensored_intersecting_registered');
    } else {
      await page.getByTestId('comparison-P104_5m').focus();
      await page.keyboard.press('Enter');
    }
    await expect(page.getByTestId('factor-detail')).toContainText('P104 SDEM 5 m');
    await page.getByText('Inspect exact values, definitions & sources', { exact: true }).click();
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
  await writeFile('docs/B03_ACCESSIBILITY.json', JSON.stringify(scans, null, 2));
});
