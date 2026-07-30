import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import { pathFor, type RouteKey } from '@/i18n/routes';
import { Logo } from '@/components/Logo';
import type { Dictionary } from '@/i18n/dictionaries';
import { siteConfig } from '@/lib/site';

const NAV_KEYS: RouteKey[] = ['calculator', 'howItWorks', 'services', 'faq', 'quote'];
const LEGAL_KEYS: RouteKey[] = ['privacy', 'terms'];

export function SiteFooter({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const { footer, meta, nav, common } = dict;
  const year = new Date().getFullYear();

  const navLabels: Record<RouteKey, string> = {
    home: meta.siteName,
    calculator: nav.links.calculator,
    howItWorks: nav.links.howItWorks,
    services: nav.links.services,
    faq: nav.links.faq,
    quote: common.ctaPrimary,
    privacy: dict.legal.privacy.title,
    terms: dict.legal.terms.title,
  };

  return (
    <footer className="bg-steel mt-auto text-white/75">
      <div className="container-page grid gap-10 py-14 md:grid-cols-4 md:gap-8">
        <div className="md:col-span-2">
          <Logo locale={locale} lead={meta.logoLead} accent={meta.logoAccent} onDark />
          <p className="mt-4 max-w-sm text-sm leading-relaxed">{footer.tagline}</p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/55">
            {footer.networkDisclosure}
          </p>
        </div>

        <nav aria-label={footer.navTitle}>
          <h2 className="font-display text-sm font-bold tracking-wider text-white uppercase">
            {footer.navTitle}
          </h2>
          <ul className="mt-4 space-y-1">
            {NAV_KEYS.map((key) => (
              <li key={key}>
                <Link
                  href={pathFor(key, locale)}
                  className="inline-flex min-h-10 items-center text-sm hover:text-white"
                >
                  {navLabels[key]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="font-display text-sm font-bold tracking-wider text-white uppercase">
            {footer.contactTitle}
          </h2>
          <ul className="mt-4 space-y-1">
            <li>
              <a
                href={`mailto:${footer.contactEmail}`}
                className="inline-flex min-h-10 items-center text-sm hover:text-white"
              >
                {footer.contactEmail}
              </a>
            </li>
          </ul>

          <h2 className="font-display mt-6 text-sm font-bold tracking-wider text-white uppercase">
            {footer.serviceAreaTitle}
          </h2>
          <p className="mt-3 text-sm">{footer.serviceArea}</p>

          <h2 className="font-display mt-6 text-sm font-bold tracking-wider text-white uppercase">
            {footer.legalTitle}
          </h2>
          <ul className="mt-3 space-y-1">
            {LEGAL_KEYS.map((key) => (
              <li key={key}>
                <Link
                  href={pathFor(key, locale)}
                  className="inline-flex min-h-10 items-center text-sm hover:text-white"
                >
                  {navLabels[key]}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteConfig.name}. {footer.rights}
          </p>
          <p>{footer.notASupplierNote}</p>
        </div>
      </div>
    </footer>
  );
}
