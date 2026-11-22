import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const shareURL = 'http://127.0.0.1:14375/share-preview/';

test('loads the family cover with its supplied mark and only local assets', async ({
  page,
  baseURL,
}) => {
  const origins = new Set<string>();
  const errors: string[] = [];
  const images: string[] = [];
  page.on('request', (request) => {
    if (!request.url().startsWith('http')) return;
    origins.add(new URL(request.url()).origin);
    if (request.resourceType() === 'image') images.push(request.url());
  });
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(response.url());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    /Software for\s*your own devices\./u,
  );
  await expect(page.locator('.cover-mark svg circle').first()).toBeAttached();
  await expect(page.locator('img, picture')).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  const bytes = await page.evaluate(() => {
    const external = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const inline = Array.from(document.scripts).filter(
      (s) => !s.src && s.type !== 'application/ld+json',
    );
    return (
      inline.reduce((sum, s) => sum + new TextEncoder().encode(s.textContent ?? '').length, 0) +
      external
        .filter((r) => new URL(r.name).pathname.endsWith('.js'))
        .reduce((sum, r) => sum + r.decodedBodySize, 0)
    );
  });
  expect(bytes).toBeGreaterThan(0);
  expect(bytes).toBeLessThan(16 * 1024);
  expect(errors).toEqual([]);
  expect(images).toEqual([]);
  expect([...origins]).toEqual([new URL(baseURL ?? '').origin]);
});

test('navigates the nested app site, platform targets and real release history', async ({
  page,
}) => {
  await page.goto('./');
  const menu = page.locator('.nav-folder summary').filter({ hasText: 'Apps' });
  await menu.focus();
  await page.keyboard.press('Enter');
  const flyout = page.locator('.nav-folder[open]');
  await expect(flyout.getByRole('link', { name: 'ZeroCloudShare' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  await expect(flyout).toHaveCount(0);
  await page.getByRole('link', { name: 'Explore the apps' }).click();
  await page.getByRole('link', { name: 'Visit app site' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('ZeroCloudShare');
  const tabs = page.getByRole('navigation', { name: 'Share sections' });
  await tabs.getByRole('link', { name: 'Design', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'One local connection' })).toBeVisible();
  await tabs.getByRole('link', { name: 'Downloads' }).click();
  await expect(tabs.getByRole('link', { name: 'Downloads' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(page.getByText('Awaiting first build')).toHaveCount(2);
  await expect(page.getByRole('link', { name: 'GitHub releases' })).toHaveAttribute(
    'href',
    'https://github.com/ayhamDev/ZeroCloud/releases',
  );
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Downloads', exact: true })
    .click();
  await expect(page.getByRole('region', { name: 'ZeroCloudShare releases' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Desktop guide' })).toHaveAttribute(
    'href',
    /\/docs\/platforms\/electrobun\/$/u,
  );
  await page.getByRole('link', { name: 'Browse the archive' }).click();
  await page.getByLabel('Platform', { exact: true }).selectOption('Android');
  await page.getByLabel('Find a build').fill('arm64');
  await expect(page.getByRole('heading', { name: 'No matching builds' })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Platform', { exact: true })).toHaveValue('Android');
  await expect(page.getByLabel('Find a build')).toHaveValue('arm64');
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.getByRole('heading', { name: 'No published builds yet' })).toBeVisible();
  await page.locator('.archive-watch summary').click();
  await expect(page.getByRole('link', { name: 'Open the repository' })).toHaveAttribute(
    'href',
    'https://github.com/ayhamDev/ZeroCloud',
  );
});

test('searches guides by multiple terms, follows a nested article and copies an example', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async (text: string) => {
          document.documentElement.dataset.copied = text;
        },
      },
    });
  });
  await page.goto('./docs/?q=desktop+window');
  await expect(page.getByRole('searchbox')).toHaveValue('desktop window');
  await expect(page.getByRole('status')).toHaveText('1 article found.');
  await page.getByRole('button', { name: 'Clear' }).click();
  await expect(page.getByRole('searchbox')).toBeFocused();
  await page.getByRole('searchbox').fill('unfindableterm');
  await expect(page.getByRole('status')).toContainText('No matching articles');
  await page.getByRole('button', { name: 'Clear' }).click();
  await expect(page.getByRole('searchbox')).toHaveValue('');
  await page.locator('.guide-item').filter({ hasText: 'Electrobun' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Electrobun');
  await page
    .getByRole('navigation', { name: 'On this page' })
    .getByRole('link', { name: 'Run the shell' })
    .click();
  await expect(page).toHaveURL(/#run-the-shell$/u);
  await page.getByRole('button', { name: 'Copy code' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-copied', /bun run dev:desktop/u);
  await page
    .getByRole('navigation', { name: 'Breadcrumb' })
    .getByRole('link', { name: 'Platform shells' })
    .click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Platform shells');
});

test('reveals words on scroll and follows system motion changes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('./');
  const supportsWorker = await page.evaluate(
    () => 'transferControlToOffscreen' in HTMLCanvasElement.prototype,
  );
  if (supportsWorker) {
    const shader = page.waitForResponse((response) =>
      response.url().includes('/_astro/ink.worker-'),
    );
    await page.evaluate(() => window.scrollBy({ top: 32, behavior: 'instant' }));
    expect((await shader).ok()).toBe(true);
  }
  const statement = page.locator('.principle-strip .pull');
  await statement.scrollIntoViewIfNeeded();
  await expect(statement).toHaveClass(/entered/u);
  const words = statement.locator('.reveal-word > span');
  await expect(words.first()).toHaveCSS('animation-name', 'word-rise');
  expect(await words.nth(1).evaluate((node) => getComputedStyle(node).animationDelay)).not.toBe(
    '0s',
  );
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(words.first()).toHaveCSS('animation-name', 'none');
  await expect(words.first()).toHaveCSS('transform', 'none');
  await expect(page.locator('[data-motion-control], .logo-toggle')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.cover-line .reveal-word > span').first()).toHaveCSS(
    'animation-name',
    'none',
  );
});

test('builds Share independently with its own root, docs and downloads', async ({
  page,
  request,
}) => {
  await page.goto(shareURL);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('ZeroCloudShare');
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', shareURL);
  const tabs = page.getByRole('navigation', { name: 'Share sections' });
  await tabs.getByRole('link', { name: 'Technologies' }).click();
  await expect(page).toHaveURL(`${shareURL}technologies/`);
  await page.locator('.guide-item').filter({ hasText: 'Run the shared interface' }).click();
  await expect(page.getByRole('heading', { name: 'Expected result' })).toBeVisible();
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
    'href',
    `${shareURL}docs/examples/run-the-interface/`,
  );
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Downloads', exact: true })
    .click();
  await expect(page.getByRole('heading', { name: 'Share downloads', level: 1 })).toBeVisible();
  await expect(page.getByText(/awaiting its first public release/u)).toBeVisible();
  expect((await request.get(`${shareURL}docs/publishing/astro/`)).status()).toBe(404);
  expect((await request.get(`${shareURL}apps/share/`)).status()).toBe(404);
});

test('the public library and footer expose reader destinations in each edition', async ({
  page,
  request,
  baseURL,
}) => {
  for (const base of [baseURL ?? '', shareURL]) {
    await page.goto(`${base}docs/`);
    const rail = page.getByRole('navigation', { name: 'Jump to topic' });
    await rail.getByRole('link', { name: 'Platform shells' }).click();
    await expect(page).toHaveURL(/#topic-platforms$/u);
    await expect(page.locator('#topic-platforms .guide-item')).toHaveCount(2);
    const footer = page.getByRole('contentinfo');
    await expect(footer.getByRole('button')).toHaveCount(0);
    await expect(
      footer.getByRole('link', { name: 'GitHub', exact: true }).locator('svg'),
    ).toBeVisible();
    await expect(page.locator('.source-button svg')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(
      await footer.locator('.foot-name').evaluate((el) => {
        const range = document.createRange();
        range.selectNodeContents(el);
        const text = range.getBoundingClientRect();
        const box = el.closest('footer')?.getBoundingClientRect();
        return (
          range.getClientRects().length === 1 &&
          box &&
          text.left >= box.left &&
          text.right <= box.right
        );
      }),
    ).toBe(true);
    await expect(footer.getByRole('link', { name: 'All guides' })).toHaveAttribute(
      'href',
      new URL(`${base}docs/`).pathname,
    );
    await expect(page.locator('a[href*="design-system"], a[href*="/docs/publishing"]')).toHaveCount(
      0,
    );
    await footer.getByRole('link', { name: 'Back to top' }).click();
    await expect(page).toHaveURL(/#top$/u);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await page.getByRole('searchbox').fill('micro-dot');
    await expect(page.getByRole('status')).toContainText('No matching articles');
    await expect(rail).toBeHidden();
    const sitemap = await (await request.get(`${base}sitemap-0.xml`)).text();
    for (const path of [
      'docs/design-system/',
      'docs/design-system/foundations/',
      'docs/publishing/',
      'docs/publishing/astro/',
      'dev/design-system/',
    ]) {
      expect(sitemap).not.toContain(path);
      expect((await request.get(base + path)).status()).toBe(404);
    }
  }
});

test('publishes page-specific metadata, a sitemap and a useful 404', async ({
  page,
  request,
  baseURL,
}) => {
  for (const path of ['', 'apps/share/', 'docs/platforms/electrobun/', 'downloads/']) {
    await page.goto(`./${path}`);
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', baseURL + path);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      'content',
      baseURL + path,
    );
    const schema = JSON.parse(
      (await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}',
    );
    expect(schema.url).toBe(baseURL + path);
  }
  expect(await (await request.get('robots.txt')).text()).toContain(
    `Sitemap: ${baseURL}sitemap-index.xml`,
  );
  const sitemap = await (await request.get('sitemap-0.xml')).text();
  expect(sitemap).toContain(`<loc>${baseURL}docs/foundations/local-networks/</loc>`);
  expect(sitemap).not.toContain('/404');
  expect((await page.goto('./missing-page/'))?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Page not found.' })).toBeVisible();
  await page.getByRole('link', { name: 'Return home' }).click();
  await expect(page).toHaveURL(baseURL ?? '');
});

for (const [label, route] of [
  ['cover', './'],
  ['guide index', './docs/'],
  ['article', './docs/platforms/electrobun/'],
  ['downloads', './downloads/'],
]) {
  test(`meets automated accessibility checks on the ${label}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(route ?? './');
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(
      result.violations.map(({ id, nodes }) => ({ id, elements: nodes.map((n) => n.target) })),
    ).toEqual([]);
  });
}

test.describe('static HTML', () => {
  test.use({ javaScriptEnabled: false });
  test('keeps nested navigation, content and downloads usable at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await page.goto('./');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
    for (const route of [
      './',
      './docs/',
      './docs/examples/run-the-interface/',
      './apps/share/',
      './downloads/',
    ]) {
      await page.goto(route);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        route,
      ).toBe(true);
    }
    await page.locator('.nav-folder summary').filter({ hasText: 'Docs' }).click();
    await page.locator('.flyout').getByRole('link', { name: 'Platform shells' }).click();
    await page
      .locator('.topic-index')
      .getByRole('link', { name: /Capacitor/u })
      .click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Capacitor on Android');
  });
});
