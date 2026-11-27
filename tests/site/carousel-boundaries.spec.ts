import { expect, test } from '@playwright/test';

test('carousel endpoints and leaving the header never replay the appbar entrance', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('./');
  const folder = page.locator('.nav-folder').first();
  await folder.locator('summary').click();
  await expect(folder).toHaveAttribute('data-menu-state', 'open');
  const next = folder.getByRole('button', { name: 'Next apps' });
  const previous = folder.getByRole('button', { name: 'Previous apps' });
  const track = folder.locator('.mega-cards');
  await page.locator('.mast-row').evaluate((element) => {
    element.setAttribute('data-test-replays', '0');
    element.addEventListener('animationstart', (event) => {
      if ((event as AnimationEvent).animationName === 'appbar-arrive')
        element.setAttribute(
          'data-test-replays',
          String(Number(element.getAttribute('data-test-replays')) + 1),
        );
    });
  });
  const opacity = page.evaluate(async () => {
    const nav = document.querySelector('.primary-nav');
    if (!nav) throw new Error('Missing navigation');
    const samples: number[] = [];
    const start = performance.now();
    while (performance.now() - start < 2600) {
      await new Promise(requestAnimationFrame);
      samples.push(Number(getComputedStyle(nav).opacity));
    }
    return Math.min(...samples);
  });
  while (await next.isEnabled()) {
    await next.click();
    await expect(track).not.toHaveAttribute('data-settling', '');
  }
  await expect(track).toBeFocused();
  while (await previous.isEnabled()) {
    await previous.click();
    await expect(track).not.toHaveAttribute('data-settling', '');
  }
  await expect(track).toBeFocused();
  await page.locator('main').focus();
  await expect(folder).toHaveAttribute('data-menu-state', 'closed');
  expect(await opacity).toBe(1);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await expect(page.locator('.mast-row')).toHaveAttribute('data-test-replays', '0');
  await expect(page.locator('.primary-nav')).toHaveCSS('opacity', '1');
});

test('releasing a swipe eases from its current position instead of teleporting', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.clock.install();
  await page.goto('./');
  const folder = page.locator('.nav-folder').first();
  await folder.locator('summary').click();
  await expect(folder).toHaveAttribute('data-menu-state', 'open');
  const track = folder.locator('.mega-cards');
  await expect(track).toHaveAttribute('data-enhanced', '');
  const box = await track.boundingBox();
  if (!box) throw new Error('Missing carousel');
  await page.clock.pauseAt(Date.now() + 100);
  const start = box.x + box.width * 0.8;
  const end = start - box.width * 0.24;
  await page.mouse.move(start, box.y + 50);
  await page.mouse.down();
  await page.mouse.move(end, box.y + 50, { steps: 6 });
  const released = await track.evaluate((element) => element.scrollLeft);
  await page.mouse.up();
  const immediate = await track.evaluate((element) => element.scrollLeft);
  expect(immediate).toBeCloseTo(released, 0);
  await expect(track).toHaveAttribute('data-settling', '');
  await page.clock.runFor(48);
  const middle = await track.evaluate((element) => element.scrollLeft);
  await page.clock.runFor(600);
  const settled = await track.evaluate((element) => element.scrollLeft);
  expect(Math.abs(middle - released)).toBeGreaterThan(1);
  expect(Math.abs(settled - middle)).toBeGreaterThan(1);
  await expect(track).not.toHaveAttribute('data-settling', '');
  await expect(folder).toHaveAttribute('data-menu-state', 'open');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await track.press('Home');
  expect(await track.evaluate((element) => element.scrollLeft)).toBe(0);
});

test('directory cards form a compact responsive grid and remain filterable', async ({
  page,
  isMobile,
}) => {
  await page.goto('./apps/');
  if (!isMobile) await page.setViewportSize({ width: 1280, height: 900 });
  const grid = page.locator('.index-list');
  const columns = await grid.evaluate(
    (element) => getComputedStyle(element).gridTemplateColumns.split(' ').length,
  );
  expect(columns).toBe(isMobile ? 1 : 3);
  if (!isMobile) {
    await page.setViewportSize({ width: 800, height: 900 });
    expect(
      await grid.evaluate(
        (element) => getComputedStyle(element).gridTemplateColumns.split(' ').length,
      ),
    ).toBe(2);
  }
  await expect(grid.locator('.directory-item')).toHaveCount(6);
  await expect(
    grid.getByRole('link', { name: /^ZeroCloud Ledger .*Explore Ledger$/ }),
  ).toBeVisible();
  await page.getByRole('searchbox', { name: 'Search apps' }).fill('ledger');
  await expect(grid.locator('.directory-item:visible')).toHaveCount(1);
  await grid.getByRole('link', { name: /^ZeroCloud Ledger .*Explore Ledger$/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('ZeroCloud Ledger');
});
