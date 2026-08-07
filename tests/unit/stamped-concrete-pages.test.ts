import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
});

async function loadStampedConcretePages() {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://betondispo.ca');
  vi.resetModules();
  return import('@/lib/stamped-concrete-pages');
}

describe('stamped concrete pages', () => {
  it('only publishes approved local stamped-concrete city pages', async () => {
    const { isStampedConcreteCitySlug, stampedConcreteCitySlugs } =
      await loadStampedConcretePages();

    expect(stampedConcreteCitySlugs).toEqual(['longueuil', 'candiac']);
    expect(isStampedConcreteCitySlug('longueuil')).toBe(true);
    expect(isStampedConcreteCitySlug('candiac')).toBe(true);
    expect(isStampedConcreteCitySlug('danville')).toBe(false);
    expect(isStampedConcreteCitySlug('windsor')).toBe(false);
  });

  it('builds canonical localized paths and hreflang alternates', async () => {
    const { stampedConcreteAlternates, stampedConcretePath } = await loadStampedConcretePages();

    expect(stampedConcretePath('longueuil', 'fr')).toBe('/fr/beton-estampe/longueuil');
    expect(stampedConcretePath('longueuil', 'en')).toBe('/en/stamped-concrete/longueuil');

    const alternates = stampedConcreteAlternates('candiac');
    expect(alternates['fr-CA']).toBe('https://betondispo.ca/fr/beton-estampe/candiac');
    expect(alternates['en-CA']).toBe('https://betondispo.ca/en/stamped-concrete/candiac');
    expect(alternates['x-default']).toBe('https://betondispo.ca/fr/beton-estampe/candiac');
  });

  it('adds stamped-concrete pages to the sitemap without unapproved city pages', async () => {
    await loadStampedConcretePages();
    const { default: sitemap } = await import('@/app/sitemap');
    const values = JSON.stringify(await sitemap());

    expect(values).toContain('https://betondispo.ca/fr/beton-estampe');
    expect(values).toContain('https://betondispo.ca/en/stamped-concrete');
    expect(values).toContain('https://betondispo.ca/fr/beton-estampe/longueuil');
    expect(values).toContain('https://betondispo.ca/en/stamped-concrete/candiac');
    expect(values).not.toContain('/fr/beton-estampe/danville');
    expect(values).not.toContain('/en/stamped-concrete/windsor');
  });
});
