import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProjectIntelligencePage } from '@/components/pages/ProjectIntelligencePage';
import type { Locale } from '@/i18n/config';
import {
  archiveMonthForSlug,
  buildArchiveProjectMetadata,
  projectArchiveMonths,
  archiveMonthSlugs,
} from '@/lib/project-intelligence-pages';
import { getProjectIntelligenceData, getProjectPublicationReadiness } from '@/server/project-intelligence';

type Params = Promise<{ locale: string; city?: string; year?: string; month: string }>;

export function archiveStaticParams(locale: Locale) {
  return projectArchiveMonths().map((archive) => ({
    locale,
    year: String(archive.year),
    month: archiveMonthSlugs[locale][archive.month - 1],
  }));
}

export async function generateArchiveProjectMetadata(
  params: Params,
  expectedLocale: Locale,
): Promise<Metadata> {
  const { locale, year, city, month } = await params;
  if (locale !== expectedLocale) return {};

  const archive = archiveMonthForSlug(year ?? city ?? '', month, expectedLocale);
  if (!archive) return {};

  const readiness = await getProjectPublicationReadiness();
  return buildArchiveProjectMetadata(expectedLocale, archive, {
    indexable: readiness.monthlyArchives[archiveKey(archive)]?.indexable ?? false,
  });
}

export async function renderArchiveProjectPage(params: Params, expectedLocale: Locale) {
  const { locale, year, city, month } = await params;
  if (locale !== expectedLocale) notFound();

  const archive = archiveMonthForSlug(year ?? city ?? '', month, expectedLocale);
  if (!archive) notFound();

  const readiness = await getProjectPublicationReadiness();
  const indexable = readiness.monthlyArchives[archiveKey(archive)]?.indexable ?? false;
  const data = await getProjectIntelligenceData({ month: archive });

  return (
    <ProjectIntelligencePage
      locale={expectedLocale}
      data={data}
      mode="archive"
      archive={archive}
      indexable={indexable}
    />
  );
}

function archiveKey(archive: { year: number; month: number }): string {
  return `${archive.year}-${String(archive.month).padStart(2, '0')}`;
}
