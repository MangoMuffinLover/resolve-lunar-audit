import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const data = JSON.parse(await readFile('src/data/audit.v1.json', 'utf8'));
const folder = 'docs/screenshots/redesign';
test.beforeAll(() => mkdir(folder, { recursive: true }).then(() => {}));

test('purpose → exact audit → common clock → retained detailed science and source dialog', async ({
  page,
}) => {
  const errors: string[] = [],
    failures: string[] = [],
    external: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('requestfailed', (r) => failures.push(r.url()));
  page.on('request', (r) => {
    if (!r.url().startsWith((test.info().project.use.baseURL || 'http://127.0.0.1:3000') + '/'))
      external.push(r.url());
  });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Before you trust the window, audit the model.',
  );
  await expect(
    page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link'),
  ).toHaveText(['Audit', 'Navigator', 'Evidence']);
  const initial = data.cases['P78_5m:fixed_absolute:uncensored_intersecting_registered'];
  await expect(page.getByTestId('initial-duration')).toHaveText('7.40DAYS');
  await expect(page.getByTestId('initial-duration')).toHaveAccessibleName(
    `${initial.simultaneous.days.original} days`,
  );
  await expect(page.getByText('MODEL-SENSITIVE', { exact: true })).not.toBeVisible();
  const initialScan = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(initialScan.violations).toEqual([]);
  const evidence = page.getByRole('button', { name: 'Result evidence', exact: true }).first();
  await evidence.click();
  await expect(page.getByRole('dialog')).toContainText('Frozen results for P78 SL2 5 m');
  await page.getByRole('dialog').getByText('Simultaneous window duration', { exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText(initial.simultaneous.days.original);
  await expect(page.getByRole('dialog')).toContainText('resolution_response.csv');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Audit this result', exact: true }).click();
  await expect(
    page.getByRole('heading', {
      name: 'Another NASA terrain representation. Another modeled window.',
    }),
  ).toBeFocused();
  await expect(page.getByTestId('selected-duration')).toHaveText('12.92DAYS');
  await expect(page.getByTestId('selected-delta')).toHaveText('+5.53 d');
  await expect(page.getByTestId('model-SYNTHETIC_59p88m')).not.toBeVisible();
  const why = page.getByRole('button', { name: 'See why it changes', exact: true });
  await expect(why).toBeInViewport({ ratio: 1 });
  await why.click();
  await expect(page.getByTestId('audit-mechanism')).toContainText('17 Nov, 14:30 UTC');
  await expect(page.getByTestId('common-clock-sky')).toBeVisible();
  await expect(page.locator('.mechanism-states')).toContainText('Sun & Earth not both above');
  await expect(page.locator('.mechanism-states')).toContainText('Sun & Earth both above');
  await page.getByText('Trace the event to sampled terrain', { exact: true }).click();
  await expect(page.locator('.mechanism-witnesses')).toContainText('49.125 m');
  await expect(page.locator('.mechanism-witnesses')).toContainText('2.017 km');
  await page.getByText('Detailed horizon, terrain & support records', { exact: true }).click();
  await expect(page.getByTestId('horizon-plot')).toBeVisible();
  await expect(page.getByTestId('selected-horizon')).toHaveText('−0.19°');
  const legacy = page.locator('.legacy-evidence');
  const sun = await legacy.locator('.sun-marker').getAttribute('cx'),
    sunY = await legacy.locator('.sun-marker').getAttribute('cy');
  await expect(legacy.locator('.support-panel')).toContainText('0.131405');
  await expect(legacy.locator('.support-panel')).toContainText('15.0052');
  await page.getByText('Inspect the frozen terrain cross-section', { exact: true }).click();
  await expect(page.getByTestId('terrain-plot')).toBeVisible();
  await page.getByRole('button', { name: 'Native 80 m onset sector', exact: true }).click();
  await expect(page.getByTestId('terrain-plot')).toHaveAttribute('aria-label', /151\.0098/);
  await page.getByText('Explore terrain representations', { exact: true }).click();
  await page.getByTestId('model-P90_40m').click();
  const h40 =
    data.cases['P90_40m:fixed_absolute:uncensored_intersecting_registered'].nominalHorizon.value;
  await expect(page.getByTestId('selected-horizon')).toHaveText(
    `${h40 >= 0 ? '+' : '−'}${Math.abs(h40).toFixed(2)}°`,
  );
  expect(await legacy.locator('.sun-marker').getAttribute('cx')).toBe(sun);
  expect(await legacy.locator('.sun-marker').getAttribute('cy')).toBe(sunY);
  const source = await page.request.get(data.sources.response.href);
  expect(await source.text()).toEqual(
    await readFile(path.join('public', data.sources.response.href), 'utf8'),
  );
  const scan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(scan.violations).toEqual([]);
  await evidence.click();
  await expect(page.getByRole('button', { name: 'Close scientific evidence' })).toBeFocused();
  const drawerScan = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(drawerScan.violations).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(evidence).toBeFocused();
  await writeFile(
    'docs/REDESIGN_AUDIT_ACCESSIBILITY.json',
    JSON.stringify(
      [initialScan, scan, drawerScan].map((s, i) => ({
        state: ['initial', 'expanded proof', 'dialog'][i],
        violations: s.violations,
        manualReview: s.incomplete.map((v) => ({
          id: v.id,
          targets: v.nodes.map((n) => n.target),
        })),
      })),
      null,
      2,
    ),
  );
  expect(errors).toEqual([]);
  expect(failures).toEqual([]);
  expect(external).toEqual([]);
});

test('all 32 source selections preserve their own observer/domain case, with truthful reference and synthetic labels', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Audit this result', exact: true }).click();
  await page.getByText('Analysis definitions', { exact: true }).click();
  await page.getByText('Explore terrain representations', { exact: true }).click();
  await page.getByText('Synthetic control · expanded scientific detail', { exact: true }).click();
  for (const domain of ['uncensored_intersecting_registered', 'registered_domain']) {
    await page.getByTestId('domain-select').selectOption(domain);
    for (const observer of ['fixed_absolute', 'each_surface_2m']) {
      await page.getByTestId('observer-select').selectOption(observer);
      for (const model of data.representations) {
        await page.getByTestId(`model-${model.id}`).click();
        const c = data.cases[`${model.id}:${observer}:${domain}`];
        await expect(page.getByTestId('selected-label')).toHaveText(model.label);
        await expect(page.getByTestId('selected-duration')).toHaveAttribute(
          'aria-label',
          `${c.simultaneous.days.original} days`,
        );
        await expect(page.getByTestId(`model-${model.id}`)).toHaveAttribute('aria-pressed', 'true');
        if (domain === 'registered_domain')
          await expect(page.getByTestId('censor-note')).toContainText('right-censored');
        if (model.id === 'P78_5m')
          await expect(
            page.getByRole('heading', { name: 'The reference is selected.' }),
          ).toBeVisible();
        if (model.type === 'synthetic-control')
          await expect(
            page.getByRole('heading', { name: 'A synthetic control. A different modeled window.' }),
          ).toBeVisible();
      }
    }
  }
  await page.getByTestId('model-P104_5m').click();
  await expect(page.getByTestId('sdem-note')).toContainText('1.325806 m higher');
  await page.getByTestId('domain-select').selectOption('uncensored_intersecting_registered');
  await expect(page.getByTestId('selected-duration')).toHaveText('7.27DAYS');
  await page.getByTestId('observer-select').selectOption('fixed_absolute');
  await expect(page.getByTestId('selected-duration')).toHaveText('2.99DAYS');
  await page.getByRole('button', { name: 'See why it changes', exact: true }).click();
  await expect(page.getByTestId('audit-mechanism')).toBeVisible();
  await page.getByText('Detailed horizon, terrain & support records', { exact: true }).click();
  await expect(page.getByTestId('horizon-plot')).toHaveAccessibleName(
    'Frozen horizon comparison: P78 SL2 5 m and P104 SDEM 5 m',
  );
  await page.getByTestId('observer-select').selectOption('each_surface_2m');
  const h =
    data.cases['P104_5m:each_surface_2m:uncensored_intersecting_registered'].nominalHorizon.value;
  await expect(page.getByTestId('selected-horizon')).toHaveText(
    `${h >= 0 ? '+' : '−'}${Math.abs(h).toFixed(2)}°`,
  );
  await expect(
    page.getByRole('heading', {
      name: 'Same ephemeris. Different observer. Different modeled skyline.',
    }),
  ).toBeVisible();
});

test('mobile and tablet preserve above-fold actions, keyboard focus and accessible expanded evidence', async ({
  page,
}) => {
  const scans = [];
  for (const [label, width, height] of [
    ['mobile', 390, 844],
    ['tablet', 834, 1112],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to decision audit' })).toBeFocused();
    const cta = page.getByRole('button', { name: 'Audit this result', exact: true });
    await expect(cta).toBeInViewport({ ratio: 1 });
    await cta.click();
    await expect(
      page.getByRole('button', { name: 'See why it changes', exact: true }),
    ).toBeInViewport({ ratio: 1 });
    await page.getByRole('button', { name: 'See why it changes', exact: true }).click();
    await expect(page.getByTestId('audit-mechanism')).toBeVisible();
    const fitted = page.locator('.audit-mechanism .fitted-sky');
    await expect
      .poll(() =>
        fitted.evaluate((element) => {
          const svg = element.querySelector('svg')!;
          return svg.viewBox.baseVal.width <= element.clientWidth + 1;
        }),
      )
      .toBe(true);
    expect(
      await fitted.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        return ['.sun-marker', '.navigator-earth'].every((selector) => {
          const marker = element.querySelector(selector)!.getBoundingClientRect();
          return marker.left >= bounds.left && marker.right <= bounds.right;
        });
      }),
    ).toBe(true);
    await page.getByText('Detailed horizon, terrain & support records', { exact: true }).click();
    await expect(page.getByTestId('horizon-plot')).toBeVisible();
    await page.getByText('Inspect the frozen terrain cross-section', { exact: true }).click();
    await expect(page.getByTestId('terrain-plot')).toBeVisible();
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
    await page.screenshot({ path: `${folder}/expanded-${label}.png`, fullPage: true });
  }
  await writeFile('docs/REDESIGN_RESPONSIVE_ACCESSIBILITY.json', JSON.stringify(scans, null, 2));
});

test('a missing detailed profile retains the explicitly fixed-reference fallback', async ({
  page,
}) => {
  await page.route('**/evidence/profiles/P90_80m_fixed_absolute.v1.json', (r) =>
    r.fulfill({ status: 404, body: 'Missing fixture' }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Audit this result', exact: true }).click();
  await page.getByRole('button', { name: 'See why it changes', exact: true }).click();
  await page.getByText('Detailed horizon, terrain & support records', { exact: true }).click();
  await expect(page.getByText(/The interactive records could not be loaded/)).toBeVisible();
  await expect(
    page.getByRole('img', {
      name: 'Frozen R-01C critical horizon profiles, fixed absolute observer',
    }),
  ).toBeVisible();
});

test('corrupt paired geometry cannot retain a stale skyline and full link preserves reporting scope', async ({
  page,
}) => {
  let broken = true;
  await page.route('**/evidence/explain/P90_80m_fixed_absolute.v1.json', (r) =>
    broken ? r.fulfill({ status: 200, body: '{}' }) : r.continue(),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Audit this result', exact: true }).click();
  await page.getByRole('button', { name: 'See why it changes', exact: true }).click();
  await expect(page.locator('.mechanism-error')).toContainText(
    'No previous comparison’s skyline is shown',
  );
  await expect(page.getByTestId('common-clock-sky')).not.toBeVisible();
  broken = false;
  await page.getByRole('button', { name: 'Retry paired geometry' }).click();
  await expect(page.getByTestId('common-clock-sky')).toBeVisible();
  await page.getByText('Analysis definitions', { exact: true }).click();
  await page.getByTestId('domain-select').selectOption('registered_domain');
  await expect(page.locator('.mechanism-caption')).toContainText('reporting-clipped');
  await page
    .getByRole('link', { name: 'Inspect the full physical explanation', exact: false })
    .first()
    .click();
  await expect(page.getByTestId('explain-comparison-select')).toHaveValue(
    'terrain-P90_80m-fixed_absolute-registered_domain',
  );
  await expect(page.getByTestId('explain-utc')).toHaveText('17 Nov, 14:30 UTC');
});
