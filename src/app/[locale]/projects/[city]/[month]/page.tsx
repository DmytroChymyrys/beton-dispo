import type { Metadata } from 'next';
import {
  archiveStaticParams,
  generateArchiveProjectMetadata,
  renderArchiveProjectPage,
} from '../../_archive-page';

type Props = { params: Promise<{ locale: string; city: string; month: string }> };

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return archiveStaticParams('en').map(({ locale, year, month }) => ({
    locale,
    city: year,
    month,
  }));
}

export function generateMetadata({ params }: Props): Promise<Metadata> {
  return generateArchiveProjectMetadata(params, 'en');
}

export default function Page({ params }: Props) {
  return renderArchiveProjectPage(params, 'en');
}
