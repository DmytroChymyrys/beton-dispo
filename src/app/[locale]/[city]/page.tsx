import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SeoLandingPage } from '@/components/pages/SeoLandingPage';
import { locales, type Locale } from '@/i18n/config';
import {
  buildSeoLandingMetadata,
  dynamicSeoLandingKeys,
  seoLandingKeyForSlug,
  seoLandingPages,
  type SeoLandingKey,
} from '@/lib/seo-landing-pages';

type PageProps = {
  params: Promise<{ locale: string; city: string }>;
};

export function generateStaticParams() {
  return dynamicSeoLandingKeys.flatMap((key) =>
    locales.map((locale) => ({
      locale,
      city: seoLandingPages[key].slugs[locale],
    })),
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, city } = await params;
  if (!isLocale(locale)) return {};

  const pageKey = pageKeyForDynamicSlug(city, locale);
  if (!pageKey) return {};

  return buildSeoLandingMetadata(locale, pageKey);
}

export default async function DynamicSeoLandingPage({ params }: PageProps) {
  const { locale, city } = await params;
  if (!isLocale(locale)) notFound();

  const pageKey = pageKeyForDynamicSlug(city, locale);
  if (!pageKey) notFound();

  return <SeoLandingPage locale={locale} pageKey={pageKey} />;
}

function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

function pageKeyForDynamicSlug(slug: string, locale: Locale): SeoLandingKey | null {
  const key = seoLandingKeyForSlug(slug, locale);
  if (!key) return null;
  return (dynamicSeoLandingKeys as readonly SeoLandingKey[]).includes(key) ? key : null;
}
