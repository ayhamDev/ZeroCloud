import { expect, test } from '@playwright/test';

test('app FAQs distinguish transfers, persistent sync and casting', async ({ page }) => {
  for (const [slug, shortName, question, answer] of [
    ['hub', 'Hub', 'Do I need Hub to use the other apps?', /Hub is optional/u],
    ['share', 'Share', 'How is Share different from Bucket?', /persistent|automatically synced/u],
    ['bucket', 'Bucket', 'Can I restore my files onto a replacement phone?', /complete copy/u],
    ['cast', 'Cast', 'Who can see my screen?', /Encrypted connections/u],
  ] as const) {
    await page.goto(`./apps/${slug}/`);
    const faq = page.getByRole('region', { name: `About ${shortName}` });
    const summary = faq.locator('summary').filter({ hasText: question });
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(faq.locator('details[open] > p')).toContainText(answer);
    await expect(faq.locator('details').first()).toHaveCSS('border-width', '0px');
    await expect(faq.locator('summary').first()).toHaveCSS('border-width', '0px');
  }
  await page.goto('./apps/share/');
  await expect(page.locator('.app-cover-copy > p')).toHaveText(
    'Send files from any device to any device, whenever you need to.',
  );
});

test('downloads show honest Web placeholders and a Google TV option for Cast', async ({ page }) => {
  await page.goto('./downloads/');
  await expect(page.locator('.release-entry')).toHaveCount(6);
  for (const [id, shortName] of [
    ['hub', 'Hub'],
    ['share', 'Share'],
    ['bucket', 'Bucket'],
    ['cast', 'Cast'],
    ['seek', 'Seek'],
    ['ledger', 'Ledger'],
  ] as const) {
    const app = page.locator(`#builds-${id}`);
    await expect(app.getByRole('heading', { name: 'Web', exact: true })).toBeVisible();
    await expect(app.getByRole('button', { name: `Open web app for ${shortName}` })).toBeDisabled();
    await expect(app.locator('.platform-list > li').last()).toHaveCSS('border-width', '0px');
  }
  await expect(page.locator('.platform-open[href]')).toHaveCount(0);
  await expect(page.locator('.published-files a')).toHaveCount(0);
  await page.getByRole('searchbox', { name: 'Search apps' }).fill('Google TV');
  await expect(page.locator('.release-entry:visible')).toHaveCount(1);
  await expect(
    page.locator('#builds-cast').getByRole('heading', { name: 'Google TV', exact: true }),
  ).toBeVisible();
});

test('borderless controls keep visible keyboard focus', async ({ page }) => {
  await page.goto('./apps/');
  const search = page.getByRole('searchbox', { name: 'Search apps' });
  await expect(search).toHaveCSS('border-width', '0px');
  await search.focus();
  await page.keyboard.press('Tab');
  const category = page.getByRole('combobox', { name: 'Category', exact: true });
  await expect(category).toBeFocused();
  await expect(category).toHaveCSS('outline-style', 'solid');
  await expect(category).toHaveCSS('outline-width', '3px');
  const summary = page.locator('.nav-folder summary').filter({ hasText: 'Apps' });
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.nav-folder[open] .mega-panel')).toHaveCSS('border-width', '0px');
});

for (const [slug, root, count] of [
  ['share', 'zcs-motion', 24],
  ['bucket', 'zcb-motion', 19],
  ['cast', 'zcc-motion', 22],
  ['seek', 'zcseek-motion', 16],
  ['ledger', 'zcledger-motion', 21],
] as const) {
  test(`${slug} has distinct looping and one-time marks with reduced motion fallback`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(`./apps/${slug}/`);
    const mark = page.locator('[data-motion-product]');
    await expect(mark.locator(`svg.${root}`)).toBeVisible();
    await expect(mark.locator('circle')).toHaveCount(count);
    await expect(mark).toHaveAttribute('data-playing', '');
    await expect(mark).toHaveAttribute('data-motion-mode', 'loop');
    const ends = await mark.evaluate((element) =>
      element
        .getAnimations({ subtree: true })
        .map((animation) => animation.effect?.getComputedTiming().iterations),
    );
    expect(ends.length).toBeGreaterThan(0);
    for (const end of ends) expect(end).toBe(Infinity);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect
      .poll(() => mark.evaluate((element) => element.getAnimations({ subtree: true }).length))
      .toBe(0);
    await expect(page.locator('.app-cover button')).toHaveCount(0);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('./downloads/');
    const once = page.locator(`#builds-${slug} .product-mark`);
    await once.scrollIntoViewIfNeeded();
    await expect(once).toHaveAttribute('data-playing', '');
    await expect(once).toHaveAttribute('data-motion-mode', 'once');
    const finite = await once.evaluate((element) =>
      element
        .getAnimations({ subtree: true })
        .map((animation) => animation.effect?.getComputedTiming().endTime),
    );
    expect(finite.length).toBeGreaterThan(0);
    for (const end of finite) expect(end).toBeLessThan(5000);
  });
}

test('one-time and looping Share variants coexist in its standalone edition', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('http://127.0.0.1:14375/share-preview/');
  const once = page.locator('.mast-row > .signature .product-mark-share');
  const loop = page.locator('.app-cover .product-mark-share');
  await expect(once).toHaveAttribute('data-playing', '');
  await expect(loop).toHaveAttribute('data-playing', '');
  const iterations = (element: Element) =>
    element
      .getAnimations({ subtree: true })
      .map((animation) => animation.effect?.getComputedTiming().iterations);
  const single = await once.evaluate(iterations);
  const repeating = await loop.evaluate(iterations);
  expect(single.length).toBeGreaterThan(0);
  expect(repeating.length).toBeGreaterThan(0);
  for (const iteration of single) expect(iteration).toBe(1);
  for (const iteration of repeating) expect(iteration).toBe(Infinity);
});
