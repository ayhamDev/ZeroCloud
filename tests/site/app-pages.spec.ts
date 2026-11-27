import { expect, test } from '@playwright/test';

test('app pages use concise sections and paired documentation and download cards', async ({
  page,
  request,
}) => {
  test.setTimeout(90_000);
  await page.goto('./downloads/');
  const noise = await page
    .locator('.downloads-cover .ink-field')
    .evaluate((element) => getComputedStyle(element).backgroundImage);
  for (const [slug, name] of [
    ['hub', 'ZeroCloud Hub'],
    ['share', 'ZeroCloud Share'],
    ['bucket', 'ZeroCloud Bucket'],
    ['cast', 'ZeroCloud Cast'],
    ['seek', 'ZeroCloud Seek'],
    ['ledger', 'ZeroCloud Ledger'],
  ] as const) {
    const shortName = name.replace(/^ZeroCloud\s*/u, '');
    const response = await request.get(`./apps/${slug}/`);
    const html = await response.text();
    expect(html).toContain('app-overview');
    expect(html).toContain('app-resources');
    expect(html).not.toContain('In development');
    await page.goto(`./apps/${slug}/`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(name ?? '');
    await expect(page.locator('.app-cover canvas')).toHaveAttribute('data-ink', 'downloads');
    expect(
      await page
        .locator('.app-cover .ink-field')
        .evaluate((element) => getComputedStyle(element).backgroundImage),
    ).toBe(noise);
    await expect(page.locator('.app-cover button')).toHaveCount(0);
    await expect(page.locator('.app-steps li')).toHaveCount(3);
    await expect(page.locator('.app-overview-copy > p')).toHaveCSS('font-size', '16px');
    const resources = page.getByRole('navigation', {
      name: `${shortName} resources`,
    });
    const cards = resources.locator('.app-resource');
    await expect(cards).toHaveCount(2);
    await resources.scrollIntoViewIfNeeded();
    const boxes = await cards.evaluateAll((elements) =>
      elements.map((element) => {
        const box = element.getBoundingClientRect();
        return { x: box.x, y: box.y, width: box.width };
      }),
    );
    if ((page.viewportSize()?.width ?? 0) > 600) {
      expect(boxes[0]?.y).toBe(boxes[1]?.y);
      expect(boxes[1]?.x).toBeGreaterThan(boxes[0]?.x ?? 0);
    } else {
      expect(boxes[0]?.x).toBe(boxes[1]?.x);
      expect(boxes[1]?.y).toBeGreaterThan(boxes[0]?.y ?? 0);
    }
    await resources.getByRole('link', { name: /^Downloads/u }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(`${shortName} downloads`);
    await expect(page.locator('.platform-list')).toBeVisible();
    await expect(page.getByRole('searchbox', { name: 'Search apps' })).toHaveCount(0);
    await expect(page.getByRole('combobox', { name: 'Category', exact: true })).toHaveCount(0);
    await expect(page.locator('.catalog-count, .catalog-empty')).toHaveCount(0);
    await page.goto(`./apps/${slug}/`);
    await page
      .locator('.app-resources')
      .getByRole('link', { name: /^Documentation/u })
      .click();
    await expect(page.getByRole('heading', { name: 'No guides yet.' })).toBeVisible();
  }
  await page.goto('./apps/hub/downloads/?appQuery=missing&category=File%20sharing');
  await expect(page.getByRole('region', { name: 'ZeroCloud Hub releases' })).toBeVisible();
});

test('the Hub hero loops while cards play once and reduced motion stays static', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('./apps/hub/');
  const mark = page.locator('[data-motion-hub]');
  const center = mark.locator('.zch-center');
  await expect(mark.locator('circle')).toHaveCount(17);
  await expect(mark).toHaveAttribute('data-playing', '');
  await expect(mark).toHaveAttribute('data-motion-mode', 'loop');
  await expect(center).toHaveCSS('animation-iteration-count', 'infinite');
  expect(await mark.evaluate((element) => element.getBoundingClientRect().width)).toBeGreaterThan(
    100,
  );
  const timings = await mark.evaluate((element) =>
    element
      .getAnimations({ subtree: true })
      .map((animation) => animation.effect?.getComputedTiming().iterations),
  );
  expect(timings).toHaveLength(17);
  for (const time of timings) {
    expect(time).toBe(Infinity);
  }
  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }),
  );
  await expect(mark).not.toHaveAttribute('data-playing', '');
  await expect(center).toHaveCSS('animation-name', 'none');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(mark).toHaveAttribute('data-playing', '');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(center).toHaveCSS('animation-name', 'none');
  await expect(center).toHaveCSS('transform', 'none');
  await expect(page.locator('.app-cover button')).toHaveCount(0);
  await expect(page.locator('.app-cover .ink-field')).toHaveCSS('background-image', /grain/u);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('./');
  const once = page.locator('.product-card[data-product="hub"] .product-mark');
  await once.scrollIntoViewIfNeeded();
  await expect(once).toHaveAttribute('data-playing', '');
  await expect(once).toHaveAttribute('data-motion-mode', 'once');
  const ends = await once.evaluate((element) =>
    element
      .getAnimations({ subtree: true })
      .map((animation) => animation.effect?.getComputedTiming().endTime),
  );
  expect(ends.length).toBeGreaterThan(0);
  for (const end of ends) expect(end).toBeLessThan(5000);
});

for (const width of [320, 500, 640, 768, 1024, 1440]) {
  test(`the app carousel stays readable and bounded at ${width}px`, async ({ page, isMobile }) => {
    test.skip(
      isMobile,
      'The desktop project covers the full width matrix; mobile interaction is covered separately.',
    );
    await page.setViewportSize({ width, height: 740 });
    await page.goto('./project/');
    await page.evaluate(() => document.fonts.ready);
    const apps = page.locator('.nav-folder').first();
    for (const docked of [false, true]) {
      await page.evaluate(
        (docked) => window.scrollTo({ top: docked ? 360 : 0, behavior: 'instant' }),
        docked,
      );
      const header = page.locator('.masthead');
      if (docked) await expect(header).toHaveAttribute('data-stuck', '');
      else await expect(header).not.toHaveAttribute('data-stuck', '');
      await page.locator('.primary-nav').evaluate(async (element) => {
        await Promise.all(
          element.getAnimations().map((animation) => animation.finished.catch(() => {})),
        );
      });
      await apps.locator('summary').click();
      await expect(apps).toHaveAttribute('data-menu-state', 'open');
      const panel = apps.locator('.mega-panel');
      const track = panel.getByRole('navigation', { name: 'Apps', exact: true });
      await expect(track.locator('.mega-card')).toHaveCount(6);
      await expect(panel.getByRole('searchbox')).toHaveCount(0);
      await expect(panel.locator('.mega-topics, .mega-all')).toHaveCount(0);
      await expect
        .poll(() =>
          panel.evaluate((element) => {
            const box = element.getBoundingClientRect();
            return box.left >= 0 && box.right <= innerWidth + 1 && box.bottom <= innerHeight;
          }),
        )
        .toBe(true);
      expect(
        await panel.evaluate((element) => element.scrollWidth - element.clientWidth),
      ).toBeLessThanOrEqual(1);
      await track.press('End');
      await expect(
        panel.getByRole('link', { name: 'ZeroCloud Ledger', exact: true }),
      ).toBeInViewport();
      await expect(panel.getByRole('button', { name: 'Next apps' })).toBeDisabled();
      await track.press('Home');
      await expect(
        panel.getByRole('link', { name: 'ZeroCloud Hub', exact: true }),
      ).toBeInViewport();
      await expect(panel.getByRole('button', { name: 'Previous apps' })).toBeDisabled();
      await page.keyboard.press('Escape');
      await expect(apps.locator('summary')).toBeFocused();
    }
  });
}
