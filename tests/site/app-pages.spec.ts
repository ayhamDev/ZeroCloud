import { expect, test } from '@playwright/test';

test('app pages use concise sections and paired documentation and download cards', async ({
  page,
  request,
}) => {
  await page.goto('./downloads/');
  const noise = await page
    .locator('.downloads-cover .ink-field')
    .evaluate((element) => getComputedStyle(element).backgroundImage);
  for (const [slug, name] of [
    ['hub', 'ZeroCloud Hub'],
    ['share', 'ZeroCloud Share'],
    ['bucket', 'ZeroCloud Bucket'],
    ['cast', 'ZeroCloud Cast'],
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
  test(`a full featured menu stays readable and scrollable at ${width}px`, async ({
    page,
    isMobile,
  }) => {
    test.skip(
      isMobile,
      'The desktop project covers the full width matrix; mobile interaction is covered separately.',
    );
    await page.setViewportSize({ width, height: 740 });
    await page.goto('./project/');
    // Stress the layout with the maximum four featured cards, long descriptions and six categories.
    // The catalog unit fixture separately verifies selection from 48 synthetic app records.
    const apps = page.locator('.nav-folder').first();
    await apps.locator('.mega-cards').evaluate((element) => {
      const first = element.firstElementChild;
      if (!first) throw new Error('Missing app card');
      while (element.children.length < 4) element.append(first.cloneNode(true));
      for (const [index, title] of [
        'ZeroCloud Workspace Tools',
        'ZeroCloud Media Library',
      ].entries()) {
        const clone = element.children[index + 2];
        if (!clone) throw new Error('Missing stress card');
        clone.setAttribute('aria-label', title);
        const name = clone.querySelector('strong');
        const description = clone.querySelector('.mega-card-copy > span');
        if (name) name.textContent = title;
        if (description)
          description.textContent =
            'A longer app description that explains its purpose in a growing family of desktop and Android tools, with enough detail to wrap across several lines.';
      }
      const intro = element.previousElementSibling;
      if (intro) {
        const topics = document.createElement('nav');
        topics.className = 'mega-topics';
        topics.setAttribute('aria-label', 'App categories');
        for (const title of [
          'App management',
          'File sharing',
          'Writing and editing',
          'Media tools',
          'Developer tools',
          'Utilities',
        ]) {
          const link = document.createElement('a');
          link.href = './apps/';
          link.textContent = title;
          topics.append(link);
        }
        intro.append(topics);
      }
      const all = document.createElement('a');
      all.className = 'mega-all';
      all.href = './apps/';
      all.textContent = 'Browse all 48 apps';
      element.parentElement?.append(all);
    });
    for (const docked of [false, true]) {
      await page.evaluate(
        (docked) => window.scrollTo({ top: docked ? 360 : 0, behavior: 'instant' }),
        docked,
      );
      const header = page.locator('.masthead');
      if (docked) await expect(header).toHaveAttribute('data-stuck', '');
      else await expect(header).not.toHaveAttribute('data-stuck', '');
      await apps.locator('summary').click();
      const panel = apps.locator('.mega-panel');
      await expect(panel).toBeVisible();
      await expect(panel.locator('.mega-card')).toHaveCount(4);
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
      if (width > 960) {
        const cards = await panel.locator('.mega-card').evaluateAll((elements) =>
          elements.map((element) => {
            const box = element.getBoundingClientRect();
            return { x: box.x, y: box.y };
          }),
        );
        expect(cards[2]?.x).toBe(cards[0]?.x);
        expect(cards[3]?.x).toBe(cards[1]?.x);
        expect(cards[2]?.y).toBeGreaterThan(cards[0]?.y ?? 0);
      }
      if (width <= 960) {
        const names = await panel.locator('.mega-card-copy strong').evaluateAll((elements) =>
          elements.slice(0, 2).map((element) => {
            const style = getComputedStyle(element);
            return {
              height: element.getBoundingClientRect().height,
              lineHeight: Number.parseFloat(style.lineHeight),
            };
          }),
        );
        for (const name of names) expect(name.height).toBeLessThanOrEqual(name.lineHeight + 1);
      }
      const all = panel.getByRole('link', { name: 'Browse all 48 apps' });
      await all.focus();
      await expect(all).toBeInViewport();
      await page.keyboard.press('Escape');
      await expect(apps.locator('summary')).toBeFocused();
    }
  });
}
