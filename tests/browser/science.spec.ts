import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const folder = 'docs/screenshots/b05';
test.beforeAll(() => mkdir(folder, { recursive: true }).then(() => {}));

test('science entry → scoped negative control → exact factor context', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('link', { name: 'Evidence', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'What does the evidence support?',
  );
  await page
    .getByRole('navigation', { name: 'Science sections' })
    .getByRole('link', { name: 'Negative evidence', exact: true })
    .click();
  await expect(page.getByTestId('control-baseline')).toContainText('13.227474');
  await expect(page.getByTestId('control-table').locator('tbody tr')).toHaveCount(5);
  await expect(page.getByTestId('control-table')).toContainText('13.225631');
  await expect(page.getByTestId('control-table')).toContainText(
    'Meets 6.5-day simultaneous benchmark',
  );
  await page.getByTestId('control-study').selectOption('modeling');
  await expect(page.getByTestId('control-baseline')).toContainText('8.471310');
  await expect(page.getByTestId('control-scope')).toContainText('Registered reporting domain');
  await expect(page.getByTestId('control-table').locator('tbody tr')).toHaveCount(12);
  await page.getByTestId('control-metric').selectOption('earth');
  await expect(page.getByTestId('control-table')).toContainText(
    'No historical Earth-only benchmark',
  );
  await expect(page.getByTestId('control-table')).toContainText('−5.00 h');
  await page.getByRole('link', { name: 'Product 104 SDEM', exact: true }).click();
  await expect(page.getByTestId('factor-delta')).toContainText('−5.00 h');
  await expect(page.getByTestId('factor-detail')).toContainText('Product 104 SDEM');
  expect(errors).toEqual([]);
});

test('all study/observable combinations retain their research criteria and exact source evidence', async ({
  page,
}) => {
  await page.goto('/science/#control');
  await expect(page.getByTestId('control-baseline')).toBeVisible();
  for (const study of ['pilot', 'modeling']) {
    await page.getByTestId('control-study').selectOption(study);
    for (const metric of ['sun', 'earth', 'simultaneous']) {
      await page.getByTestId('control-metric').selectOption(metric);
      const table = page.getByTestId('control-table');
      await expect(table.locator('tbody tr')).toHaveCount(study === 'pilot' ? 5 : 12);
      if (metric === 'earth') await expect(table).not.toContainText('Meets');
      if (metric === 'sun' && study === 'modeling')
        await expect(table).toContainText('Below 10-day solar screen');
    }
  }
  await page
    .getByText('Exact control values, source rows and study limits', { exact: true })
    .click();
  await expect(page.locator('#control')).toContainText('8.47131030132787');
  await expect(page.locator('#control')).toContainText('simultaneous_days');
  await expect(page.locator('#validation')).toContainText(
    'preferred 60 s target was not achieved everywhere',
  );
  await expect(page.locator('#limits')).toContainText('twenty-second judge test');
});

test('review downloads resolve locally to declared bytes; corrupt control can retry without invented results', async ({
  page,
  request,
}) => {
  const packetResponse = await request.get('/evidence/science/review-packet.v1.json');
  expect(packetResponse.ok()).toBe(true);
  const data = await packetResponse.json();
  for (const source of Object.values(data.sources) as {
    href: string;
    sha256: string;
    bytes: number;
  }[]) {
    const response = await request.get(source.href);
    expect(response.ok()).toBe(true);
    const bytes = await response.body();
    expect(bytes.byteLength).toBe(source.bytes);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(source.sha256);
  }
  const external: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith('http://127.0.0.1:3000/')) external.push(r.url());
  });
  let broken = true;
  await page.route('**/evidence/factors/dGR203.v1.json', (route) =>
    broken ? route.fulfill({ status: 200, body: '{}' }) : route.continue(),
  );
  await page.goto('/science/#control');
  await expect(page.locator('.science-error')).toContainText(
    'No control result or classification is shown',
  );
  await expect(page.getByTestId('control-table')).not.toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'What does the evidence support?' }),
  ).toBeVisible();
  broken = false;
  await page.getByRole('button', { name: 'Retry control evidence' }).click();
  await expect(page.getByTestId('control-table')).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download the review packet', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('review-packet.v1.json');
  expect(external).toEqual([]);
});

test('science evidence remains keyboard accessible and reflows with expanded provenance', async ({
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
    await page.goto('/science/#control');
    await expect(page.getByTestId('control-baseline')).toBeVisible();
    await page.getByTestId('control-metric').focus();
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowDown');
    await expect(page.getByTestId('control-metric')).toHaveValue('sun');
    await page
      .getByText('Exact control values, source rows and study limits', { exact: true })
      .click();
    await page
      .getByRole('navigation', { name: 'Science sections' })
      .getByRole('link', { name: 'NASA data', exact: true })
      .click();
    await page.getByText('Exact SPICE kernels and retained checksums', { exact: true }).click();
    await page
      .getByRole('navigation', { name: 'Science sections' })
      .getByRole('link', { name: 'Reproduce', exact: true })
      .click();
    await page.getByText('Source register: paths, bytes and SHA-256', { exact: true }).click();
    await page
      .getByText('Product commands and original research instructions', { exact: true })
      .click();
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
      manualReview: scan.incomplete.map((v) => ({
        id: v.id,
        targets: v.nodes.map((n) => n.target),
      })),
    });
    await page.screenshot({ path: `${folder}/${label}.png`, fullPage: true });
  }
  await writeFile('docs/B05_ACCESSIBILITY.json', JSON.stringify(scans, null, 2));
});

test('evidence chapters open from deep links and the initial evidence view remains concise', async ({
  page,
}) => {
  await page.goto('/science/');
  await expect(page.locator('.evidence-chapter[open]')).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: 'Download the review packet', exact: true }),
  ).toBeVisible();
  for (const id of ['control', 'method', 'validation', 'provenance', 'limits', 'reproduce']) {
    await page.goto('/science/#' + id);
    await expect(page.locator('#' + id)).toHaveAttribute('open', '');
  }
});
