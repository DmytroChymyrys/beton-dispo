import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
});

async function loadLocalCalculatorPages() {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://betondispo.com');
  vi.resetModules();
  return import('@/lib/local-calculator-pages');
}

describe('local calculator pages', () => {
  it('only accepts approved calculator city slugs', async () => {
    const { isLocalCalculatorSlug, localCalculatorSlugs } = await loadLocalCalculatorPages();

    expect(localCalculatorSlugs).toEqual([
      'longueuil',
      'montreal',
      'beloeil',
      'candiac',
      'brossard',
    ]);
    expect(isLocalCalculatorSlug('longueuil')).toBe(true);
    expect(isLocalCalculatorSlug('danville')).toBe(false);
    expect(isLocalCalculatorSlug('val-des-sources')).toBe(false);
    expect(isLocalCalculatorSlug('windsor')).toBe(false);
  });

  it('builds canonical local calculator paths for both locales', async () => {
    const { localCalculatorPath } = await loadLocalCalculatorPages();

    expect(localCalculatorPath('longueuil', 'fr')).toBe('/fr/calculateur-beton/longueuil');
    expect(localCalculatorPath('longueuil', 'en')).toBe('/en/concrete-calculator/longueuil');
  });

  it('builds reciprocal hreflang alternates on the canonical .ca domain', async () => {
    const { localCalculatorAlternates } = await loadLocalCalculatorPages();

    const alternates = localCalculatorAlternates('brossard');

    expect(alternates['fr-CA']).toBe('https://betondispo.ca/fr/calculateur-beton/brossard');
    expect(alternates['en-CA']).toBe('https://betondispo.ca/en/concrete-calculator/brossard');
    expect(alternates['x-default']).toBe('https://betondispo.ca/fr/calculateur-beton/brossard');
  });

  it('creates unique local metadata with self-referencing canonical URLs', async () => {
    const { buildLocalCalculatorMetadata } = await loadLocalCalculatorPages();

    const fr = buildLocalCalculatorMetadata('longueuil', 'fr');
    const en = buildLocalCalculatorMetadata('longueuil', 'en');

    expect(fr.title).toBe('Calculateur de béton à Longueuil — Estimez votre volume en m³ | BétonDispo');
    expect(en.title).toBe('Concrete Calculator in Longueuil — Estimate Volume in m³ | BétonDispo');
    expect(fr.alternates?.canonical).toBe(
      'https://betondispo.ca/fr/calculateur-beton/longueuil',
    );
    expect(en.alternates?.canonical).toBe(
      'https://betondispo.ca/en/concrete-calculator/longueuil',
    );
  });

  it('adds approved local calculator routes to the sitemap', async () => {
    await loadLocalCalculatorPages();
    const { default: sitemap } = await import('@/app/sitemap');
    const values = JSON.stringify(await sitemap());

    expect(values).toContain('https://betondispo.ca/fr/calculateur-beton/montreal');
    expect(values).toContain('https://betondispo.ca/en/concrete-calculator/beloeil');
    expect(values).not.toContain('/fr/calculateur-beton/danville');
    expect(values).not.toContain('/en/concrete-calculator/windsor');
  });

  it('builds quote CTA links with city and recommended volume prefilled', async () => {
    const { calculatorQuoteHref } = await import(
      '@/components/concrete-calculator/ConcreteCalculator'
    );
    const href = calculatorQuoteHref({
      locale: 'fr',
      recommendedVolume: 5.19,
      quoteContext: {
        cityName: 'Longueuil',
        landingPage: '/fr/calculateur-beton/longueuil',
      },
    });

    expect(href).toBe(
      '/fr/soumission?volume=5.19&city=Longueuil&landing_page=%2Ffr%2Fcalculateur-beton%2Flongueuil',
    );
  });
});
