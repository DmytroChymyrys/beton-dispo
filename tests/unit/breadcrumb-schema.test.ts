import { afterEach, describe, expect, it, vi } from 'vitest';
import { locales } from '@/i18n/config';

type BreadcrumbListItem = {
  '@type': string;
  position: number;
  name: string;
  item: string;
};

async function loadBreadcrumbModules() {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://betondispo.ca');
  vi.resetModules();

  const [routes, site, structuredData, seoLandingPages] = await Promise.all([
    import('@/i18n/routes'),
    import('@/lib/site'),
    import('@/lib/structured-data'),
    import('@/lib/seo-landing-pages'),
  ]);

  return { routes, site, structuredData, seoLandingPages };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

function assertValidBreadcrumbItems(schema: {
  '@type': string;
  itemListElement: BreadcrumbListItem[];
}) {
  expect(schema['@type']).toBe('BreadcrumbList');

  schema.itemListElement.forEach((item) => {
    expect(item).toMatchObject({
      '@type': 'ListItem',
      position: expect.any(Number),
      name: expect.any(String),
      item: expect.stringMatching(/^https:\/\/betondispo\.ca\/(fr|en)(\/|#|$)/),
    });
  });
}

describe('breadcrumbSchema', () => {
  it('emits absolute canonical .ca item URLs for every ListItem', async () => {
    const { structuredData } = await loadBreadcrumbModules();
    const schema = structuredData.breadcrumbSchema([
      { name: 'Accueil', url: '/fr' },
      { name: 'Services', url: '/fr/services' },
      { name: 'Béton pour garage', url: '/fr/beton-garage' },
    ]);

    expect(schema.itemListElement).toEqual([
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Accueil',
        item: 'https://betondispo.ca/fr',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Services',
        item: 'https://betondispo.ca/fr/services',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Béton pour garage',
        item: 'https://betondispo.ca/fr/beton-garage',
      },
    ] satisfies BreadcrumbListItem[]);
  });

  it('generates valid breadcrumb items for every SEO landing page in both locales', async () => {
    const { routes, site, structuredData, seoLandingPages } = await loadBreadcrumbModules();

    for (const locale of locales) {
      for (const key of seoLandingPages.seoLandingKeys) {
        const page = seoLandingPages.seoLandingPages[key];
        const copy = page.copy[locale];
        const schema = structuredData.breadcrumbSchema([
          {
            name: locale === 'fr' ? 'Accueil' : 'Home',
            url: site.absoluteUrl(routes.pathFor('home', locale)),
          },
          {
            name: copy.breadcrumbGroup,
            url: site.absoluteUrl(seoLandingPages.seoLandingBreadcrumbGroupPath(key, locale)),
          },
          {
            name: copy.h1,
            url: site.absoluteUrl(seoLandingPages.seoLandingPath(key, locale)),
          },
        ]);

        assertValidBreadcrumbItems(schema);
      }
    }
  });
});
