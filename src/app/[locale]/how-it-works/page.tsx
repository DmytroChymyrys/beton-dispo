import type { Metadata } from 'next';
import { requireLocale, staticParamsFor } from '@/i18n/guard';
import { buildPageMetadata } from '@/lib/seo';
import { HowItWorksPage } from '@/components/pages/HowItWorksPage';

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return staticParamsFor('en');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await requireLocale(params, 'en');
  return buildPageMetadata(locale, 'howItWorks');
}

export default async function Page({ params }: Props) {
  const locale = await requireLocale(params, 'en');
  return <HowItWorksPage locale={locale} />;
}
