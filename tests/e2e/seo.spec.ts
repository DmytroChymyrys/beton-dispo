import { expect, test, type Page } from '@playwright/test';

/**
 * SEO regressions are silent: the page still renders, the tests still pass, and
 * the damage only shows up weeks later in Search Console. These assertions
 * cover the parts that have already broken once or would break unnoticed.
 */

/** Every public page, as `[French path, English path]`. */
const PAGE_PAIRS: [string, string][] = [
  ['/fr', '/en'],
  ['/fr/soumission', '/en/quote'],
  ['/fr/calculateur-beton', '/en/concrete-calculator'],
  ['/fr/dalle-beton', '/en/concrete-slab'],
  ['/fr/livraison-beton', '/en/concrete-delivery'],
  ['/fr/comment-ca-marche', '/en/how-it-works'],
  ['/fr/services', '/en/services'],
  ['/fr/faq', '/en/faq'],
  ['/fr/politique-confidentialite', '/en/privacy'],
  ['/fr/conditions', '/en/terms'],
];

const CITY_PAGE_PAIRS: [string, string][] = [
  ['/fr/beton/longueuil', '/en/concrete/longueuil'],
  ['/fr/beton/brossard', '/en/concrete/brossard'],
  ['/fr/beton/candiac', '/en/concrete/candiac'],
  ['/fr/beton/la-prairie', '/en/concrete/la-prairie'],
  ['/fr/beton/boucherville', '/en/concrete/boucherville'],
];

const ALL_PAGES = [...PAGE_PAIRS, ...CITY_PAGE_PAIRS].flat();

async function content(page: Page, selector: string): Promise<string | null> {
  return page.locator(selector).first().getAttribute('content');
}

test.describe('social cards', () => {
  // Regression guard: returning an `openGraph` object from `generateMetadata`
  // replaces the image contributed by `opengraph-image.tsx`, so nested pages
  // silently shipped without any og:image until it was set explicitly.
  for (const path of ['/fr', '/fr/faq', '/en/quote', '/fr/services']) {
    test(`${path} declares an og:image that actually resolves`, async ({ page, request }) => {
      await page.goto(path);

      const image = await content(page, 'meta[property="og:image"]');
      expect(image, `${path} has no og:image`).toBeTruthy();
      expect(await content(page, 'meta[name="twitter:image"]')).toBeTruthy();
      expect(await content(page, 'meta[name="twitter:card"]')).toBe('summary_large_image');

      const response = await request.get(image!);
      expect(response.status(), `og:image 404s for ${path}`).toBe(200);
      expect(response.headers()['content-type']).toContain('image/');
    });
  }
});

test.describe('canonical and hreflang', () => {
  for (const [fr, en] of PAGE_PAIRS) {
    test(`${fr} and ${en} point at each other`, async ({ page }) => {
      for (const [self, other, selfTag, otherTag] of [
        [fr, en, 'fr-CA', 'en-CA'],
        [en, fr, 'en-CA', 'fr-CA'],
      ] as const) {
        await page.goto(self);

        // Canonical must be self-referential and absolute, or the pair
        // collapses into one indexed URL.
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
          'href',
          new RegExp(`^https?://[^/]+${self}$`),
        );
        await expect(page.locator(`link[hreflang="${selfTag}"]`)).toHaveAttribute(
          'href',
          new RegExp(`${self}$`),
        );
        await expect(page.locator(`link[hreflang="${otherTag}"]`)).toHaveAttribute(
          'href',
          new RegExp(`${other}$`),
        );
        // x-default is French: Québec is the primary market.
        await expect(page.locator('link[hreflang="x-default"]')).toHaveAttribute(
          'href',
          new RegExp(`${fr}$`),
        );
      }
    });
  }

  for (const [fr, en] of CITY_PAGE_PAIRS) {
    test(`${fr} and ${en} point at each other`, async ({ page }) => {
      for (const [self, other, selfTag, otherTag] of [
        [fr, en, 'fr-CA', 'en-CA'],
        [en, fr, 'en-CA', 'fr-CA'],
      ] as const) {
        await page.goto(self);

        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
          'href',
          new RegExp(`^https?://[^/]+${self}$`),
        );
        await expect(page.locator(`link[hreflang="${selfTag}"]`)).toHaveAttribute(
          'href',
          new RegExp(`${self}$`),
        );
        await expect(page.locator(`link[hreflang="${otherTag}"]`)).toHaveAttribute(
          'href',
          new RegExp(`${other}$`),
        );
        await expect(page.locator('link[hreflang="x-default"]')).toHaveAttribute(
          'href',
          new RegExp(`${fr}$`),
        );
      }
    });
  }
});

test.describe('titles and descriptions', () => {
  test('are present, unique across the site, and fit the SERP', async ({ page }) => {
    const seenTitles = new Map<string, string>();
    const seenDescriptions = new Map<string, string>();

    for (const path of ALL_PAGES) {
      await page.goto(path);

      const title = await page.title();
      const description = await content(page, 'meta[name="description"]');

      expect(title, `${path} has no title`).toBeTruthy();
      expect(description, `${path} has no description`).toBeTruthy();

      expect(
        seenTitles.get(title),
        `${path} duplicates the title of ${seenTitles.get(title)}`,
      ).toBeUndefined();
      expect(
        seenDescriptions.get(description!),
        `${path} duplicates the description of ${seenDescriptions.get(description!)}`,
      ).toBeUndefined();

      seenTitles.set(title, path);
      seenDescriptions.set(description!, path);

      // Google truncates descriptions past roughly 160 characters.
      expect(
        description!.length,
        `${path} description is ${description!.length} chars`,
      ).toBeLessThanOrEqual(165);
    }
  });
});

test.describe('sitemap', () => {
  test('lists every public page in both locales, with alternates', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.status()).toBe(200);
    const xml = await response.text();

    for (const path of ALL_PAGES) {
      expect(xml, `${path} is missing from the sitemap`).toContain(`${path}</loc>`);
    }

    // One entry per page per locale, each carrying the full alternates set.
    expect((xml.match(/<url>/g) ?? []).length).toBe(ALL_PAGES.length);
    expect((xml.match(/hreflang="x-default"/g) ?? []).length).toBe(ALL_PAGES.length);

    // Nothing internal may be advertised to crawlers.
    expect(xml).not.toContain('/admin');
  });
});

test.describe('crawl directives', () => {
  test('robots.txt blocks indexing outside production', async ({ request }) => {
    // NEXT_PUBLIC_SITE_URL is localhost here, so the site must be closed off.
    // Production flips this to allow — see src/app/robots.ts.
    const response = await request.get('/robots.txt');
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain('Disallow: /');
  });

  test('a trailing slash resolves to one canonical URL', async ({ request }) => {
    const response = await request.get('/fr/services/', { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers()['location']).toMatch(/\/fr\/services$/);
  });

  test('an unknown page returns 404, not a soft 200', async ({ request }) => {
    const response = await request.get('/fr/this-page-does-not-exist');
    expect(response.status()).toBe(404);
  });
});
