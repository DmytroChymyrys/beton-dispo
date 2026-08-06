import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProjectIntelligencePage } from '@/components/pages/ProjectIntelligencePage';
import { locales, type Locale } from '@/i18n/config';
import { citySlugs, isCitySlug } from '@/lib/city-pages';
import {
  buildCityServiceProjectMetadata,
  serviceProjectKeyForSlug,
  serviceProjectKeys,
  serviceProjectPages,
} from '@/lib/project-intelligence-pages';
import { getProjectIntelligenceData, getProjectPublicationReadiness } from '@/server/project-intelligence';

type Props = { params: Promise<{ locale: string; city: string; service: string }> };

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    citySlugs.flatMap((city) =>
      serviceProjectKeys.map((service) => ({
        locale,
        city,
        service: serviceProjectPages[service].slugs[locale],
      })),
    ),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, city, service } = await params;
  if (!isLocale(locale) || !isCitySlug(city)) return {};

  const serviceKey = serviceProjectKeyForSlug(service, locale);
  if (!serviceKey) return {};

  const readiness = await getProjectPublicationReadiness(serviceReadinessInputs());
  return buildCityServiceProjectMetadata(locale, city, serviceKey, {
    indexable: readiness.cityServiceProjects[cityServiceReadinessKey(city, serviceKey)]?.indexable ?? false,
  });
}

export default async function Page({ params }: Props) {
  const { locale, city, service } = await params;
  if (!isLocale(locale) || !isCitySlug(city)) notFound();

  const serviceKey = serviceProjectKeyForSlug(service, locale);
  if (!serviceKey) notFound();

  const readiness = await getProjectPublicationReadiness(serviceReadinessInputs());
  const indexable = readiness.cityServiceProjects[cityServiceReadinessKey(city, serviceKey)]?.indexable ?? false;
  const data = await getProjectIntelligenceData({
    city,
    projectType: serviceProjectPages[serviceKey].projectType,
  });

  return (
    <ProjectIntelligencePage
      locale={locale}
      data={data}
      mode="cityService"
      city={city}
      service={serviceKey}
      indexable={indexable}
    />
  );
}

function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

function serviceReadinessInputs() {
  return serviceProjectKeys.map((key) => ({
    key,
    projectType: serviceProjectPages[key].projectType,
  }));
}

function cityServiceReadinessKey(city: string, service: string): string {
  return `${city}:${service}`;
}
