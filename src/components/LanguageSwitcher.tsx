'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { otherLocale, type Locale } from '@/i18n/config';
import { switchLocalePath } from '@/i18n/routes';
import { cn } from '@/lib/cn';

type Props = {
  locale: Locale;
  label: string;
  ariaLabel: string;
  className?: string;
  onDark?: boolean;
};

/**
 * FR | EN switcher. Preserves the current page by mapping the localized slug
 * through the route registry (/fr/soumission -> /en/quote).
 */
export function LanguageSwitcher({ locale, label, ariaLabel, className, onDark = false }: Props) {
  const router = useRouter();
  const pathname = usePathname() ?? `/${locale}`;
  const target = otherLocale(locale);
  const href = switchLocalePath(pathname, target);

  return (
    <Link
      href={href}
      hrefLang={target}
      aria-label={ariaLabel}
      onClick={(event) => {
        const currentPath = window.location.pathname;
        const currentTarget = switchLocalePath(currentPath, target);
        if (currentTarget !== href) {
          event.preventDefault();
          router.push(currentTarget);
        }
      }}
      className={cn(
        'inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold tracking-wide uppercase transition-colors',
        onDark
          ? 'text-white/80 hover:bg-white/10 hover:text-white'
          : 'text-ink-soft hover:bg-surface-sunken hover:text-ink',
        className,
      )}
    >
      {/* Show the short code on narrow screens, the language name from ~sm up. */}
      <span aria-hidden="true" className="sm:hidden">
        {target.toUpperCase()}
      </span>
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
