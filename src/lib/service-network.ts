import type { Locale } from '@/i18n/config';
import { pathFor, type RouteKey } from '@/i18n/routes';

export type ServiceCategory = 'calculator' | 'delivery' | 'residential' | 'commercial' | 'support';

export type ServiceNetworkKey =
  | 'concreteSlab'
  | 'concretePatio'
  | 'concreteDelivery'
  | 'calculator'
  | 'services'
  | 'faq';

type ServiceNetworkCopy = {
  title: string;
  description: string;
  action: string;
};

export type ServiceNetworkItem = {
  key: ServiceNetworkKey;
  routeKey: RouteKey;
  category: ServiceCategory;
  popular?: boolean;
  copy: Record<Locale, ServiceNetworkCopy>;
};

export const serviceNetwork: ServiceNetworkItem[] = [
  {
    key: 'concreteSlab',
    routeKey: 'concreteSlab',
    category: 'residential',
    popular: true,
    copy: {
      fr: {
        title: 'Dalle de béton',
        description: 'Calculer le volume et préparer une demande pour une dalle résidentielle.',
        action: 'Voir le guide',
      },
      en: {
        title: 'Concrete slab',
        description: 'Calculate volume and prepare a request for a residential slab.',
        action: 'View guide',
      },
    },
  },
  {
    key: 'concretePatio',
    routeKey: 'concretePatio',
    category: 'residential',
    popular: true,
    copy: {
      fr: {
        title: 'Terrasse extérieure',
        description: 'Calculer le volume et obtenir une soumission pour votre patio en béton.',
        action: 'Voir le service',
      },
      en: {
        title: 'Concrete patio',
        description: 'Calculate volume and request a quote for an outdoor concrete patio.',
        action: 'View service',
      },
    },
  },
  {
    key: 'concreteDelivery',
    routeKey: 'concreteDelivery',
    category: 'delivery',
    popular: true,
    copy: {
      fr: {
        title: 'Livraison de béton',
        description: 'Préparer une demande de livraison avec volume, date et accès au chantier.',
        action: 'Voir le service',
      },
      en: {
        title: 'Concrete delivery',
        description: 'Prepare a delivery request with volume, date and site access.',
        action: 'View service',
      },
    },
  },
  {
    key: 'calculator',
    routeKey: 'calculator',
    category: 'calculator',
    popular: true,
    copy: {
      fr: {
        title: 'Calculateur de béton',
        description: 'Estimer une quantité en m³ avant de demander une soumission.',
        action: 'Calculer le volume',
      },
      en: {
        title: 'Concrete calculator',
        description: 'Estimate a cubic metre quantity before requesting a quote.',
        action: 'Calculate volume',
      },
    },
  },
  {
    key: 'services',
    routeKey: 'services',
    category: 'support',
    popular: true,
    copy: {
      fr: {
        title: 'Services de béton',
        description: 'Comparer livraison, béton mobile et pompage selon les besoins du chantier.',
        action: 'Voir les services',
      },
      en: {
        title: 'Concrete services',
        description: 'Compare delivery, mobile concrete and pumping by site requirements.',
        action: 'View services',
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
        action: 'Lire la FAQ',
      },
      en: {
        title: 'FAQ',
        description: 'Answers about volumes, delivery, pumping and quote requests.',
        action: 'Read FAQ',
      },
    },
  },
];

export function serviceHref(item: ServiceNetworkItem, locale: Locale): string {
  return pathFor(item.routeKey, locale);
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
      return aScore - bScore;
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
    ['concretePatio', 'concreteSlab', 'concreteDelivery'].includes(item.key),
  );
}
