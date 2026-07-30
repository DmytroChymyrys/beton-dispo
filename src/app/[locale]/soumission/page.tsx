import type { Metadata } from 'next';
import { requireLocale, staticParamsFor } from '@/i18n/guard';
import { buildPageMetadata } from '@/lib/seo';
import { QuotePage } from '@/components/pages/QuotePage';

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return staticParamsFor('fr');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await requireLocale(params, 'fr');
  return buildPageMetadata(locale, 'quote');
}

export default async function Page({ params }: Props) {
  const locale = await requireLocale(params, 'fr');
  return <QuotePage locale={locale} />;
}
