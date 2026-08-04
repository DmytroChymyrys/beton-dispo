import type { Locale } from '@/i18n/config';
import { pathFor, type RouteKey } from '@/i18n/routes';

export type SeoLandingKey = 'concreteSlab' | 'concreteDelivery';

type SeoLandingCopy = {
  eyebrow: string;
  h1: string;
  intro: string;
  primaryCta: string;
  secondaryCta: string;
  breadcrumbGroup: string;
  sections: { title: string; body: string }[];
  asideTitle: string;
  asideBody: string;
  relatedTitle: string;
};

export type SeoLandingPage = {
  key: SeoLandingKey;
  routeKey: RouteKey;
  schemaType: 'project' | 'service';
  copy: Record<Locale, SeoLandingCopy>;
};

export const seoLandingPages: Record<SeoLandingKey, SeoLandingPage> = {
  concreteSlab: {
    key: 'concreteSlab',
    routeKey: 'concreteSlab',
    schemaType: 'project',
    copy: {
      fr: {
        eyebrow: 'Guide projet',
        h1: 'Combien de béton faut-il pour une dalle?',
        intro:
          'Une dalle de béton se calcule à partir de la longueur, de la largeur et de l’épaisseur. Cette page vous aide à estimer les mètres cubes avant de demander une soumission.',
        primaryCta: 'Calculer le volume de ma dalle',
        secondaryCta: 'Obtenir une soumission',
        breadcrumbGroup: 'Guides',
        sections: [
          {
            title: 'Formule pour une dalle de béton',
            body: 'Le volume se calcule avec la formule longueur × largeur × épaisseur. Toutes les dimensions doivent être converties dans la même unité, puis le résultat est exprimé en mètres cubes.',
          },
          {
            title: 'Quelle épaisseur prévoir?',
            body: 'L’épaisseur dépend de l’usage, du sol, du coffrage et des exigences du projet. Pour une dalle structurale ou un projet soumis à des plans, fiez-vous toujours aux indications de votre professionnel.',
          },
          {
            title: 'Pourquoi ajouter une marge?',
            body: 'Une marge peut couvrir les petites variations de profondeur, les pertes et les irrégularités du chantier. Le calculateur permet de choisir 0 %, 5 %, 10 % ou 15 % selon l’incertitude.',
          },
          {
            title: 'Informations utiles pour une soumission',
            body: 'Indiquez l’adresse, la date souhaitée, les dimensions, l’accès au chantier et toute contrainte comme une cour arrière, une longue distance ou un besoin possible de pompage.',
          },
        ],
        asideTitle: 'De la dalle au volume estimé',
        asideBody:
          'Utilisez le calculateur en mode dalle pour obtenir une quantité recommandée, puis envoyez une demande avec cette estimation.',
        relatedTitle: 'Guides connexes',
      },
      en: {
        eyebrow: 'Project guide',
        h1: 'How much concrete do you need for a slab?',
        intro:
          'A concrete slab is calculated from length, width and thickness. This page helps estimate cubic metres before requesting a quote.',
        primaryCta: 'Calculate my slab volume',
        secondaryCta: 'Request a quote',
        breadcrumbGroup: 'Guides',
        sections: [
          {
            title: 'Concrete slab formula',
            body: 'Volume is calculated as length × width × thickness. All dimensions must be converted to the same unit, then the result is expressed in cubic metres.',
          },
          {
            title: 'What thickness should you allow?',
            body: 'Thickness depends on use, soil, formwork and project requirements. For structural work or projects with drawings, always follow your professional guidance.',
          },
          {
            title: 'Why add an allowance?',
            body: 'An allowance can cover small depth variations, waste and site irregularities. The calculator lets you choose 0%, 5%, 10% or 15% depending on uncertainty.',
          },
          {
            title: 'Useful information for a quote',
            body: 'Provide the address, desired date, dimensions, site access and constraints such as backyard access, long distance or possible pumping needs.',
          },
        ],
        asideTitle: 'From slab dimensions to estimated volume',
        asideBody:
          'Use the calculator in slab mode to get a recommended quantity, then send a request with that estimate.',
        relatedTitle: 'Related guides',
      },
    },
  },
  concreteDelivery: {
    key: 'concreteDelivery',
    routeKey: 'concreteDelivery',
    schemaType: 'service',
    copy: {
      fr: {
        eyebrow: 'Service',
        h1: 'Livraison de béton à Montréal et sur la Rive-Sud',
        intro:
          'Préparez une demande de livraison de béton avec les informations qui permettent de vérifier une option adaptée à votre chantier.',
        primaryCta: 'Obtenir une soumission',
        secondaryCta: 'Calculer mon volume',
        breadcrumbGroup: 'Services',
        sections: [
          {
            title: 'Quelles informations fournir?',
            body: 'Une bonne demande inclut l’adresse du chantier, la date souhaitée, le type de projet, la quantité approximative, la résistance si connue et les contraintes d’accès.',
          },
          {
            title: 'Volume de béton',
            body: 'Le béton est généralement commandé en mètres cubes au Québec. Si vous ne connaissez pas la quantité exacte, utilisez le calculateur ou indiquez les dimensions disponibles.',
          },
          {
            title: 'Accès au chantier',
            body: 'Précisez si le camion peut s’approcher de la coulée, s’il y a une cour arrière, des fils aériens, une pente, un stationnement limité ou une longue distance à franchir.',
          },
          {
            title: 'Pompage ou béton mobile',
            body: 'Selon le volume, l’accès et l’horaire, une pompe ou une solution de béton mobile peut être pertinente. Décrivez le chantier pour faciliter l’évaluation.',
          },
        ],
        asideTitle: 'Une seule demande pour vérifier les options',
        asideBody:
          'BétonDispo travaille avec un réseau de fournisseurs et d’opérateurs afin de trouver une solution adaptée à votre projet.',
        relatedTitle: 'Guides connexes',
      },
      en: {
        eyebrow: 'Service',
        h1: 'Concrete delivery in Montréal and the South Shore',
        intro:
          'Prepare a concrete delivery request with the information needed to check an option suited to your job site.',
        primaryCta: 'Request a quote',
        secondaryCta: 'Calculate my volume',
        breadcrumbGroup: 'Services',
        sections: [
          {
            title: 'What information should you provide?',
            body: 'A good request includes the site address, desired date, project type, approximate quantity, concrete strength if known and site access constraints.',
          },
          {
            title: 'Concrete volume',
            body: 'In Québec, concrete is generally ordered by the cubic metre. If you do not know the exact quantity, use the calculator or provide the dimensions you have.',
          },
          {
            title: 'Site access',
            body: 'Specify whether the truck can approach the pour area, whether there is backyard access, overhead wires, slope, limited parking or a long distance to cover.',
          },
          {
            title: 'Pumping or mobile concrete',
            body: 'Depending on volume, access and schedule, a pump or mobile concrete solution may be relevant. Describe the site to make the request clearer.',
          },
        ],
        asideTitle: 'One request to check available options',
        asideBody:
          'BétonDispo works with a network of suppliers and operators to find a solution suited to your project.',
        relatedTitle: 'Related guides',
      },
    },
  },
};

export function relatedSeoLinks(locale: Locale) {
  return [
    {
      href: pathFor('concretePatio', locale),
      label: locale === 'fr' ? 'Béton pour terrasse extérieure' : 'Concrete patio',
    },
    {
      href: pathFor('concreteDelivery', locale),
      label: seoLandingPages.concreteDelivery.copy[locale].h1,
    },
    { href: pathFor('concreteSlab', locale), label: seoLandingPages.concreteSlab.copy[locale].h1 },
    { href: pathFor('calculator', locale), label: getCalculatorLabel(locale) },
    { href: pathFor('services', locale), label: locale === 'fr' ? 'Services' : 'Services' },
    { href: pathFor('faq', locale), label: locale === 'fr' ? 'FAQ' : 'FAQ' },
  ];
}

function getCalculatorLabel(locale: Locale): string {
  return locale === 'fr' ? 'Calculateur de béton' : 'Concrete Calculator';
}
