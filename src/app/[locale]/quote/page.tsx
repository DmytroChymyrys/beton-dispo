import type { Metadata } from 'next';
import { requireLocale, staticParamsFor } from '@/i18n/guard';
import { buildPageMetadata } from '@/lib/seo';
import { QuotePage } from '@/components/pages/QuotePage';

type Props = { params: Promise<{ locale: string }> };

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return staticParamsFor('en');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await requireLocale(params, 'en');
  return buildPageMetadata(locale, 'quote');
}

export default async function Page({ params }: Props) {
  const locale = await requireLocale(params, 'en');
  return <QuotePage locale={locale} />;
}
