import 'server-only';

import { unstable_cache } from 'next/cache';
import type { Locale } from '@/i18n/config';
import { pathFor } from '@/i18n/routes';
import { footerIntelligenceLinks } from '@/components/ProjectIntelligenceLinks';
import {
  serviceHref,
  serviceNetwork,
  type ServiceCategory,
  type ServiceNetworkItem,
} from '@/lib/service-network';

export type SeoRecommendationCategory =
  | 'SERVICE'
  | 'PRICING'
  | 'GUIDE'
  | 'CALCULATOR'
  | 'CITY'
  | 'PROJECT'
  | 'COMPARISON'
  | 'MARKET';

export type SeoRecommendationMetrics = {
  pageViews7d?: number;
  pageViews30d?: number;
  organicClicks30d?: number;
  quoteSubmits?: number;
  qualifiedLeads?: number;
  wonJobs?: number;
  revenue?: number;
  conversionRate?: number;
};

export type SeoRecommendationPage = SeoRecommendationMetrics & {
  id: string;
  href: string;
  title: string;
  category: SeoRecommendationCategory;
  published: boolean;
  publishedAt?: Date;
  isFeatured?: boolean;
  lastUpdated?: Date;
};

export type FooterRecommendationSection = {
  key: 'popularServices' | 'pricing' | 'latestGuides' | 'calculators' | 'marketData';
  title: string;
  links: { href: string; label: string }[];
  viewAll?: { href: string; label: string };
  updatedLabel?: string;
};

type SectionSpec = {
  key: FooterRecommendationSection['key'];
  title: string;
  categories: SeoRecommendationCategory[];
  limit: number;
  viewAll?: string;
  mode?: 'score' | 'freshness';
};

const SCORE_WEIGHTS = {
  organicClicks: 0.4,
  quoteSubmits: 0.3,
  revenue: 0.2,
  freshness: 0.1,
} as const;

const getCachedFooterRecommendations = unstable_cache(
  async (locale: Locale) => buildFooterRecommendations(locale),
  ['footer-recommendations-v1'],
  { revalidate: 3600 },
);

export async function footerRecommendations(
  locale: Locale,
): Promise<FooterRecommendationSection[]> {
  return getCachedFooterRecommendations(locale);
}

async function buildFooterRecommendations(locale: Locale): Promise<FooterRecommendationSection[]> {
  const pages = recommendationPages(locale);
  const specs: SectionSpec[] = [
    {
      key: 'popularServices',
      title: locale === 'fr' ? 'Services populaires' : 'Popular services',
      categories: ['SERVICE', 'PROJECT'],
      limit: 4,
      viewAll: pathFor('services', locale),
    },
    {
      key: 'pricing',
      title: locale === 'fr' ? 'Prix' : 'Pricing',
      categories: ['PRICING'],
      limit: 4,
      viewAll: `${pathFor('services', locale)}#service-category-pricing`,
    },
    {
      key: 'latestGuides',
      title: locale === 'fr' ? 'Guides récents' : 'Latest guides',
      categories: ['GUIDE', 'COMPARISON'],
      limit: 4,
      viewAll: `${pathFor('services', locale)}#service-category-decision`,
      mode: 'freshness',
    },
    {
      key: 'calculators',
      title: locale === 'fr' ? 'Calculateurs' : 'Calculators',
      categories: ['CALCULATOR'],
      limit: 2,
      viewAll: pathFor('calculator', locale),
    },
  ];

  const sections: FooterRecommendationSection[] = specs
    .map((spec) => {
      const links = rankPages(
        pages.filter((page) => page.published && spec.categories.includes(page.category)),
        spec.mode,
      )
        .slice(0, spec.limit)
        .map((page) => ({ href: page.href, label: page.title }));

      return {
        key: spec.key,
        title: spec.title,
        links,
        viewAll: spec.viewAll ? { href: spec.viewAll, label: viewAllLabel(locale, spec.key) } : undefined,
        updatedLabel: spec.key === 'latestGuides' ? updatedLabel(locale) : undefined,
      };
    })
    .filter((section) => section.links.length > 0);

  const marketLinks = await footerIntelligenceLinks(locale);
  if (marketLinks.length) {
    sections.push({
      key: 'marketData',
      title: locale === 'fr' ? 'Données du marché' : 'Market data',
      links: marketLinks.slice(0, 6),
      viewAll: { href: pathFor('recentProjects', locale), label: viewAllLabel(locale, 'marketData') },
    });
  }

  return sections;
}

function viewAllLabel(locale: Locale, key: FooterRecommendationSection['key']): string {
  const labels: Record<FooterRecommendationSection['key'], Record<Locale, string>> = {
    popularServices: {
      fr: 'Voir tous les services',
      en: 'View all services',
    },
    pricing: {
      fr: 'Voir tous les prix',
      en: 'View all pricing',
    },
    latestGuides: {
      fr: 'Voir tous les guides',
      en: 'View all guides',
    },
    calculators: {
      fr: 'Voir tous les calculateurs',
      en: 'View all calculators',
    },
    marketData: {
      fr: 'Voir les données du marché',
      en: 'View market data',
    },
  };

  return labels[key][locale];
}

function updatedLabel(locale: Locale): string {
  return locale === 'fr' ? 'Mis à jour août 2026' : 'Updated Aug 2026';
}

function recommendationPages(locale: Locale): SeoRecommendationPage[] {
  return serviceNetwork
    .filter((item) => item.copy[locale])
    .map((item) => recommendationPageFromService(item, locale))
    .filter((page) => page.published);
}

function recommendationPageFromService(
  item: ServiceNetworkItem,
  locale: Locale,
): SeoRecommendationPage {
  return {
    id: item.key,
    href: serviceHref(item, locale),
    title: item.copy[locale].title,
    category: recommendationCategory(item.category),
    published: true,
    isFeatured: item.popular,
    lastUpdated: new Date('2026-08-06T00:00:00.000Z'),
  };
}

function recommendationCategory(category: ServiceCategory): SeoRecommendationCategory {
  if (category === 'calculator') return 'CALCULATOR';
  if (category === 'pricing') return 'PRICING';
  if (category === 'decision') return 'COMPARISON';
  if (category === 'residential') return 'PROJECT';
  if (category === 'commercial' || category === 'delivery') return 'SERVICE';
  return 'GUIDE';
}

function rankPages(
  pages: SeoRecommendationPage[],
  mode: 'score' | 'freshness' = 'score',
): SeoRecommendationPage[] {
  return [...pages].sort((a, b) => {
    if (mode === 'freshness') {
      const freshnessDiff = timestamp(b.lastUpdated) - timestamp(a.lastUpdated);
      if (freshnessDiff !== 0) return freshnessDiff;
    }

    const featuredDiff = Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured));
    if (featuredDiff !== 0) return featuredDiff;

    const scoreDiff = scorePage(b) - scorePage(a);
    if (scoreDiff !== 0) return scoreDiff;

    return a.title.localeCompare(b.title);
  });
}

function scorePage(page: SeoRecommendationPage): number {
  const freshness = freshnessScore(page.lastUpdated ?? page.publishedAt);
  return (
    (page.organicClicks30d ?? 0) * SCORE_WEIGHTS.organicClicks +
    (page.quoteSubmits ?? 0) * SCORE_WEIGHTS.quoteSubmits +
    (page.revenue ?? 0) * SCORE_WEIGHTS.revenue +
    freshness * SCORE_WEIGHTS.freshness
  );
}

function freshnessScore(date?: Date): number {
  if (!date) return 0;
  const ageMs = Date.now() - date.getTime();
  const ageDays = Math.max(0, ageMs / 86_400_000);
  return Math.max(0, 100 - ageDays);
}

function timestamp(date?: Date): number {
  return date?.getTime() ?? 0;
}
