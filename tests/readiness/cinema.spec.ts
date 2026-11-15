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
  const sun = await page.getByTestId('fracture-sun').getAttribute('transform'),
    earth = await page.getByTestId('fracture-earth').getAttribute('transform');
  for (const [spacing, value] of steps) {
    await page
      .getByRole('button', { name: `Inspect native ${spacing} metre representation`, exact: true })
      .click();
    await expect(page.getByTestId('selected-duration')).toHaveText(`${value}DAYS`);
    await expect(page.getByTestId('fracture-sun')).toHaveAttribute('transform', sun!);
    await expect(page.getByTestId('fracture-earth')).toHaveAttribute('transform', earth!);
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
test('the automatic sequence uses discrete values, finishes at 80 m and can pause', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Audit this result', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pause sequence', exact: true })).toBeVisible();
  await expect(page.getByTestId('selected-duration')).toHaveText('8.36DAYS');
  await page.getByRole('button', { name: 'Pause sequence', exact: true }).click();
  const paused = await page.getByTestId('selected-duration').textContent();
  await page.waitForTimeout(800);
  await expect(page.getByTestId('selected-duration')).toHaveText(paused!);
  await page.getByRole('button', { name: 'Replay sequence', exact: true }).click();
  await expect(page.getByTestId('selected-duration')).toHaveText('12.92DAYS');
  await expect(page.getByRole('button', { name: 'Replay sequence', exact: true })).toBeVisible();
  await expect(page.locator('.fracture-status')).toHaveText('MODEL-SENSITIVE');
});
test('reduced motion skips playback, preserves source access and reveals the physical distinction', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Audit this result', exact: true }).click();
  await expect(page.getByTestId('selected-duration')).toHaveText('12.92DAYS');
  await expect(page.getByRole('button', { name: 'Pause sequence', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'See why it changes', exact: true }).click();
  await expect(page.getByTestId('near-field-profile')).toBeVisible();
  await expect(page.getByTestId('physical-reveal')).toContainText(
    'different event times and azimuths',
  );
  await expect(page.getByTestId('physical-reveal')).toContainText('1.647339 m lower');
  await page.getByRole('button', { name: 'Result evidence', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Result evidence', exact: true })).toBeFocused();
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
