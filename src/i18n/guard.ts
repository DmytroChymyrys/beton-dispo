import { notFound } from 'next/navigation';
import type { Locale } from './config';

/**
 * Localized slugs are real directories (`/[locale]/soumission`,
 * `/[locale]/quote`), so each one must reject the locale it doesn't belong to —
 * otherwise `/en/soumission` would render French content at an English URL and
 * duplicate the page for search engines.
 */
export async function requireLocale(
  params: Promise<{ locale: string }>,
  expected: Locale,
): Promise<Locale> {
  const { locale } = await params;
  if (locale !== expected) notFound();
  return expected;
}

/** Only prerender the slug under the locale it belongs to. */
export function staticParamsFor(locale: Locale) {
  return [{ locale }];
}
