import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale, locales } from '@/i18n/config';
import { buildPageMetadata } from '@/lib/seo';
import { FaqPage } from '@/components/pages/FaqPage';

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return buildPageMetadata(locale, 'faq');
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <FaqPage locale={locale} />;
}
