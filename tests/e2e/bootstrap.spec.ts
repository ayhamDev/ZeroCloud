import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('loads the shared application shell', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page).toHaveTitle('ZeroCloud Share');
  await expect(page.getByRole('heading', { name: 'ZeroCloudShare' })).toBeVisible();
  expect(errors).toEqual([]);
});
test('makes no requests outside the local development server', async ({ page }) => {
  const external: string[] = [];
  page.on('request', (request) => {
    if (!['127.0.0.1', 'localhost'].includes(new URL(request.url()).hostname))
      external.push(request.url());
  });
  await page.goto('/');
  await expect(page.getByText('Project setup is ready.')).toBeVisible();
  expect(external).toEqual([]);
});
test('has accessible markup and fits the viewport', async ({ page }) => {
  await page.goto('/');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
