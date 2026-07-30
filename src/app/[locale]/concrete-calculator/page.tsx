import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale } from '@/i18n/config';
import { buildPageMetadata } from '@/lib/seo';
import { ConcreteCalculatorPage } from '@/components/pages/ConcreteCalculatorPage';

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return [{ locale: 'en' }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return buildPageMetadata(locale, 'calculator');
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  if (locale !== 'en') notFound();
  return <ConcreteCalculatorPage locale={locale} />;
}
