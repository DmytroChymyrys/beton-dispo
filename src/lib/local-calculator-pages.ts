import type { Metadata } from 'next';
import type { Locale } from '@/i18n/config';
import { defaultLocale, localeTags, locales, otherLocale } from '@/i18n/config';
import { pathFor } from '@/i18n/routes';
import { getDictionary } from '@/i18n/dictionaries';
import { absoluteUrl } from '@/lib/site';

export const localCalculatorSlugs = [
  'longueuil',
  'montreal',
  'beloeil',
  'candiac',
  'brossard',
] as const;

export type LocalCalculatorSlug = (typeof localCalculatorSlugs)[number];

export const LOCAL_CALCULATOR_LAST_MODIFIED = new Date('2026-08-03T00:00:00-04:00');

type LocalCalculatorFaq = {
  question: string;
  answer: string;
};

type LocalCalculatorCopy = {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  h1: string;
  intro: string;
  calculatorResultTitle: string;
  calculatorQuoteButton: string;
  howTitle: string;
  howBody: string;
  deliveryTitle: string;
  deliveryBody: string;
  pumpTitle: string;
  pumpBody: string;
  projectsTitle: string;
  projects: string[];
  servicesTitle: string;
  finalTitle: string;
  finalBody: string;
  quoteCta: string;
  nearbyTitle: string;
  faqTitle: string;
  faqs: LocalCalculatorFaq[];
};

export type LocalCalculatorCity = {
  slug: LocalCalculatorSlug;
  frenchName: string;
  englishName: string;
  regionLabelFr: string;
  regionLabelEn: string;
  nearbyAreasFr: string[];
  nearbyAreasEn: string[];
  enabled: boolean;
  copy: Record<Locale, LocalCalculatorCopy>;
};

const projectExamples = {
  fr: ['Dalle de garage', 'Fondation ou semelles', 'Patio', 'Agrandissement', 'Trottoir ou entrée', 'Petit projet commercial'],
  en: ['Garage slab', 'Foundation or footings', 'Patio', 'Extension', 'Walkway or driveway', 'Small commercial project'],
} as const;

function standardFaqs(city: string, locale: Locale): LocalCalculatorFaq[] {
  if (locale === 'fr') {
    return [
      {
        question: 'Comment calculer le béton nécessaire pour une dalle?',
        answer:
          'Multipliez la longueur, la largeur et l’épaisseur, puis convertissez le résultat en mètres cubes. Le calculateur fait cette conversion automatiquement.',
      },
      {
        question: 'Quelle marge supplémentaire faut-il prévoir?',
        answer:
          'Une marge de 5 % à 10 % est souvent utile pour les variations de profondeur, les pertes et les irrégularités du chantier. Vous pouvez choisir 0 %, 5 %, 10 % ou 15 %.',
      },
      {
        question: 'Le résultat est-il une quantité finale garantie?',
        answer:
          'Non. Le résultat est une estimation. Les conditions réelles, les dimensions finales et l’accès au chantier peuvent modifier la quantité requise.',
      },
      {
        question: `Est-ce que je peux demander une livraison de béton à ${city}?`,
        answer:
          'Oui, vous pouvez envoyer une demande. BétonDispo vérifie les options disponibles selon l’emplacement, la date, la quantité et les exigences du projet.',
      },
    ];
  }

  return [
    {
      question: 'How do I calculate the concrete needed for a slab?',
      answer:
        'Multiply length, width and thickness, then convert the result to cubic metres. The calculator handles that conversion automatically.',
    },
    {
      question: 'How much extra allowance should I include?',
      answer:
        'A 5% to 10% allowance is often useful for depth variation, waste and site irregularities. You can choose 0%, 5%, 10% or 15%.',
    },
    {
      question: 'Is the result a guaranteed final quantity?',
      answer:
        'No. The result is an estimate. Actual site conditions, final dimensions and access can affect the amount required.',
    },
    {
      question: `Can I request concrete delivery in ${city}?`,
      answer:
        'Yes, you can submit a request. BétonDispo checks available options based on the project location, date, quantity and requirements.',
    },
  ];
}

function frCopy(city: string, intro: string, deliveryBody: string): LocalCalculatorCopy {
  return {
    metaTitle: `Calculateur de béton à ${city} — Estimez votre volume en m³ | BétonDispo`,
    metaDescription: `Calculez la quantité approximative de béton nécessaire pour une dalle, une fondation ou un garage à ${city}, puis demandez une soumission.`,
    eyebrow: `OUTIL GRATUIT — ${city}`,
    h1: `Calculateur de béton à ${city}`,
    intro,
    calculatorResultTitle: `Besoin de cette quantité de béton à ${city}?`,
    calculatorQuoteButton: 'Obtenir une soumission pour {volume}',
    howTitle: 'Comment calculer la quantité de béton pour votre projet?',
    howBody:
      'Entrez les dimensions de la dalle, fondation, mur, colonne ou autre ouvrage. Le calculateur convertit les mesures en volume en m³ et ajoute la marge sélectionnée pour obtenir une quantité recommandée.',
    deliveryTitle: `Quels renseignements fournir pour une livraison à ${city}?`,
    deliveryBody,
    pumpTitle: 'Une pompe à béton est-elle nécessaire?',
    pumpBody:
      'Le pompage peut être utile lorsque le camion ne peut pas s’approcher de la zone de coulée, lorsque l’accès est en cour arrière ou lorsque la distance depuis la rue est importante. Ajoutez ces détails dans la demande.',
    projectsTitle: 'Projets courants',
    projects: [...projectExamples.fr],
    servicesTitle: 'Services reliés',
    finalTitle: `Prêt à demander une soumission à ${city}?`,
    finalBody:
      'Envoyez votre quantité estimée, la date souhaitée et les détails du chantier. La quantité et la ville resteront modifiables dans le formulaire.',
    quoteCta: `Obtenir une soumission à ${city}`,
    nearbyTitle: 'Secteurs à proximité',
    faqTitle: 'Questions fréquentes',
    faqs: standardFaqs(city, 'fr'),
  };
}

function enCopy(city: string, intro: string, deliveryBody: string): LocalCalculatorCopy {
  return {
    metaTitle: `Concrete Calculator in ${city} — Estimate Volume in m³ | BétonDispo`,
    metaDescription: `Estimate the amount of concrete required for a slab, foundation or garage project in ${city}, then request a quote.`,
    eyebrow: `FREE TOOL — ${city}`,
    h1: `Concrete Calculator for ${city} Projects`,
    intro,
    calculatorResultTitle: `Need this amount of concrete in ${city}?`,
    calculatorQuoteButton: 'Request a quote for {volume}',
    howTitle: 'How do you calculate concrete quantity for your project?',
    howBody:
      'Enter the dimensions for a slab, foundation, wall, column or other pour. The calculator converts the measurements into cubic metres and adds the selected allowance to produce a recommended quantity.',
    deliveryTitle: `What information helps with concrete delivery in ${city}?`,
    deliveryBody,
    pumpTitle: 'Is a concrete pump required?',
    pumpBody:
      'Pumping may help when the truck cannot get close to the pour area, when access is through a backyard or when concrete must travel a longer distance from the street. Add those details to the request.',
    projectsTitle: 'Common projects',
    projects: [...projectExamples.en],
    servicesTitle: 'Related services',
    finalTitle: `Ready to request a quote in ${city}?`,
    finalBody:
      'Send your estimated quantity, desired date and site details. The quantity and city stay editable in the form.',
    quoteCta: `Request a quote in ${city}`,
    nearbyTitle: 'Nearby areas',
    faqTitle: 'FAQ',
    faqs: standardFaqs(city, 'en'),
  };
}

export const localCalculatorCities: Record<LocalCalculatorSlug, LocalCalculatorCity> = {
  longueuil: {
    slug: 'longueuil',
    frenchName: 'Longueuil',
    englishName: 'Longueuil',
    regionLabelFr: 'Rive-Sud',
    regionLabelEn: 'South Shore',
    nearbyAreasFr: ['Greenfield Park', 'Saint-Hubert', 'Boucherville'],
    nearbyAreasEn: ['Greenfield Park', 'Saint-Hubert', 'Boucherville'],
    enabled: true,
    copy: {
      fr: frCopy(
        'Longueuil',
        'Estimez rapidement la quantité approximative de béton nécessaire pour votre projet à Longueuil. Entrez les dimensions de votre dalle, fondation, mur, colonne ou autre ouvrage afin d’obtenir un résultat en mètres cubes.',
        'Indiquez le type de projet, la quantité recommandée, la date souhaitée, l’adresse du chantier et les détails d’accès comme la cour arrière, le stationnement ou la distance entre le camion et la zone de coulée.',
      ),
      en: enCopy(
        'Longueuil',
        'Estimate the approximate amount of concrete required for a slab, foundation, wall, column or other project in Longueuil. Enter your dimensions to get a cubic metre result before requesting a quote.',
        'Include the project type, recommended quantity, desired date, job-site address and access details such as backyard access, parking or distance from the truck to the pour area.',
      ),
    },
  },
  montreal: {
    slug: 'montreal',
    frenchName: 'Montréal',
    englishName: 'Montreal',
    regionLabelFr: 'Grand Montréal',
    regionLabelEn: 'Greater Montreal',
    nearbyAreasFr: ['Rive-Sud', 'Longueuil', 'Brossard'],
    nearbyAreasEn: ['South Shore', 'Longueuil', 'Brossard'],
    enabled: true,
    copy: {
      fr: frCopy(
        'Montréal',
        'Préparez votre projet à Montréal en estimant le volume en m³ pour une dalle de béton, une fondation, un garage, une rénovation ou un petit chantier commercial.',
        'Les accès urbains peuvent influencer la livraison ou le pompage. Ajoutez les renseignements utiles sur la rue, le stationnement, l’accès à la cour, la distance de coulée et la fenêtre de livraison souhaitée.',
      ),
      en: enCopy(
        'Montreal',
        'Prepare your Montreal project by estimating cubic metre volume for a concrete slab, foundation, garage, renovation or small commercial job.',
        'Urban access can affect delivery or pumping. Add useful details about the street, parking, backyard access, pour distance and desired delivery window.',
      ),
    },
  },
  beloeil: {
    slug: 'beloeil',
    frenchName: 'Beloeil',
    englishName: 'Beloeil',
    regionLabelFr: 'Montérégie',
    regionLabelEn: 'Monteregie',
    nearbyAreasFr: ['McMasterville', 'Mont-Saint-Hilaire', 'Saint-Basile-le-Grand'],
    nearbyAreasEn: ['McMasterville', 'Mont-Saint-Hilaire', 'Saint-Basile-le-Grand'],
    enabled: true,
    copy: {
      fr: frCopy(
        'Beloeil',
        'Estimez votre quantité de béton à Beloeil pour une dalle, des semelles, une fondation, un patio ou un projet de rénovation résidentielle.',
        'Précisez l’emplacement du chantier, le volume estimé, l’accès au terrain et la date souhaitée. Ces détails aident à vérifier les options possibles selon les besoins du projet.',
      ),
      en: enCopy(
        'Beloeil',
        'Estimate your concrete quantity in Beloeil for a slab, footings, foundation, patio or residential renovation project.',
        'Provide the job-site location, estimated volume, property access and desired date. These details help check possible options based on project needs.',
      ),
    },
  },
  candiac: {
    slug: 'candiac',
    frenchName: 'Candiac',
    englishName: 'Candiac',
    regionLabelFr: 'Rive-Sud',
    regionLabelEn: 'South Shore',
    nearbyAreasFr: ['La Prairie', 'Brossard', 'Saint-Constant'],
    nearbyAreasEn: ['La Prairie', 'Brossard', 'Saint-Constant'],
    enabled: true,
    copy: {
      fr: frCopy(
        'Candiac',
        'Calculez le volume approximatif pour une dalle de garage, une fondation, une piscine, un patio ou un aménagement à Candiac.',
        'Ajoutez les dimensions, la quantité recommandée, la date visée et les contraintes d’accès. Une demande claire facilite la vérification des options de livraison ou de pompage lorsque nécessaire.',
      ),
      en: enCopy(
        'Candiac',
        'Calculate approximate volume for a garage slab, foundation, pool, patio or landscaping project in Candiac.',
        'Add dimensions, recommended quantity, target date and access constraints. A clear request makes it easier to check delivery or pumping options when needed.',
      ),
    },
  },
  brossard: {
    slug: 'brossard',
    frenchName: 'Brossard',
    englishName: 'Brossard',
    regionLabelFr: 'Rive-Sud',
    regionLabelEn: 'South Shore',
    nearbyAreasFr: ['Candiac', 'Longueuil', 'La Prairie'],
    nearbyAreasEn: ['Candiac', 'Longueuil', 'La Prairie'],
    enabled: true,
    copy: {
      fr: frCopy(
        'Brossard',
        'Utilisez le calculateur pour estimer le béton requis à Brossard pour une dalle, un garage, une fondation, une rénovation ou un petit chantier commercial.',
        'Mentionnez l’adresse, l’accès au chantier, le stationnement, la distance de coulée et la quantité recommandée. Ces informations aident à déterminer si le pompage ou une autre approche peut être utile.',
      ),
      en: enCopy(
        'Brossard',
        'Use the calculator to estimate concrete required in Brossard for a slab, garage, foundation, renovation or small commercial site.',
        'Mention the address, site access, parking, pour distance and recommended quantity. This information helps determine whether pumping or another approach may be useful.',
      ),
    },
  },
};

export function isLocalCalculatorSlug(value: string): value is LocalCalculatorSlug {
  return (
    (localCalculatorSlugs as readonly string[]).includes(value) &&
    localCalculatorCities[value as LocalCalculatorSlug].enabled
  );
}

export function localCalculatorPath(slug: LocalCalculatorSlug, locale: Locale): string {
  return `${pathFor('calculator', locale)}/${slug}`;
}

export function localCalculatorStaticParams() {
  return localCalculatorSlugs
    .filter((slug) => localCalculatorCities[slug].enabled)
    .map((city) => ({ city }));
}

export function localCalculatorAlternates(slug: LocalCalculatorSlug): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[localeTags[locale]] = absoluteUrl(localCalculatorPath(slug, locale));
  }
  languages['x-default'] = absoluteUrl(localCalculatorPath(slug, defaultLocale));
  return languages;
}

export function buildLocalCalculatorMetadata(
  slug: LocalCalculatorSlug,
  locale: Locale,
): Metadata {
  const city = localCalculatorCities[slug];
  const copy = city.copy[locale];
  const canonical = absoluteUrl(localCalculatorPath(slug, locale));
  const dict = getDictionary(locale);
  const socialImage = {
    url: absoluteUrl(`/${locale}/opengraph-image`),
    width: 1200,
    height: 630,
    alt: dict.meta.siteName,
  };

  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
    alternates: { canonical, languages: localCalculatorAlternates(slug) },
    openGraph: {
      type: 'website',
      siteName: dict.meta.siteName,
      title: copy.metaTitle,
      description: copy.metaDescription,
      url: canonical,
      locale: dict.meta.ogLocale,
      alternateLocale: getDictionary(otherLocale(locale)).meta.ogLocale,
      images: [socialImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: copy.metaTitle,
      description: copy.metaDescription,
      images: [socialImage.url],
    },
  };
}
