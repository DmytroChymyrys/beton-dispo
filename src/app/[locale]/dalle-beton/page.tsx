import type { Metadata } from 'next';
import { requireLocale, staticParamsFor } from '@/i18n/guard';
import { buildPageMetadata } from '@/lib/seo';
import { SeoLandingPage } from '@/components/pages/SeoLandingPage';

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return staticParamsFor('fr');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await requireLocale(params, 'fr');
  return buildPageMetadata(locale, 'concreteSlab');
}

export default async function Page({ params }: Props) {
  const locale = await requireLocale(params, 'fr');
  return <SeoLandingPage locale={locale} pageKey="concreteSlab" />;
}
