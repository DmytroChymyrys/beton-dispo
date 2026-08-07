import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { StampedConcreteCityPage } from '@/components/pages/StampedConcreteCityPage';
import {
  buildStampedConcreteMetadata,
  isStampedConcreteCitySlug,
  stampedConcreteStaticParams,
} from '@/lib/stamped-concrete-pages';

type Props = { params: Promise<{ locale: string; city: string }> };

export function generateStaticParams() {
  return stampedConcreteStaticParams().map(({ city }) => ({ locale: 'fr', city }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, city } = await params;
  if (locale !== 'fr' || !isStampedConcreteCitySlug(city)) return {};
  return buildStampedConcreteMetadata(city, locale);
}

export default async function Page({ params }: Props) {
  const { locale, city } = await params;
  if (locale !== 'fr' || !isStampedConcreteCitySlug(city)) notFound();
  return <StampedConcreteCityPage locale={locale} city={city} />;
}
