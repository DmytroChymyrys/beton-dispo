import type { Metadata } from 'next';
import { requireLocale, staticParamsFor } from '@/i18n/guard';
import { buildPageMetadata } from '@/lib/seo';
import { PartnerPage } from '@/components/pages/PartnerPage';

type Props = { params: Promise<{ locale: string }> };

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return staticParamsFor('fr');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await requireLocale(params, 'fr');
  return buildPageMetadata(locale, 'partner');
}

export default async function Page({ params }: Props) {
  const locale = await requireLocale(params, 'fr');
  return <PartnerPage locale={locale} />;
}
