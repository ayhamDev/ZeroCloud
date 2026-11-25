import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const shareURL = 'http://127.0.0.1:14375/share-preview/';

test('renders the complete cover in HTML with only local assets and a small script budget', async ({
  page,
  request,
  baseURL,
}) => {
  const origins = new Set<string>();
  const errors: string[] = [];
  page.on('request', (request) => {
    if (request.url().startsWith('http')) origins.add(new URL(request.url()).origin);
  });
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(response.url());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  const html = await (await request.get('./')).text();
  expect(html.replace(/<[^>]+>/gu, ' ').replace(/\s+/gu, ' ')).toContain('your own devices.');
  expect(html).toContain('ZeroCloud Hub');
  expect(html).toContain('ZeroCloud Share');
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    /Software for\s*your own devices\./u,
  );
  await expect(page.locator('.cover-mark svg circle')).toHaveCount(27);
  await expect(page.locator('img, picture')).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  const bytes = await page.evaluate(() => {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    return (
      Array.from(document.scripts)
        .filter((script) => !script.src && script.type !== 'application/ld+json')
        .reduce(
          (total, script) => total + new TextEncoder().encode(script.textContent ?? '').length,
          0,
        ) +
      resources
        .filter((resource) => new URL(resource.name).pathname.endsWith('.js'))
        .reduce((total, resource) => total + resource.decodedBodySize, 0)
    );
  });
  expect(bytes).toBeGreaterThan(0);
  expect(bytes).toBeLessThan(24 * 1024);
  expect(errors).toEqual([]);
  expect([...origins]).toEqual([new URL(baseURL ?? '').origin]);
});

test('opens app cards and grouped documentation links with keyboard and Escape', async ({
  page,
}) => {
  await page.goto('./');
  const apps = page.locator('.nav-folder summary').filter({ hasText: 'Apps' });
  await apps.focus();
  await page.keyboard.press('Enter');
  const panel = page.locator('.nav-folder[open] .mega-panel');
  await expect(panel.locator('.mega-card')).toHaveCount(4);
  await expect(panel.locator('.mega-card').first()).toHaveAccessibleName('ZeroCloud Hub');
  await expect(panel.getByText('Optional companion', { exact: true })).toBeVisible();
  await expect(panel.getByText(/Send files from any device/)).toBeVisible();
  expect(
    await panel.evaluate((element) => element.getBoundingClientRect().width / innerWidth),
  ).toBeGreaterThan(0.7);
  await page.keyboard.press('Escape');
  await expect(apps).toBeFocused();
  await expect(page.locator('.nav-folder[open]')).toHaveCount(0);
  await page.locator('.nav-folder summary').filter({ hasText: 'Docs' }).click();
  const docs = page.locator('.docs-panel');
  await expect(docs.locator('.mega-card')).toHaveCount(0);
  await expect(docs.locator('.docs-app')).toHaveCount(4);
  for (const name of ['Hub', 'Share', 'Bucket', 'Cast']) {
    const section = docs.getByRole('navigation', { name: `ZeroCloud ${name}`, exact: true });
    await expect(section.getByRole('heading')).toHaveAccessibleName(`ZeroCloud ${name}`);
    await expect(section.getByRole('link', { name: `${name} documentation` })).toHaveAttribute(
      'href',
      /\/technologies\/$/u,
    );
    await expect(section.getByRole('link', { name: 'Common questions' })).toHaveAttribute(
      'href',
      /#app-faq-title$/u,
    );
  }
  await expect(page.getByRole('link', { name: 'Hub documentation', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Hub documentation', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Documentation.');
  await expect(page.getByRole('heading', { name: 'No guides yet.' })).toBeVisible();
});

test('keeps Hub first and optional while Share has independent downloads and a real archive', async ({
  page,
}) => {
  await page.goto('./downloads/');
  await expect(page.locator('.release-entry').first()).toHaveAttribute('id', 'builds-hub');
  await expect(page.getByText('Hub is optional.', { exact: true })).toBeVisible();
  const share = page.getByRole('region', { name: 'ZeroCloud Share releases' });
  await expect(share).toBeVisible();
  await expect(share.getByText('Awaiting first build')).toHaveCount(2);
  await expect(share.getByRole('link', { name: 'GitHub releases' })).toHaveAttribute(
    'href',
    'https://github.com/ayhamDev/ZeroCloud/releases',
  );
  await expect(page.locator('.platform-guide')).toHaveCount(0);
  await page.getByRole('link', { name: 'Browse the archive' }).click();
  await page.getByLabel('Platform', { exact: true }).selectOption('Android');
  await page.getByLabel('Find a build').fill('arm64');
  await expect(page.getByRole('heading', { name: 'No matching builds' })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Platform', { exact: true })).toHaveValue('Android');
  await expect(page.getByLabel('Find a build')).toHaveValue('arm64');
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.getByRole('heading', { name: 'No published builds yet' })).toBeVisible();
});

test('clears the public docs without stale guide links, articles or a misleading search box', async ({
  page,
  request,
}) => {
  await page.goto('./docs/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Documentation');
  await expect(page.getByRole('heading', { name: 'No guides yet.' })).toBeVisible();
  await expect(page.getByRole('searchbox')).toHaveCount(0);
  await expect(page.locator('.guide-item')).toHaveCount(0);
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex, follow');
  for (const oldPath of [
    'docs/platforms/electrobun/',
    'docs/examples/run-the-interface/',
    'apps/share/design/',
  ]) {
    expect((await request.get(oldPath)).status()).toBe(404);
  }
});

test('finds apps by purpose and category with linkable filters and an empty state', async ({
  page,
}) => {
  await page.goto('./apps/?category=File%20sharing');
  const cards = page.locator('[data-catalog-item]:visible');
  await expect(cards).toHaveCount(1);
  await expect(cards.getByRole('heading')).toHaveText('ZeroCloud Share');
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Search apps' }).fill('install update');
  await expect(cards).toHaveCount(1);
  await expect(cards.getByRole('heading')).toHaveText('ZeroCloud Hub');
  await page.reload();
  await expect(page.getByRole('searchbox', { name: 'Search apps' })).toHaveValue('install update');
  await page.getByRole('searchbox', { name: 'Search apps' }).fill('no-such-app');
  await expect(page.getByRole('heading', { name: 'No matching apps.' })).toBeVisible();
  await page.getByRole('button', { name: 'Show all apps' }).click();
  await expect(cards).toHaveCount(4);
});

test('filters download apps without making Hub mandatory or breaking direct app anchors', async ({
  page,
}) => {
  await page.goto('./downloads/');
  await page.getByRole('searchbox', { name: 'Search apps' }).fill('file sharing');
  await expect(page.locator('#builds-hub')).toBeHidden();
  await expect(page.locator('#builds-share')).toBeVisible();
  await page.getByRole('link', { name: 'ZeroCloud Hub', exact: true }).first().click();
  await expect(page.locator('#builds-hub')).toBeVisible();
});

test('reveals offscreen content in sequence and immediately honors reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('./');
  const card = page.locator('.product-card').first();
  await expect(page.locator('html')).toHaveAttribute('data-reveal', 'ready');
  await expect(card).toHaveCSS('opacity', '0');
  await expect(page.locator('.cover-lead')).toHaveCSS('opacity', '1');
  await card.scrollIntoViewIfNeeded();
  await expect(card).toHaveCSS('opacity', '1');
  await expect(card).toHaveCSS('transform', 'none');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const target of ['.cover-title', '.cover-lead', '.product-card', '.foot-imprint']) {
    await expect(page.locator(target).first()).toHaveCSS('opacity', '1');
    await expect(page.locator(target).first()).toHaveCSS('transform', 'none');
  }
  await expect(page.locator('.reveal-word > span').first()).toHaveCSS('animation-name', 'none');
});

test('shows the page if the enhancement scripts cannot load', async ({ page }) => {
  await page.route('**/_astro/*.js', (route) => route.abort());
  await page.goto('./');
  await expect(page.locator('html')).not.toHaveAttribute('data-reveal', /.+/u);
  await expect(page.locator('.cover-title')).toHaveCSS('opacity', '1');
  await expect(page.locator('.product-card').first()).toHaveCSS('opacity', '1');
});

test('builds Share independently with its own root, empty docs and downloads', async ({
  page,
  request,
}) => {
  await page.goto(shareURL);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('ZeroCloud Share');
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', shareURL);
  const tabs = page.getByRole('navigation', { name: 'Share sections' });
  await tabs.getByRole('link', { name: 'Documentation' }).click();
  await expect(page.getByRole('heading', { name: 'No guides yet.' })).toBeVisible();
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Downloads', exact: true })
    .click();
  await expect(page.getByRole('heading', { name: 'Share downloads', level: 1 })).toBeVisible();
  await expect(page.getByRole('searchbox', { name: 'Search apps' })).toHaveCount(0);
  await expect(page.getByRole('combobox', { name: 'Category', exact: true })).toHaveCount(0);
  await expect(page.getByText(/awaiting its first public release/u)).toBeVisible();
  expect((await request.get(`${shareURL}docs/platforms/electrobun/`)).status()).toBe(404);
});

test('keeps the footer and empty documentation useful in both editions', async ({ page }) => {
  for (const base of ['./', shareURL]) {
    await page.goto(`${base}docs/`);
    const footer = page.getByRole('contentinfo');
    await expect(footer.getByRole('button')).toHaveCount(0);
    await expect(footer.getByRole('link', { name: 'All guides' })).toHaveAttribute(
      'href',
      new URL(page.url()).pathname,
    );
    await footer.getByRole('link', { name: 'Back to top' }).click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  }
});

test('publishes app metadata and a sitemap that excludes the empty documentation', async ({
  page,
  request,
  baseURL,
}) => {
  for (const path of ['', 'apps/hub/', 'apps/share/', 'apps/bucket/', 'apps/cast/', 'downloads/']) {
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
  const sitemap = await (await request.get('sitemap-0.xml')).text();
  expect(sitemap).toContain(`<loc>${baseURL}apps/hub/</loc>`);
  expect(sitemap).toContain(`<loc>${baseURL}apps/bucket/</loc>`);
  expect(sitemap).toContain(`<loc>${baseURL}apps/cast/</loc>`);
  expect(sitemap).not.toContain('/docs/');
  expect(sitemap).not.toContain('/technologies/');
  expect(sitemap).not.toContain('/404');
  expect((await page.goto('./missing-page/'))?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Page not found.' })).toBeVisible();
});

for (const [label, route] of [
  ['cover', './'],
  ['guide index', './docs/'],
  ['Hub', './apps/hub/'],
  ['Bucket', './apps/bucket/'],
  ['Cast', './apps/cast/'],
  ['downloads', './downloads/'],
]) {
  test(`meets automated accessibility checks on the ${label}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(route ?? './');
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(
      result.violations.map(({ id, nodes }) => ({
        id,
        elements: nodes.map((node) => node.target),
      })),
    ).toEqual([]);
  });
}
test('keeps the expanded app menu accessible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  await page.locator('.nav-folder summary').filter({ hasText: 'Apps' }).click();
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(result.violations.map(({ id }) => id)).toEqual([]);
});

test.describe('static HTML', () => {
  test.use({ javaScriptEnabled: false });
  test('keeps content and native disclosure menus usable at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await page.goto('./');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
    for (const route of [
      './',
      './docs/',
      './apps/hub/',
      './apps/share/',
      './apps/bucket/',
      './apps/cast/',
      './downloads/',
    ]) {
      await page.goto(route);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        route,
      ).toBe(true);
    }
    await page.locator('.nav-folder summary').filter({ hasText: 'Docs' }).click();
    await page.getByRole('link', { name: 'Hub documentation', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'No guides yet.' })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
});
