import type { Metadata } from 'next';
import {
  generateServiceProjectMetadata,
  renderServiceProjectPage,
} from '../../projects/_service-page';

type Props = { params: Promise<{ locale: string }> };

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return [{ locale: 'fr' }];
}

export function generateMetadata({ params }: Props): Promise<Metadata> {
  return generateServiceProjectMetadata(params, 'fr', 'slab');
}

export default function Page({ params }: Props) {
  return renderServiceProjectPage(params, 'fr', 'slab');
}
