'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Locale } from '@/i18n/config';
import { pathFor, type RouteKey } from '@/i18n/routes';
import { buttonClass } from '@/components/ui/button-styles';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Logo } from '@/components/Logo';
import { cn } from '@/lib/cn';

export type HeaderStrings = {
  logoLead: string;
  logoAccent: string;
  ariaLabel: string;
  openMenu: string;
  closeMenu: string;
  ctaPrimary: string;
  switchTo: string;
  switchToAria: string;
  links: { calculator: string; howItWorks: string; services: string; faq: string };
};

const NAV_ITEMS: { key: RouteKey; label: keyof HeaderStrings['links'] }[] = [
  { key: 'calculator', label: 'calculator' },
  { key: 'howItWorks', label: 'howItWorks' },
  { key: 'services', label: 'services' },
  { key: 'faq', label: 'faq' },
];

export function SiteHeader({ locale, strings }: { locale: Locale; strings: HeaderStrings }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile menu on navigation so the panel never survives a route
  // change. Adjusted during render rather than in an effect, which avoids the
  // extra commit that would briefly paint the open panel on the new page.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  return (
    <header className="border-line bg-surface/95 supports-[backdrop-filter]:bg-surface/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4 md:h-20">
        <Logo locale={locale} lead={strings.logoLead} accent={strings.logoAccent} />

        <nav aria-label={strings.ariaLabel} className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const href = pathFor(item.key, locale);
            const active = pathname === href;
            return (
              <Link
                key={item.key}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-flex min-h-11 items-center rounded-lg px-3 text-[0.95rem] font-medium transition-colors',
                  active ? 'text-accent' : 'text-ink-soft hover:bg-surface-sunken hover:text-ink',
                )}
              >
                {strings.links[item.label]}
              </Link>
            );
          })}

          <span aria-hidden="true" className="bg-line mx-1 h-5 w-px" />
          <LanguageSwitcher
            locale={locale}
            label={strings.switchTo}
            ariaLabel={strings.switchToAria}
          />
          <Link href={pathFor('quote', locale)} className={buttonClass('primary', 'md', 'ml-2')}>
            {strings.ctaPrimary}
          </Link>
        </nav>

        <div className="flex items-center gap-1 md:hidden">
          <LanguageSwitcher
            locale={locale}
            label={strings.switchTo}
            ariaLabel={strings.switchToAria}
          />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? strings.closeMenu : strings.openMenu}
            className="border-line-strong text-ink inline-flex size-11 items-center justify-center rounded-lg border"
          >
            <MenuIcon open={open} />
          </button>
        </div>
      </div>

      {open ? (
        <nav
          id="mobile-nav"
          aria-label={strings.ariaLabel}
          className="border-line bg-surface border-t md:hidden"
        >
          <ul className="container-page flex flex-col py-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.key}>
                <Link
                  href={pathFor(item.key, locale)}
                  className="border-line text-ink-soft flex min-h-12 items-center border-b text-base font-medium"
                >
                  {strings.links[item.label]}
                </Link>
              </li>
            ))}
            <li className="py-3">
              <Link
                href={pathFor('quote', locale)}
                className={buttonClass('primary', 'md', 'w-full')}
              >
                {strings.ctaPrimary}
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="size-6"
    >
      {open ? (
        <>
          <path d="M6 6l12 12" />
          <path d="M18 6L6 18" />
        </>
      ) : (
        <>
          <path d="M3 6h18" />
          <path d="M3 12h18" />
          <path d="M3 18h18" />
        </>
      )}
    </svg>
  );
}
