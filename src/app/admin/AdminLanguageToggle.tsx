'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import type { AdminLocale } from '@/app/admin/i18n';

export function AdminLanguageToggle({
  label,
  nextLocale,
}: {
  label: string;
  nextLocale: AdminLocale;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const next = `${pathname}${query ? `?${query}` : ''}`;
  const href = `/admin/language?lang=${nextLocale}&next=${encodeURIComponent(next)}`;

  return (
    <a
      href={href}
      className="border-line-strong text-ink-soft hover:bg-surface-sunken inline-flex min-h-10 items-center rounded-lg border px-3 text-sm font-medium"
    >
      {label}
    </a>
  );
}
