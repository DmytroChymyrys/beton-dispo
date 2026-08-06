import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildMarketIndexMetadata } from '@/lib/project-intelligence-pages';
import { getMarketIntelligenceData, getProjectPublicationReadiness } from '@/server/project-intelligence';
import { ProjectIntelligencePage } from '@/components/pages/ProjectIntelligencePage';

type Props = { params: Promise<{ locale: string }> };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== 'fr') return {};
  const readiness = await getProjectPublicationReadiness();
  return buildMarketIndexMetadata(locale, { indexable: readiness.marketIndex.indexable });
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  if (locale !== 'fr') notFound();
  const readiness = await getProjectPublicationReadiness();
  const data = await getMarketIntelligenceData();
  return (
    <ProjectIntelligencePage
      locale={locale}
      data={data}
      mode="market"
      indexable={readiness.marketIndex.indexable}
    />
  );
}
