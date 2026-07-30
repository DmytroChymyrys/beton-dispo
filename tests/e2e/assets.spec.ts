import { expect, test } from '@playwright/test';

/**
 * Static assets are served from this origin, not a CDN.
 *
 * The failure mode these tests exist for is subtle: the locale proxy prefixes
 * unrecognised paths with a language, so a rule change could quietly turn
 * `/images/mixer-truck.svg` into a 307 to `/fr/images/mixer-truck.svg` and 404
 * every image on the site while every page still returned 200.
 */

const ICONS = [
  ['/favicon.ico', 'image/x-icon'],
  ['/icon.svg', 'image/svg+xml'],
  ['/icon.png', 'image/png'],
  ['/apple-icon.png', 'image/png'],
] as const;

const IMAGES = [
  '/images/concrete-pour.svg',
  '/images/slab-finishing.svg',
  '/images/boom-pump.svg',
  '/images/mixer-truck.svg',
  '/images/volumetric-mixer.svg',
  '/images/pump-hose.svg',
];

test.describe('icons', () => {
  for (const [path, contentType] of ICONS) {
    test(`${path} is served directly as ${contentType}`, async ({ request }) => {
      const response = await request.get(path, { maxRedirects: 0 });
      expect(response.status(), `${path} must not redirect`).toBe(200);
      expect(response.headers()['content-type']).toContain(contentType);
    });
  }

  test('the browser tab icon is declared on a public page', async ({ page }) => {
    await page.goto('/fr');
    // Google Search reads the .ico; modern browsers prefer the SVG.
    await expect(page.locator('link[rel="icon"][type="image/x-icon"]')).toHaveCount(1);
    await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveCount(1);
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
  });
});

test.describe('images', () => {
  for (const path of IMAGES) {
    test(`${path} is served directly, not locale-prefixed`, async ({ request }) => {
      const response = await request.get(path, { maxRedirects: 0 });
      expect(response.status(), `${path} must not redirect`).toBe(200);
      expect(response.headers()['content-type']).toContain('image/svg+xml');
    });
  }

  test('every image on the home page actually loads', async ({ page }) => {
    const failed: string[] = [];
    page.on('requestfailed', (request) => failed.push(request.url()));

    await page.goto('/fr', { waitUntil: 'networkidle' });

    const images = page.locator('main img');
    const count = await images.count();
    expect(count, 'the home page should render its imagery').toBeGreaterThan(0);

    for (let i = 0; i < count; i += 1) {
      const image = images.nth(i);
      // Everything below the fold is lazy-loaded, so bring it into view first.
      await image.scrollIntoViewIfNeeded();

      // A broken image still has a DOM node, so assert it actually decoded.
      await expect
        .poll(() => image.evaluate((el) => (el as HTMLImageElement).naturalWidth), {
          message: `image ${await image.getAttribute('src')} failed to load`,
          timeout: 10_000,
        })
        .toBeGreaterThan(0);

      // Alt text is required: these carry meaning, not decoration.
      await expect(image).not.toHaveAttribute('alt', '');
    }

    expect(failed, 'no asset request should fail').toEqual([]);
  });
});
