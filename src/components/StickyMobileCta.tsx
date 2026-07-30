'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Locale } from '@/i18n/config';
import { pathFor } from '@/i18n/routes';
import { buttonClass } from '@/components/ui/button-styles';

/**
 * Mobile-only sticky CTA. Most contractor traffic is on a phone and the quote
 * form is the single conversion goal, so the action stays reachable one-handed.
 *
 * Hidden on the quote page itself (the form is already on screen) and on the
 * confirmation screen, so it never competes with the content it points to.
 * The spacer keeps the bar from covering the end of the page.
 */
export function StickyMobileCta({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname() ?? '';
  const quoteHref = pathFor('quote', locale);

  if (pathname.startsWith(quoteHref)) return null;

  return (
    <>
      <div aria-hidden="true" className="h-20 md:hidden" />
      <div className="border-line bg-surface/95 fixed inset-x-0 bottom-0 z-30 border-t p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
        <Link href={quoteHref} className={buttonClass('primary', 'md', 'w-full')}>
          {label}
        </Link>
      </div>
    </>
  );
}
