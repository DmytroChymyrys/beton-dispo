import 'server-only';

import { revalidatePath } from 'next/cache';
import { locales } from '@/i18n/config';
import { pathFor } from '@/i18n/routes';
import { cityPages, citySlugs, type CitySlug } from '@/lib/city-pages';
import {
  archiveProjectPath,
  cityProjectsPath,
  cityServiceProjectPath,
  serviceProjectKeys,
  serviceProjectPages,
  serviceProjectPath,
  type ProjectArchiveMonth,
} from '@/lib/project-intelligence-pages';
import type { ProjectType } from '@/lib/quote-options';

type RevalidationInput = {
  city?: string | null;
  projectType?: ProjectType | null;
  createdAt?: Date | string | null;
};

function citySlugForName(city: string | null | undefined): CitySlug | null {
  if (!city) return null;
  const normalized = city.trim().toLowerCase();
  return citySlugs.find((slug) => cityPages[slug].name.toLowerCase() === normalized) ?? null;
}

function archiveForDate(value: Date | string | null | undefined): ProjectArchiveMonth | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

function serviceKeyForProjectType(projectType: ProjectType | null | undefined) {
  if (!projectType) return null;
  return serviceProjectKeys.find((key) => serviceProjectPages[key].projectType === projectType) ?? null;
}

export function revalidateProjectIntelligencePublication(input: RevalidationInput = {}) {
  const city = citySlugForName(input.city);
  const service = serviceKeyForProjectType(input.projectType);
  const archive = archiveForDate(input.createdAt);

  revalidatePath('/sitemap.xml');
  revalidatePath('/admin');

  for (const locale of locales) {
    // Refresh the footer/navigation shell because Project Intelligence footer
    // links appear only after the same publication gate passes.
    revalidatePath(`/${locale}`, 'layout');
    revalidatePath(pathFor('recentProjects', locale));
    revalidatePath(pathFor('marketIndex', locale));

    if (city) revalidatePath(cityProjectsPath(city, locale));
    if (service) revalidatePath(serviceProjectPath(service, locale));
    if (city && service) revalidatePath(cityServiceProjectPath(city, service, locale));
    if (archive) revalidatePath(archiveProjectPath(archive, locale));
  }
}
