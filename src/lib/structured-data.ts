import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { pathFor } from '@/i18n/routes';
import { absoluteUrl, siteConfig } from './site';

/**
 * Structured data is deliberately limited to what is factually true today.
 *
 * We publish `Organization` — not `LocalBusiness` — because BétonDispo has no
 * publicly representable street address, and no `LocalBusiness`/`address`
 * markup may be added until one genuinely exists. Nothing here claims owned
 * equipment: services are described as offerings, not as an operated fleet.
 */
const ORGANIZATION_ID = `${siteConfig.url}/#organization`;

export function organizationSchema(locale: Locale) {
  const dict = getDictionary(locale);
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: dict.meta.siteName,
    url: absoluteUrl(pathFor('home', locale)),
    description: dict.meta.pages.home.description,
    email: siteConfig.contactEmail,
    areaServed: siteConfig.areasServed.map((name) => ({ '@type': 'Place', name })),
    knowsLanguage: ['fr-CA', 'en-CA'],
  };
}

export function websiteSchema(locale: Locale) {
  const dict = getDictionary(locale);
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteConfig.url}/#website`,
    name: dict.meta.siteName,
    url: absoluteUrl(pathFor('home', locale)),
    inLanguage: locale === 'fr' ? 'fr-CA' : 'en-CA',
    publisher: { '@id': ORGANIZATION_ID },
  };
}

export function servicesSchema(locale: Locale) {
  const dict = getDictionary(locale);
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: dict.servicesPage.items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Service',
        name: item.title,
        description: item.short,
        serviceType: item.title,
        provider: { '@id': ORGANIZATION_ID },
        areaServed: siteConfig.areasServed.map((name) => ({ '@type': 'Place', name })),
        url: `${absoluteUrl(pathFor('services', locale))}#${item.key}`,
      },
    })),
  };
}

export function faqSchema(locale: Locale) {
  const dict = getDictionary(locale);
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: dict.faqPage.items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

export function breadcrumbSchema(items: { name: string; url?: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.url ? { item: item.url } : {}),
    })),
  };
}

export function cityServiceSchema({
  locale,
  cityName,
  url,
  name,
  description,
  areaType = 'City',
}: {
  locale: Locale;
  cityName: string;
  url: string;
  name: string;
  description: string;
  areaType?: 'City' | 'Place';
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    provider: { '@id': ORGANIZATION_ID },
    areaServed: [
      { '@type': areaType, name: cityName },
      { '@type': 'Place', name: 'Rive-Sud' },
    ],
    availableLanguage: locale === 'fr' ? 'fr-CA' : 'en-CA',
    url,
  };
}
