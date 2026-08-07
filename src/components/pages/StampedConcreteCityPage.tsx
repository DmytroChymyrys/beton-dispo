import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { pathFor } from '@/i18n/routes';
import { JsonLd } from '@/components/JsonLd';
import { RelatedServices, ServicePrevNext } from '@/components/RelatedServices';
import { Breadcrumbs, type BreadcrumbItem } from '@/components/ui/Breadcrumbs';
import { buttonClass } from '@/components/ui/button-styles';
import { Section, SectionTitle } from '@/components/ui/Section';
import { absoluteUrl } from '@/lib/site';
import { breadcrumbSchema, cityServiceSchema } from '@/lib/structured-data';
import {
  stampedConcreteCityConcretePath,
  stampedConcreteLocalLinks,
  stampedConcretePages,
  stampedConcretePath,
  stampedConcreteQuoteHref,
  type StampedConcreteCitySlug,
} from '@/lib/stamped-concrete-pages';
import { seoLandingPath } from '@/lib/seo-landing-pages';

export function StampedConcreteCityPage({
  locale,
  city,
}: {
  locale: Locale;
  city: StampedConcreteCitySlug;
}) {
  const dict = getDictionary(locale);
  const page = stampedConcretePages[city];
  const copy = page.copy[locale];
  const homeLabel = locale === 'fr' ? 'Accueil' : 'Home';
  const servicesLabel = locale === 'fr' ? 'Services' : 'Services';
  const stampedLabel = locale === 'fr' ? 'Béton estampé' : 'Stamped concrete';
  const currentUrl = absoluteUrl(stampedConcretePath(city, locale));
  const questions = faqItems(locale, page.name);
  const breadcrumbs: BreadcrumbItem[] = [
    { label: homeLabel, href: pathFor('home', locale) },
    { label: servicesLabel, href: pathFor('services', locale) },
    { label: stampedLabel, href: seoLandingPath('stampedConcrete', locale) },
    { label: page.name },
  ];

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: homeLabel, url: absoluteUrl(pathFor('home', locale)) },
          { name: servicesLabel, url: absoluteUrl(pathFor('services', locale)) },
          { name: stampedLabel, url: absoluteUrl(seoLandingPath('stampedConcrete', locale)) },
          { name: page.name, url: currentUrl },
        ])}
      />
      <JsonLd
        data={cityServiceSchema({
          locale,
          cityName: page.name,
          url: currentUrl,
          name: copy.h1,
          description: copy.intro,
        })}
      />
      <JsonLd data={faqPageSchema(questions)} />

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
              href={stampedConcreteQuoteHref(city, locale)}
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
            {copy.sections.map((section) => (
              <section key={section.title} className="p-6 md:p-8">
                <h2 className="text-2xl">{section.title}</h2>
                <p className="text-ink-muted mt-3 leading-relaxed">{section.body}</p>
              </section>
            ))}
          </div>

          <aside className="space-y-6">
            <div className="border-accent bg-accent-tint rounded-card border p-6">
              <h2 className="text-2xl">{copy.ctaTitle}</h2>
              <p className="text-ink-muted mt-3 leading-relaxed">{copy.ctaBody}</p>
              <div className="mt-5 flex flex-col gap-3">
                <Link
                  href={stampedConcreteQuoteHref(city, locale)}
                  className={buttonClass('primary', 'lg', 'w-full')}
                >
                  {dict.common.ctaPrimary}
                </Link>
                <Link
                  href={pathFor('calculator', locale)}
                  className={buttonClass('secondary', 'md', 'w-full')}
                >
                  {copy.calculatorCta}
                </Link>
              </div>
            </div>

            <RelatedStampedLinks locale={locale} city={city} />
          </aside>
        </div>
      </Section>

      <Section tone="surface" labelledBy="stamped-local-faq" className="py-12 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">
          <section className="rounded-card border-line bg-ground border p-6">
            <SectionTitle id="stamped-local-faq" className="mt-0">
              {locale === 'fr' ? 'Questions fréquentes' : 'People also ask'}
            </SectionTitle>
            <div className="divide-line mt-4 divide-y">
              {questions.map((item) => (
                <details key={item.question} className="group py-4">
                  <summary className="text-ink cursor-pointer font-display text-lg font-bold">
                    {item.question}
                  </summary>
                  <p className="text-ink-muted mt-3 leading-relaxed">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="rounded-card border-line bg-ground border p-6">
            <h2 className="text-2xl">
              {locale === 'fr' ? 'Guides utiles' : 'Useful guides'}
            </h2>
            <div className="mt-5 grid gap-3">
              <Link
                href={seoLandingPath('stampedConcrete', locale)}
                className="border-line hover:border-accent rounded-lg border p-4 font-display font-bold"
              >
                {stampedLabel}
              </Link>
              <Link
                href={stampedConcreteCityConcretePath(city, locale)}
                className="border-line hover:border-accent rounded-lg border p-4 font-display font-bold"
              >
                {copy.localConcreteCta}
              </Link>
              <Link
                href={seoLandingPath('concreteDelivery', locale)}
                className="border-line hover:border-accent rounded-lg border p-4 font-display font-bold"
              >
                {locale === 'fr' ? 'Livraison de béton' : 'Concrete delivery'}
              </Link>
            </div>
          </section>
        </div>
      </Section>

      <Section tone="ground" className="py-12 md:py-16">
        <div className="space-y-6">
          <RelatedServices locale={locale} current="stampedConcrete" />
          <ServicePrevNext locale={locale} current="stampedConcrete" />
        </div>
      </Section>
    </>
  );
}

function RelatedStampedLinks({
  locale,
  city,
}: {
  locale: Locale;
  city: StampedConcreteCitySlug;
}) {
  const links = stampedConcreteLocalLinks(locale, city);
  if (links.length === 0) return null;

  return (
    <div className="border-line bg-surface rounded-card border p-6">
      <h2 className="font-display text-lg font-bold">
        {locale === 'fr' ? 'Autres pages béton estampé' : 'Other stamped concrete pages'}
      </h2>
      <ul className="mt-3 space-y-1">
        {links.map((link) => (
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

function faqItems(locale: Locale, city: string): { question: string; answer: string }[] {
  if (locale === 'fr') {
    return [
      {
        question: `Comment calculer le béton estampé à ${city}?`,
        answer:
          'Calculez la surface comme une dalle: longueur multipliée par largeur multipliée par épaisseur, puis ajoutez une marge adaptée aux variations du chantier.',
      },
      {
        question: 'BétonDispo réalise-t-il la finition estampée?',
        answer:
          'BétonDispo aide à structurer la demande de béton et à vérifier les options disponibles. La finition estampée doit être planifiée avec l’entrepreneur responsable.',
      },
      {
        question: 'Faut-il prévoir une pompe pour ce type de projet?',
        answer:
          'Une pompe peut être utile si le camion ne peut pas atteindre la zone de coulée, si la surface est en cour arrière ou si la distance depuis la rue est importante.',
      },
    ];
  }

  return [
    {
      question: `How do you calculate stamped concrete in ${city}?`,
      answer:
        'Calculate the area like a slab: length times width times thickness, then add an allowance for job-site variation.',
    },
    {
      question: 'Does BétonDispo perform stamped finishing?',
      answer:
        'BétonDispo helps structure the concrete request and check available options. Stamped finishing must be planned with the contractor responsible for the work.',
    },
    {
      question: 'Should a pump be considered for this type of project?',
      answer:
        'A pump may be useful if the truck cannot reach the pour area, if the surface is in a backyard or if the distance from the street is significant.',
    },
  ];
}

function faqPageSchema(questions: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}
