import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const folder = 'docs/screenshots/b06';
test.beforeAll(() => mkdir(folder, { recursive: true }).then(() => {}));

test('guided result → audit → physical mechanism → controls → negative evidence → full product', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('link', { name: 'Guided demo', exact: true }).click();
  await expect(page.getByTestId('demo-result')).toContainText('7.40');
  await page.getByRole('button', { name: 'Audit this result' }).click();
  await expect(page.getByTestId('demo-audit')).toContainText('+5.53 days');
  await expect(page.getByTestId('demo-audit')).toContainText('not designated more accurate');
  await expect(page.getByTestId('demo-step-title')).toBeFocused();
  await page.getByRole('button', { name: 'Next: Why' }).click();
  await expect(page.getByTestId('demo-mechanism')).toContainText('17 Nov, 14:30 UTC, 2026');
  await expect(page.getByTestId('common-clock-sky')).toBeVisible();
  await expect(page.locator('.demo-visibility')).toContainText('not both above');
  await page.getByText('Trace the onset to sampled terrain', { exact: true }).click();
  await expect(page.getByTestId('demo-mechanism')).toContainText('49.125 m');
  await expect(page.getByTestId('demo-mechanism')).toContainText('2.017 km');
  await page.getByRole('button', { name: 'Next: Assumptions' }).click();
  await expect(page.getByTestId('demo-observer-result')).toContainText('2.99 days');
  await page.getByTestId('demo-observer').selectOption('each_surface_2m');
  await expect(page.getByTestId('demo-observer-result')).toContainText('7.27 days');
  await expect(page.getByTestId('demo-assumptions')).toContainText('5.38 days clipped');
  await page.getByRole('button', { name: 'Next: Negative evidence' }).click();
  await expect(page.getByTestId('demo-negative')).toContainText('5 of 5 tested clones');
  await expect(page.getByTestId('demo-negative')).toContainText(
    'not establish universal stability',
  );
  await page.getByRole('button', { name: 'Next: Evidence & use' }).click();
  await expect(page.getByTestId('demo-evidence')).toContainText('dGR101, dGR201, dGR204');
  await page.getByRole('button', { name: 'Restart demonstration' }).click();
  await expect(page.getByTestId('demo-result')).toBeVisible();
  await page.getByRole('button', { name: '4 Assumptions', exact: true }).click();
  await expect(page.getByTestId('demo-observer')).toHaveValue('fixed_absolute');
  expect(errors).toEqual([]);
});

test('deep product links retain comparison, observer, metric and common clock', async ({
  page,
}) => {
  await page.goto('/demo/');
  await page.getByRole('button', { name: '3 Why', exact: true }).click();
  await expect(page.getByTestId('demo-mechanism')).toBeVisible();
  await page.getByRole('link', { name: 'Inspect the full physical explanation' }).click();
  await expect(page.getByTestId('explain-utc')).toHaveText('17 Nov, 14:30 UTC');
  await expect(page.getByTestId('explain-effect')).toHaveText('+5.53 d');
  await page.goto('/demo/');
  await page.getByRole('button', { name: '6 Evidence & use', exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download the source review packet' }).click();
  expect((await download).suggestedFilename()).toBe('review-packet.v1.json');
  await page.getByRole('link', { name: 'Open the Site & Date Navigator' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Compare the opportunity');
});

test('missing geometry and corrupt pilot suppress affected evidence and can recover', async ({
  page,
}) => {
  let geometryBroken = true,
    controlBroken = true;
  await page.route('**/evidence/explain/P90_80m_fixed_absolute.v1.json', (r) =>
    geometryBroken ? r.fulfill({ status: 404, body: 'missing' }) : r.continue(),
  );
  await page.route('**/evidence/factors/dGR203.v1.json', (r) =>
    controlBroken ? r.fulfill({ status: 200, body: '{}' }) : r.continue(),
  );
  await page.goto('/demo/');
  await page.getByRole('button', { name: '3 Why', exact: true }).click();
  await expect(page.locator('.demo-error')).toContainText(
    'No skyline or visibility state is shown',
  );
  await expect(page.getByTestId('common-clock-sky')).not.toBeVisible();
  geometryBroken = false;
  await page.getByRole('button', { name: 'Retry demo geometry' }).click();
  await expect(page.getByTestId('common-clock-sky')).toBeVisible();
  await page.getByRole('button', { name: '5 Negative evidence', exact: true }).click();
  await expect(page.locator('.demo-error')).toContainText(
    'No clone range or classification is shown',
  );
  await expect(page.getByTestId('demo-negative')).not.toBeVisible();
  controlBroken = false;
  await page.getByRole('button', { name: 'Retry demo control' }).click();
  await expect(page.getByTestId('demo-negative')).toContainText('13.225631–13.226919');
});

test('manual steps and evidence support keyboard, responsive viewports and tested accessibility states', async ({
  page,
}) => {
  const scans = [];
  const external: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith((test.info().project.use.baseURL || 'http://127.0.0.1:3000') + '/'))
      external.push(r.url());
  });
  for (const [label, width, height] of [
    ['desktop', 1440, 1000],
    ['mobile', 390, 844],
    ['tablet', 834, 1112],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/demo/');
    const nav = page.getByRole('navigation', { name: 'Demonstration steps' });
    await nav.getByRole('button', { name: '2 Audit', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('demo-audit')).toBeVisible();
    for (const [name, id] of [
      ['1 Result', 'demo-result'],
      ['2 Audit', 'demo-audit'],
      ['3 Why', 'demo-mechanism'],
      ['4 Assumptions', 'demo-assumptions'],
      ['5 Negative evidence', 'demo-negative'],
      ['6 Evidence & use', 'demo-evidence'],
    ] as const) {
      await nav.getByRole('button', { name, exact: true }).click();
      await expect(page.getByTestId(id)).toBeVisible();
      if (id === 'demo-result')
        await page.getByText('Exact result and scope', { exact: true }).click();
      if (id === 'demo-mechanism')
        await page.getByText('Trace the onset to sampled terrain', { exact: true }).click();
      if (id === 'demo-evidence')
        await page.getByText('Numerical checks and remaining limits', { exact: true }).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      const scan = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(scan.violations).toEqual([]);
      scans.push({
        viewport: label,
        step: id,
        violations: scan.violations,
        manualReview: scan.incomplete.map((v) => ({
          id: v.id,
          targets: v.nodes.map((n) => n.target),
        })),
      });
    }
    await page.screenshot({ path: `${folder}/${label}.png`, fullPage: true });
  }
  expect(external).toEqual([]);
  await writeFile('docs/B06_ACCESSIBILITY.json', JSON.stringify(scans, null, 2));
});
