import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildProjectIntelligenceMetadata } from '@/lib/project-intelligence-pages';
import { cityStaticParams, isCitySlug } from '@/lib/city-pages';
import { getProjectIntelligenceData, getProjectPublicationReadiness } from '@/server/project-intelligence';
import { ProjectIntelligencePage } from '@/components/pages/ProjectIntelligencePage';

type Props = { params: Promise<{ locale: string; city: string }> };

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return cityStaticParams().map(({ city }) => ({ locale: 'fr', city }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, city } = await params;
  if (locale !== 'fr' || !isCitySlug(city)) return {};
  const readiness = await getProjectPublicationReadiness();
  return buildProjectIntelligenceMetadata(locale, city, {
    indexable: readiness.cityProjects[city].indexable,
  });
}

export default async function Page({ params }: Props) {
  const { locale, city } = await params;
  if (locale !== 'fr' || !isCitySlug(city)) notFound();
  const readiness = await getProjectPublicationReadiness();
  const data = await getProjectIntelligenceData({ city });
  return (
    <ProjectIntelligencePage
      locale={locale}
      data={data}
      mode="city"
      city={city}
      indexable={readiness.cityProjects[city].indexable}
    />
  );
}
