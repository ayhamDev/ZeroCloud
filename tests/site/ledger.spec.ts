import { expect, test } from '@playwright/test';

test('Ledger explains selective account sharing, offline changes and planned sync', async ({
  page,
}) => {
  await page.goto('./apps/ledger/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('ZeroCloud Ledger');
  await expect(page.locator('.app-overview-copy')).toContainText(
    'sync only the accounts you choose',
  );
  const faq = page.getByRole('region', { name: 'About Ledger' });
  await faq.locator('summary').filter({ hasText: 'Can I keep some accounts private?' }).click();
  await expect(faq.locator('details[open] > p')).toContainText(
    'must not grant access to your other accounts',
  );
  await faq
    .locator('summary')
    .filter({ hasText: 'What if two people make changes while offline?' })
    .click();
  await expect(faq.getByText(/without silently overwriting an amount/u)).toBeVisible();
  await faq.locator('summary').filter({ hasText: 'How would synchronization work?' }).click();
  await expect(faq.getByText(/still needs to be built and verified/u)).toBeVisible();
  await page.goto('./apps/ledger/downloads/');
  await expect(page.getByRole('button', { name: 'Open web app for Ledger' })).toBeDisabled();
  await expect(page.locator('.published-files a')).toHaveCount(0);
  await expect(page.locator('.catalog-controls, .catalog-count')).toHaveCount(0);
});
