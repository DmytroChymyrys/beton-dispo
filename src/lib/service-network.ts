import type { Locale } from '@/i18n/config';
import { pathFor, type RouteKey } from '@/i18n/routes';
import {
  seoLandingPages,
  seoLandingPath,
  type SeoLandingKey,
} from '@/lib/seo-landing-pages';

export type ServiceCategory =
  | 'calculator'
  | 'delivery'
  | 'residential'
  | 'commercial'
  | 'pricing'
  | 'decision'
  | 'support';

export type ServiceNetworkKey = SeoLandingKey | 'concretePatio' | 'calculator' | 'services' | 'faq';

type ServiceNetworkCopy = {
  title: string;
  description: string;
  action: string;
};

type ServiceNetworkBase = {
  key: ServiceNetworkKey;
  category: ServiceCategory;
  popular?: boolean;
  copy: Record<Locale, ServiceNetworkCopy>;
};

export type ServiceNetworkItem = ServiceNetworkBase &
  ({ routeKey: RouteKey; seoKey?: never } | { seoKey: SeoLandingKey; routeKey?: never });

const action = {
  fr: {
    guide: 'Voir le guide',
    service: 'Voir le service',
    price: 'Voir les facteurs de prix',
    compare: 'Comparer les options',
    calculate: 'Calculer le volume',
    quote: 'Obtenir une soumission',
    read: 'Lire la FAQ',
  },
  en: {
    guide: 'View guide',
    service: 'View service',
    price: 'View price factors',
    compare: 'Compare options',
    calculate: 'Calculate volume',
    quote: 'Request a quote',
    read: 'Read FAQ',
  },
} as const;

export const serviceNetwork: ServiceNetworkItem[] = [
  seoService('concreteSlab', 'residential', true, {
    fr: 'Calculer le volume et préparer une demande pour une dalle résidentielle.',
    en: 'Calculate volume and prepare a request for a residential slab.',
  }),
  {
    key: 'concretePatio',
    routeKey: 'concretePatio',
    category: 'residential',
    popular: true,
    copy: {
      fr: {
        title: 'Terrasse extérieure',
        description: 'Calculer le volume et obtenir une soumission pour votre patio en béton.',
        action: action.fr.service,
      },
      en: {
        title: 'Concrete patio',
        description: 'Calculate volume and request a quote for an outdoor concrete patio.',
        action: action.en.service,
      },
    },
  },
  seoService('garageConcrete', 'residential', true, {
    fr: 'Planifier une dalle de garage avec dimensions, marge et accès au chantier.',
    en: 'Plan a garage slab with dimensions, allowance and job-site access.',
  }),
  seoService('foundationConcrete', 'residential', true, {
    fr: 'Préparer une demande pour semelles, murs et travaux de fondation.',
    en: 'Prepare a request for footings, walls and foundation work.',
  }),
  seoService('drivewayConcrete', 'residential', false, {
    fr: 'Estimer une entrée de cour en béton avec pente, drainage et accès.',
    en: 'Estimate a concrete driveway with slope, drainage and access details.',
  }),
  seoService('poolConcrete', 'residential', false, {
    fr: 'Préparer un projet de contour de piscine ou dalle technique.',
    en: 'Prepare a pool deck or equipment pad project.',
  }),
  seoService('basementConcrete', 'residential', false, {
    fr: 'Planifier une dalle de sous-sol avec accès intérieur et besoin possible de pompage.',
    en: 'Plan a basement slab with interior access and possible pumping needs.',
  }),
  seoService('concreteFootings', 'residential', false, {
    fr: 'Calculer des semelles, bases ou appuis en béton.',
    en: 'Calculate concrete footings, bases or supports.',
  }),
  seoService('sidewalkConcrete', 'residential', false, {
    fr: 'Estimer un trottoir, une allée ou un petit chemin en béton.',
    en: 'Estimate a sidewalk, walkway or small concrete path.',
  }),
  seoService('concreteDelivery', 'delivery', true, {
    fr: 'Préparer une demande de livraison avec volume, date et accès au chantier.',
    en: 'Prepare a delivery request with volume, date and site access.',
  }),
  seoService('mobileConcrete', 'delivery', true, {
    fr: 'Vérifier une option pour petits volumes, coulées échelonnées ou quantité incertaine.',
    en: 'Check an option for small volumes, staged pours or uncertain quantities.',
  }),
  seoService('concretePumping', 'delivery', true, {
    fr: 'Évaluer le pompage lorsque le camion ne peut pas atteindre la zone de coulée.',
    en: 'Assess pumping when the truck cannot reach the pour area.',
  }),
  seoService('commercialConcrete', 'commercial', true, {
    fr: 'Envoyer une demande pour béton commercial léger avec horaire et contraintes.',
    en: 'Send a request for light commercial concrete with schedule and constraints.',
  }),
  seoService('concretePriceM3', 'pricing', true, {
    fr: 'Comprendre les facteurs qui influencent le prix du béton au m³.',
    en: 'Understand what affects concrete price per cubic metre.',
  }),
  seoService('concreteDeliveryCost', 'pricing', false, {
    fr: 'Voir les facteurs de coût d’une livraison de béton.',
    en: 'See the cost factors for concrete delivery.',
  }),
  seoService('concreteSlabCost', 'pricing', true, {
    fr: 'Comprendre les coûts associés à une dalle de béton.',
    en: 'Understand the cost drivers for a concrete slab.',
  }),
  seoService('garageSlabCost', 'pricing', false, {
    fr: 'Évaluer les facteurs de prix d’une dalle de garage.',
    en: 'Review the price factors for a garage slab.',
  }),
  seoService('concretePumpCost', 'pricing', false, {
    fr: 'Comprendre les facteurs qui influencent le prix du pompage.',
    en: 'Understand what affects concrete pumping cost.',
  }),
  seoService('readyMixVsBags', 'decision', false, {
    fr: 'Comparer béton prêt à l’emploi et béton en sac selon le projet.',
    en: 'Compare ready-mix and bagged concrete by project.',
  }),
  seoService('pumpVsWheelbarrow', 'decision', false, {
    fr: 'Comparer pompe à béton et brouette selon l’accès et le volume.',
    en: 'Compare concrete pumping and wheelbarrow placement by access and volume.',
  }),
  seoService('fiberVsRebar', 'decision', false, {
    fr: 'Comparer fibre, treillis et armature pour une dalle.',
    en: 'Compare fiber, mesh and rebar for a slab.',
  }),
  seoService('slabThickness', 'decision', false, {
    fr: 'Comparer une dalle de 10 cm et une dalle de 15 cm.',
    en: 'Compare a 4-inch and 6-inch concrete slab.',
  }),
  seoService('concreteVsAsphalt', 'decision', false, {
    fr: 'Comparer béton et asphalte pour une surface extérieure.',
    en: 'Compare concrete and asphalt for an exterior surface.',
  }),
  {
    key: 'calculator',
    routeKey: 'calculator',
    category: 'calculator',
    popular: true,
    copy: {
      fr: {
        title: 'Calculateur de béton',
        description: 'Estimer une quantité en m³ avant de demander une soumission.',
        action: action.fr.calculate,
      },
      en: {
        title: 'Concrete calculator',
        description: 'Estimate a cubic metre quantity before requesting a quote.',
        action: action.en.calculate,
      },
    },
  },
  {
    key: 'services',
    routeKey: 'services',
    category: 'support',
    popular: false,
    copy: {
      fr: {
        title: 'Services de béton',
        description: 'Comparer livraison, béton mobile et pompage selon les besoins du chantier.',
        action: action.fr.service,
      },
      en: {
        title: 'Concrete services',
        description: 'Compare delivery, mobile concrete and pumping by site requirements.',
        action: action.en.service,
      },
    },
  },
  {
    key: 'faq',
    routeKey: 'faq',
    category: 'support',
    popular: true,
    copy: {
      fr: {
        title: 'FAQ',
        description: 'Réponses sur les volumes, la livraison, le pompage et les demandes.',
        action: action.fr.read,
      },
      en: {
        title: 'FAQ',
        description: 'Answers about volumes, delivery, pumping and quote requests.',
        action: action.en.read,
      },
    },
  },
];

function seoService(
  key: SeoLandingKey,
  category: ServiceCategory,
  popular: boolean,
  description: Record<Locale, string>,
): ServiceNetworkItem {
  const page = seoLandingPages[key];
  const actionKind =
    category === 'pricing'
      ? 'price'
      : category === 'decision'
        ? 'compare'
        : page.schemaType === 'service'
          ? 'service'
          : 'guide';

  return {
    key,
    seoKey: key,
    category,
    popular,
    copy: {
      fr: {
        title: page.copy.fr.h1,
        description: description.fr,
        action: action.fr[actionKind],
      },
      en: {
        title: page.copy.en.h1,
        description: description.en,
        action: action.en[actionKind],
      },
    },
  };
}

export function serviceHref(item: ServiceNetworkItem, locale: Locale): string {
  return item.seoKey ? seoLandingPath(item.seoKey, locale) : pathFor(item.routeKey, locale);
}

export function popularServices(locale: Locale): ServiceNetworkItem[] {
  return serviceNetwork.filter((item) => item.popular && item.copy[locale]);
}

export function relatedServices({
  locale,
  current,
  limit = 6,
}: {
  locale: Locale;
  current?: ServiceNetworkKey;
  limit?: number;
}): ServiceNetworkItem[] {
  const currentItem = serviceNetwork.find((item) => item.key === current);
  const candidates = serviceNetwork.filter((item) => item.key !== current && item.copy[locale]);

  return candidates
    .sort((a, b) => {
      const aScore = currentItem && a.category === currentItem.category ? 0 : 1;
      const bScore = currentItem && b.category === currentItem.category ? 0 : 1;
      if (aScore !== bScore) return aScore - bScore;
      return Number(Boolean(b.popular)) - Number(Boolean(a.popular));
    })
    .slice(0, limit);
}

export function serviceNeighbors(
  current: ServiceNetworkKey,
  locale: Locale,
): { previous: ServiceNetworkItem; next: ServiceNetworkItem } | null {
  const items = serviceNetwork.filter((item) => item.copy[locale]);
  const index = items.findIndex((item) => item.key === current);
  if (index < 0 || items.length < 2) return null;

  return {
    previous: items[(index - 1 + items.length) % items.length]!,
    next: items[(index + 1) % items.length]!,
  };
}

export function calculatorSuggestions(): ServiceNetworkItem[] {
  return serviceNetwork.filter((item) =>
    ['concretePatio', 'concreteSlab', 'garageConcrete', 'foundationConcrete'].includes(item.key),
  );
}
