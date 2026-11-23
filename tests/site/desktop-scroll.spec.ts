import { expect, test } from '@playwright/test';

test('wheel momentum follows desktop input and live motion preferences', async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.clock.install();
  await page.goto('./');
  const root = page.locator('html');

  if (isMobile) {
    await expect(root).not.toHaveClass(/\blenis\b/u);
    const native = await page.evaluate(() =>
      document.body.dispatchEvent(
        new WheelEvent('wheel', { deltaY: 400, bubbles: true, cancelable: true }),
      ),
    );
    expect(native).toBe(true);
    return;
  }

  await page.mouse.move(200, 200);
  await expect(root).toHaveClass(/\blenis\b/u);
  const handled = await page.evaluate(() =>
    document.body.dispatchEvent(
      new WheelEvent('wheel', { deltaY: 400, bubbles: true, cancelable: true }),
    ),
  );
  expect(handled).toBe(false);
  await page.clock.runFor(64);
  const coasting = await page.evaluate(() => scrollY);
  expect(coasting).toBeGreaterThan(0);
  expect(coasting).toBeLessThan(400);
  await page.clock.runFor(900);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(400);

  await page.evaluate(() =>
    document.body.dispatchEvent(
      new WheelEvent('wheel', { deltaY: 400, bubbles: true, cancelable: true }),
    ),
  );
  await page.clock.runFor(64);
  await page.keyboard.press('End');
  await page.clock.runFor(900);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollHeight - innerHeight - scrollY))
    .toBeLessThan(2);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(root).not.toHaveClass(/\blenis\b/u);
  const native = await page.evaluate(() =>
    document.body.dispatchEvent(
      new WheelEvent('wheel', { deltaY: 400, bubbles: true, cancelable: true }),
    ),
  );
  expect(native).toBe(true);

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.mouse.move(300, 240);
  await expect(root).toHaveClass(/\blenis\b/u);
  await page.setViewportSize({ width: 600, height: 800 });
  await expect(root).not.toHaveClass(/\blenis\b/u);
});
