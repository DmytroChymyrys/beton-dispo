import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isCitySlug, buildCityMetadata, cityStaticParams } from '@/lib/city-pages';
import { CityPage } from '@/components/pages/CityPage';

type Props = { params: Promise<{ locale: string; city: string }> };

export function generateStaticParams() {
  return cityStaticParams().map(({ city }) => ({ locale: 'fr', city }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, city } = await params;
  if (locale !== 'fr' || !isCitySlug(city)) return {};
  return buildCityMetadata(city, locale);
}

export default async function Page({ params }: Props) {
  const { locale, city } = await params;
  if (locale !== 'fr' || !isCitySlug(city)) notFound();
  return <CityPage locale={locale} city={city} />;
}
