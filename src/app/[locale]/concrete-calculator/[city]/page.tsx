import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale } from '@/i18n/config';
import { LocalCalculatorPage } from '@/components/pages/LocalCalculatorPage';
import {
  buildLocalCalculatorMetadata,
  isLocalCalculatorSlug,
  localCalculatorStaticParams,
} from '@/lib/local-calculator-pages';

type Props = { params: Promise<{ locale: string; city: string }> };

export function generateStaticParams() {
  return localCalculatorStaticParams().map(({ city }) => ({ locale: 'en', city }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, city } = await params;
  if (locale !== 'en' || !isLocalCalculatorSlug(city)) return {};
  return buildLocalCalculatorMetadata(city, locale);
}

export default async function Page({ params }: Props) {
  const { locale, city } = await params;
  if (!isLocale(locale) || locale !== 'en' || !isLocalCalculatorSlug(city)) notFound();
  return <LocalCalculatorPage locale={locale} city={city} />;
}
