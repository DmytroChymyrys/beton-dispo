import type { Metadata } from 'next';
import type { Locale } from '@/i18n/config';
import { defaultLocale, localeTags } from '@/i18n/config';
import { pathFor, type RouteKey } from '@/i18n/routes';
import { absoluteUrl } from '@/lib/site';

export type SeoLandingKey =
  | 'concreteSlab'
  | 'concreteDelivery'
  | 'garageConcrete'
  | 'foundationConcrete'
  | 'drivewayConcrete'
  | 'poolConcrete'
  | 'basementConcrete'
  | 'concreteFootings'
  | 'sidewalkConcrete'
  | 'commercialConcrete'
  | 'concretePriceM3'
  | 'concreteDeliveryCost'
  | 'concreteSlabCost'
  | 'garageSlabCost'
  | 'concretePumpCost'
  | 'mobileConcrete'
  | 'concretePumping'
  | 'readyMixVsBags'
  | 'pumpVsWheelbarrow'
  | 'fiberVsRebar'
  | 'slabThickness'
  | 'concreteVsAsphalt';

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
  routeKey?: RouteKey;
  slugs: Record<Locale, string>;
  schemaType: 'project' | 'service';
  popular?: boolean;
  copy: Record<Locale, SeoLandingCopy>;
};

type LandingSeed = {
  key: SeoLandingKey;
  slugs: Record<Locale, string>;
  schemaType: 'project' | 'service';
  group: 'project' | 'price' | 'service' | 'comparison';
  popular?: boolean;
  routeKey?: RouteKey;
  fr: {
    eyebrow: string;
    h1: string;
    intro: string;
    subject: string;
    aside: string;
    metaTitle?: string;
    metaDescription?: string;
  };
  en: {
    eyebrow: string;
    h1: string;
    intro: string;
    subject: string;
    aside: string;
    metaTitle?: string;
    metaDescription?: string;
  };
};

const seeds: LandingSeed[] = [
  {
    key: 'concreteSlab',
    routeKey: 'concreteSlab',
    slugs: { fr: 'dalle-beton', en: 'concrete-slab' },
    schemaType: 'project',
    group: 'project',
    popular: true,
    fr: {
      eyebrow: 'Guide projet',
      h1: 'Combien de béton faut-il pour une dalle?',
      intro:
        'Une dalle de béton se calcule à partir de la longueur, de la largeur et de l’épaisseur. Cette page vous aide à estimer les mètres cubes avant de demander une soumission.',
      subject: 'dalle de béton',
      aside:
        'Utilisez le calculateur en mode dalle pour obtenir une quantité recommandée, puis envoyez une demande avec cette estimation.',
    },
    en: {
      eyebrow: 'Project guide',
      h1: 'How much concrete do you need for a slab?',
      intro:
        'A concrete slab is calculated from length, width and thickness. This page helps estimate cubic metres before requesting a quote.',
      subject: 'concrete slab',
      aside:
        'Use the calculator in slab mode to get a recommended quantity, then send a request with that estimate.',
    },
  },
  {
    key: 'concreteDelivery',
    routeKey: 'concreteDelivery',
    slugs: { fr: 'livraison-beton', en: 'concrete-delivery' },
    schemaType: 'service',
    group: 'service',
    popular: true,
    fr: {
      eyebrow: 'Service',
      h1: 'Livraison de béton à Montréal et sur la Rive-Sud',
      intro:
        'Préparez une demande de livraison de béton avec les informations qui permettent de vérifier une option adaptée à votre chantier.',
      subject: 'livraison de béton',
      aside:
        'BétonDispo travaille avec un réseau de fournisseurs et d’opérateurs afin de trouver une solution adaptée à votre projet.',
    },
    en: {
      eyebrow: 'Service',
      h1: 'Concrete delivery in Montréal and the South Shore',
      intro:
        'Prepare a concrete delivery request with the information needed to check an option suited to your job site.',
      subject: 'concrete delivery',
      aside:
        'BétonDispo works with a network of suppliers and operators to find a solution suited to your project.',
    },
  },
  {
    key: 'garageConcrete',
    slugs: { fr: 'beton-garage', en: 'garage-concrete-slab' },
    schemaType: 'project',
    group: 'project',
    popular: true,
    fr: {
      eyebrow: 'Garage',
      h1: 'Béton pour garage',
      intro:
        'Planifiez une dalle de garage avec une estimation en m³, les bonnes informations de chantier et une demande claire pour la livraison de béton.',
      subject: 'dalle de garage',
      aside:
        'Une dalle de garage demande une quantité fiable, un accès clair et une date réaliste pour coordonner la coulée.',
    },
    en: {
      eyebrow: 'Garage',
      h1: 'Garage concrete slab',
      intro:
        'Plan a garage slab with an m³ estimate, clear job-site details and a quote request ready for concrete delivery.',
      subject: 'garage slab',
      aside:
        'A garage slab needs a reliable volume, clear access details and a realistic pour date.',
    },
  },
  {
    key: 'foundationConcrete',
    slugs: { fr: 'beton-fondation', en: 'foundation-concrete' },
    schemaType: 'project',
    group: 'project',
    popular: true,
    fr: {
      eyebrow: 'Fondation',
      h1: 'Béton pour fondation',
      intro:
        'Préparez une demande pour semelles, murs ou travaux de fondation avec les dimensions, l’accès au chantier et les exigences connues.',
      subject: 'fondation en béton',
      aside:
        'Pour les ouvrages structuraux, validez toujours les plans, la résistance et les détails techniques avec votre professionnel.',
    },
    en: {
      eyebrow: 'Foundation',
      h1: 'Foundation concrete',
      intro:
        'Prepare a request for footings, walls or foundation work with dimensions, site access and known requirements.',
      subject: 'concrete foundation',
      aside:
        'For structural work, always confirm drawings, strength and technical details with your professional.',
    },
  },
  {
    key: 'drivewayConcrete',
    slugs: { fr: 'beton-entree', en: 'concrete-driveway' },
    schemaType: 'project',
    group: 'project',
    popular: true,
    fr: {
      eyebrow: 'Entrée',
      h1: 'Béton pour entrée de cour',
      intro:
        'Estimez le béton nécessaire pour une entrée, une allée ou une surface extérieure et préparez une demande avec les bonnes contraintes d’accès.',
      subject: 'entrée de cour en béton',
      aside:
        'Les entrées exigent une attention particulière à l’épaisseur, au drainage, à la pente et à l’accès du camion.',
    },
    en: {
      eyebrow: 'Driveway',
      h1: 'Concrete driveway',
      intro:
        'Estimate concrete for a driveway, walkway or exterior surface and prepare a request with the right access details.',
      subject: 'concrete driveway',
      aside:
        'Driveways require attention to thickness, drainage, slope and truck access.',
    },
  },
  {
    key: 'poolConcrete',
    slugs: { fr: 'beton-piscine', en: 'concrete-pool-deck' },
    schemaType: 'project',
    group: 'project',
    fr: {
      eyebrow: 'Piscine',
      h1: 'Béton pour piscine et contour',
      intro:
        'Préparez une demande pour contour de piscine, dalle technique ou aménagement extérieur avec volume estimé et contraintes d’accès.',
      subject: 'béton autour de piscine',
      aside:
        'Les projets de piscine impliquent souvent un accès restreint, une finition extérieure et une coordination serrée avec les autres travaux.',
    },
    en: {
      eyebrow: 'Pool',
      h1: 'Concrete pool deck',
      intro:
        'Prepare a request for a pool deck, equipment pad or exterior concrete work with estimated volume and access constraints.',
      subject: 'pool deck concrete',
      aside:
        'Pool projects often involve restricted access, exterior finishing and coordination with other work.',
    },
  },
  {
    key: 'basementConcrete',
    slugs: { fr: 'beton-sous-sol', en: 'basement-concrete-slab' },
    schemaType: 'project',
    group: 'project',
    fr: {
      eyebrow: 'Sous-sol',
      h1: 'Béton pour dalle de sous-sol',
      intro:
        'Planifiez une dalle de sous-sol avec les dimensions, l’épaisseur, les accès intérieurs et le besoin possible de pompage.',
      subject: 'dalle de sous-sol',
      aside:
        'Un sous-sol peut exiger une pompe, une distance de boyau importante ou une coordination avec l’excavation et le coffrage.',
    },
    en: {
      eyebrow: 'Basement',
      h1: 'Basement concrete slab',
      intro:
        'Plan a basement slab with dimensions, thickness, interior access and possible pumping requirements.',
      subject: 'basement slab',
      aside:
        'Basement pours may require a pump, significant hose distance or coordination with excavation and formwork.',
    },
  },
  {
    key: 'concreteFootings',
    slugs: { fr: 'semelle-beton', en: 'concrete-footings' },
    schemaType: 'project',
    group: 'project',
    fr: {
      eyebrow: 'Semelles',
      h1: 'Semelle de béton',
      intro:
        'Calculez le volume pour des semelles, bases ou appuis en béton et préparez une demande claire pour votre chantier.',
      subject: 'semelle de béton',
      aside:
        'Les semelles exigent des dimensions précises et une bonne compréhension des plans ou exigences du projet.',
    },
    en: {
      eyebrow: 'Footings',
      h1: 'Concrete footings',
      intro:
        'Calculate volume for concrete footings, bases or supports and prepare a clear request for your site.',
      subject: 'concrete footing',
      aside:
        'Footings require precise dimensions and a clear understanding of project drawings or requirements.',
    },
  },
  {
    key: 'sidewalkConcrete',
    slugs: { fr: 'trottoir-beton', en: 'concrete-sidewalk' },
    schemaType: 'project',
    group: 'project',
    fr: {
      eyebrow: 'Trottoir',
      h1: 'Trottoir de béton',
      intro:
        'Estimez le volume pour un trottoir, une allée ou un petit chemin en béton et préparez les détails de livraison.',
      subject: 'trottoir de béton',
      aside:
        'Les petits projets linéaires doivent préciser la longueur, la largeur, l’épaisseur et l’accès le long du tracé.',
    },
    en: {
      eyebrow: 'Sidewalk',
      h1: 'Concrete sidewalk',
      intro:
        'Estimate volume for a sidewalk, walkway or small concrete path and prepare the delivery details.',
      subject: 'concrete sidewalk',
      aside:
        'Linear projects should specify length, width, thickness and access along the pour path.',
    },
  },
  {
    key: 'commercialConcrete',
    slugs: { fr: 'beton-commercial', en: 'commercial-concrete' },
    schemaType: 'service',
    group: 'service',
    popular: true,
    fr: {
      eyebrow: 'Commercial',
      h1: 'Béton commercial',
      intro:
        'Envoyez une demande pour un projet commercial léger avec volume, horaire, accès, résistance et contraintes de chantier.',
      subject: 'béton commercial',
      aside:
        'Les demandes commerciales gagnent à inclure un contact chantier, une fenêtre horaire et les exigences de coordination.',
    },
    en: {
      eyebrow: 'Commercial',
      h1: 'Commercial concrete',
      intro:
        'Send a request for light commercial concrete work with volume, schedule, access, strength and job-site constraints.',
      subject: 'commercial concrete',
      aside:
        'Commercial requests benefit from a site contact, time window and coordination requirements.',
    },
  },
  {
    key: 'concretePriceM3',
    slugs: { fr: 'prix-beton-m3', en: 'concrete-price-per-cubic-metre' },
    schemaType: 'service',
    group: 'price',
    fr: {
      eyebrow: 'Prix',
      h1: 'Prix du béton au m³',
      intro:
        'Comprenez les facteurs qui influencent le prix du béton au mètre cube sans vous fier à un chiffre unique hors contexte.',
      subject: 'prix du béton au m³',
      aside:
        'Le prix dépend du volume, du secteur, de la date, du mélange, de l’accès et des besoins comme le pompage.',
    },
    en: {
      eyebrow: 'Pricing',
      h1: 'Concrete price per cubic metre',
      intro:
        'Understand what affects concrete price per cubic metre without relying on a single number out of context.',
      subject: 'concrete price per cubic metre',
      aside:
        'Price depends on volume, area, date, mix, access and needs such as pumping.',
    },
  },
  {
    key: 'concreteDeliveryCost',
    slugs: { fr: 'prix-livraison-beton', en: 'concrete-delivery-cost' },
    schemaType: 'service',
    group: 'price',
    fr: {
      eyebrow: 'Prix',
      h1: 'Prix de livraison du béton',
      intro:
        'Voyez les éléments qui influencent le coût d’une livraison de béton: volume, distance, horaire, accès et contraintes de chantier.',
      subject: 'prix de livraison du béton',
      aside:
        'Une demande complète permet de vérifier une option réaliste plutôt qu’une estimation trop générale.',
    },
    en: {
      eyebrow: 'Pricing',
      h1: 'Concrete delivery cost',
      intro:
        'See what affects concrete delivery cost: volume, distance, schedule, access and job-site constraints.',
      subject: 'concrete delivery cost',
      aside:
        'A complete request makes it possible to check a realistic option instead of a generic estimate.',
    },
  },
  {
    key: 'concreteSlabCost',
    slugs: { fr: 'prix-dalle-beton', en: 'concrete-slab-cost' },
    schemaType: 'project',
    group: 'price',
    fr: {
      eyebrow: 'Prix',
      h1: 'Prix d’une dalle de béton',
      intro:
        'Comprenez les coûts associés à une dalle: volume en m³, épaisseur, préparation du sol, armature, accès et finition.',
      subject: 'prix de dalle de béton',
      aside:
        'Commencez par calculer le volume de béton, puis ajoutez les détails de préparation et d’accès dans la demande.',
    },
    en: {
      eyebrow: 'Pricing',
      h1: 'Concrete slab cost',
      intro:
        'Understand slab cost drivers: m³ volume, thickness, base preparation, reinforcement, access and finishing.',
      subject: 'concrete slab cost',
      aside:
        'Start by calculating concrete volume, then add preparation and access details to the request.',
    },
  },
  {
    key: 'garageSlabCost',
    slugs: { fr: 'prix-beton-garage', en: 'garage-slab-cost' },
    schemaType: 'project',
    group: 'price',
    fr: {
      eyebrow: 'Prix',
      h1: 'Prix du béton pour garage',
      intro:
        'Évaluez les facteurs de coût d’une dalle de garage: dimensions, épaisseur, marge, résistance, accès et calendrier.',
      subject: 'prix du béton pour garage',
      aside:
        'Une dalle de garage peut demander plus de préparation qu’une petite dalle extérieure; les détails changent beaucoup le prix final.',
    },
    en: {
      eyebrow: 'Pricing',
      h1: 'Garage slab cost',
      intro:
        'Review the cost factors for a garage slab: dimensions, thickness, allowance, strength, access and schedule.',
      subject: 'garage slab cost',
      aside:
        'A garage slab may require more preparation than a small outdoor pad; details can change the final price significantly.',
    },
  },
  {
    key: 'concretePumpCost',
    slugs: { fr: 'prix-pompe-beton', en: 'concrete-pump-cost' },
    schemaType: 'service',
    group: 'price',
    fr: {
      eyebrow: 'Prix',
      h1: 'Prix d’une pompe à béton',
      intro:
        'Comprenez quand le pompage devient pertinent et quels facteurs influencent le coût: distance, hauteur, accès, volume et durée.',
      subject: 'prix de pompe à béton',
      aside:
        'Décrivez la distance entre le camion et la coulée pour aider à évaluer si une pompe est nécessaire.',
    },
    en: {
      eyebrow: 'Pricing',
      h1: 'Concrete pump cost',
      intro:
        'Understand when pumping is useful and what affects cost: distance, height, access, volume and duration.',
      subject: 'concrete pump cost',
      aside:
        'Describe the distance between the truck and pour area to help assess whether a pump is needed.',
    },
  },
  {
    key: 'mobileConcrete',
    slugs: { fr: 'beton-mobile', en: 'mobile-concrete' },
    schemaType: 'service',
    group: 'service',
    popular: true,
    fr: {
      eyebrow: 'Service',
      h1: 'Béton mobile',
      intro:
        'Le béton mobile peut être utile pour des petits volumes, des coulées échelonnées ou des projets où la quantité exacte est difficile à prévoir.',
      subject: 'béton mobile',
      aside:
        'BétonDispo peut orienter votre demande vers une option adaptée selon le volume, la date et l’accès.',
    },
    en: {
      eyebrow: 'Service',
      h1: 'Mobile concrete',
      intro:
        'Mobile concrete can be useful for small volumes, staged pours or projects where the exact quantity is hard to predict.',
      subject: 'mobile concrete',
      aside:
        'BétonDispo can route your request toward a suitable option based on volume, date and access.',
    },
  },
  {
    key: 'concretePumping',
    slugs: { fr: 'pompage-beton', en: 'concrete-pumping' },
    schemaType: 'service',
    group: 'service',
    popular: true,
    fr: {
      eyebrow: 'Service',
      h1: 'Pompage de béton',
      intro:
        'Le pompage de béton aide lorsque le camion ne peut pas atteindre la zone de coulée: cour arrière, sous-sol, hauteur ou accès limité.',
      subject: 'pompage de béton',
      aside:
        'Indiquez si la coulée est loin de la rue, en hauteur, dans une cour arrière ou dans un espace difficile d’accès.',
    },
    en: {
      eyebrow: 'Service',
      h1: 'Concrete pumping',
      intro:
        'Concrete pumping helps when the truck cannot reach the pour area: backyard, basement, height or limited access.',
      subject: 'concrete pumping',
      aside:
        'Indicate whether the pour is far from the street, elevated, in a backyard or in a hard-to-access space.',
    },
  },
  {
    key: 'readyMixVsBags',
    slugs: { fr: 'beton-pret-emploi-vs-beton-en-sac', en: 'ready-mix-vs-bagged-concrete' },
    schemaType: 'service',
    group: 'comparison',
    fr: {
      eyebrow: 'Comparaison',
      h1: 'Béton prêt à l’emploi ou béton en sac?',
      intro:
        'Comparez les deux options selon le volume, le temps, la qualité, la manutention et le type de projet.',
      subject: 'béton prêt à l’emploi vs béton en sac',
      aside:
        'Plus le volume augmente, plus il devient important de comparer le temps, la main-d’œuvre et la constance du mélange.',
    },
    en: {
      eyebrow: 'Comparison',
      h1: 'Ready-mix vs bagged concrete',
      intro:
        'Compare both options by volume, time, quality, handling and project type.',
      subject: 'ready-mix vs bagged concrete',
      aside:
        'As volume increases, it becomes more important to compare time, labour and mix consistency.',
    },
  },
  {
    key: 'pumpVsWheelbarrow',
    slugs: { fr: 'pompe-beton-ou-brouette', en: 'concrete-pump-vs-wheelbarrow' },
    schemaType: 'service',
    group: 'comparison',
    fr: {
      eyebrow: 'Comparaison',
      h1: 'Pompe à béton ou brouette?',
      intro:
        'Comparez le pompage et le transport à la brouette selon l’accès, la distance, le volume, la main-d’œuvre et la vitesse de coulée.',
      subject: 'pompe à béton ou brouette',
      aside:
        'La distance entre le camion et la zone de coulée change beaucoup l’effort, le temps et le risque de retard pendant la mise en place.',
    },
    en: {
      eyebrow: 'Comparison',
      h1: 'Concrete pump vs wheelbarrow',
      intro:
        'Compare pumping and wheelbarrow placement by access, distance, volume, labour and pour speed.',
      subject: 'concrete pump vs wheelbarrow',
      aside:
        'Distance between the truck and pour area can greatly affect labour, timing and the risk of delays during placement.',
    },
  },
  {
    key: 'fiberVsRebar',
    slugs: { fr: 'fibre-ou-armature-dalle-beton', en: 'fiber-vs-rebar-concrete-slab' },
    schemaType: 'project',
    group: 'comparison',
    fr: {
      eyebrow: 'Comparaison',
      h1: 'Fibre ou armature pour une dalle de béton?',
      intro:
        'Comprenez les différences entre fibre, treillis et armature pour discuter plus clairement des besoins de votre dalle.',
      subject: 'fibre ou armature pour dalle de béton',
      aside:
        'Le choix dépend de l’usage, de l’épaisseur, du sol, de la charge prévue et des exigences du professionnel responsable.',
    },
    en: {
      eyebrow: 'Comparison',
      h1: 'Fiber vs rebar for a concrete slab',
      intro:
        'Understand the differences between fiber, mesh and rebar so you can discuss slab requirements more clearly.',
      subject: 'fiber vs rebar for a concrete slab',
      aside:
        'The choice depends on use, thickness, soil, expected load and the requirements of the responsible professional.',
    },
  },
  {
    key: 'slabThickness',
    slugs: { fr: 'dalle-10-cm-ou-15-cm', en: '4-inch-vs-6-inch-concrete-slab' },
    schemaType: 'project',
    group: 'comparison',
    fr: {
      eyebrow: 'Comparaison',
      h1: 'Dalle de 10 cm ou 15 cm?',
      intro:
        'Comparez les épaisseurs courantes de dalle selon le type de projet, l’usage, la charge et le volume de béton requis.',
      subject: 'dalle 10 cm ou 15 cm',
      aside:
        'Passer de 10 cm à 15 cm augmente fortement le volume; calculez les deux scénarios avant de demander une soumission.',
    },
    en: {
      eyebrow: 'Comparison',
      h1: '4-inch vs 6-inch concrete slab',
      intro:
        'Compare common slab thicknesses by project type, use, expected load and required concrete volume.',
      subject: '4-inch vs 6-inch concrete slab',
      aside:
        'Going from 4 inches to 6 inches significantly increases volume; calculate both scenarios before requesting a quote.',
    },
  },
  {
    key: 'concreteVsAsphalt',
    slugs: { fr: 'beton-vs-asphalte', en: 'concrete-vs-asphalt' },
    schemaType: 'project',
    group: 'comparison',
    fr: {
      eyebrow: 'Comparaison',
      h1: 'Béton ou asphalte?',
      intro:
        'Comparez béton et asphalte pour une entrée, une allée ou une surface extérieure selon l’usage, l’entretien et l’apparence.',
      subject: 'béton vs asphalte',
      aside:
        'Pour un projet en béton, commencez par estimer le volume en m³ et préciser l’usage prévu de la surface.',
    },
    en: {
      eyebrow: 'Comparison',
      h1: 'Concrete vs asphalt',
      intro:
        'Compare concrete and asphalt for a driveway, walkway or exterior surface by use, maintenance and appearance.',
      subject: 'concrete vs asphalt',
      aside:
        'For a concrete project, start by estimating cubic metre volume and describing the intended surface use.',
    },
  },
];

function pageCopy(seed: LandingSeed, locale: Locale): SeoLandingCopy {
  const local = seed[locale];
  if (seed.group === 'price') return priceCopy(seed, locale);
  if (seed.group === 'service') return serviceCopy(seed, locale);
  if (seed.group === 'comparison') return comparisonCopy(seed, locale);

  return {
    eyebrow: local.eyebrow,
    h1: local.h1,
    intro: local.intro,
    primaryCta: locale === 'fr' ? 'Calculer le volume' : 'Calculate volume',
    secondaryCta: locale === 'fr' ? 'Obtenir une soumission' : 'Request a quote',
    breadcrumbGroup: locale === 'fr' ? 'Guides projet' : 'Project guides',
    asideTitle: locale === 'fr' ? `Préparer votre ${local.subject}` : `Prepare your ${local.subject}`,
    asideBody: local.aside,
    relatedTitle: locale === 'fr' ? 'Guides connexes' : 'Related guides',
    sections:
      locale === 'fr'
        ? [
            {
              title: `Calculer le volume pour ${local.subject}`,
              body: 'Commencez par les dimensions utiles: longueur, largeur, épaisseur ou hauteur selon la forme. Convertissez les mesures dans la même unité, puis calculez le volume en mètres cubes.',
            },
            {
              title: 'Prévoir une marge réaliste',
              body: 'Une marge de 5 à 10 % est souvent utilisée pour couvrir les variations de profondeur, les pertes et les irrégularités du chantier. Ajustez-la selon le niveau d’incertitude.',
            },
            {
              title: 'Décrire l’accès au chantier',
              body: 'Précisez si le camion peut approcher la zone de coulée, s’il y a une cour arrière, des fils aériens, une pente, du stationnement limité ou une distance importante à franchir.',
            },
            {
              title: 'Préparer la demande de soumission',
              body: 'Ajoutez la ville, l’adresse, la date souhaitée, le type de projet, la quantité estimée et toute contrainte. Une demande précise permet de vérifier plus rapidement une option adaptée.',
            },
          ]
        : [
            {
              title: `Calculate volume for a ${local.subject}`,
              body: 'Start with useful dimensions: length, width, thickness or height depending on the shape. Convert measurements to the same unit, then calculate volume in cubic metres.',
            },
            {
              title: 'Allow a realistic margin',
              body: 'A 5 to 10% allowance is often used for depth variation, waste and site irregularities. Adjust it based on uncertainty.',
            },
            {
              title: 'Describe job-site access',
              body: 'Specify whether the truck can approach the pour area, whether there is backyard access, overhead wires, slope, limited parking or significant distance to cover.',
            },
            {
              title: 'Prepare the quote request',
              body: 'Add the city, address, desired date, project type, estimated quantity and constraints. A precise request makes it easier to check a suitable option quickly.',
            },
          ],
  };
}

function priceCopy(seed: LandingSeed, locale: Locale): SeoLandingCopy {
  const local = seed[locale];
  return {
    eyebrow: local.eyebrow,
    h1: local.h1,
    intro: local.intro,
    primaryCta: locale === 'fr' ? 'Calculer le volume' : 'Calculate volume',
    secondaryCta: locale === 'fr' ? 'Demander un prix' : 'Request pricing',
    breadcrumbGroup: locale === 'fr' ? 'Guides de prix' : 'Pricing guides',
    asideTitle: locale === 'fr' ? 'Pourquoi le prix varie' : 'Why pricing varies',
    asideBody: local.aside,
    relatedTitle: locale === 'fr' ? 'Guides connexes' : 'Related guides',
    sections:
      locale === 'fr'
        ? [
            {
              title: 'Les principaux facteurs de coût',
              body: 'Le prix dépend du volume, du type de mélange, du secteur, de l’horaire, de l’accès au chantier, du besoin de pompage et des exigences particulières du projet.',
            },
            {
              title: 'Pourquoi éviter un prix fixe générique?',
              body: 'Deux projets avec le même volume peuvent coûter différemment si l’un nécessite une pompe, un accès complexe, une courte fenêtre horaire ou une livraison dans un secteur plus éloigné.',
            },
            {
              title: 'Commencer par le volume',
              body: 'Le volume en m³ reste la base de la discussion. Utilisez le calculateur pour obtenir une quantité estimée, puis ajoutez une marge selon les conditions du chantier.',
            },
            {
              title: 'Obtenir une soumission utile',
              body: 'Envoyez les dimensions, la date souhaitée, l’adresse, l’accès et les notes de chantier. Ces détails permettent d’obtenir une réponse plus pertinente qu’une simple moyenne.',
            },
          ]
        : [
            {
              title: 'Main cost drivers',
              body: 'Price depends on volume, mix type, area, schedule, site access, pumping needs and project-specific requirements.',
            },
            {
              title: 'Why avoid a generic fixed price?',
              body: 'Two projects with the same volume can cost differently if one requires pumping, complex access, a narrow time window or delivery to a farther area.',
            },
            {
              title: 'Start with volume',
              body: 'Cubic metre volume is the base of the discussion. Use the calculator to estimate quantity, then add an allowance based on site conditions.',
            },
            {
              title: 'Get a useful quote',
              body: 'Send dimensions, desired date, address, access and site notes. These details lead to a more relevant response than a broad average.',
            },
          ],
  };
}

function serviceCopy(seed: LandingSeed, locale: Locale): SeoLandingCopy {
  const local = seed[locale];
  return {
    eyebrow: local.eyebrow,
    h1: local.h1,
    intro: local.intro,
    primaryCta: locale === 'fr' ? 'Obtenir une soumission' : 'Request a quote',
    secondaryCta: locale === 'fr' ? 'Calculer mon volume' : 'Calculate my volume',
    breadcrumbGroup: locale === 'fr' ? 'Services' : 'Services',
    asideTitle: locale === 'fr' ? 'Une seule demande' : 'One request',
    asideBody: local.aside,
    relatedTitle: locale === 'fr' ? 'Services connexes' : 'Related services',
    sections:
      locale === 'fr'
        ? [
            {
              title: `Quand utiliser ${local.subject}?`,
              body: 'Cette option devient pertinente lorsque le volume, l’accès, la distance, l’horaire ou le type de chantier rendent une demande standard moins évidente.',
            },
            {
              title: 'Informations à fournir',
              body: 'Indiquez la ville, l’adresse, la quantité estimée, la date souhaitée, la résistance si connue, l’accès au chantier et les contraintes comme la cour arrière ou la distance de coulée.',
            },
            {
              title: 'Volume et planification',
              body: 'Même une estimation approximative en m³ aide à orienter la demande. Si le volume est incertain, fournissez les dimensions ou une description claire du projet.',
            },
            {
              title: 'Rôle de BétonDispo',
              body: 'BétonDispo ne prétend pas opérer tous les équipements. Nous centralisons votre demande et vérifions les options adaptées avec notre réseau.',
            },
          ]
        : [
            {
              title: `When to use ${local.subject}`,
              body: 'This option becomes relevant when volume, access, distance, schedule or site type makes a standard request less straightforward.',
            },
            {
              title: 'Information to provide',
              body: 'Include city, address, estimated quantity, desired date, strength if known, site access and constraints such as backyard access or pour distance.',
            },
            {
              title: 'Volume and planning',
              body: 'Even a rough m³ estimate helps route the request. If volume is uncertain, provide dimensions or a clear project description.',
            },
            {
              title: 'BétonDispo’s role',
              body: 'BétonDispo does not imply ownership of every piece of equipment. We centralize your request and check suitable options with our network.',
            },
          ],
  };
}

function comparisonCopy(seed: LandingSeed, locale: Locale): SeoLandingCopy {
  const local = seed[locale];
  return {
    eyebrow: local.eyebrow,
    h1: local.h1,
    intro: local.intro,
    primaryCta: locale === 'fr' ? 'Calculer mon volume' : 'Calculate my volume',
    secondaryCta: locale === 'fr' ? 'Obtenir une soumission' : 'Request a quote',
    breadcrumbGroup: locale === 'fr' ? 'Guides de décision' : 'Decision guides',
    asideTitle: locale === 'fr' ? 'Décider avec le volume' : 'Decide with volume',
    asideBody: local.aside,
    relatedTitle: locale === 'fr' ? 'Guides connexes' : 'Related guides',
    sections:
      locale === 'fr'
        ? [
            {
              title: 'Comparer selon la quantité',
              body: 'Le volume change rapidement l’équation. Pour un très petit projet, le béton en sac peut être pratique; pour plusieurs mètres cubes, le béton livré devient souvent plus réaliste.',
            },
            {
              title: 'Comparer selon la main-d’œuvre',
              body: 'Le mélange manuel demande du temps, de l’espace, de l’eau, de la manutention et une cadence constante. Une livraison peut réduire l’effort, mais demande une meilleure préparation.',
            },
            {
              title: 'Comparer selon la qualité',
              body: 'La constance du mélange, le temps de mise en place et la finition influencent le résultat. Pour une dalle ou un ouvrage durable, évitez de choisir uniquement selon le prix initial.',
            },
            {
              title: 'Prochaine étape',
              body: 'Calculez le volume, vérifiez l’accès et demandez une soumission si la quantité ou la logistique dépasse ce que vous voulez gérer manuellement.',
            },
          ]
        : [
            {
              title: 'Compare by quantity',
              body: 'Volume changes the equation quickly. For a very small project, bags can be practical; for several cubic metres, delivered concrete often becomes more realistic.',
            },
            {
              title: 'Compare by labour',
              body: 'Manual mixing takes time, space, water, handling and a steady pace. Delivery can reduce labour, but requires better preparation.',
            },
            {
              title: 'Compare by quality',
              body: 'Mix consistency, placement time and finishing affect the result. For a slab or durable work, avoid deciding only on initial price.',
            },
            {
              title: 'Next step',
              body: 'Calculate volume, check access and request a quote if the quantity or logistics exceed what you want to manage manually.',
            },
          ],
  };
}

export const seoLandingPages = Object.fromEntries(
  seeds.map((seed) => [
    seed.key,
    {
      key: seed.key,
      routeKey: seed.routeKey,
      slugs: seed.slugs,
      schemaType: seed.schemaType,
      popular: seed.popular,
      copy: {
        fr: pageCopy(seed, 'fr'),
        en: pageCopy(seed, 'en'),
      },
    },
  ]),
) as Record<SeoLandingKey, SeoLandingPage>;

export const seoLandingKeys = seeds.map((seed) => seed.key) as SeoLandingKey[];
export const dynamicSeoLandingKeys = seoLandingKeys.filter(
  (key) => !seoLandingPages[key].routeKey,
);

export function seoLandingPath(key: SeoLandingKey, locale: Locale): string {
  const page = seoLandingPages[key];
  return page.routeKey ? pathFor(page.routeKey, locale) : `/${locale}/${page.slugs[locale]}`;
}

export function seoLandingAlternates(key: SeoLandingKey): Record<string, string> {
  return {
    [localeTags.fr]: absoluteUrl(seoLandingPath(key, 'fr')),
    [localeTags.en]: absoluteUrl(seoLandingPath(key, 'en')),
    'x-default': absoluteUrl(seoLandingPath(key, defaultLocale)),
  };
}

export function seoLandingKeyForSlug(slug: string, locale: Locale): SeoLandingKey | null {
  return seoLandingKeys.find((key) => seoLandingPages[key].slugs[locale] === slug) ?? null;
}

export function buildSeoLandingMetadata(locale: Locale, key: SeoLandingKey): Metadata {
  const page = seoLandingPages[key];
  const copy = page.copy[locale];
  const canonical = absoluteUrl(seoLandingPath(key, locale));
  const alternateLocale = locale === 'fr' ? 'en_CA' : 'fr_CA';
  const ogLocale = locale === 'fr' ? 'fr_CA' : 'en_CA';
  const socialImage = {
    url: absoluteUrl(`/${locale}/opengraph-image`),
    width: 1200,
    height: 630,
    alt: 'BétonDispo',
  };

  return {
    title: `${copy.h1} | BétonDispo`,
    description: copy.intro,
    alternates: { canonical, languages: seoLandingAlternates(key) },
    openGraph: {
      type: 'website',
      siteName: 'BétonDispo',
      title: copy.h1,
      description: copy.intro,
      url: canonical,
      locale: ogLocale,
      alternateLocale,
      images: [socialImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: copy.h1,
      description: copy.intro,
      images: [socialImage.url],
    },
  };
}

export function relatedSeoLinks(locale: Locale, current?: SeoLandingKey) {
  const priority: SeoLandingKey[] = [
    'concretePriceM3',
    'concreteSlabCost',
    'garageConcrete',
    'foundationConcrete',
    'mobileConcrete',
    'concretePumping',
    'concreteSlab',
    'concreteDelivery',
  ];

  return [
    ...priority
      .filter((key) => key !== current)
      .slice(0, 5)
      .map((key) => ({
        href: seoLandingPath(key, locale),
        label: seoLandingPages[key].copy[locale].h1,
      })),
    { href: pathFor('calculator', locale), label: getCalculatorLabel(locale) },
    { href: pathFor('quote', locale), label: locale === 'fr' ? 'Soumission' : 'Quote' },
  ];
}

function getCalculatorLabel(locale: Locale): string {
  return locale === 'fr' ? 'Calculateur de béton' : 'Concrete Calculator';
}
