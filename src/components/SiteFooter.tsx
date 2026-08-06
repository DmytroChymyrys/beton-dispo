import Link from 'next/link';
import {
  ArrowRight,
  BadgeDollarSign,
  BookOpen,
  Calculator,
  Compass,
  Construction,
  FileText,
  Mail,
  MapPin,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import type { Locale } from '@/i18n/config';
import { pathFor, type RouteKey } from '@/i18n/routes';
import { Logo } from '@/components/Logo';
import type { Dictionary } from '@/i18n/dictionaries';
import { siteConfig } from '@/lib/site';
import { footerRecommendations } from '@/server/footer-recommendations';

const NAV_KEYS: RouteKey[] = ['calculator', 'howItWorks', 'services', 'faq', 'quote'];
const LEGAL_KEYS: RouteKey[] = ['privacy', 'terms'];
const SECTION_ICONS: Record<
  Awaited<ReturnType<typeof footerRecommendations>>[number]['key'],
  LucideIcon
> = {
  popularServices: Construction,
  pricing: BadgeDollarSign,
  latestGuides: FileText,
  calculators: Calculator,
  marketData: BookOpen,
};

export async function SiteFooter({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const { footer, meta, nav, common } = dict;
  const year = new Date().getFullYear();
  const recommendationSections = await footerRecommendations(locale);
  const sectionByKey = new Map(recommendationSections.map((section) => [section.key, section]));
  const servicesSection = sectionByKey.get('popularServices');
  const pricingSection = sectionByKey.get('pricing');
  const guidesSection = sectionByKey.get('latestGuides');
  const calculatorsSection = sectionByKey.get('calculators');
  const marketSection = sectionByKey.get('marketData');

  const navLabels: Record<RouteKey, string> = {
    home: meta.siteName,
    calculator: nav.links.calculator,
    concreteSlab: locale === 'fr' ? 'Dalle de béton' : 'Concrete slab',
    concreteDelivery: locale === 'fr' ? 'Livraison de béton' : 'Concrete delivery',
    concretePatio: locale === 'fr' ? 'Béton pour terrasse' : 'Concrete patio',
    recentProjects: locale === 'fr' ? 'Projets récents' : 'Recent projects',
    marketIndex: locale === 'fr' ? 'Indice du marché' : 'Market index',
    howItWorks: nav.links.howItWorks,
    services: nav.links.services,
    faq: nav.links.faq,
    quote: common.ctaPrimary,
    privacy: dict.legal.privacy.title,
    terms: dict.legal.terms.title,
  };

  return (
    <footer className="bg-steel mt-auto text-white/75">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[minmax(230px,1.25fr)_0.85fr_0.95fr_0.95fr_1.05fr_0.95fr] xl:gap-14">
        <div>
          <Logo locale={locale} lead={meta.logoLead} accent={meta.logoAccent} onDark />
          <p className="mt-4 max-w-sm text-sm leading-relaxed">{footer.tagline}</p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/55">
            {footer.networkDisclosure}
          </p>
        </div>

        <nav aria-label={footer.navTitle}>
          <FooterSectionHeading icon={Compass}>
            {footer.navTitle}
          </FooterSectionHeading>
          <ul className="mt-4 space-y-1">
            {NAV_KEYS.map((key) => (
              <li key={key}>
                <Link
                  href={pathFor(key, locale)}
                  className="inline-flex min-h-9 items-center text-sm hover:text-white"
                >
                  {navLabels[key]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {servicesSection ? <FooterRecommendationSection section={servicesSection} /> : null}

        {pricingSection ? <FooterRecommendationSection section={pricingSection} /> : null}

        <FooterResourcesSection
          locale={locale}
          guidesSection={guidesSection}
          calculatorsSection={calculatorsSection}
        />

        <div>
          <FooterSectionHeading icon={Mail}>
            {footer.contactTitle}
          </FooterSectionHeading>
          <a
            href={`mailto:${footer.contactEmail}`}
            className="mt-3 inline-flex min-h-10 items-center text-sm hover:text-white"
          >
            {footer.contactEmail}
          </a>

          <FooterSectionHeading icon={MapPin} className="mt-8">
            {footer.serviceAreaTitle}
          </FooterSectionHeading>
          <p className="mt-3 max-w-xs text-sm">{footer.serviceArea}</p>

          <nav aria-label={footer.legalTitle} className="mt-8">
            <FooterSectionHeading icon={ShieldCheck}>
              {footer.legalTitle}
            </FooterSectionHeading>
            <ul className="mt-4 space-y-1">
              {LEGAL_KEYS.map((key) => (
                <li key={key}>
                  <Link
                    href={pathFor(key, locale)}
                    className="inline-flex min-h-9 items-center text-sm hover:text-white"
                  >
                    {navLabels[key]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {marketSection ? (
        <div className="container-page pb-10">
          <div className="border-t border-white/10 pt-8">
            <FooterRecommendationSection section={marketSection} compact />
          </div>
        </div>
      ) : null}

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

function FooterResourcesSection({
  locale,
  guidesSection,
  calculatorsSection,
}: {
  locale: Locale;
  guidesSection?: Awaited<ReturnType<typeof footerRecommendations>>[number];
  calculatorsSection?: Awaited<ReturnType<typeof footerRecommendations>>[number];
}) {
  if (!guidesSection && !calculatorsSection) return null;

  return (
    <div>
      <FooterSectionHeading icon={BookOpen}>
        {locale === 'fr' ? 'Ressources' : 'Resources'}
      </FooterSectionHeading>

      {guidesSection ? <FooterRecommendationSection section={guidesSection} nested /> : null}
      {calculatorsSection ? (
        <FooterRecommendationSection section={calculatorsSection} nested compact />
      ) : null}
    </div>
  );
}

function FooterRecommendationSection({
  section,
  compact = false,
  nested = false,
}: {
  section: Awaited<ReturnType<typeof footerRecommendations>>[number];
  compact?: boolean;
  nested?: boolean;
}) {
  return (
    <nav aria-label={section.title}>
      {nested ? (
        <div className="mt-5">
          <FooterSectionHeading
            icon={SECTION_ICONS[section.key]}
            as="h3"
            className="text-xs text-white/70"
          >
            {section.title}
          </FooterSectionHeading>
          {section.updatedLabel ? (
            <p className="mt-1 text-xs font-medium text-white/45">{section.updatedLabel}</p>
          ) : null}
        </div>
      ) : (
        <>
          <FooterSectionHeading icon={SECTION_ICONS[section.key]}>
            {section.title}
          </FooterSectionHeading>
          {section.updatedLabel ? (
            <p className="mt-2 text-xs font-medium text-white/45">{section.updatedLabel}</p>
          ) : null}
        </>
      )}
      <ul className={compact ? 'mt-3 space-y-1' : 'mt-4 space-y-1'}>
        {section.links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-flex min-h-9 items-center text-sm leading-snug hover:text-white"
            >
              {link.label}
            </Link>
          </li>
        ))}
        {section.viewAll ? (
          <li>
            <FooterViewAllLink href={section.viewAll.href}>{section.viewAll.label}</FooterViewAllLink>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}

function FooterSectionHeading({
  icon: Icon,
  children,
  as = 'h2',
  className = '',
}: {
  icon: LucideIcon;
  children: React.ReactNode;
  as?: 'h2' | 'h3';
  className?: string;
}) {
  const Tag = as;

  return (
    <Tag
      className={`font-display group inline-flex items-center gap-2 text-sm font-bold tracking-wider text-white uppercase transition-colors hover:text-accent-bright ${className}`}
    >
      <Icon
        aria-hidden="true"
        size={14}
        strokeWidth={1.5}
        className="shrink-0 text-white/45 transition-colors group-hover:text-accent-bright"
      />
      <span>{children}</span>
    </Tag>
  );
}

function FooterViewAllLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-white/85 transition-colors hover:text-accent-bright"
    >
      <span>{children}</span>
      <ArrowRight
        aria-hidden="true"
        size={14}
        strokeWidth={1.5}
        className="shrink-0 text-white/45 transition-[color,transform] motion-safe:group-hover:translate-x-1 group-hover:text-accent-bright"
      />
    </Link>
  );
}
