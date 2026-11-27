import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('dropdowns animate both directions and reverse interrupted exits without a jump', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('./');
  const folder = page.locator('.nav-folder').first();
  const summary = folder.locator('summary');
  const panel = folder.locator('.flyout');
  const entrance = await folder.evaluate((element) => {
    // Freeze the sampled frame in the same task that starts its animation.
    element.querySelector<HTMLElement>('summary')?.click();
    const panel = element.querySelector<HTMLElement>('.flyout');
    const animation = panel?.getAnimations()[0];
    if (!panel) throw new Error('Missing dropdown');
    if (!animation) throw new Error('Missing dropdown entrance');
    animation.pause();
    animation.currentTime = 90;
    const style = getComputedStyle(panel);
    const result = { opacity: Number(style.opacity), transform: style.transform };
    animation.play();
    return result;
  });
  expect(entrance.opacity).toBeGreaterThan(0);
  expect(entrance.opacity).toBeLessThan(1);
  expect(entrance.transform).not.toBe('none');
  await expect(folder).toHaveAttribute('data-menu-state', 'open');
  const reversal = await folder.evaluate((element) => {
    // Begin and freeze the exit in one task, before a busy runner can let it finish.
    element.querySelector<HTMLElement>('summary')?.click();
    const panel = element.querySelector<HTMLElement>('.flyout');
    const animation = panel?.getAnimations()[0];
    if (!panel || !animation) throw new Error('Missing dropdown exit');
    animation.pause();
    animation.currentTime = 110;
    const before = Number(getComputedStyle(panel).opacity);
    const closing = {
      open: element.hasAttribute('open'),
      inert: panel.inert,
      expanded: element.querySelector('summary')?.getAttribute('aria-expanded'),
    };
    element.querySelector<HTMLElement>('summary')?.click();
    return { before, after: Number(getComputedStyle(panel).opacity), closing };
  });
  expect(reversal.closing).toEqual({ open: true, inert: true, expanded: 'false' });
  expect(reversal.before).toBeGreaterThan(0);
  expect(reversal.before).toBeLessThan(1);
  expect(reversal.after).toBeCloseTo(reversal.before, 2);
  await expect(summary).toHaveAttribute('aria-expanded', 'true');
  await expect(folder).toHaveAttribute('data-menu-state', 'open');
  await page.keyboard.press('Escape');
  await expect(summary).toBeFocused();
  await expect(folder).not.toHaveAttribute('open', '');
  await expect(panel).toBeHidden();
  await expect.poll(() => panel.evaluate((el) => el.getAnimations().length)).toBe(0);
});

test('switching menus, outside focus and reduced motion keep only the intended links available', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('./');
  const apps = page.locator('.nav-folder').first();
  const docs = page.locator('.nav-folder').nth(1);
  await apps.locator('summary').click();
  await docs.locator('summary').click();
  await expect(apps.locator('.flyout')).toHaveAttribute('aria-hidden', 'true');
  await expect(docs.locator('summary')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('link', { name: 'Hub documentation', exact: true })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Apps', exact: true })).toHaveCount(0);
  await expect(docs).toHaveAttribute('data-menu-state', 'open');
  await page.locator('.primary-nav > a').focus();
  await expect(docs.locator('summary')).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('link', { name: 'Hub documentation', exact: true })).toHaveCount(0);
  await expect(docs).not.toHaveAttribute('open', '');
  await apps.locator('summary').click();
  await expect(apps).toHaveAttribute('data-menu-state', 'open');
  await apps.locator('summary').click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(apps).not.toHaveAttribute('open', '');
  await docs.locator('summary').click();
  await expect(docs).toHaveAttribute('data-menu-state', 'open');
  expect(await docs.locator('.flyout').evaluate((el) => el.getAnimations().length)).toBe(0);
  await page.mouse.click(2, 200);
  await expect(docs).not.toHaveAttribute('open', '');
  await expect(page.locator('.mast-row')).toHaveCSS('opacity', '1');
});

test('documentation link columns stay readable, scrollable and accessible as guide lists grow', async ({
  page,
  isMobile,
}) => {
  if (isMobile) await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('./project/');
  const docs = page.locator('.nav-folder').nth(1);
  // Stress the bounded three article links with wrapping titles, alongside the
  // real documentation/FAQ links, without publishing placeholder articles.
  await docs.locator('.docs-app ul').evaluateAll((lists) => {
    for (const list of lists) {
      for (const title of [
        'Connecting your devices securely',
        'Managing a shared collection',
        'Recovering after replacing a device',
      ]) {
        const row = document.createElement('li');
        const link = document.createElement('a');
        link.href = list.querySelector('a')?.href ?? '';
        link.textContent = title;
        row.append(link);
        list.prepend(row);
      }
    }
  });
  for (const docked of [false, true]) {
    await page.evaluate(
      (docked) => window.scrollTo({ top: docked ? 360 : 0, behavior: 'instant' }),
      docked,
    );
    await docs.locator('summary').click();
    await expect(docs).toHaveAttribute('data-menu-state', 'open');
    const panel = docs.locator('.flyout');
    const layout = await panel.evaluate((element) => {
      const box = element.getBoundingClientRect();
      return {
        inside: box.left >= 0 && box.right <= innerWidth + 1 && box.bottom <= innerHeight,
        overflow: element.scrollWidth - element.clientWidth,
      };
    });
    expect(layout.inside).toBe(true);
    expect(layout.overflow).toBeLessThanOrEqual(1);
    const last = docs
      .getByRole('navigation', { name: 'ZeroCloud Ledger', exact: true })
      .getByRole('link', { name: 'Common questions' });
    await last.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(last).toBeFocused();
    await expect(last).toBeInViewport();
    await expect(last).toHaveCSS('outline-style', 'solid');
    await page.keyboard.press('Escape');
    await expect(docs).not.toHaveAttribute('open', '');
  }
  await docs.locator('summary').click();
  await expect(docs).toHaveAttribute('data-menu-state', 'open');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

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

test('footer noise stays subtle and static with a reduced-motion fallback', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('./apps/cast/');
  const footer = page.locator('.site-foot');
  const field = footer.locator('.ink-field');
  await expect(field).toHaveAttribute('aria-hidden', 'true');
  await expect(field).toHaveCSS('animation-name', 'none');
  await expect(field).toHaveCSS('transform', 'none');
  await expect(field).toHaveCSS('pointer-events', 'none');
  await expect(field).toHaveCSS('opacity', '0.3');
  await footer.scrollIntoViewIfNeeded();
  await expect(field).toHaveCSS('animation-name', 'none');
  await expect(field.locator('canvas')).toHaveCSS('transition-property', 'none');
  expect(await field.evaluate((element) => element.getAnimations().length)).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(field).toHaveCSS('animation-name', 'none');
  await expect(field).toHaveCSS('transform', 'none');
  await expect(field.locator('canvas')).toHaveCSS('opacity', '0');
  await expect(field).not.toHaveCSS('background-image', 'none');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(field).toHaveCSS('animation-name', 'none');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(field).toHaveCSS('animation-name', 'none');
});

test('the transparent sticky header stays operable and clears anchored headings', async ({
  page,
  isMobile,
}) => {
  if (isMobile) await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('./');
  const header = page.locator('.masthead');
  await expect(header).toHaveCSS('position', 'sticky');
  await expect(header).not.toHaveAttribute('data-stuck', '');
  // A lingering opacity animation on this ancestor isolates its backdrop filter.
  await expect(page.locator('.mast-row')).toHaveCSS('animation-name', 'none');
  await expect(page.locator('.mast-row')).toHaveCSS('opacity', '1');
  await expect(page.locator('.mast-row')).toHaveCSS('will-change', 'auto');
  const widthAtTop = (await page.locator('.mast-row').boundingBox())?.width ?? 0;
  await page.evaluate(() => window.scrollTo({ top: 360, behavior: 'instant' }));
  await expect(header).toHaveAttribute('data-stuck', '');
  await expect(header).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  const backdrop = await page
    .locator('.mast-row')
    .evaluate((row) => getComputedStyle(row, '::before').backdropFilter);
  expect(backdrop).toContain('blur(');
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
  await expect(page.locator('.mast-row')).toHaveCSS('transition-property', /max-width/u);
  await expect(page.locator('.primary-nav')).toHaveCSS('transition-property', /transform/u);
  await page.keyboard.press('Escape');
  await expect(docs).toBeFocused();
  await expect(header.locator('details[open]')).toHaveCount(0);
  await page.getByRole('link', { name: 'What ZeroCloud means' }).click();
  await expect(page).toHaveURL(/#what-is-zerocloud$/u);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const heading = document.querySelector('#what-is-zerocloud')?.getBoundingClientRect();
        const nav = document.querySelector('.primary-nav')?.getBoundingClientRect();
        return !!heading && !!nav && heading.top >= nav.bottom && heading.top < innerHeight;
      }),
    )
    .toBe(true);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(header).not.toHaveAttribute('data-stuck', '');
});
