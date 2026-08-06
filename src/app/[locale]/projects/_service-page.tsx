import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProjectIntelligencePage } from '@/components/pages/ProjectIntelligencePage';
import {
  buildServiceProjectMetadata,
  serviceProjectPages,
  type ServiceProjectKey,
} from '@/lib/project-intelligence-pages';
import { getProjectIntelligenceData, getProjectPublicationReadiness } from '@/server/project-intelligence';
import type { Locale } from '@/i18n/config';

type Params = Promise<{ locale: string }>;

export async function generateServiceProjectMetadata(
  params: Params,
  expectedLocale: Locale,
  service: ServiceProjectKey,
): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== expectedLocale) return {};
  const readiness = await getProjectPublicationReadiness();
  return buildServiceProjectMetadata(expectedLocale, service, {
    indexable: readiness.projectTypeProjects[serviceProjectPages[service].projectType].indexable,
  });
}

export async function renderServiceProjectPage(
  params: Params,
  expectedLocale: Locale,
  service: ServiceProjectKey,
) {
  const { locale } = await params;
  if (locale !== expectedLocale) notFound();

  const readiness = await getProjectPublicationReadiness();
  const indexable = readiness.projectTypeProjects[serviceProjectPages[service].projectType].indexable;
  const data = await getProjectIntelligenceData({
    projectType: serviceProjectPages[service].projectType,
  });

  return (
    <ProjectIntelligencePage
      locale={expectedLocale}
      data={data}
      mode="service"
      service={service}
      indexable={indexable}
    />
  );
}
