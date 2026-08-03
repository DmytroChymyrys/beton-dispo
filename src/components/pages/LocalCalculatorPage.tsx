import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { pathFor } from '@/i18n/routes';
import { ConcreteCalculator } from '@/components/concrete-calculator/ConcreteCalculator';
import { JsonLd } from '@/components/JsonLd';
import { LocalCalculatorTracker } from '@/components/pages/LocalCalculatorTracker';
import { Breadcrumbs, type BreadcrumbItem } from '@/components/ui/Breadcrumbs';
import { Section, SectionTitle } from '@/components/ui/Section';
import { buttonClass } from '@/components/ui/button-styles';
import { cityPath, isCitySlug } from '@/lib/city-pages';
import {
  localCalculatorCities,
  localCalculatorPath,
  type LocalCalculatorSlug,
} from '@/lib/local-calculator-pages';
import { relatedSeoLinks } from '@/lib/seo-landing-pages';
import { absoluteUrl } from '@/lib/site';
import { breadcrumbSchema } from '@/lib/structured-data';

export function LocalCalculatorPage({
  locale,
  city,
}: {
  locale: Locale;
  city: LocalCalculatorSlug;
}) {
  const dict = getDictionary(locale);
  const page = localCalculatorCities[city];
  const copy = page.copy[locale];
  const cityName = locale === 'fr' ? page.frenchName : page.englishName;
  const region = locale === 'fr' ? page.regionLabelFr : page.regionLabelEn;
  const currentPath = localCalculatorPath(city, locale);
  const currentUrl = absoluteUrl(currentPath);
  const homeLabel = locale === 'fr' ? 'Accueil' : 'Home';
  const calculatorLabel = locale === 'fr' ? 'Calculateur de béton' : 'Concrete calculator';
  const breadcrumbs: BreadcrumbItem[] = [
    { label: homeLabel, href: pathFor('home', locale) },
    { label: calculatorLabel, href: pathFor('calculator', locale) },
    { label: cityName },
  ];
  const calculatorStrings = {
    ...dict.concreteCalculator,
    result: {
      ...dict.concreteCalculator.result,
      ctaTitle: copy.calculatorResultTitle,
      quoteButton: copy.calculatorQuoteButton,
    },
  };
  const serviceCityPath = isCitySlug(city) ? cityPath(city, locale) : null;
  const serviceLinks = [
    { href: pathFor('calculator', locale), label: calculatorLabel },
    {
      href: pathFor('concreteDelivery', locale),
      label: locale === 'fr' ? 'Livraison de béton' : 'Concrete delivery',
    },
    { href: pathFor('concreteSlab', locale), label: locale === 'fr' ? 'Dalle de béton' : 'Concrete slab' },
    { href: pathFor('services', locale), label: dict.nav.links.services },
    { href: pathFor('quote', locale), label: dict.common.ctaPrimary },
    ...(serviceCityPath
      ? [
          {
            href: serviceCityPath,
            label:
              locale === 'fr'
                ? `Béton à ${cityName}`
                : `Concrete in ${cityName}`,
          },
        ]
      : []),
  ];

  return (
    <>
      <LocalCalculatorTracker locale={locale} city={cityName} landingPage={currentPath} />
      <JsonLd
        data={breadcrumbSchema([
          { name: homeLabel, url: absoluteUrl(pathFor('home', locale)) },
          { name: calculatorLabel, url: absoluteUrl(pathFor('calculator', locale)) },
          { name: cityName, url: currentUrl },
        ])}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: copy.h1,
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          url: currentUrl,
          inLanguage: locale === 'fr' ? 'fr-CA' : 'en-CA',
          provider: {
            '@type': 'Organization',
            name: 'BétonDispo',
            url: absoluteUrl(pathFor('home', locale)),
          },
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: copy.faqs.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer },
          })),
        }}
      />

      <div className="border-line bg-surface border-b">
        <div className="container-page py-8 md:py-10">
          <Breadcrumbs items={breadcrumbs} />
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(17rem,0.3fr)_minmax(0,0.7fr)] lg:items-start xl:gap-10">
            <div className="max-w-md">
              <p className="text-accent font-display text-sm font-bold tracking-wide uppercase">
                {copy.eyebrow}
              </p>
              <h1 className="mt-3 text-4xl leading-[1.05] sm:text-5xl">{copy.h1}</h1>
              <p className="text-ink-muted mt-4 text-lg leading-relaxed">{copy.intro}</p>
              <p className="text-ink-soft mt-4 text-sm font-semibold">{region}</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="#calculator"
                  className={buttonClass('primary', 'lg', 'w-full sm:w-auto')}
                >
                  {dict.concreteCalculator.hero.primaryCta}
                </Link>
                <Link
                  href={`${pathFor('quote', locale)}?city=${encodeURIComponent(cityName)}`}
                  className={buttonClass('secondary', 'lg', 'w-full sm:w-auto')}
                >
                  {copy.quoteCta}
                </Link>
              </div>
            </div>

            <div id="calculator" className="scroll-mt-24">
              <ConcreteCalculator
                locale={locale}
                strings={calculatorStrings}
                quoteContext={{ cityName, landingPage: currentPath }}
              />
            </div>
          </div>
        </div>
      </div>

      <Section tone="ground" labelledBy="local-calculator-guidance" className="py-12 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="divide-line rounded-card border-line bg-surface divide-y border">
            <InfoBlock title={copy.howTitle} body={copy.howBody} />
            <InfoBlock title={copy.deliveryTitle} body={copy.deliveryBody} />
            <InfoBlock title={copy.pumpTitle} body={copy.pumpBody} />
          </div>

          <aside className="space-y-6">
            <div className="border-line bg-surface rounded-card border p-6">
              <h2 id="local-calculator-guidance" className="text-2xl">
                {copy.projectsTitle}
              </h2>
              <ul className="mt-4 grid gap-2 text-ink-muted sm:grid-cols-2 lg:grid-cols-1">
                {copy.projects.map((project) => (
                  <li key={project} className="border-line rounded-lg border px-3 py-2">
                    {project}
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-line bg-surface rounded-card border p-6">
              <h2 className="font-display text-lg font-bold">{copy.servicesTitle}</h2>
              <ul className="mt-3 space-y-1">
                {serviceLinks.map((link) => (
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
          </aside>
        </div>
      </Section>

      <Section tone="surface" labelledBy="local-calculator-faq" className="py-12 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <SectionTitle id="local-calculator-faq" className="mt-0">
              {copy.faqTitle}
            </SectionTitle>
            <div className="divide-line mt-6 divide-y">
              {copy.faqs.map((item) => (
                <section key={item.question} className="py-5 first:pt-0">
                  <h2 className="text-xl">{item.question}</h2>
                  <p className="text-ink-muted mt-2 leading-relaxed">{item.answer}</p>
                </section>
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="border-line bg-ground rounded-card border p-6">
              <h2 className="font-display text-lg font-bold">{copy.nearbyTitle}</h2>
              <ul className="mt-3 space-y-1">
                {(locale === 'fr' ? page.nearbyAreasFr : page.nearbyAreasEn).map((area) => (
                  <li key={area} className="text-ink-muted py-1">
                    {area}
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-accent bg-accent-tint rounded-card border p-6">
              <h2 className="text-2xl">{copy.finalTitle}</h2>
              <p className="text-ink-muted mt-3 leading-relaxed">{copy.finalBody}</p>
              <Link
                href={`${pathFor('quote', locale)}?city=${encodeURIComponent(cityName)}`}
                className={buttonClass('primary', 'lg', 'mt-5 w-full')}
              >
                {copy.quoteCta}
              </Link>
            </div>
          </aside>
        </div>
      </Section>

      <Section tone="ground" labelledBy="local-related-guides" className="py-12 md:py-16">
        <div className="rounded-card border-line bg-surface border p-6">
          <h2 id="local-related-guides" className="font-display text-lg font-bold">
            {locale === 'fr' ? 'Guides connexes' : 'Related guides'}
          </h2>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            {relatedSeoLinks(locale)
              .slice(0, 4)
              .map((link) => (
                <Link key={link.href} href={link.href} className="text-ink-soft hover:text-accent font-medium">
                  {link.label}
                </Link>
              ))}
          </div>
        </div>
      </Section>
    </>
  );
}

function InfoBlock({ title, body }: { title: string; body: string }) {
  return (
    <section className="p-6 md:p-8">
      <h2 className="text-2xl">{title}</h2>
      <p className="text-ink-muted mt-3 leading-relaxed">{body}</p>
    </section>
  );
}
