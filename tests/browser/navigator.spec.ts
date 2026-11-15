import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const manifest = JSON.parse(await readFile('src/data/navigator.v1.json', 'utf8'));
const folder = 'docs/screenshots/b02';
test.beforeAll(() => mkdir(folder, { recursive: true }).then(() => {}));

test('site/date selection → real Sun/Earth geometry → saved comparisons → scoped audit', async ({
  page,
}) => {
  const errors: string[] = [],
    failures: string[] = [],
    external: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('requestfailed', (request) => failures.push(request.url()));
  page.on('request', (request) => {
    if (!request.url().startsWith(test.info().project.use.baseURL || 'http://127.0.0.1:3000'))
      external.push(request.url());
  });
  await page.goto('/');
  await page.getByRole('link', { name: 'Explore sites & dates' }).click();
  await expect(page.getByTestId('navigator-sky')).toBeVisible();
  await expect(page.getByTestId('navigator-utc')).toHaveText('22 Nov, 15:00 UTC');
  await expect(page.getByTestId('navigator-together')).toHaveText(
    'Sun and Earth centers are both above the modeled horizon.',
  );
  await expect(page.locator('.navigator-result .snapshot-opportunity')).toContainText(
    'days remaining',
  );
  await page.screenshot({ path: path.join(folder, '01-navigator-desktop.png'), fullPage: true });
  const sunAtFirstTime = await page.getByTestId('navigator-sun-marker').getAttribute('cx');
  await page.getByRole('button', { name: 'SAVE FOR COMPARISON', exact: true }).click();
  await page.getByTestId('navigator-date').selectOption('2026-11-10');
  await expect(page.getByTestId('navigator-together')).toHaveText(
    'Sun and Earth centers are not both above the modeled horizon.',
  );
  await expect(page.locator('.navigator-result .snapshot-opportunity')).toContainText(
    'Next overlap begins 22 Nov',
  );
  expect(await page.getByTestId('navigator-sun-marker').getAttribute('cx')).not.toBe(
    sunAtFirstTime,
  );
  await page.getByRole('button', { name: 'SAVE FOR COMPARISON', exact: true }).click();
  await page.getByTestId('navigator-site').selectOption('dGR201');
  await expect(page.getByTestId('navigator-sky')).toHaveAccessibleName(/dGR201/);
  await expect(page.getByTestId('navigator-utc')).toHaveText('10 Nov, 15:00 UTC');
  await page.getByRole('button', { name: 'SAVE FOR COMPARISON', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Compare saved scenarios (3/3)' })).toBeVisible();
  await expect(page.locator('.navigator-saved')).toHaveCount(3);
  await expect(page.getByTestId('navigator-save')).toBeDisabled();
  await page.getByRole('button', { name: 'Inspect scenario 1' }).click();
  await expect(page.getByTestId('navigator-site')).toHaveValue('dGR101');
  await expect(page.getByTestId('navigator-date')).toHaveValue('2026-11-22');
  await expect(page.getByTestId('navigator-time')).toHaveValue('15:00');
  await page.getByRole('button', { name: 'Remove scenario 2' }).click();
  await expect(page.locator('.navigator-saved')).toHaveCount(2);
  await page.locator('.navigator-comparisons').screenshot({
    path: path.join(folder, '02-saved-comparisons.png'),
    style: '.topbar,.skip-link{visibility:hidden}',
  });
  const selected = await page.request.get(manifest.sites[0].href);
  expect(await selected.body()).toEqual(
    await readFile(path.join('public', manifest.sites[0].href)),
  );
  await page.getByRole('link', { name: 'OPEN dGR101’S CASE STUDY AUDIT' }).click();
  await expect(page.getByTestId('initial-duration')).toHaveText('7.40DAYS');
  expect(errors).toEqual([]);
  expect(failures).toEqual([]);
  expect(external).toEqual([]);
});

test('all supported site and date endpoints render their own stored record; keyboard slider works', async ({
  page,
}) => {
  await page.goto('/navigator/');
  for (const site of manifest.sites) {
    const data = JSON.parse(await readFile(path.join('public', site.href), 'utf8'));
    await page.getByTestId('navigator-site').selectOption(site.id);
    await expect(page.getByTestId('navigator-sky')).toHaveAccessibleName(new RegExp(site.id));
    for (const [date, time, index] of [
      ['2026-11-06', '00:00', 0],
      ['2026-11-27', '23:30', 1055],
    ] as const) {
      await page.getByTestId('navigator-date').selectOption(date);
      await page.getByTestId('navigator-time').selectOption(time);
      await expect(page.getByTestId('navigator-together')).toHaveText(
        data.samples[index].simultaneous_visible
          ? 'Sun and Earth centers are both above the modeled horizon.'
          : 'Sun and Earth centers are not both above the modeled horizon.',
      );
    }
    const slider = page.getByRole('slider', { name: 'Move through stored snapshots' });
    await slider.focus();
    await page.keyboard.press('Home');
    await expect(slider).toHaveValue('0');
    await expect(page.getByRole('button', { name: 'Previous 30 min' })).toBeDisabled();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByTestId('navigator-time')).toHaveValue('00:30');
    await page.getByText(`Sources, exact intervals & model definitions for ${site.id}`).click();
    await expect(page.locator('.navigator-evidence')).toContainText(site.validation);
  }
  await expect(
    page.getByRole('link', { name: 'OPEN dGR101’S CASE STUDY AUDIT' }),
  ).not.toBeVisible();
});

test('navigator reflows on mobile/tablet and passes tested automated accessibility states', async ({
  page,
}) => {
  const scans = [];
  for (const [label, width, height] of [
    ['desktop', 1440, 1000],
    ['mobile', 390, 844],
    ['tablet', 834, 1112],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.goto('/navigator/');
    await expect(page.getByTestId('navigator-sky')).toBeVisible();
    await page.getByRole('button', { name: 'SAVE FOR COMPARISON', exact: true }).click();
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
    await page.screenshot({ path: path.join(folder, `03-navigator-${label}.png`), fullPage: true });
  }
  await writeFile('docs/B02_ACCESSIBILITY.json', JSON.stringify(scans, null, 2));
});

test('missing or corrupted selected-site data hides stale results and can retry', async ({
  page,
}) => {
  let broken = true;
  await page.route('**/evidence/navigator/dGR201.v1.json', (route) =>
    broken
      ? route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: '{"schema":"resolve.navigator.site.v1","site":{"id":"dGR101"}}',
        })
      : route.continue(),
  );
  await page.goto('/navigator/');
  await expect(page.getByTestId('navigator-sky')).toBeVisible();
  await page.getByTestId('navigator-site').selectOption('dGR201');
  await expect(
    page.getByRole('region', { name: 'Selected site result' }).getByRole('alert'),
  ).toContainText('No result is shown.');
  await expect(page.getByTestId('navigator-sky')).not.toBeVisible();
  await expect(
    page.getByRole('button', { name: 'SAVE FOR COMPARISON', exact: true }),
  ).toBeDisabled();
  broken = false;
  await page.getByRole('button', { name: 'Retry selected site' }).click();
  await expect(page.getByTestId('navigator-sky')).toHaveAccessibleName(/dGR201/);
});
