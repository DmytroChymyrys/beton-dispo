import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { pathFor } from '@/i18n/routes';
import { buttonClass } from '@/components/ui/button-styles';
import { Breadcrumbs, type BreadcrumbItem } from '@/components/ui/Breadcrumbs';
import { JsonLd } from '@/components/JsonLd';
import { Section, SectionTitle } from '@/components/ui/Section';
import { absoluteUrl } from '@/lib/site';
import { breadcrumbSchema, cityServiceSchema } from '@/lib/structured-data';
import { relatedSeoLinks, seoLandingPages, type SeoLandingKey } from '@/lib/seo-landing-pages';

export function SeoLandingPage({ locale, pageKey }: { locale: Locale; pageKey: SeoLandingKey }) {
  const dict = getDictionary(locale);
  const page = seoLandingPages[pageKey];
  const copy = page.copy[locale];
  const pageUrl = absoluteUrl(pathFor(page.routeKey, locale));
  const homeLabel = locale === 'fr' ? 'Accueil' : 'Home';
  const breadcrumbs: BreadcrumbItem[] = [
    { label: homeLabel, href: pathFor('home', locale) },
    { label: copy.breadcrumbGroup },
    { label: copy.h1 },
  ];

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: homeLabel, url: absoluteUrl(pathFor('home', locale)) },
          { name: copy.breadcrumbGroup },
          { name: copy.h1, url: pageUrl },
        ])}
      />
      {page.schemaType === 'service' ? (
        <JsonLd
          data={cityServiceSchema({
            locale,
            cityName: locale === 'fr' ? 'Grand Montréal' : 'Greater Montréal',
            url: pageUrl,
            name: copy.h1,
            description: copy.intro,
            areaType: 'Place',
          })}
        />
      ) : null}

      <div className="border-line bg-surface border-b">
        <div className="container-page py-10 md:py-14">
          <Breadcrumbs items={breadcrumbs} />
          <p className="text-accent font-display mt-8 text-sm font-bold tracking-wide uppercase">
            {copy.eyebrow}
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl leading-[1.08] sm:text-5xl">{copy.h1}</h1>
          <p className="text-ink-muted mt-4 max-w-3xl text-lg leading-relaxed">{copy.intro}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href={
                pageKey === 'concreteSlab'
                  ? pathFor('calculator', locale)
                  : pathFor('quote', locale)
              }
              className={buttonClass('primary', 'lg', 'w-full sm:w-auto')}
            >
              {copy.primaryCta}
            </Link>
            <Link
              href={
                pageKey === 'concreteSlab'
                  ? pathFor('quote', locale)
                  : pathFor('calculator', locale)
              }
              className={buttonClass('secondary', 'lg', 'w-full sm:w-auto')}
            >
              {copy.secondaryCta}
            </Link>
          </div>
        </div>
      </div>

      <Section tone="ground" className="py-12 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="divide-line rounded-card border-line bg-surface shadow-card divide-y border">
            {copy.sections.map((section) => (
              <section key={section.title} className="p-6 md:p-8">
                <h2 className="text-2xl">{section.title}</h2>
                <p className="text-ink-muted mt-3 leading-relaxed">{section.body}</p>
              </section>
            ))}
          </div>

          <aside className="space-y-6">
            <div className="border-accent bg-accent-tint rounded-card border p-6">
              <h2 className="text-2xl">{copy.asideTitle}</h2>
              <p className="text-ink-muted mt-3 leading-relaxed">{copy.asideBody}</p>
              <div className="mt-5 flex flex-col gap-3">
                <Link
                  href={pathFor('calculator', locale)}
                  className={buttonClass('primary', 'lg', 'w-full')}
                >
                  {locale === 'fr' ? 'Calculer mon volume' : 'Calculate my volume'}
                </Link>
                <Link
                  href={pathFor('quote', locale)}
                  className={buttonClass('secondary', 'md', 'w-full')}
                >
                  {dict.common.ctaPrimary}
                </Link>
              </div>
            </div>

            <RelatedLinks title={copy.relatedTitle} locale={locale} />
          </aside>
        </div>
      </Section>

      <Section tone="surface" labelledBy="seo-final-cta" className="py-12 md:py-16">
        <div className="rounded-card border-line bg-ground grid items-center gap-6 border p-8 md:grid-cols-[1.2fr_auto]">
          <div>
            <SectionTitle id="seo-final-cta" className="mt-0 text-3xl">
              {locale === 'fr' ? 'Vous avez les détails du projet?' : 'Have the project details?'}
            </SectionTitle>
            <p className="text-ink-muted mt-3 max-w-2xl leading-relaxed">
              {locale === 'fr'
                ? 'Envoyez une demande avec la quantité approximative, la date souhaitée et l’accès au chantier.'
                : 'Send a request with the approximate quantity, desired date and site access.'}
            </p>
          </div>
          <Link
            href={pathFor('quote', locale)}
            className={buttonClass('primary', 'lg', 'w-full md:w-auto')}
          >
            {dict.common.ctaPrimary}
          </Link>
        </div>
      </Section>
    </>
  );
}

export function RelatedLinks({ title, locale }: { title: string; locale: Locale }) {
  return (
    <div className="border-line bg-surface rounded-card border p-6">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <ul className="mt-3 space-y-1">
        {relatedSeoLinks(locale).map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-ink-soft hover:text-accent inline-flex min-h-10 items-center font-medium"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
