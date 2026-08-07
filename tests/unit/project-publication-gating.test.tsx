import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProjectIntelligencePage } from '@/components/pages/ProjectIntelligencePage';
import { buildProjectIntelligenceMetadata } from '@/lib/project-intelligence-pages';
import type { ProjectIntelligenceData, ProjectPublicationReadiness } from '@/server/project-intelligence';

type ReadinessOverride = {
  recentProjects?: Partial<ProjectPublicationReadiness['recentProjects']>;
  cityProjects?: Partial<ProjectPublicationReadiness['cityProjects']>;
  projectTypeProjects?: Partial<ProjectPublicationReadiness['projectTypeProjects']>;
  cityServiceProjects?: ProjectPublicationReadiness['cityServiceProjects'];
  monthlyArchives?: ProjectPublicationReadiness['monthlyArchives'];
  marketIndex?: Partial<ProjectPublicationReadiness['marketIndex']>;
};

function emptyData(): ProjectIntelligenceData {
  return {
    projects: [],
    stats: {
      totalProjects: 0,
      totalVolumeM3: 0,
      averageVolumeM3: null,
      largestVolumeM3: null,
      averageResponseMinutes: null,
      busiestCity: null,
      topProjectType: null,
    },
    projectDistribution: [],
    cityDistribution: [],
  };
}

function readiness(overrides: ReadinessOverride = {}): ProjectPublicationReadiness {
  const base: ProjectPublicationReadiness = {
    recentProjects: {
      indexable: false,
      totalProjects: 0,
      uniqueCities: 0,
      uniqueProjectTypes: 0,
    },
    cityProjects: {
      longueuil: { indexable: false, totalProjects: 0 },
      candiac: { indexable: false, totalProjects: 0 },
      brossard: { indexable: false, totalProjects: 0 },
      'greenfield-park': { indexable: false, totalProjects: 0 },
      'la-prairie': { indexable: false, totalProjects: 0 },
      boucherville: { indexable: false, totalProjects: 0 },
    },
    projectTypeProjects: {
      FOUNDATION: { indexable: false, totalProjects: 0 },
      SLAB: { indexable: false, totalProjects: 0 },
      GARAGE: { indexable: false, totalProjects: 0 },
      POOL: { indexable: false, totalProjects: 0 },
      LANDSCAPING: { indexable: false, totalProjects: 0 },
      COMMERCIAL: { indexable: false, totalProjects: 0 },
      REPAIR: { indexable: false, totalProjects: 0 },
      OTHER: { indexable: false, totalProjects: 0 },
    },
    cityServiceProjects: {},
    monthlyArchives: {},
    marketIndex: { indexable: false, totalProjects: 0 },
  };

  return {
    ...base,
    recentProjects: { ...base.recentProjects, ...overrides.recentProjects },
    cityProjects: { ...base.cityProjects, ...overrides.cityProjects },
    projectTypeProjects: { ...base.projectTypeProjects, ...overrides.projectTypeProjects },
    cityServiceProjects: { ...base.cityServiceProjects, ...overrides.cityServiceProjects },
    monthlyArchives: { ...base.monthlyArchives, ...overrides.monthlyArchives },
    marketIndex: { ...base.marketIndex, ...overrides.marketIndex },
  };
}

async function loadWithReadiness(state: ProjectPublicationReadiness) {
  vi.resetModules();
  vi.doMock('@/server/project-intelligence', async () => {
    const actual = await vi.importActual<typeof import('@/server/project-intelligence')>(
      '@/server/project-intelligence',
    );
    return {
      ...actual,
      getProjectPublicationReadiness: vi.fn().mockResolvedValue(state),
    };
  });
}

afterEach(() => {
  vi.resetModules();
  vi.doUnmock('@/server/project-intelligence');
});

describe('Dynamic Project Intelligence publication gating', () => {
  it('marks zero-data city project metadata as noindex,follow', () => {
    const metadata = buildProjectIntelligenceMetadata('fr', 'brossard', { indexable: false });

    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata.alternates).toBeUndefined();
  });

  it('excludes a zero-data city project page from the sitemap', async () => {
    await loadWithReadiness(readiness());
    const { default: sitemap } = await import('@/app/sitemap');
    const urls = JSON.stringify(await sitemap());

    expect(urls).not.toContain('/fr/projets/brossard');
    expect(urls).not.toContain('/en/projects/brossard');
  });

  it('excludes a zero-data city project page from footer market links', async () => {
    await loadWithReadiness(readiness());
    const { footerIntelligenceLinks } = await import('@/components/ProjectIntelligenceLinks');

    await expect(footerIntelligenceLinks('fr')).resolves.toEqual([]);
  });

  it('renders a preview instead of zero KPI cards below threshold', () => {
    const html = renderToStaticMarkup(
      <ProjectIntelligencePage
        locale="fr"
        data={emptyData()}
        mode="city"
        city="brossard"
        indexable={false}
      />,
    );

    expect(html).toContain('Données à venir');
    expect(html).toContain('Aucun nom');
    expect(html).not.toContain('Projets qualifiés');
    expect(html).not.toContain('Volume total demandé');
  });

  it('makes a city page indexable and sitemap-visible after threshold', async () => {
    const metadata = buildProjectIntelligenceMetadata('fr', 'brossard', { indexable: true });
    expect(metadata.robots).toBeUndefined();
    expect(metadata.alternates?.canonical).toContain('/fr/projets/brossard');

    await loadWithReadiness(
      readiness({
        cityProjects: {
          brossard: { indexable: true, totalProjects: 5 },
        },
      }),
    );
    const { default: sitemap } = await import('@/app/sitemap');
    const urls = JSON.stringify(await sitemap());

    expect(urls).toContain('/fr/projets/brossard');
    expect(urls).toContain('/en/projects/brossard');
  });

  it('updates footer links when a page becomes publishable', async () => {
    await loadWithReadiness(
      readiness({
        recentProjects: {
          indexable: true,
          totalProjects: 8,
          uniqueCities: 3,
          uniqueProjectTypes: 3,
        },
        cityProjects: {
          brossard: { indexable: true, totalProjects: 5 },
        },
      }),
    );
    const { footerIntelligenceLinks } = await import('@/components/ProjectIntelligenceLinks');

    const fr = await footerIntelligenceLinks('fr');
    const en = await footerIntelligenceLinks('en');

    expect(fr.map((link) => link.href)).toContain('/fr/projets-recents');
    expect(fr.map((link) => link.href)).toContain('/fr/projets/brossard');
    expect(en.map((link) => link.href)).toContain('/en/recent-projects');
    expect(en.map((link) => link.href)).toContain('/en/projects/brossard');
  });

  it('keeps FR and EN project publication states synchronized', async () => {
    await loadWithReadiness(
      readiness({
        cityProjects: {
          brossard: { indexable: true, totalProjects: 5 },
          longueuil: { indexable: false, totalProjects: 1 },
        },
      }),
    );
    const { default: sitemap } = await import('@/app/sitemap');
    const urls = JSON.stringify(await sitemap());

    expect(urls).toContain('/fr/projets/brossard');
    expect(urls).toContain('/en/projects/brossard');
    expect(urls).not.toContain('/fr/projets/longueuil');
    expect(urls).not.toContain('/en/projects/longueuil');
  });
});
