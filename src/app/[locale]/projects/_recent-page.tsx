import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProjectIntelligencePage, type RecentProjectFilters } from '@/components/pages/ProjectIntelligencePage';
import type { Locale } from '@/i18n/config';
import { citySlugs } from '@/lib/city-pages';
import { buildProjectIntelligenceMetadata } from '@/lib/project-intelligence-pages';
import { PROJECT_TYPES } from '@/lib/quote-options';
import type { ProjectType } from '@/lib/quote-options';
import {
  getProjectIntelligenceData,
  getProjectPublicationReadiness,
  PROJECT_INTELLIGENCE_PAGE_SIZE,
  type PublicProjectStatus,
} from '@/server/project-intelligence';

type Params = Promise<{ locale: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const publicStatuses: PublicProjectStatus[] = ['in_progress', 'completed'];

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function oneOf<T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined {
  return value && allowed.includes(value as T) ? (value as T) : undefined;
}

function parsePage(value: string | undefined): number {
  const parsed = Number(value ?? '1');
  return Number.isFinite(parsed) ? Math.max(1, Math.trunc(parsed)) : 1;
}

function parseRecentProjectFilters(params: Record<string, string | string[] | undefined>): RecentProjectFilters {
  return {
    city: oneOf(first(params.city), citySlugs),
    projectType: oneOf<ProjectType>(first(params.project), PROJECT_TYPES),
    status: oneOf<PublicProjectStatus>(first(params.status), publicStatuses),
    page: parsePage(first(params.page)),
  };
}

export async function generateRecentProjectMetadata(
  params: Params,
  searchParams: SearchParams,
  expectedLocale: Locale,
): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== expectedLocale) return {};
  const filters = parseRecentProjectFilters(await searchParams);
  const readiness = await getProjectPublicationReadiness();
  const isUnfilteredFirstPage =
    !filters.city && !filters.projectType && !filters.status && filters.page === 1;
  return buildProjectIntelligenceMetadata(expectedLocale, undefined, {
    indexable: readiness.recentProjects.indexable && isUnfilteredFirstPage,
  });
}

export async function renderRecentProjectsPage(
  params: Params,
  searchParams: SearchParams,
  expectedLocale: Locale,
) {
  const { locale } = await params;
  if (locale !== expectedLocale) notFound();

  const filters = parseRecentProjectFilters(await searchParams);
  const readiness = await getProjectPublicationReadiness();
  const isUnfilteredFirstPage =
    !filters.city && !filters.projectType && !filters.status && filters.page === 1;
  const indexable = readiness.recentProjects.indexable && isUnfilteredFirstPage;
  const offset = (filters.page - 1) * PROJECT_INTELLIGENCE_PAGE_SIZE;
  const data = await getProjectIntelligenceData({
    limit: PROJECT_INTELLIGENCE_PAGE_SIZE,
    offset,
    paginated: true,
    city: filters.city,
    projectType: filters.projectType,
    status: filters.status,
  });

  return (
    <ProjectIntelligencePage
      locale={expectedLocale}
      data={data}
      mode="recent"
      filters={filters}
      indexable={indexable}
    />
  );
}
