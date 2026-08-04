import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Locale } from '@/i18n/config';
import { pathFor } from '@/i18n/routes';
import { JsonLd } from '@/components/JsonLd';
import { PatioSlabCalculator } from '@/components/pages/PatioSlabCalculator';
import { Photo } from '@/components/Photo';
import { RelatedServices, ServicePrevNext } from '@/components/RelatedServices';
import { Breadcrumbs, type BreadcrumbItem } from '@/components/ui/Breadcrumbs';
import { Section, SectionTitle } from '@/components/ui/Section';
import { buttonClass } from '@/components/ui/button-styles';
import { absoluteUrl } from '@/lib/site';
import { breadcrumbSchema } from '@/lib/structured-data';

type InfoCard = { title: string; body: string; icon: 'ruler' | 'percent' | 'base' };
type ContentSection = { title: string; body: string; cta?: string };
type Faq = { question: string; answer: string };
type GuideLink = {
  href: string;
  title: string;
  description: string;
  icon: 'quote' | 'calculator' | 'slab' | 'process' | 'faq';
};

const copy = {
  fr: {
    breadcrumbService: 'Services',
    h1: 'Béton pour terrasse extérieure',
    intro:
      'Calculez la quantité de béton nécessaire pour votre terrasse extérieure et obtenez une soumission pour la livraison de béton dans le Grand Montréal et la Rive-Sud.',
    primary: 'Obtenir une soumission',
    secondary: 'Calculer le volume de béton',
    imageAlt: 'Coulée de béton pour une terrasse résidentielle extérieure',
    trustLine: 'Solution pour les projets résidentiels dans le Grand Montréal et la Rive-Sud.',
    note: 'Les exigences peuvent varier selon le projet. Consultez un professionnel pour valider la structure, l’épaisseur, l’armature et les joints nécessaires.',
    projectParam: 'terrasse',
    cards: [
      {
        title: 'Épaisseur courante',
        body: 'Une dalle de terrasse résidentielle est souvent conçue avec une épaisseur d’environ 10 cm, selon le sol, l’usage et les exigences du projet.',
        icon: 'ruler',
      },
      {
        title: 'Prévoir une marge',
        body: 'Ajoutez généralement de 5 à 10 % au volume calculé afin de couvrir les pertes, les variations du terrain et les ajustements pendant la coulée.',
        icon: 'percent',
      },
      {
        title: 'Préparation du sol',
        body: 'Une base compactée, un coffrage solide et un drainage adéquat contribuent à réduire les risques de fissures et de mouvements.',
        icon: 'base',
      },
    ] satisfies InfoCard[],
    sections: [
      {
        title: 'Quel béton choisir pour une terrasse extérieure?',
        body: 'Pour une terrasse extérieure, le mélange doit être adapté aux conditions climatiques, à l’exposition à l’eau, au gel et au dégel ainsi qu’à l’utilisation prévue. Le fournisseur ou l’entrepreneur peut recommander le type de béton, la résistance, les adjuvants et la finition appropriés.',
      },
      {
        title: 'Combien de béton faut-il?',
        body: 'Vous avez besoin de la longueur, de la largeur, de l’épaisseur et d’une marge de perte. Une terrasse de 4 m × 5 m avec une épaisseur de 0,10 m représente un volume net de 2,0 m³. Avec une marge de 10 %, le volume estimé serait de 2,2 m³.',
      },
      {
        title: 'Combien coûte une terrasse en béton?',
        body: 'Le prix dépend de la surface, de l’épaisseur, de l’excavation, de la préparation de la base, de l’armature, du mélange de béton, du pompage, de l’accès au chantier, de la finition, de la distance du fournisseur et des frais minimums de livraison.',
        cta: 'Recevoir une estimation adaptée à mon projet',
      },
      {
        title: 'Livraison de béton pour terrasse dans le Grand Montréal',
        body: 'BétonDispo peut recevoir des demandes pour Montréal, Longueuil, Brossard, Candiac, Saint-Hubert, Boucherville, Laval, Repentigny et les municipalités à proximité, selon les détails du chantier et la date souhaitée.',
      },
    ] satisfies ContentSection[],
    prepTitle: 'Comment préparer une dalle de béton pour terrasse?',
    prepIntro:
      'Ces étapes restent générales. Pour les dimensions finales, la structure, l’armature et les joints, validez avec un entrepreneur qualifié.',
    prepSteps: [
      'Déterminer les dimensions',
      'Préparer et compacter la base',
      'Installer le coffrage',
      'Prévoir l’armature et les joints',
      'Organiser la livraison et la coulée',
      'Effectuer la finition et la cure',
    ],
    faqTitle: 'Questions fréquentes',
    faqs: [
      {
        question: 'Quelle épaisseur prévoir pour une terrasse en béton?',
        answer:
          'Une terrasse résidentielle est souvent pensée autour d’une dalle d’environ 10 cm, mais l’épaisseur réelle dépend du sol, de l’usage, des charges, de l’armature et des exigences du projet.',
      },
      {
        question: 'Comment calculer la quantité de béton nécessaire?',
        answer:
          'Multipliez la longueur par la largeur et par l’épaisseur, avec toutes les mesures dans la même unité. Le résultat doit ensuite être exprimé en mètres cubes.',
      },
      {
        question: 'Faut-il ajouter une marge au volume calculé?',
        answer:
          'Oui, une marge de 5 à 10 % est souvent utile pour couvrir les pertes, les variations de profondeur et les ajustements pendant la coulée.',
      },
      {
        question: 'Peut-on livrer une petite quantité de béton?',
        answer:
          'Vous pouvez soumettre la demande même pour une petite quantité. Les options dépendent du secteur, de la date, du volume et des exigences du chantier.',
      },
      {
        question: 'Ai-je besoin d’une pompe à béton?',
        answer:
          'Une pompe peut être pertinente si le camion ne peut pas approcher la zone de coulée ou si l’accès est long, étroit, en cour arrière ou avec un dénivelé.',
      },
      {
        question: 'Combien coûte la livraison de béton pour une terrasse?',
        answer:
          'Le coût varie selon le volume, le mélange, les frais minimums, l’accès, la distance, le pompage et la finition. Une soumission adaptée au chantier est nécessaire.',
      },
      {
        question: 'Quelle finition peut-on choisir pour une terrasse en béton?',
        answer:
          'La finition dépend de l’usage et de l’apparence souhaitée. Un entrepreneur peut recommander une finition appropriée pour une surface extérieure.',
      },
      {
        question: 'Combien de temps faut-il attendre avant d’utiliser la terrasse?',
        answer:
          'Le délai dépend du mélange, de la météo, de la cure et de l’usage prévu. Suivez les recommandations du fournisseur ou de l’entrepreneur.',
      },
    ] satisfies Faq[],
    finalTitle: 'Prêt à planifier votre terrasse en béton?',
    finalText:
      'Indiquez les dimensions, l’adresse, la date souhaitée et les particularités de votre projet. BétonDispo vous aidera à trouver une solution de livraison adaptée.',
    linksTitle: 'Guides utiles',
    volumeLink: 'Calculer le volume',
    guideLinks: [
      {
        title: 'Obtenir une soumission',
        description: 'Recevez une estimation adaptée à votre projet.',
        icon: 'quote',
      },
      {
        title: 'Calculer le volume',
        description: 'Utilisez le calculateur complet pour votre projet.',
        icon: 'calculator',
      },
      {
        title: 'Dalle de béton',
        description: 'Consultez le guide général sur les dalles.',
        icon: 'slab',
      },
      {
        title: 'Comment ça marche',
        description: 'Découvrez comment BétonDispo traite une demande.',
        icon: 'process',
      },
      {
        title: 'Questions fréquentes',
        description: 'Consultez les réponses aux questions courantes.',
        icon: 'faq',
      },
    ],
  },
  en: {
    breadcrumbService: 'Services',
    h1: 'Concrete for an Outdoor Patio',
    intro:
      'Calculate how much concrete your outdoor patio requires and request a concrete delivery quote in Greater Montreal and the South Shore.',
    primary: 'Get a quote',
    secondary: 'Calculate concrete volume',
    imageAlt: 'Concrete being poured for a residential outdoor patio',
    trustLine:
      'A practical solution for residential projects in Greater Montreal and the South Shore.',
    note: 'Requirements can vary by project. Consult a professional to confirm the structure, thickness, reinforcement and joints needed.',
    projectParam: 'patio',
    cards: [
      {
        title: 'Common thickness',
        body: 'A residential patio slab is often planned around roughly 10 cm, depending on soil, use and project requirements.',
        icon: 'ruler',
      },
      {
        title: 'Include an allowance',
        body: 'Add about 5% to 10% to the calculated volume to cover waste, ground variation and adjustments during the pour.',
        icon: 'percent',
      },
      {
        title: 'Base preparation',
        body: 'A compacted base, solid formwork and suitable drainage help reduce the risk of cracking and movement.',
        icon: 'base',
      },
    ] satisfies InfoCard[],
    sections: [
      {
        title: 'Which concrete should you choose for an outdoor patio?',
        body: 'For an outdoor patio, the mix should suit the climate, water exposure, freeze-thaw conditions and intended use. The supplier or contractor can recommend the concrete type, strength, admixtures and finish.',
      },
      {
        title: 'How much concrete do you need?',
        body: 'You need length, width, thickness and an allowance. A 4 m × 5 m patio with a 0.10 m thickness has a net volume of 2.0 m³. With a 10% allowance, the estimated volume is 2.2 m³.',
      },
      {
        title: 'How much does a concrete patio cost?',
        body: 'Cost depends on surface area, slab thickness, excavation, base preparation, reinforcement, concrete mix, pumping needs, site access, finishing, supplier distance and minimum delivery charges.',
        cta: 'Get an estimate suited to my project',
      },
      {
        title: 'Patio concrete delivery in Greater Montreal',
        body: 'BétonDispo can receive requests for Montréal, Longueuil, Brossard, Candiac, Saint-Hubert, Boucherville, Laval, Repentigny and nearby municipalities, depending on site details and the desired date.',
      },
    ] satisfies ContentSection[],
    prepTitle: 'How do you prepare a concrete patio slab?',
    prepIntro:
      'These steps are general. For final dimensions, structure, reinforcement and joints, confirm the plan with a qualified contractor.',
    prepSteps: [
      'Determine the dimensions',
      'Prepare and compact the base',
      'Install the formwork',
      'Plan reinforcement and joints',
      'Organize delivery and pouring',
      'Complete finishing and curing',
    ],
    faqTitle: 'FAQ',
    faqs: [
      {
        question: 'What thickness should a concrete patio have?',
        answer:
          'A residential patio is often planned around a slab of roughly 10 cm, but the actual thickness depends on soil, use, loads, reinforcement and project requirements.',
      },
      {
        question: 'How do I calculate the concrete quantity needed?',
        answer:
          'Multiply length by width by thickness, with all measurements in the same unit. Then express the result in cubic metres.',
      },
      {
        question: 'Should I add an allowance to the calculated volume?',
        answer:
          'Yes. A 5% to 10% allowance is often useful for waste, depth variation and adjustments during the pour.',
      },
      {
        question: 'Can a small amount of concrete be delivered?',
        answer:
          'You can submit the request even for a small quantity. Options depend on the area, date, volume and site requirements.',
      },
      {
        question: 'Do I need a concrete pump?',
        answer:
          'A pump may be relevant if the truck cannot get close to the pour area or access is long, narrow, in a backyard or affected by elevation.',
      },
      {
        question: 'How much does patio concrete delivery cost?',
        answer:
          'Cost varies by volume, mix, minimum charges, access, distance, pumping and finishing. A quote suited to the site is needed.',
      },
      {
        question: 'What finish can I choose for a concrete patio?',
        answer:
          'The finish depends on the intended use and appearance. A contractor can recommend a finish appropriate for an outdoor surface.',
      },
      {
        question: 'How long should I wait before using the patio?',
        answer:
          'Timing depends on the mix, weather, curing and intended use. Follow the supplier or contractor recommendations.',
      },
    ] satisfies Faq[],
    finalTitle: 'Ready to plan your concrete patio?',
    finalText:
      'Provide the dimensions, address, desired date and project details. BétonDispo will help find a delivery solution suited to your site.',
    linksTitle: 'Useful guides',
    volumeLink: 'Calculate volume',
    guideLinks: [
      {
        title: 'Get a quote',
        description: 'Receive an estimate suited to your project.',
        icon: 'quote',
      },
      {
        title: 'Calculate volume',
        description: 'Use the full calculator for your project.',
        icon: 'calculator',
      },
      {
        title: 'Concrete slab',
        description: 'Read the general guide for concrete slabs.',
        icon: 'slab',
      },
      {
        title: 'How it works',
        description: 'See how BétonDispo handles a request.',
        icon: 'process',
      },
      {
        title: 'FAQ',
        description: 'Find answers to common questions.',
        icon: 'faq',
      },
    ],
  },
} as const;

export function ConcretePatioPage({ locale }: { locale: Locale }) {
  const page = copy[locale];
  const pageUrl = absoluteUrl(pathFor('concretePatio', locale));
  const quoteHref = `${pathFor('quote', locale)}?project=${encodeURIComponent(page.projectParam)}`;
  const calculatorHref = `${pathFor('calculator', locale)}?project=${encodeURIComponent(page.projectParam)}`;
  const calculatorAnchorHref = '#patio-calculator';
  const homeLabel = locale === 'fr' ? 'Accueil' : 'Home';
  const breadcrumbs: BreadcrumbItem[] = [
    { label: homeLabel, href: pathFor('home', locale) },
    { label: page.breadcrumbService, href: pathFor('services', locale) },
    { label: page.h1 },
  ];
  const guideHrefs = [
    quoteHref,
    calculatorHref,
    pathFor('concreteSlab', locale),
    pathFor('howItWorks', locale),
    pathFor('faq', locale),
  ];
  const guideLinks: GuideLink[] = page.guideLinks.map((item, index) => ({
    ...item,
    href: guideHrefs[index]!,
  }));

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: homeLabel, url: absoluteUrl(pathFor('home', locale)) },
          { name: page.breadcrumbService, url: absoluteUrl(pathFor('services', locale)) },
          { name: page.h1, url: pageUrl },
        ])}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: page.faqs.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer },
          })),
        }}
      />

      <div className="border-line bg-surface border-b">
        <div className="container-page py-8 xl:py-7">
          <Breadcrumbs items={breadcrumbs} />
          <div className="mt-5 grid gap-6 lg:grid-cols-[0.84fr_1.16fr] lg:items-center xl:min-h-[350px] xl:gap-0">
            <div className="relative z-20">
              <h1 className="mt-2 max-w-3xl text-4xl leading-[1.08] sm:text-5xl">{page.h1}</h1>
              <p className="text-ink-muted mt-4 max-w-2xl text-lg leading-relaxed">{page.intro}</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href={quoteHref} className={buttonClass('primary', 'lg', 'w-full sm:w-auto')}>
                  {page.primary}
                </Link>
                <Link
                  href={calculatorAnchorHref}
                  className={buttonClass('secondary', 'lg', 'w-full sm:w-auto')}
                >
                  {page.secondary}
                </Link>
              </div>
              <p className="text-ink-muted mt-4 text-sm leading-relaxed">{page.trustLine}</p>
            </div>
            <Photo
              photo="patioPour"
              alt={page.imageAlt}
              aspect="aspect-[16/9]"
              priority
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="xl:-ml-12 xl:rounded-l-none xl:border-0 xl:shadow-none xl:before:absolute xl:before:inset-y-0 xl:before:left-0 xl:before:z-10 xl:before:w-[30%] xl:before:bg-gradient-to-r xl:before:from-white xl:before:via-white/70 xl:before:to-transparent xl:before:content-['']"
              imageClassName="object-[58%_50%]"
            />
          </div>
        </div>
      </div>

      <Section tone="ground" className="pt-5 pb-4 md:pt-6 md:pb-5">
        <div className="grid gap-4 md:grid-cols-3">
          {page.cards.map((card) => (
            <article
              key={card.title}
              className="rounded-card border-line bg-surface flex h-full gap-4 border p-4 xl:min-h-[150px]"
            >
              <ServiceIcon icon={card.icon} />
              <div>
                <h2 className="text-lg">{card.title}</h2>
                <p className="text-ink-muted mt-1.5 text-sm leading-relaxed">{card.body}</p>
              </div>
            </article>
          ))}
        </div>
        <p className="text-ink-muted mt-3 text-sm leading-relaxed">{page.note}</p>
      </Section>

      <Section tone="surface" labelledBy="patio-calculator" className="pt-5 pb-10 md:pt-5 md:pb-12">
        <PatioSlabCalculator locale={locale} projectParam={page.projectParam} />
      </Section>

      <Section tone="ground" className="py-12 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-6">
            <div className="divide-line rounded-card border-line bg-surface divide-y border">
              {page.sections.slice(0, 1).map((section) => (
                <section key={section.title} className="p-6 md:p-8">
                  <h2 className="text-2xl">{section.title}</h2>
                  <p className="text-ink-muted mt-3 leading-relaxed">{section.body}</p>
                </section>
              ))}

              <section className="p-6 md:p-8">
                <h2 className="text-2xl">{page.prepTitle}</h2>
                <p className="text-ink-muted mt-3 leading-relaxed">{page.prepIntro}</p>
                <ol className="mt-5 grid gap-3 sm:grid-cols-2">
                  {page.prepSteps.map((step, index) => (
                    <li key={step} className="flex gap-3">
                      <span className="bg-accent flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white">
                        {index + 1}
                      </span>
                      <span className="text-ink-soft font-medium">{step}</span>
                    </li>
                  ))}
                </ol>
              </section>

              {page.sections.slice(1).map((section) => (
                <section key={section.title} className="p-6 md:p-8">
                  <h2 className="text-2xl">{section.title}</h2>
                  <p className="text-ink-muted mt-3 leading-relaxed">{section.body}</p>
                  {section.title ===
                  (locale === 'fr'
                    ? 'Combien de béton faut-il?'
                    : 'How much concrete do you need?') ? (
                    <p className="mt-4">
                      <Link
                        href="#patio-calculator"
                        className="text-accent font-semibold hover:underline"
                      >
                        {locale === 'fr'
                          ? 'Calculez votre volume de béton'
                          : 'Calculate your concrete volume'}
                      </Link>
                    </p>
                  ) : null}
                  {section.cta ? (
                    <Link
                      href={quoteHref}
                      className={buttonClass('primary', 'md', 'mt-5 w-full sm:w-auto')}
                    >
                      {section.cta}
                    </Link>
                  ) : null}
                </section>
              ))}
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-card border-line bg-surface shadow-card border p-5">
              <h2 className="font-display text-lg font-bold">{page.linksTitle}</h2>
              <ul className="divide-line mt-3 divide-y">
                {guideLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group hover:text-accent focus-visible:text-accent flex gap-3 py-4 outline-none first:pt-2"
                    >
                      <GuideIcon icon={link.icon} />
                      <span className="min-w-0 flex-1">
                        <span className="text-ink group-hover:text-accent group-focus-visible:text-accent font-semibold">
                          {link.title}
                        </span>
                        <span className="text-ink-muted mt-1 block text-sm leading-relaxed">
                          {link.description}
                        </span>
                      </span>
                      <span className="text-ink-muted group-hover:text-accent group-focus-visible:text-accent">
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </Section>

      <Section tone="surface" labelledBy="patio-faq" className="py-12 md:py-16">
        <SectionTitle id="patio-faq" className="mt-0">
          {page.faqTitle}
        </SectionTitle>
        <div className="divide-line mt-6 divide-y">
          {page.faqs.map((item) => (
            <section key={item.question} className="py-5 first:pt-0">
              <h2 className="text-xl">{item.question}</h2>
              <p className="text-ink-muted mt-2 leading-relaxed">{item.answer}</p>
            </section>
          ))}
        </div>
      </Section>

      <Section tone="steel" labelledBy="patio-final-cta" className="py-12 md:py-16">
        <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
          <div>
            <SectionTitle id="patio-final-cta" className="mt-0 text-3xl" onDark>
              {page.finalTitle}
            </SectionTitle>
            <p className="mt-3 max-w-2xl text-white/75">{page.finalText}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
            <Link href={quoteHref} className={buttonClass('primary', 'lg', 'w-full md:w-auto')}>
              {page.primary}
            </Link>
            <Link
              href={calculatorHref}
              className={buttonClass('secondary', 'lg', 'w-full md:w-auto')}
            >
              {page.volumeLink}
            </Link>
          </div>
        </div>
      </Section>

      <Section tone="ground" className="py-12 md:py-16">
        <div className="space-y-6">
          <RelatedServices locale={locale} current="concretePatio" />
          <ServicePrevNext locale={locale} current="concretePatio" />
        </div>
      </Section>
    </>
  );
}

function ServiceIcon({ icon }: { icon: InfoCard['icon'] }) {
  const paths = {
    ruler: (
      <>
        <path d="M5 19 19 5" />
        <path d="m8 16 2 2" />
        <path d="m11 13 2 2" />
        <path d="m14 10 2 2" />
      </>
    ),
    percent: (
      <>
        <path d="m7 17 10-10" />
        <circle cx="8" cy="8" r="2" />
        <circle cx="16" cy="16" r="2" />
      </>
    ),
    base: (
      <>
        <path d="M4 15h16" />
        <path d="M6 11h12" />
        <path d="M8 7h8" />
        <path d="M5 19h14" />
      </>
    ),
  } satisfies Record<InfoCard['icon'], ReactNode>;

  return (
    <span className="bg-accent flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        {paths[icon]}
      </svg>
    </span>
  );
}

function GuideIcon({ icon }: { icon: GuideLink['icon'] }) {
  const paths = {
    quote: (
      <>
        <path d="M7 8h10" />
        <path d="M7 12h7" />
        <path d="M5 4h14v16H5z" />
      </>
    ),
    calculator: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M8 7h8" />
        <path d="M8 11h2" />
        <path d="M12 11h2" />
        <path d="M16 11h0" />
        <path d="M8 15h2" />
        <path d="M12 15h2" />
        <path d="M16 15h0" />
      </>
    ),
    slab: (
      <>
        <path d="m4 15 8-4 8 4-8 4-8-4Z" />
        <path d="m4 11 8-4 8 4" />
      </>
    ),
    process: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v5l3 2" />
      </>
    ),
    faq: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M9.5 9a2.5 2.5 0 0 1 4.3 1.7c0 1.7-1.8 2.1-1.8 3.3" />
        <path d="M12 17h.01" />
      </>
    ),
  } satisfies Record<GuideLink['icon'], ReactNode>;

  return (
    <span className="border-accent/30 bg-accent-tint text-accent mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        {paths[icon]}
      </svg>
    </span>
  );
}
