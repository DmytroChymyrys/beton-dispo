import type { Metadata } from 'next';
import { defaultLocale, localeTags, locales, otherLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { pathFor, type RouteKey } from '@/i18n/routes';
import { absoluteUrl } from './site';

/**
 * Per-page metadata: localized title/description, canonical URL, hreflang for
 * every locale plus x-default (French, the primary market), and Open Graph.
 *
 * `og:image` is supplied automatically by `app/[locale]/opengraph-image.tsx`.
 */
export function buildPageMetadata(locale: Locale, key: RouteKey): Metadata {
  const dict = getDictionary(locale);
  const page = dict.meta.pages[key];
  const canonical = absoluteUrl(pathFor(key, locale));

  const languages: Record<string, string> = {};
  for (const l of locales) {
    languages[localeTags[l]] = absoluteUrl(pathFor(key, l));
  }
  languages['x-default'] = absoluteUrl(pathFor(key, defaultLocale));

  /*
   * The social card is generated per locale by
   * `app/[locale]/opengraph-image.tsx`. It has to be referenced explicitly:
   * returning an `openGraph` object from `generateMetadata` replaces whatever
   * the file convention contributed, so without this every page except the two
   * home pages would ship with no `og:image` at all.
   */
  const socialImage = {
    url: absoluteUrl(`/${locale}/opengraph-image`),
    width: 1200,
    height: 630,
    alt: dict.meta.siteName,
  };

  return {
    title: page.title,
    description: page.description,
    alternates: { canonical, languages },
    openGraph: {
      type: 'website',
      siteName: dict.meta.siteName,
      title: page.title,
      description: page.description,
      url: canonical,
      locale: dict.meta.ogLocale,
      alternateLocale: getDictionary(otherLocale(locale)).meta.ogLocale,
      images: [socialImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: page.title,
      description: page.description,
      images: [socialImage.url],
    },
  };
}
