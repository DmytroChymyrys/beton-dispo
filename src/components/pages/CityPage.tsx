import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { pathFor } from '@/i18n/routes';
import { buttonClass } from '@/components/ui/button-styles';
import { Breadcrumbs, type BreadcrumbItem } from '@/components/ui/Breadcrumbs';
import { Section, SectionTitle } from '@/components/ui/Section';
import { JsonLd } from '@/components/JsonLd';
import { absoluteUrl } from '@/lib/site';
import { cityPages, cityPath, citySlugs, type CitySlug } from '@/lib/city-pages';
import { breadcrumbSchema, cityServiceSchema } from '@/lib/structured-data';

export function CityPage({ locale, city }: { locale: Locale; city: CitySlug }) {
  const dict = getDictionary(locale);
  const page = cityPages[city];
  const copy = page.copy[locale];
  const currentUrl = absoluteUrl(cityPath(city, locale));
  const homeLabel = locale === 'fr' ? 'Accueil' : 'Home';
  const cityRootLabel = locale === 'fr' ? 'Béton' : 'Concrete';
  const breadcrumbs: BreadcrumbItem[] = [
    { label: homeLabel, href: pathFor('home', locale) },
    { label: cityRootLabel },
    { label: page.name },
  ];
  const breadcrumbLdItems = [
    { name: homeLabel, url: absoluteUrl(pathFor('home', locale)) },
    { name: cityRootLabel },
    { name: page.name, url: currentUrl },
  ];

  const nearby = citySlugs.filter((slug) => slug !== city).map((slug) => cityPages[slug]);

  return (
    <>
      <JsonLd data={breadcrumbSchema(breadcrumbLdItems)} />
      <JsonLd
        data={cityServiceSchema({
          locale,
          cityName: page.name,
          url: currentUrl,
          name: copy.h1,
          description: copy.intro,
        })}
      />

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
              href={pathFor('quote', locale)}
              className={buttonClass('primary', 'lg', 'w-full sm:w-auto')}
            >
              {copy.quoteCta}
            </Link>
            <Link
              href={pathFor('calculator', locale)}
              className={buttonClass('secondary', 'lg', 'w-full sm:w-auto')}
            >
              {copy.calculatorCta}
            </Link>
          </div>
        </div>
      </div>

      <Section tone="ground" className="py-12 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="divide-line rounded-card border-line bg-surface shadow-card divide-y border">
            <CityTopic title={copy.servicesTitle} body={copy.servicesBody} />
            <CityTopic title={copy.projectsTitle} body={copy.projectsBody} />
            <CityTopic title={copy.logisticsTitle} body={copy.logisticsBody} />
            <CityTopic title={copy.calculatorTitle} body={copy.calculatorBody} />
          </div>

          <aside className="space-y-6">
            <div className="border-accent bg-accent-tint rounded-card border p-6">
              <h2 className="text-2xl">{copy.ctaTitle}</h2>
              <p className="text-ink-muted mt-3 leading-relaxed">{copy.ctaBody}</p>
              <div className="mt-5 flex flex-col gap-3">
                <Link
                  href={pathFor('quote', locale)}
                  className={buttonClass('primary', 'lg', 'w-full')}
                >
                  {copy.quoteCta}
                </Link>
                <Link
                  href={pathFor('calculator', locale)}
                  className={buttonClass('secondary', 'md', 'w-full')}
                >
                  {copy.calculatorCta}
                </Link>
              </div>
            </div>

            <div className="border-line bg-surface rounded-card border p-6">
              <h2 className="font-display text-lg font-bold">{copy.nearbyTitle}</h2>
              <ul className="mt-3 space-y-1">
                {nearby.map((nearbyCity) => (
                  <li key={nearbyCity.slug}>
                    <Link
                      href={cityPath(nearbyCity.slug, locale)}
                      className="text-ink-soft hover:text-accent inline-flex min-h-10 items-center font-medium"
                    >
                      {nearbyCity.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </Section>

      <Section tone="surface" labelledBy="city-services-cta" className="py-12 md:py-16">
        <div className="rounded-card border-line bg-ground grid items-center gap-6 border p-8 md:grid-cols-[1.2fr_auto]">
          <div>
            <SectionTitle id="city-services-cta" className="mt-0 text-3xl">
              {locale === 'fr' ? 'Voir les services de béton' : 'View concrete services'}
            </SectionTitle>
            <p className="text-ink-muted mt-3 max-w-2xl leading-relaxed">
              {locale === 'fr'
                ? 'Comparez livraison de béton, béton mobile et pompage selon les besoins de votre chantier.'
                : 'Compare concrete delivery, mobile concrete and pumping depending on your site needs.'}
            </p>
          </div>
          <Link
            href={pathFor('services', locale)}
            className={buttonClass('secondary', 'lg', 'w-full md:w-auto')}
          >
            {dict.nav.links.services}
          </Link>
        </div>
      </Section>
    </>
  );
}

function CityTopic({ title, body }: { title: string; body: string }) {
  return (
    <section className="p-6 md:p-8">
      <h2 className="text-2xl">{title}</h2>
      <p className="text-ink-muted mt-3 leading-relaxed">{body}</p>
    </section>
  );
}
