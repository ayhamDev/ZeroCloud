import { expect, test } from '@playwright/test';

test('the original hero floats and the smaller marks loop while visible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('./');
  const hero = page.locator('.cover-mark');
  const smallMark = page.locator('.mast-row .loop-mark');
  const footer = page.locator('.foot-signature .loop-mark');
  const dot = hero.locator('circle').first();
  await expect(hero.locator('circle')).toHaveCount(27);
  await expect(hero.locator('.loop-mark')).toHaveCount(0);
  await expect(smallMark.locator('circle').first()).toHaveCSS(
    'animation-iteration-count',
    'infinite',
  );
  await expect(smallMark.locator('.zc-c').first()).toHaveCSS('animation-name', 'zc-cut');
  const floated = await hero.evaluate(async (el) => {
    const circle = el.querySelector('circle');
    await new Promise(requestAnimationFrame);
    const animation = circle?.getAnimations()[0];
    if (!animation || !circle) return false;
    animation.currentTime = 1900;
    const transform = new DOMMatrixReadOnly(getComputedStyle(circle).transform);
    return (
      animation.effect?.getComputedTiming().iterations === 1 &&
      Math.hypot(transform.e, transform.f) > 0.1
    );
  });
  expect(floated).toBe(true);
  await expect(footer.locator('circle').first()).toHaveCSS('animation-name', 'none');
  await footer.scrollIntoViewIfNeeded();
  await expect(footer.locator('circle').first()).toHaveCSS('animation-iteration-count', 'infinite');
  await expect.poll(() => dot.evaluate((el) => el.getAnimations().length)).toBe(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(footer.locator('circle').first()).toHaveCSS('animation-name', 'none');
  await expect(footer.locator('circle').first()).toHaveCSS('transform', 'none');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(footer.locator('circle').first()).toHaveCSS('animation-name', 'zc-wave');
});

test('the download arrow lands in its tray and respects visibility and reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('./downloads/');
  const glyph = page.locator('.download-glyph');
  const arrow = glyph.locator('.download-arrow');
  const tray = glyph.locator('.download-tray i');
  await expect(glyph).toHaveAttribute('aria-hidden', 'true');
  await expect(arrow).toHaveCSS('animation-name', 'download-drop');
  await expect(arrow).toHaveCSS('animation-iteration-count', 'infinite');
  await expect(tray.first()).toHaveCSS('animation-name', 'tray-ripple');
  // The row below the two raised tray edges starts its ripple at the middle dot.
  await expect(tray.nth(7)).toHaveCSS('animation-delay', '0s');
  await expect(tray.last()).toHaveCSS('animation-delay', '0.24s');
  await expect(page.locator('.downloads-cover canvas[data-ink="downloads"]')).toBeAttached();
  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }),
  );
  await expect(arrow).toHaveCSS('animation-name', 'none');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(arrow).toHaveCSS('animation-name', 'download-drop');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(arrow).toHaveCSS('transform', 'none');
  await expect(tray.first()).toHaveCSS('animation-name', 'none');
});

test('the transparent sticky header stays operable and clears anchored headings', async ({
  page,
  isMobile,
}) => {
  if (isMobile) await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('./docs/platforms/electrobun/');
  const header = page.locator('.masthead');
  await expect(header).toHaveCSS('position', 'sticky');
  await expect(header).not.toHaveAttribute('data-stuck', '');
  const widthAtTop = (await page.locator('.mast-row').boundingBox())?.width ?? 0;
  await page.evaluate(() => window.scrollTo({ top: 360, behavior: 'instant' }));
  await expect(header).toHaveAttribute('data-stuck', '');
  await expect(header).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect
    .poll(() => header.evaluate((el) => el.getBoundingClientRect().top))
    .toBeCloseTo(0, 0);
  if (isMobile) {
    await expect(page.locator('.mast-row .brand-name')).toHaveCSS('opacity', '0');
    await expect
      .poll(() => page.locator('.primary-nav').evaluate((el) => el.getBoundingClientRect().bottom))
      .toBeLessThan(62);
  } else {
    await expect
      .poll(async () => (await page.locator('.mast-row').boundingBox())?.width ?? widthAtTop)
      .toBeLessThan(widthAtTop - 20);
  }
  const docs = header.locator('summary').filter({ hasText: 'Docs' });
  await docs.click();
  await expect(header.getByRole('link', { name: 'Documentation home' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(docs).toBeFocused();
  await expect(header.locator('details[open]')).toHaveCount(0);
  await page
    .getByRole('navigation', { name: 'On this page' })
    .getByRole('link', { name: 'Run the shell' })
    .click();
  await expect(page).toHaveURL(/#run-the-shell$/u);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const heading = document.querySelector('#run-the-shell')?.getBoundingClientRect();
        const nav = document.querySelector('.primary-nav')?.getBoundingClientRect();
        return !!heading && !!nav && heading.top >= nav.bottom && heading.top < innerHeight;
      }),
    )
    .toBe(true);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(header).not.toHaveAttribute('data-stuck', '');
});
