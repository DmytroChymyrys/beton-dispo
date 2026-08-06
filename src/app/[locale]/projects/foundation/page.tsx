import type { Metadata } from 'next';
import {
  generateServiceProjectMetadata,
  renderServiceProjectPage,
} from '../_service-page';

type Props = { params: Promise<{ locale: string }> };

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return [{ locale: 'en' }];
}

export function generateMetadata({ params }: Props): Promise<Metadata> {
  return generateServiceProjectMetadata(params, 'en', 'foundation');
}

export default function Page({ params }: Props) {
  return renderServiceProjectPage(params, 'en', 'foundation');
}
