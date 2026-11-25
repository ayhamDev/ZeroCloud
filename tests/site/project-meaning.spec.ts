import { expect, test } from '@playwright/test';

test('explains the project from the hero and ends the homepage with the app directory', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('link', { name: 'What ZeroCloud means' }).click();
  await expect(page).toHaveURL(/#what-is-zerocloud$/u);
  const meaning = page.getByRole('region', { name: 'Zero required cloud services.' });
  await expect(meaning).toBeVisible();
  await expect(meaning.locator('dt')).toHaveText([
    'On your device',
    'Between your devices',
    'Online by choice',
  ]);
  await expect(page.getByRole('link', { name: 'Try the transfer demo' })).toHaveCount(0);
  await expect(page.locator('main > .frame > section:last-child h2').first()).toHaveText(
    'Inside ZeroCloud',
  );
  const philosophy = page.getByRole('region', { name: 'Our philosophy' });
  await expect(philosophy.getByRole('heading', { name: 'Secure by default.' })).toBeVisible();
  await expect(philosophy.locator('details')).toHaveCount(0);
  await expect(page.getByText('For ZeroCloudShare', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Local file sharing', { exact: true })).toHaveCount(0);
  await philosophy.getByRole('link', { name: 'Read our principles' }).click();
  await expect(page).toHaveURL(/\/project\/$/u);
  const alignment = await page.evaluate(() =>
    ['.page-lead h1', '.prose h2', '.prose p'].map((selector) =>
      Math.round(document.querySelector(selector)?.getBoundingClientRect().left ?? -1),
    ),
  );
  expect(new Set(alignment).size).toBe(1);
});
