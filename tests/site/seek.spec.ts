import { expect, test } from '@playwright/test';

test('finds Seek through the full app carousel', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('.product-card')).toHaveCount(4);
  await page.locator('.nav-folder summary').filter({ hasText: 'Apps' }).click();
  const menu = page.locator('.nav-folder[open]');
  await expect(menu).toHaveAttribute('data-menu-state', 'open');
  await expect(menu.locator('.mega-card')).toHaveCount(6);
  await menu.getByRole('navigation', { name: 'Apps', exact: true }).press('End');
  await menu.getByRole('link', { name: 'ZeroCloud Seek', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('ZeroCloud Seek');
});

test('Seek describes planned finding and mapping without claiming live tracking', async ({
  page,
  request,
}) => {
  const response = await request.get('./apps/seek/');
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain('Seek is being designed');
  expect(html).toContain('See where to look.');
  await page.goto('./apps/seek/');
  const map = page.getByRole('region', { name: 'See where to look.' });
  await expect(map.getByRole('img')).toHaveAccessibleName(/not a live device reading/u);
  await expect(map.locator('figcaption')).toContainText('not an exact position');
  await expect(map.getByRole('button')).toHaveCount(0);
  const faq = page.getByRole('region', { name: 'About Seek' });
  await faq
    .locator('summary')
    .filter({ hasText: 'What if the device is offline or switched off?' })
    .click();
  await expect(faq.locator('details[open] > p')).toContainText(
    'historical clue, not a current location',
  );
  await faq.locator('summary').filter({ hasText: 'How would Seek find a device?' }).click();
  await expect(
    faq.locator('details[open] > p').filter({ hasText: 'cannot reliably' }),
  ).toContainText('cannot reliably give an exact distance or direction');
  await page.goto('./apps/seek/downloads/');
  await expect(page.getByRole('heading', { name: 'Desktop', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Android', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open web app for Seek' })).toBeDisabled();
  await expect(page.getByRole('searchbox', { name: 'Search apps' })).toHaveCount(0);
});
