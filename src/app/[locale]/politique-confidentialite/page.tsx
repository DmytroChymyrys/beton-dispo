import type { Metadata } from 'next';
import { requireLocale, staticParamsFor } from '@/i18n/guard';
import { buildPageMetadata } from '@/lib/seo';
import { LegalPage } from '@/components/pages/LegalPage';

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return staticParamsFor('fr');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await requireLocale(params, 'fr');
  return buildPageMetadata(locale, 'privacy');
}

export default async function Page({ params }: Props) {
  const locale = await requireLocale(params, 'fr');
  return <LegalPage locale={locale} doc="privacy" />;
}
