import 'server-only';

import type { SQL } from 'drizzle-orm';
import { and, desc, eq, gte, inArray, lt, sql } from 'drizzle-orm';
import { getDb, isDatabaseConfigured } from '@/db/client';
import { quoteRequests } from '@/db/schema';
import type { Locale } from '@/i18n/config';
import type { ProjectType, QuoteStatus } from '@/lib/quote-options';
import { PROJECT_TYPES } from '@/lib/quote-options';
import { cityPages, citySlugs, type CitySlug } from '@/lib/city-pages';

const PUBLIC_STATUSES = ['QUALIFIED', 'QUOTING', 'OFFER_SENT', 'WON'] as const satisfies readonly QuoteStatus[];
const IN_PROGRESS_STATUSES = ['QUALIFIED', 'QUOTING', 'OFFER_SENT'] as const satisfies readonly QuoteStatus[];
export const PROJECT_PUBLICATION_THRESHOLDS = {
  recentProjects: 8,
  recentCities: 3,
  recentProjectTypes: 3,
  cityProjects: 5,
  projectTypeProjects: 5,
  cityServiceProjects: 3,
  monthlyArchiveProjects: 8,
  marketIndexProjects: 25,
} as const;

export const PROJECT_INTELLIGENCE_PAGE_SIZE = 12;
let readinessWarningLogged = false;
let queryWarningLogged = false;

export type PublicProject = {
  city: string;
  citySlug: CitySlug | null;
  projectType: ProjectType;
  volumeM3: number | null;
  month: string;
  year: number;
  locale: Locale;
  status: 'in_progress' | 'completed';
  createdAt: Date;
};

export type PublicProjectStatus = PublicProject['status'];

export type ProjectIntelligenceStats = {
  totalProjects: number;
  totalVolumeM3: number;
  averageVolumeM3: number | null;
  largestVolumeM3: number | null;
  averageResponseMinutes: number | null;
  busiestCity: string | null;
  topProjectType: ProjectType | null;
};

export type ProjectDistributionRow = {
  label: string;
  count: number;
  share: number;
};

export type MarketTrendRow = {
  month: string;
  count: number;
  volumeM3: number;
};

export type MarketIntelligenceStats = {
  projectsToday: number;
  projectsThisWeek: number;
  projectsThisMonth: number;
  projectsThisYear: number;
  medianVolumeM3: number | null;
  busiestMonth: string | null;
  monthlyTrend: MarketTrendRow[];
};

export type ProjectIntelligenceData = {
  projects: PublicProject[];
  stats: ProjectIntelligenceStats;
  projectDistribution: ProjectDistributionRow[];
  cityDistribution: ProjectDistributionRow[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  market?: MarketIntelligenceStats;
};

export type ProjectPublicationReadiness = {
  recentProjects: {
    indexable: boolean;
    totalProjects: number;
    uniqueCities: number;
    uniqueProjectTypes: number;
  };
  cityProjects: Record<CitySlug, { indexable: boolean; totalProjects: number }>;
  projectTypeProjects: Record<ProjectType, { indexable: boolean; totalProjects: number }>;
  cityServiceProjects: Record<string, { indexable: boolean; totalProjects: number }>;
  monthlyArchives: Record<string, { indexable: boolean; totalProjects: number }>;
  marketIndex: { indexable: boolean; totalProjects: number };
};

function citySlugForName(city: string | null): CitySlug | null {
  if (!city) return null;
  const normalized = city.trim().toLowerCase();
  return citySlugs.find((slug) => cityPages[slug].name.toLowerCase() === normalized) ?? null;
}

function publicStatus(status: QuoteStatus): PublicProject['status'] {
  return status === 'WON' ? 'completed' : 'in_progress';
}

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function monthKey(date: Date): string {
  return date.toISOString().slice(0, 7);
}

function emptyStats(): ProjectIntelligenceStats {
  return {
    totalProjects: 0,
    totalVolumeM3: 0,
    averageVolumeM3: null,
    largestVolumeM3: null,
    averageResponseMinutes: null,
    busiestCity: null,
    topProjectType: null,
  };
}

function emptyProjectIntelligenceData(limit: number, paginated: boolean): ProjectIntelligenceData {
  return {
    projects: [],
    stats: emptyStats(),
    projectDistribution: [],
    cityDistribution: [],
    pagination: paginated ? { page: 1, pageSize: limit, total: 0, totalPages: 1 } : undefined,
  };
}

function emptyProjectPublicationReadiness(): ProjectPublicationReadiness {
  const cityProjects = Object.fromEntries(
    citySlugs.map((city) => [city, { indexable: false, totalProjects: 0 }]),
  ) as ProjectPublicationReadiness['cityProjects'];
  const projectTypeProjects = Object.fromEntries(
    PROJECT_TYPES.map((projectType) => [projectType, { indexable: false, totalProjects: 0 }]),
  ) as ProjectPublicationReadiness['projectTypeProjects'];

  return {
    recentProjects: {
      indexable: false,
      totalProjects: 0,
      uniqueCities: 0,
      uniqueProjectTypes: 0,
    },
    cityProjects,
    projectTypeProjects,
    cityServiceProjects: {},
    monthlyArchives: {},
    marketIndex: { indexable: false, totalProjects: 0 },
  };
}

function databaseErrorCode(error: unknown): string {
  if (error instanceof Error && 'cause' in error) {
    const cause = error.cause as { code?: unknown } | undefined;
    if (typeof cause?.code === 'string') return cause.code;
  }
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === 'string') return code;
  }
  return 'unknown';
}

function safeVolume(value: unknown): number | null {
  const volume = numberOrNull(value);
  if (volume === null || volume <= 0) return null;
  return Math.round(volume * 100) / 100;
}

function isNormalizedProjectType(value: ProjectType): boolean {
  return (PROJECT_TYPES as readonly string[]).includes(value);
}

function distribution<T extends string>(
  rows: PublicProject[],
  key: (row: PublicProject) => T | null,
): ProjectDistributionRow[] {
  const counts = new Map<T, number>();
  for (const row of rows) {
    const value = key(row);
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, count]) => ({
      label,
      count,
      share: rows.length ? count / rows.length : 0,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 8);
}

function summarize(projects: PublicProject[], averageResponseMinutes: number | null): ProjectIntelligenceStats {
  const volumes = projects
    .map((project) => project.volumeM3)
    .filter((volume): volume is number => volume !== null);
  const totalVolumeM3 = volumes.reduce((sum, volume) => sum + volume, 0);
  const cityDistribution = distribution(projects, (project) => project.city);
  const projectDistribution = distribution(projects, (project) => project.projectType);

  return {
    totalProjects: projects.length,
    totalVolumeM3,
    averageVolumeM3: volumes.length ? totalVolumeM3 / volumes.length : null,
    largestVolumeM3: volumes.length ? Math.max(...volumes) : null,
    averageResponseMinutes,
    busiestCity: cityDistribution[0]?.label ?? null,
    topProjectType: (projectDistribution[0]?.label as ProjectType | undefined) ?? null,
  };
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfUtcWeek(date: Date): Date {
  const day = date.getUTCDay();
  const mondayOffset = day === 0 ? 6 : day - 1;
  const start = startOfUtcDay(date);
  start.setUTCDate(start.getUTCDate() - mondayOffset);
  return start;
}

function startOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function startOfUtcYear(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return sorted[middle] ?? null;
  const left = sorted[middle - 1];
  const right = sorted[middle];
  return left === undefined || right === undefined ? null : (left + right) / 2;
}

function marketStats(projects: PublicProject[]): MarketIntelligenceStats {
  const now = new Date();
  const today = startOfUtcDay(now);
  const week = startOfUtcWeek(now);
  const month = startOfUtcMonth(now);
  const year = startOfUtcYear(now);
  const volumes = projects
    .map((project) => project.volumeM3)
    .filter((volume): volume is number => volume !== null);
  const monthMap = new Map<string, { count: number; volumeM3: number }>();

  for (const project of projects) {
    const current = monthMap.get(project.month) ?? { count: 0, volumeM3: 0 };
    current.count += 1;
    current.volumeM3 += project.volumeM3 ?? 0;
    monthMap.set(project.month, current);
  }

  const monthlyTrend = [...monthMap.entries()]
    .map(([key, row]) => ({ month: key, count: row.count, volumeM3: row.volumeM3 }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12);
  const busiestMonth =
    [...monthMap.entries()].sort((a, b) => b[1].count - a[1].count || b[0].localeCompare(a[0]))[0]?.[0] ??
    null;

  return {
    projectsToday: projects.filter((project) => project.createdAt >= today).length,
    projectsThisWeek: projects.filter((project) => project.createdAt >= week).length,
    projectsThisMonth: projects.filter((project) => project.createdAt >= month).length,
    projectsThisYear: projects.filter((project) => project.createdAt >= year).length,
    medianVolumeM3: median(volumes),
    busiestMonth,
    monthlyTrend,
  };
}

export async function getProjectIntelligenceData({
  limit = 24,
  offset = 0,
  paginated = false,
  city,
  projectType,
  status,
  month,
}: {
  limit?: number;
  offset?: number;
  paginated?: boolean;
  city?: CitySlug;
  projectType?: ProjectType;
  status?: PublicProjectStatus;
  month?: { year: number; month: number };
} = {}): Promise<ProjectIntelligenceData> {
  if (!isDatabaseConfigured()) {
    return emptyProjectIntelligenceData(limit, paginated);
  }

  try {
    const db = await getDb();
    const cityName = city ? cityPages[city].name : null;
    const monthStart = month ? new Date(Date.UTC(month.year, month.month - 1, 1)) : null;
    const monthEnd = month ? new Date(Date.UTC(month.year, month.month, 1)) : null;
  const filters = [
    inArray(quoteRequests.status, PUBLIC_STATUSES),
    eq(quoteRequests.abuseStatus, 'clean'),
    sql`${quoteRequests.estimatedVolumeM3} is not null`,
    sql`${quoteRequests.estimatedVolumeM3} > 0`,
    status === 'completed' ? eq(quoteRequests.status, 'WON') : undefined,
      status === 'in_progress' ? inArray(quoteRequests.status, IN_PROGRESS_STATUSES) : undefined,
      cityName ? eq(quoteRequests.city, cityName) : undefined,
      projectType ? eq(quoteRequests.projectType, projectType) : undefined,
      monthStart ? gte(quoteRequests.createdAt, monthStart) : undefined,
      monthEnd ? lt(quoteRequests.createdAt, monthEnd) : undefined,
    ].filter(Boolean);

    const whereClause = and(...(filters as SQL[]));
    const [projectRows, responseRows, countRows] = await Promise.all([
      db
        .select({
          city: quoteRequests.city,
          projectType: quoteRequests.projectType,
          volumeM3: quoteRequests.estimatedVolumeM3,
          locale: quoteRequests.locale,
          status: quoteRequests.status,
          createdAt: quoteRequests.createdAt,
        })
        .from(quoteRequests)
        .where(whereClause)
        .orderBy(desc(quoteRequests.createdAt))
        .offset(offset)
        .limit(limit),
      db
        .select({
          averageResponseMinutes:
            sql<number | null>`avg(extract(epoch from (${quoteRequests.firstResponseAt} - ${quoteRequests.createdAt})) / 60)`,
        })
        .from(quoteRequests)
        .where(and(...(filters as SQL[]), sql`${quoteRequests.firstResponseAt} is not null`)),
      paginated
        ? db
            .select({ count: sql<number>`count(*)` })
            .from(quoteRequests)
            .where(whereClause)
        : Promise.resolve([]),
    ]);

    const projects = projectRows.map((row) => ({
      city: row.city,
      citySlug: citySlugForName(row.city),
      projectType: row.projectType,
      volumeM3: safeVolume(row.volumeM3),
      month: monthKey(row.createdAt),
      year: row.createdAt.getUTCFullYear(),
      locale: row.locale,
      status: publicStatus(row.status),
      createdAt: row.createdAt,
    }));
    const averageResponseMinutes = numberOrNull(responseRows[0]?.averageResponseMinutes);
    const total = paginated ? numberOrNull(countRows[0]?.count) ?? projects.length : projects.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      projects,
      stats: summarize(projects, averageResponseMinutes),
      projectDistribution: distribution(projects, (project) => project.projectType),
      cityDistribution: distribution(projects, (project) => project.city),
      pagination: paginated
        ? {
            page: Math.floor(offset / limit) + 1,
            pageSize: limit,
            total,
            totalPages,
          }
        : undefined,
    };
  } catch (error) {
    if (!queryWarningLogged) {
      queryWarningLogged = true;
      console.warn('project_intelligence.query_failed', {
        errorCode: databaseErrorCode(error),
        paginated,
        city,
        projectType,
        status,
        month,
      });
    }
    return emptyProjectIntelligenceData(limit, paginated);
  }
}

export async function getMarketIntelligenceData(): Promise<ProjectIntelligenceData> {
  const data = await getProjectIntelligenceData({ limit: 500 });
  return {
    ...data,
    market: marketStats(data.projects),
  };
}

export async function getProjectPublicationReadiness(
  serviceProjectTypes: { key: string; projectType: ProjectType }[] = [],
): Promise<ProjectPublicationReadiness> {
  if (!isDatabaseConfigured()) return emptyProjectPublicationReadiness();

  try {
    const db = await getDb();
    const rows = await db
      .select({
        city: quoteRequests.city,
        projectType: quoteRequests.projectType,
        volumeM3: quoteRequests.estimatedVolumeM3,
        status: quoteRequests.status,
        abuseStatus: quoteRequests.abuseStatus,
        createdAt: quoteRequests.createdAt,
      })
      .from(quoteRequests)
      .where(inArray(quoteRequests.status, PUBLIC_STATUSES));

    const cityCounts = new Map<CitySlug, number>();
    const projectTypeCounts = new Map<ProjectType, number>();
    const projectTypes = new Set<ProjectType>();
    const cityServiceCounts = new Map<string, number>();
    const monthlyArchiveCounts = new Map<string, number>();

    for (const row of rows) {
      const citySlug = citySlugForName(row.city);
      const volume = safeVolume(row.volumeM3);
      if (
        !citySlug ||
        !isNormalizedProjectType(row.projectType) ||
        !volume ||
        !(PUBLIC_STATUSES as readonly QuoteStatus[]).includes(row.status) ||
        row.abuseStatus !== 'clean'
      ) {
        continue;
      }

      projectTypes.add(row.projectType);

      cityCounts.set(citySlug, (cityCounts.get(citySlug) ?? 0) + 1);
      projectTypeCounts.set(row.projectType, (projectTypeCounts.get(row.projectType) ?? 0) + 1);
      const archiveKey = monthKey(row.createdAt);
      monthlyArchiveCounts.set(archiveKey, (monthlyArchiveCounts.get(archiveKey) ?? 0) + 1);
      for (const service of serviceProjectTypes) {
        if (service.projectType !== row.projectType) continue;
        const key = `${citySlug}:${service.key}`;
        cityServiceCounts.set(key, (cityServiceCounts.get(key) ?? 0) + 1);
      }
    }

    const cityProjects = Object.fromEntries(
      citySlugs.map((city) => {
        const totalProjects = cityCounts.get(city) ?? 0;
        return [
          city,
          {
            totalProjects,
            indexable: totalProjects >= PROJECT_PUBLICATION_THRESHOLDS.cityProjects,
          },
        ];
      }),
    ) as ProjectPublicationReadiness['cityProjects'];

    const projectTypeProjects = Object.fromEntries(
      PROJECT_TYPES.map((projectType) => {
        const totalProjects = projectTypeCounts.get(projectType) ?? 0;
        return [
          projectType,
          {
            totalProjects,
            indexable: totalProjects >= PROJECT_PUBLICATION_THRESHOLDS.projectTypeProjects,
          },
        ];
      }),
    ) as ProjectPublicationReadiness['projectTypeProjects'];

    const cityServiceProjects = Object.fromEntries(
      [...cityServiceCounts.entries()].map(([key, totalProjects]) => [
        key,
        {
          totalProjects,
          indexable: totalProjects >= PROJECT_PUBLICATION_THRESHOLDS.cityServiceProjects,
        },
      ]),
    );
    const monthlyArchives = Object.fromEntries(
      [...monthlyArchiveCounts.entries()].map(([key, totalProjects]) => [
        key,
        {
          totalProjects,
          indexable: totalProjects >= PROJECT_PUBLICATION_THRESHOLDS.monthlyArchiveProjects,
        },
      ]),
    );
    const totalProjects = [...cityCounts.values()].reduce((sum, count) => sum + count, 0);

    return {
      recentProjects: {
        totalProjects,
        uniqueCities: cityCounts.size,
        uniqueProjectTypes: projectTypes.size,
        indexable:
          totalProjects >= PROJECT_PUBLICATION_THRESHOLDS.recentProjects &&
          cityCounts.size >= PROJECT_PUBLICATION_THRESHOLDS.recentCities &&
          projectTypes.size >= PROJECT_PUBLICATION_THRESHOLDS.recentProjectTypes,
      },
      cityProjects,
      projectTypeProjects,
      cityServiceProjects,
      monthlyArchives,
      marketIndex: {
        totalProjects,
        indexable: totalProjects >= PROJECT_PUBLICATION_THRESHOLDS.marketIndexProjects,
      },
    };
  } catch (error) {
    if (!readinessWarningLogged) {
      readinessWarningLogged = true;
      console.warn('project_intelligence.readiness_failed', {
        errorCode: databaseErrorCode(error),
      });
    }
    return emptyProjectPublicationReadiness();
  }
}
