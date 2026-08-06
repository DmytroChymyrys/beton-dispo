import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { pathFor } from '@/i18n/routes';
import { buttonClass } from '@/components/ui/button-styles';
import { Breadcrumbs, type BreadcrumbItem } from '@/components/ui/Breadcrumbs';
import { JsonLd } from '@/components/JsonLd';
import { ProjectIntelligenceLinks } from '@/components/ProjectIntelligenceLinks';
import { RelatedServices, ServicePrevNext } from '@/components/RelatedServices';
import { Section, SectionTitle } from '@/components/ui/Section';
import { absoluteUrl } from '@/lib/site';
import { breadcrumbSchema, cityServiceSchema } from '@/lib/structured-data';
import {
  relatedSeoLinks,
  seoLandingPages,
  seoLandingPath,
  type SeoLandingKey,
} from '@/lib/seo-landing-pages';
import type { ServiceNetworkKey } from '@/lib/service-network';
import type { ServiceProjectKey } from '@/lib/project-intelligence-pages';

const PROJECT_INTELLIGENCE_BY_PAGE: Partial<Record<SeoLandingKey, ServiceProjectKey>> = {
  concreteSlab: 'slab',
  concreteSlabCost: 'slab',
  garageConcrete: 'garage',
  garageSlabCost: 'garage',
  foundationConcrete: 'foundation',
  commercialConcrete: 'commercial',
};

export function SeoLandingPage({ locale, pageKey }: { locale: Locale; pageKey: SeoLandingKey }) {
  const dict = getDictionary(locale);
  const page = seoLandingPages[pageKey];
  const copy = page.copy[locale];
  const serviceKey: ServiceNetworkKey = pageKey;
  const pageUrl = absoluteUrl(seoLandingPath(pageKey, locale));
  const quoteFirst =
    pageKey === 'concreteDelivery' ||
    pageKey === 'mobileConcrete' ||
    pageKey === 'concretePumping' ||
    pageKey === 'commercialConcrete';
  const homeLabel = locale === 'fr' ? 'Accueil' : 'Home';
  const planning = planningGuide(locale, pageKey);
  const questions = peopleAlsoAsk(locale, pageKey);
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
              href={quoteFirst ? pathFor('quote', locale) : pathFor('calculator', locale)}
              className={buttonClass('primary', 'lg', 'w-full sm:w-auto')}
            >
              {copy.primaryCta}
            </Link>
            <Link
              href={quoteFirst ? pathFor('calculator', locale) : pathFor('quote', locale)}
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

            <RelatedLinks title={copy.relatedTitle} locale={locale} current={pageKey} />
          </aside>
        </div>
      </Section>

      <Section tone="surface" labelledBy="planning-guide" className="py-12 md:py-16">
        <SectionTitle id="planning-guide" className="mt-0">
          {locale === 'fr' ? 'Planifier ce type de projet' : 'Plan this type of project'}
        </SectionTitle>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {planning.map((item) => (
            <article key={item.title} className="rounded-card border-line bg-ground border p-5">
              <h3 className="font-display text-lg font-bold">{item.title}</h3>
              <p className="text-ink-muted mt-2 text-sm leading-relaxed">{item.body}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section tone="ground" className="py-12 md:py-16">
        <div className="space-y-6">
          <PeopleAlsoAsk locale={locale} questions={questions} />
          <RelatedCalculators locale={locale} pageKey={pageKey} />
          <RelatedConcreteProjectsPreview
            locale={locale}
            currentService={PROJECT_INTELLIGENCE_BY_PAGE[pageKey]}
          />
          <ProjectIntelligenceLinks
            locale={locale}
            currentService={PROJECT_INTELLIGENCE_BY_PAGE[pageKey]}
          />
          <RelatedServices locale={locale} current={serviceKey} />
          <ServicePrevNext locale={locale} current={serviceKey} />
        </div>
      </Section>

      <Section tone="ground" labelledBy="seo-final-cta" className="py-12 md:py-16">
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

function planningGuide(locale: Locale, pageKey: SeoLandingKey): { title: string; body: string }[] {
  const isPricing = pageKey.includes('Price') || pageKey.includes('Cost');
  const isPump = pageKey === 'concretePumping' || pageKey === 'concretePumpCost';
  const isComparison =
    pageKey === 'readyMixVsBags' ||
    pageKey === 'pumpVsWheelbarrow' ||
    pageKey === 'fiberVsRebar' ||
    pageKey === 'slabThickness' ||
    pageKey === 'concreteVsAsphalt';

  if (locale === 'fr') {
    return [
      {
        title: isPricing ? 'Base du prix' : isComparison ? 'Critère principal' : 'Volume typique',
        body: isPricing
          ? 'Le volume en m³ est le point de départ, mais le prix final dépend aussi de la livraison, de l’accès et des besoins de chantier.'
          : isComparison
            ? 'Comparez d’abord selon le volume, l’accès et l’usage prévu. Ces trois facteurs changent souvent la meilleure option.'
            : 'Le volume dépend des dimensions réelles, de l’épaisseur et d’une marge raisonnable pour les variations du chantier.',
      },
      {
        title: 'Préparation',
        body: 'Prévoyez une base stable, un coffrage clair, les niveaux, le drainage et les détails d’armature ou de finition si le projet l’exige.',
      },
      {
        title: 'Accès et livraison',
        body: isPump
          ? 'Décrivez la distance, la hauteur, les obstacles et la position du camion pour évaluer le besoin de pompage.'
          : 'Indiquez si le camion peut approcher, s’il y a une cour arrière, des fils aériens, une pente ou une distance à franchir.',
      },
      {
        title: 'Prochaine étape',
        body: 'Calculez une quantité approximative, ajoutez la ville, la date souhaitée et les contraintes, puis envoyez la demande de soumission.',
      },
    ];
  }

  return [
    {
      title: isPricing ? 'Pricing base' : isComparison ? 'Main decision factor' : 'Typical volume',
      body: isPricing
        ? 'Cubic metre volume is the starting point, but final pricing also depends on delivery, access and site requirements.'
        : isComparison
          ? 'Compare options first by volume, access and intended use. These three factors often change the best choice.'
          : 'Volume depends on real dimensions, thickness and a reasonable allowance for job-site variation.',
    },
    {
      title: 'Preparation',
      body: 'Plan for a stable base, clear forms, levels, drainage and reinforcement or finishing details if the project requires them.',
    },
    {
      title: 'Access and delivery',
      body: isPump
        ? 'Describe distance, height, obstacles and truck position to assess pumping needs.'
        : 'Indicate whether the truck can approach, whether there is backyard access, overhead wires, slope or distance to cover.',
    },
    {
      title: 'Next step',
      body: 'Calculate an approximate quantity, add city, desired date and constraints, then send the quote request.',
    },
  ];
}

function peopleAlsoAsk(locale: Locale, pageKey: SeoLandingKey): { question: string; answer: string }[] {
  const copy = seoLandingPages[pageKey].copy[locale];
  if (locale === 'fr') {
    return [
      {
        question: `Comment calculer le béton pour ${copy.h1.toLowerCase()}?`,
        answer:
          'Multipliez les dimensions utiles dans la même unité, convertissez le résultat en mètres cubes et ajoutez une marge selon les conditions du chantier.',
      },
      {
        question: 'Quelle marge faut-il prévoir?',
        answer:
          'Une marge de 5 à 10 % est souvent utilisée pour les variations de profondeur, les pertes et les irrégularités. Un chantier incertain peut demander plus.',
      },
      {
        question: 'Quelles informations faut-il pour une soumission?',
        answer:
          'La ville, l’adresse, la date souhaitée, le type de projet, la quantité estimée, l’accès au chantier et les contraintes connues rendent la demande plus utile.',
      },
      {
        question: 'Le camion doit-il pouvoir accéder directement à la coulée?',
        answer:
          'Un accès direct simplifie la livraison. Si la coulée est loin du camion, en hauteur, au sous-sol ou dans une cour arrière, indiquez-le dans la demande.',
      },
      {
        question: 'Quand faut-il considérer une pompe à béton?',
        answer:
          'Une pompe peut devenir pertinente si la distance, la hauteur, les obstacles ou l’accès rendent la mise en place au camion ou à la brouette difficile.',
      },
    ];
  }

  return [
    {
      question: `How do you calculate concrete for ${copy.h1.toLowerCase()}?`,
      answer:
        'Multiply useful dimensions in the same unit, convert the result to cubic metres and add an allowance based on job-site conditions.',
    },
    {
      question: 'How much allowance should you add?',
      answer:
        'A 5 to 10% allowance is often used for depth variation, waste and irregularities. Uncertain sites may require more.',
    },
    {
      question: 'What information is needed for a quote?',
      answer:
        'City, address, desired date, project type, estimated quantity, site access and known constraints make the request more useful.',
    },
    {
      question: 'Does the truck need direct access to the pour?',
      answer:
        'Direct access simplifies delivery. If the pour is far from the truck, elevated, in a basement or in a backyard, include that in the request.',
    },
    {
      question: 'When should a concrete pump be considered?',
      answer:
        'A pump may be useful when distance, height, obstacles or access make truck or wheelbarrow placement difficult.',
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

function PeopleAlsoAsk({
  locale,
  questions,
}: {
  locale: Locale;
  questions: { question: string; answer: string }[];
}) {
  return (
    <section className="rounded-card border-line bg-surface border p-6">
      <h2 className="text-2xl">{locale === 'fr' ? 'Questions fréquentes' : 'People also ask'}</h2>
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
  );
}

function RelatedCalculators({ locale, pageKey }: { locale: Locale; pageKey: SeoLandingKey }) {
  const labels =
    locale === 'fr'
      ? [
          'Calculateur pour dalle de garage',
          'Calculateur pour fondation',
          'Calculateur pour entrée de cour',
          'Calculateur de béton complet',
        ]
      : [
          'Garage slab calculator',
          'Foundation concrete calculator',
          'Driveway concrete calculator',
          'Complete concrete calculator',
        ];
  const currentTitle = seoLandingPages[pageKey].copy[locale].h1;

  return (
    <section className="rounded-card border-line bg-surface border p-6">
      <h2 className="text-2xl">
        {locale === 'fr' ? 'Calculateurs connexes' : 'Related calculators'}
      </h2>
      <p className="text-ink-muted mt-2 text-sm leading-relaxed">
        {locale === 'fr'
          ? `Utilisez le calculateur principal pour estimer le volume lié à ${currentTitle.toLowerCase()}.`
          : `Use the main calculator to estimate volume for ${currentTitle.toLowerCase()}.`}
      </p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {labels.map((label) => (
          <Link
            key={label}
            href={pathFor('calculator', locale)}
            className="border-line rounded-card hover:border-accent bg-ground block border p-4 font-display font-bold"
          >
            {label}
          </Link>
        ))}
      </div>
    </section>
  );
}

function RelatedConcreteProjectsPreview({
  locale,
  currentService,
}: {
  locale: Locale;
  currentService?: ServiceProjectKey;
}) {
  const serviceLabel = currentService
    ? serviceProjectLabel(locale, currentService)
    : locale === 'fr'
      ? 'projets similaires'
      : 'similar projects';

  return (
    <section className="rounded-card border-line bg-surface border p-6">
      <p className="text-accent font-display text-xs font-bold tracking-wide uppercase">
        {locale === 'fr' ? 'À venir' : 'Coming soon'}
      </p>
      <h2 className="mt-2 text-2xl">
        {locale === 'fr' ? 'Projets similaires' : 'Related concrete projects'}
      </h2>
      <p className="text-ink-muted mt-3 leading-relaxed">
        {locale === 'fr'
          ? `À mesure que BétonDispo traite plus de demandes au Québec, des exemples anonymisés de ${serviceLabel} apparaîtront ici: ville, type de projet, volume approximatif et période de réalisation.`
          : `As BétonDispo processes more requests in Québec, anonymized examples of ${serviceLabel} will appear here: city, project type, approximate volume and completion period.`}
      </p>
      <div className="border-line bg-ground mt-5 rounded-lg border p-4">
        <p className="text-ink-soft text-sm font-semibold">
          {locale === 'fr'
            ? 'Aucun faux projet n’est affiché. Cette section utilisera seulement des données réelles, anonymisées et prêtes à publier.'
            : 'No fake projects are shown. This section will only use real, anonymized, publication-ready data.'}
        </p>
      </div>
    </section>
  );
}

function serviceProjectLabel(locale: Locale, service: ServiceProjectKey): string {
  const labels: Record<ServiceProjectKey, Record<Locale, string>> = {
    garage: { fr: 'dalles de garage', en: 'garage slabs' },
    foundation: { fr: 'fondations', en: 'foundations' },
    patio: { fr: 'patios et terrasses', en: 'patios and terraces' },
    slab: { fr: 'dalles de béton', en: 'concrete slabs' },
    commercial: { fr: 'béton commercial', en: 'commercial concrete' },
  };
  return labels[service][locale];
}

export function RelatedLinks({
  title,
  locale,
  current,
}: {
  title: string;
  locale: Locale;
  current?: SeoLandingKey;
}) {
  return (
    <div className="border-line bg-surface rounded-card border p-6">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <ul className="mt-3 space-y-1">
        {relatedSeoLinks(locale, current).map((link) => (
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
