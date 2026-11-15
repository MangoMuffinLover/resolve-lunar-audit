import { test, expect } from '@playwright/test';
const steps = [
  ['5', '7.40'],
  ['20', '8.36'],
  ['40', '9.68'],
  ['60', '11.46'],
  ['80', '12.92'],
  ['240', '13.29'],
];
test('discrete model scrub changes sourced results while Sun and Earth stay anchored', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Audit this result', exact: true }).click();
  await expect(page.getByTestId('fracture-sky')).toBeVisible();
  const sun = await page.getByTestId('fracture-sun').getAttribute('data-center-position'),
    earth = await page.getByTestId('fracture-earth').getAttribute('data-center-position');
  for (const [spacing, value] of steps) {
    await page
      .getByRole('button', { name: `Inspect native ${spacing} metre representation`, exact: true })
      .click();
    await expect(page.getByTestId('selected-duration')).toHaveText(`${value}DAYS`);
    await expect(page.getByTestId('fracture-sun')).toHaveAttribute('data-center-position', sun!);
    await expect(page.getByTestId('fracture-earth')).toHaveAttribute(
      'data-center-position',
      earth!,
    );
  }
  await page
    .getByRole('button', { name: 'Inspect native 5 metre representation', exact: true })
    .click();
  await expect(page.getByTestId('scrub-witness')).toHaveText('49.125 m');
  await page.getByRole('slider', { name: 'Scrub discrete terrain representations' }).focus();
  await page.keyboard.press('End');
  await expect(page.getByTestId('selected-duration')).toHaveText('13.29DAYS');
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByTestId('selected-duration')).toHaveText('12.92DAYS');
  await expect(page.getByTestId('scrub-witness')).toHaveText('2.017 km');
});
test('each tap changes one state and holds indefinitely without automatic progression', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Audit this result', exact: true }).click();
  await expect(page.getByTestId('selected-duration')).toHaveText('12.92DAYS');
  await expect(page.locator('.fracture-status')).toHaveText('MODEL-SENSITIVE');
  await expect(page.locator('.sun-insight')).toHaveCount(0);
  await page.waitForTimeout(3000);
  await expect(page.getByTestId('selected-duration')).toHaveText('12.92DAYS');
  await expect(page.locator('.sun-insight')).toHaveCount(0);
  await page.getByRole('button', { name: 'Isolate the Sun', exact: true }).click();
  await expect(page.locator('.sun-insight')).toContainText('The Sun never moved.');
  await page.waitForTimeout(3000);
  await expect(page.locator('.sun-insight')).toBeVisible();
  await page
    .getByRole('button', { name: 'Inspect native 5 metre representation', exact: true })
    .click();
  await page.waitForTimeout(2600);
  await expect(page.getByTestId('selected-duration')).toHaveText('7.40DAYS');
  await expect(page.locator('.sun-insight')).toHaveCount(0);
  await page.getByText('Explore terrain representations', { exact: true }).click();
  await page.getByTestId('model-P90_240m').click();
  await expect(page.getByTestId('selected-duration')).toHaveText('13.29DAYS');
  await page.waitForTimeout(800);
  await expect(page.getByTestId('selected-duration')).toHaveText('13.29DAYS');
});
test('reduced motion preserves the deliberate physical steps and source access', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Audit this result', exact: true }).click();
  await expect(page.getByTestId('selected-duration')).toHaveText('12.92DAYS');
  await expect(page.getByRole('button', { name: 'Pause sequence', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'See why it changes', exact: true }).click();
  await expect(page.getByTestId('near-field-profile')).toBeVisible();
  await expect(page.locator('.witness-relocation')).toHaveCount(0);
  await page.getByRole('button', { name: '2. Compare the 80 m profile', exact: true }).click();
  await expect(page.locator('.physics-horizon-values')).toBeVisible();
  await page.getByRole('button', { name: '3. Locate event witnesses', exact: true }).click();
  await expect(page.getByTestId('physical-reveal')).toContainText(
    'different event times and azimuths',
  );
  await expect(page.getByTestId('physical-reveal')).toContainText('1.647339 m lower');
  await page.getByRole('button', { name: 'Result evidence', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Result evidence', exact: true })).toBeFocused();
});

test('3D waits for activation, holds its camera and preserves a rendered fallback', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Audit this result', exact: true }).click();
  await page.getByRole('button', { name: 'See why it changes', exact: true }).click();
  const section = page.getByTestId('terrain-study');
  await expect(section.locator('canvas')).toHaveCount(0);
  await expect(section.locator('img')).toBeVisible();
  await expect(section).toContainText('1× HEIGHT SCALE');
  await section.getByRole('button', { name: 'Explore the terrain in 3D' }).click();
  const controls = section.getByRole('group', { name: '3D camera views' }),
    retry = section.getByRole('button', { name: 'Retry 3D' });
  await expect(controls.or(retry)).toBeVisible();
  if (await controls.count()) {
    await expect(section.locator('.terrain-viewport')).toHaveAttribute('data-state', 'settled');
    await page.waitForTimeout(500);
    await expect(
      section.getByRole('button', { name: 'Oblique view', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    await section.getByRole('button', { name: 'Top view', exact: true }).click();
    await expect(section.locator('.terrain-viewport')).toHaveAttribute('data-state', 'moving');
    await expect(section.locator('.terrain-viewport')).toHaveAttribute('data-state', 'settled');
    await expect(section.getByRole('button', { name: 'Top view', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await section
      .locator('canvas')
      .evaluate((canvas: HTMLCanvasElement) =>
        canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true })),
      );
    await expect(retry).toBeVisible();
  }
  await expect(section.locator('img')).not.toHaveClass(/is-hidden/);
});
test('a failed visual bundle hides the previous skyline, then verified retry recovers', async ({
  page,
}) => {
  let broken = true;
  await page.route('**/visuals/sky-fixed_absolute.v1.json', (route) =>
    broken ? route.fulfill({ status: 200, body: '{}' }) : route.continue(),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Audit this result', exact: true }).click();
  await expect(page.locator('.fracture-loading[role="alert"]')).toContainText(
    'Skyline evidence unavailable',
  );
  await expect(page.getByTestId('fracture-sky')).toHaveCount(0);
  broken = false;
  await page.getByRole('button', { name: 'Retry visual evidence' }).click();
  await expect(page.getByTestId('fracture-sky')).toBeVisible();
  await expect(page.getByTestId('selected-duration')).toHaveText('12.92DAYS');
});
test('phone layout keeps the audit available and both geometry markers inside the diagram', async ({
  page,
}) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await expect(
      page.getByRole('button', { name: 'Audit this result', exact: true }),
    ).toBeInViewport({ ratio: 1 });
    await page.getByRole('button', { name: 'Audit this result', exact: true }).click();
    await expect(page.getByTestId('fracture-sky')).toBeVisible();
    const bounds = await page.getByTestId('fracture-sky').boundingBox();
    for (const name of ['fracture-sun', 'fracture-earth']) {
      const marker = await page.getByTestId(name).boundingBox();
      expect(marker!.x).toBeGreaterThanOrEqual(bounds!.x);
      expect(marker!.x + marker!.width).toBeLessThanOrEqual(bounds!.x + bounds!.width);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  }
});
