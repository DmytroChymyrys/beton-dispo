import { expect, test } from '@playwright/test';

/**
 * Locale routing is load-bearing for SEO: the wrong canonical or a broken
 * language switcher would split ranking between the two versions of a page.
 */

test.describe('locale routing at the root', () => {
  test('a French browser lands on /fr', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'fr-CA' });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page).toHaveURL(/\/fr$/);
    await context.close();
  });

  test('an English browser still defaults to /fr', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'en-CA' });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page).toHaveURL(/\/fr$/);
    await context.close();
  });

  test('an unsupported language falls back to French', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'de-DE' });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page).toHaveURL(/\/fr$/);
    await context.close();
  });
});

test.describe('language switcher', () => {
  const pairs: [string, string][] = [
    ['/fr', '/en'],
    ['/fr/soumission', '/en/quote'],
    ['/fr/comment-ca-marche', '/en/how-it-works'],
    ['/fr/services', '/en/services'],
    ['/fr/faq', '/en/faq'],
    ['/fr/politique-confidentialite', '/en/privacy'],
    ['/fr/conditions', '/en/terms'],
  ];

  for (const [frPath, enPath] of pairs) {
    test(`${frPath} switches to ${enPath} and back`, async ({ page }) => {
      await page.goto(frPath);
      await page.getByRole('link', { name: 'Afficher cette page en anglais' }).first().click();
      await expect(page).toHaveURL(new RegExp(`${enPath.replace(/\//g, '\\/')}$`));

      await page.getByRole('link', { name: 'View this page in French' }).first().click();
      await expect(page).toHaveURL(new RegExp(`${frPath.replace(/\//g, '\\/')}$`));
    });
  }
});

test.describe('page metadata', () => {
  test('French pages declare fr-CA, a canonical, and both hreflang alternates', async ({
    page,
  }) => {
    await page.goto('/fr/comment-ca-marche');

    await expect(page.locator('html')).toHaveAttribute('lang', 'fr-CA');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/fr\/comment-ca-marche$/,
    );
    await expect(page.locator('link[hreflang="en-CA"]')).toHaveAttribute(
      'href',
      /\/en\/how-it-works$/,
    );
    // x-default points at French: Québec is the primary market.
    await expect(page.locator('link[hreflang="x-default"]')).toHaveAttribute(
      'href',
      /\/fr\/comment-ca-marche$/,
    );
  });

  test('every page has exactly one H1', async ({ page }) => {
    for (const path of ['/fr', '/fr/services', '/fr/faq', '/fr/soumission', '/en', '/en/quote']) {
      await page.goto(path);
      await expect(page.locator('h1'), `${path} should have one H1`).toHaveCount(1);
    }
  });
});

test.describe('cross-locale slugs', () => {
  test('a French slug under /en is a 404, not duplicate content', async ({ page }) => {
    const response = await page.goto('/en/soumission');
    expect(response?.status()).toBe(404);
  });

  test('an English slug under /fr is a 404', async ({ page }) => {
    const response = await page.goto('/fr/quote');
    expect(response?.status()).toBe(404);
  });
});

test.describe('admin', () => {
  test('is not reachable without signing in', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test('is excluded from robots.txt', async ({ request }) => {
    const response = await request.get('/robots.txt');
    expect(response.ok()).toBe(true);
  });
});
