import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { pathFor } from '@/i18n/routes';
import { buttonClass } from '@/components/ui/button-styles';
import { Section, SectionTitle } from '@/components/ui/Section';
import { PageHeader } from '@/components/ui/PageHeader';
import { JsonLd } from '@/components/JsonLd';
import { Photo } from '@/components/Photo';
import { ProjectIntelligenceLinks } from '@/components/ProjectIntelligenceLinks';
import { servicesSchema } from '@/lib/structured-data';
import type { PhotoKey } from '@/lib/images';
import { serviceHref, serviceNetwork, type ServiceCategory } from '@/lib/service-network';

/**
 * Service `key` (stable across locales) -> photography slot. JSON imports widen
 * to `string`, so a new service falls back rather than rendering nothing.
 */
const SERVICE_PHOTOS: Record<string, PhotoKey> = {
  delivery: 'mixerTruck',
  mobile: 'volumetricMixer',
  pumping: 'pumpHose',
};
const FALLBACK_SERVICE_PHOTO: PhotoKey = 'mixerTruck';

export function ServicesPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const page = dict.servicesPage;
  const categories: { key: ServiceCategory; title: string }[] = [
    {
      key: 'residential',
      title: locale === 'fr' ? 'Construction résidentielle' : 'Residential construction',
    },
    {
      key: 'delivery',
      title: locale === 'fr' ? 'Livraison et chantier' : 'Delivery and job site',
    },
    { key: 'calculator', title: locale === 'fr' ? 'Estimation' : 'Estimating' },
    { key: 'support', title: locale === 'fr' ? 'Ressources' : 'Resources' },
  ];

  return (
    <>
      <PageHeader title={page.title} intro={page.intro} />
      <JsonLd data={servicesSchema(locale)} />

      <Section tone="ground">
        <div className="space-y-8">
          {page.items.map((item) => (
            <article
              key={item.key}
              id={item.key}
              className="rounded-card border-line bg-surface shadow-card scroll-mt-24 border p-6 md:p-10"
            >
              <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
                <div>
                  <h2 className="text-2xl sm:text-3xl">{item.title}</h2>
                  <p className="text-ink-soft mt-2 text-lg">{item.short}</p>
                  <p className="text-ink-muted mt-4 leading-relaxed">{item.body}</p>

                  <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                    {item.bullets.map((bullet) => (
                      <li key={bullet} className="text-ink-soft flex items-start gap-2">
                        <span
                          aria-hidden="true"
                          className="bg-accent mt-2 size-1.5 shrink-0 rounded-full"
                        />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>

                <Photo
                  photo={SERVICE_PHOTOS[item.key] ?? FALLBACK_SERVICE_PHOTO}
                  alt={item.imageAlt}
                  aspect="aspect-[3/2]"
                  sizes="(min-width: 1024px) 30vw, 100vw"
                />
              </div>
            </article>
          ))}
        </div>

        <div className="rounded-card border-accent-bright bg-surface-sunken mt-10 border-l-4 p-6">
          <h2 className="font-display text-lg font-bold">{page.disclosureTitle}</h2>
          <p className="text-ink-muted mt-2 max-w-3xl leading-relaxed">{page.disclosure}</p>
        </div>
      </Section>

      <Section tone="surface" labelledBy="service-hub" className="py-12 md:py-16">
        <SectionTitle id="service-hub" className="mt-0">
          {locale === 'fr' ? 'Explorer les services' : 'Explore services'}
        </SectionTitle>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {categories.map((category) => {
            const items = serviceNetwork.filter((item) => item.category === category.key);
            return (
              <section key={category.key} className="rounded-card border-line bg-ground border p-6">
                <h2 className="text-2xl">{category.title}</h2>
                <ul className="mt-4 space-y-3">
                  {items.map((item) => (
                    <li key={item.key}>
                      <Link
                        href={serviceHref(item, locale)}
                        className="text-ink-soft hover:text-accent font-semibold"
                      >
                        {item.copy[locale].title}
                      </Link>
                      <p className="text-ink-muted mt-1 text-sm">{item.copy[locale].description}</p>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </Section>

      <Section tone="surface" labelledBy="services-cta">
        <div className="mb-10">
          <ProjectIntelligenceLinks locale={locale} />
        </div>
        <div className="rounded-card border-line bg-ground grid items-center gap-6 border p-8 md:grid-cols-[1.2fr_auto] md:p-12">
          <div>
            <SectionTitle id="services-cta" className="mt-0">
              {page.ctaTitle}
            </SectionTitle>
            <p className="text-ink-muted mt-4 max-w-2xl text-lg leading-relaxed">{page.ctaBody}</p>
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
