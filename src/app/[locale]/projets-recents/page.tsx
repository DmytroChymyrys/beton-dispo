import type { Metadata } from 'next';
import { generateRecentProjectMetadata, renderRecentProjectsPage } from '../projects/_recent-page';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  return generateRecentProjectMetadata(params, searchParams, 'fr');
}

export default async function Page({ params, searchParams }: Props) {
  return renderRecentProjectsPage(params, searchParams, 'fr');
}
