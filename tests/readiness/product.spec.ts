import { test, expect, type Page, type Locator } from '@playwright/test';

async function tabTo(page: Page, locator: Locator, maximum = 120) {
  for (let i = 0; i < maximum; i++) {
    if (await locator.evaluate((element) => element === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(
    `Keyboard did not reach ${(await locator.getAttribute('aria-label')) || (await locator.textContent())}`,
  );
}

test('keyboard reaches the audit, modal traps focus and Escape restores the invoking control', async ({
  page,
  browser,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  const evidence = page.getByRole('button', { name: 'Result evidence', exact: true });
  await tabTo(page, evidence);
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const controls = await dialog.locator('button:visible, a[href]:visible, summary:visible').count();
  for (const direction of ['Tab', 'Shift+Tab'])
    for (let i = 0; i < controls + 2; i++) {
      await page.keyboard.press(direction);
      const focus = await dialog.evaluate((d) => ({
        inDialog: d.contains(document.activeElement),
        browserBoundary: document.activeElement === document.body && d.matches(':modal'),
      }));
      // Native dialogs may tab into browser chrome; background page controls must remain inert.
      expect(focus.inDialog || focus.browserBoundary).toBe(true);
    }
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(evidence).toBeFocused();
  await tabTo(page, page.getByRole('button', { name: 'Audit this result', exact: true }));
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('heading', {
      name: 'Another NASA terrain representation. Another modeled window.',
    }),
  ).toBeFocused();
  await expect(page.getByTestId('selected-delta')).toHaveText('+5.53 d');
  await tabTo(page, page.getByRole('button', { name: 'See why it changes', exact: true }));
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('common-clock-sky')).toBeVisible();
  await page.getByText('Trace the event to sampled terrain', { exact: true }).click();
  await expect(page.locator('.mechanism-witnesses')).toContainText('2.017 km');
  expect(errors).toEqual([]);
  await info.attach('browser-version', { body: browser.version(), contentType: 'text/plain' });
});

test('all six guided steps and observer controls retain the scientific outcomes across engines', async ({
  page,
  browser,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/demo/');
  await expect(page.getByTestId('demo-result')).toContainText('7.40');
  await page.getByRole('button', { name: 'Audit this result' }).click();
  await expect(page.getByTestId('demo-audit')).toContainText('+5.53 days');
  await page.getByRole('button', { name: 'Next: Why' }).click();
  await expect(page.getByTestId('demo-mechanism')).toContainText('17 Nov, 14:30 UTC, 2026');
  await expect(page.getByTestId('common-clock-sky')).toBeVisible();
  await page.getByRole('button', { name: 'Next: Assumptions' }).click();
  await page.getByTestId('demo-observer').selectOption('each_surface_2m');
  await expect(page.getByTestId('demo-observer-result')).toContainText('7.27 days');
  await page.getByRole('button', { name: 'Next: Negative evidence' }).click();
  await expect(page.getByTestId('demo-negative')).toContainText('5 of 5 tested clones');
  await page.getByRole('button', { name: 'Next: Evidence & use' }).click();
  await page.getByRole('button', { name: 'Restart demonstration' }).click();
  await expect(page.getByTestId('demo-result')).toBeVisible();
  expect(errors).toEqual([]);
  await info.attach('browser-version', { body: browser.version(), contentType: 'text/plain' });
});

test('navigator, factor, science and physical evidence keep context and missing data can retry', async ({
  page,
}) => {
  await page.goto('/navigator/');
  await expect(page.getByTestId('navigator-sky')).toBeVisible();
  await page.getByTestId('navigator-site').selectOption('dGR201');
  await page.getByTestId('navigator-date').selectOption('2026-11-10');
  await expect(page.getByTestId('navigator-sky')).toHaveAccessibleName(/dGR201/);
  await expect(page.getByTestId('navigator-utc')).toHaveText('10 Nov, 15:00 UTC');
  await page.getByRole('button', { name: 'SAVE FOR COMPARISON', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Compare saved scenarios (1/3)' })).toBeVisible();
  await page.goto('/factors/');
  await expect(page.getByTestId('factor-delta')).toContainText('+5.53 d');
  await page.getByRole('link', { name: 'Explain this comparison' }).click();
  await expect(page.getByTestId('explain-effect')).toHaveText('+5.53 d');
  await expect(page.getByTestId('matched-physical-explanation')).toBeVisible();
  await page.getByTestId('explain-date').selectOption('2026-11-17');
  await page.getByTestId('explain-time').selectOption('14:30');
  await page.getByRole('slider', { name: 'Step through stored native LOLA products' }).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByTestId('explain-comparison-select')).toHaveValue(
    'terrain-P90_60m-fixed_absolute-uncensored_intersecting_registered',
  );
  await expect(page.getByTestId('explain-utc')).toHaveText('17 Nov, 14:30 UTC');
  let broken = true;
  await page.route('**/evidence/factors/dGR203.v1.json', (r) =>
    broken ? r.fulfill({ status: 200, body: '{}' }) : r.continue(),
  );
  await page.goto('/science/#control');
  await expect(page.locator('.science-error')).toContainText('No control result');
  broken = false;
  await page.getByRole('button', { name: 'Retry control evidence' }).click();
  await expect(page.getByTestId('control-baseline')).toContainText('13.227474');
  await page.getByTestId('control-study').selectOption('modeling');
  await expect(page.getByTestId('control-baseline')).toContainText('8.471310');
});

test('all routes reflow at a narrow viewport without hiding the scope labels', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 850 });
  for (const route of ['/', '/navigator/', '/factors/', '/explain/', '/science/', '/demo/']) {
    await page.goto(route);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    if (route === '/') {
      await page.getByRole('button', { name: 'Audit this result', exact: true }).click();
      await page.getByRole('button', { name: 'See why it changes', exact: true }).click();
      const fitted = page.locator('.audit-mechanism .fitted-sky');
      await expect(page.getByTestId('common-clock-sky')).toBeVisible();
      await expect(fitted).toContainText('Elevation above local horizontal (°)');
      await expect
        .poll(() =>
          fitted.evaluate(
            (element) =>
              element.querySelector('svg')!.viewBox.baseVal.width <= element.clientWidth + 1,
          ),
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
    }
    if (route === '/explain/')
      await expect(page.getByTestId('matched-physical-explanation')).toBeVisible();
    if (route === '/science/')
      await expect(page.locator('.evidence-overview')).toContainText('Terrain truth');
    expect(
      await page.evaluate(() => ({
        width: innerWidth,
        content: document.documentElement.scrollWidth,
      })),
    ).toEqual({ width: 320, content: 320 });
  }
});
