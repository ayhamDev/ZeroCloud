import { expect, test } from '@playwright/test';

test('all six apps are reachable with carousel controls and compact docs links', async ({
  page,
}) => {
  await page.goto('./');
  const apps = page.locator('.nav-folder').first();
  await apps.locator('summary').click();
  await expect(apps).toHaveAttribute('data-menu-state', 'open');
  const track = apps.getByRole('navigation', { name: 'Apps', exact: true });
  await expect(track.locator('.mega-card')).toHaveCount(6);
  await expect(apps.getByRole('searchbox')).toHaveCount(0);
  await apps.getByRole('button', { name: 'Next apps' }).click();
  await expect(apps.getByRole('button', { name: 'Previous apps' })).toBeEnabled();
  await track.press('End');
  await expect(apps.getByRole('link', { name: 'ZeroCloud Ledger', exact: true })).toBeInViewport();
  await expect(apps.getByRole('button', { name: 'Next apps' })).toBeDisabled();
  const docs = page.locator('.nav-folder').nth(1);
  await docs.locator('summary').click();
  await expect(docs).toHaveAttribute('data-menu-state', 'open');
  await expect(docs.locator('.docs-app')).toHaveCount(6);
  for (const name of ['Hub', 'Share', 'Bucket', 'Cast', 'Seek', 'Ledger']) {
    const group = docs.getByRole('navigation', { name: `ZeroCloud ${name}`, exact: true });
    await expect(group.getByRole('link', { name: `${name} documentation` })).toHaveAttribute(
      'href',
      /\/technologies\/$/u,
    );
    await expect(group.getByRole('link', { name: 'Common questions' })).toHaveAttribute(
      'href',
      /#app-faq-title$/u,
    );
  }
});

test('menu height reverses smoothly and settles without a lingering animation', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('./');
  const apps = page.locator('.nav-folder').first();
  const docs = page.locator('.nav-folder').nth(1);
  await apps.locator('summary').click();
  await expect(apps).toHaveAttribute('data-menu-state', 'open');
  const panel = apps.locator('.flyout');
  const size = await panel.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).height),
  );
  // A future longer app description changes the measured content height.
  await apps.locator('.mega-intro').evaluate((element) => {
    element.style.minHeight = '480px';
  });
  await expect(panel).toHaveAttribute('data-resizing', '');
  const resize = await panel.evaluate((element) => {
    const animation = element
      .getAnimations()
      .find((item) =>
        (item.effect as KeyframeEffect).getKeyframes().some((frame) => frame.height !== undefined),
      );
    if (!animation) throw new Error('Missing height transition');
    animation.pause();
    animation.currentTime = 100;
    return Number.parseFloat(getComputedStyle(element).height);
  });
  expect(resize).toBeGreaterThan(size);
  // Shrink again mid-flight, using the current rendered height as the new start.
  await apps.locator('.mega-intro').evaluate((element) => {
    element.style.minHeight = '120px';
  });
  await expect(panel).not.toHaveAttribute('data-resizing', '');
  await expect
    .poll(() => panel.evaluate((element) => Number.parseFloat(getComputedStyle(element).height)))
    .toBeLessThan(resize);
  await docs.locator('summary').click();
  await expect(docs).toHaveAttribute('data-menu-state', 'open');
  await expect(docs.locator('.flyout')).not.toHaveAttribute('data-resizing', '');
  await expect
    .poll(() => docs.locator('.flyout').evaluate((element) => element.getAnimations().length))
    .toBe(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await apps.locator('summary').click();
  await expect(apps).toHaveAttribute('data-menu-state', 'open');
  expect(await panel.evaluate((element) => element.getAnimations().length)).toBe(0);
});
