import type { Metadata } from 'next';
import type { Locale } from '@/i18n/config';
import { defaultLocale, localeTags, locales, otherLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { pathFor } from '@/i18n/routes';
import { absoluteUrl } from '@/lib/site';
import { cityPath } from '@/lib/city-pages';
import { seoLandingPath } from '@/lib/seo-landing-pages';

export const stampedConcreteCitySlugs = ['longueuil', 'candiac'] as const;

export type StampedConcreteCitySlug = (typeof stampedConcreteCitySlugs)[number];

type LocalStampedCopy = {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  h1: string;
  intro: string;
  sections: { title: string; body: string }[];
  ctaTitle: string;
  ctaBody: string;
  quoteCta: string;
  calculatorCta: string;
  localConcreteCta: string;
};

type LocalStampedPage = {
  slug: StampedConcreteCitySlug;
  name: string;
  copy: Record<Locale, LocalStampedCopy>;
};

export const stampedConcretePages: Record<StampedConcreteCitySlug, LocalStampedPage> = {
  longueuil: {
    slug: 'longueuil',
    name: 'Longueuil',
    copy: {
      fr: {
        metaTitle: 'Béton estampé à Longueuil | BétonDispo',
        metaDescription:
          'Besoin de béton pour un projet de béton estampé à Longueuil? Estimez la quantité en m³ et vérifiez les options de livraison disponibles.',
        eyebrow: 'Béton décoratif à Longueuil',
        h1: 'Béton estampé à Longueuil',
        intro:
          'Pour une terrasse, un contour de piscine, une entrée ou un trottoir en béton estampé à Longueuil, préparez votre demande avec le volume, l’accès et les contraintes de finition.',
        sections: [
          {
            title: 'Projets fréquents à Longueuil',
            body: 'Les demandes de béton estampé à Longueuil visent souvent des patios, cours arrière, entrées de cour, contours de piscine et chemins résidentiels. Le volume se calcule comme une dalle, mais la mise en place doit tenir compte du temps de finition.',
          },
          {
            title: 'Accès au chantier et logistique',
            body: 'Longueuil comprend des rues résidentielles, des secteurs plus denses et des cours arrière où l’accès peut être limité. Mentionnez le stationnement, la largeur d’entrée, les fils aériens et la distance entre le camion et la surface à couler.',
          },
          {
            title: 'Coordination avec l’entrepreneur',
            body: 'Le béton estampé demande une équipe prête à placer, texturer, colorer ou sceller selon le projet. BétonDispo aide à structurer la demande de béton et ne remplace pas l’entrepreneur responsable de la finition.',
          },
          {
            title: 'Commencer par la quantité',
            body: 'Calculez la longueur, la largeur et l’épaisseur, puis ajoutez une marge réaliste. Une quantité en m³ rend la vérification de disponibilité beaucoup plus efficace.',
          },
        ],
        ctaTitle: 'Vérifier une option à Longueuil',
        ctaBody:
          'Envoyez la ville, la date souhaitée, le volume approximatif et les contraintes d’accès pour vérifier les options disponibles.',
        quoteCta: 'Obtenir une soumission à Longueuil',
        calculatorCta: 'Estimer mon volume',
        localConcreteCta: 'Voir béton à Longueuil',
      },
      en: {
        metaTitle: 'Stamped Concrete in Longueuil | BétonDispo',
        metaDescription:
          'Need concrete for a stamped concrete project in Longueuil? Estimate cubic metres and check available delivery options.',
        eyebrow: 'Decorative concrete in Longueuil',
        h1: 'Stamped concrete in Longueuil',
        intro:
          'For a stamped concrete patio, pool deck, driveway or sidewalk in Longueuil, prepare your request with volume, access and finishing constraints.',
        sections: [
          {
            title: 'Common projects in Longueuil',
            body: 'Stamped concrete requests in Longueuil often involve patios, backyards, driveways, pool decks and residential walkways. Volume is calculated like a slab, but placement must account for finishing time.',
          },
          {
            title: 'Site access and logistics',
            body: 'Longueuil includes residential streets, denser areas and backyards where access can be limited. Mention parking, driveway width, overhead wires and distance from the truck to the pour area.',
          },
          {
            title: 'Coordination with the contractor',
            body: 'Stamped concrete requires a crew ready to place, texture, colour or seal depending on the project. BétonDispo helps structure the concrete request and does not replace the contractor responsible for finishing.',
          },
          {
            title: 'Start with quantity',
            body: 'Calculate length, width and thickness, then add a realistic allowance. A cubic metre quantity makes availability checks much more efficient.',
          },
        ],
        ctaTitle: 'Check an option in Longueuil',
        ctaBody:
          'Send city, desired date, approximate volume and access constraints to check available options.',
        quoteCta: 'Request a quote in Longueuil',
        calculatorCta: 'Estimate my volume',
        localConcreteCta: 'View concrete in Longueuil',
      },
    },
  },
  candiac: {
    slug: 'candiac',
    name: 'Candiac',
    copy: {
      fr: {
        metaTitle: 'Béton estampé à Candiac | BétonDispo',
        metaDescription:
          'Planifiez un projet de béton estampé à Candiac pour terrasse, piscine, entrée ou aménagement extérieur. Calculez le volume et demandez une soumission.',
        eyebrow: 'Béton décoratif à Candiac',
        h1: 'Béton estampé à Candiac',
        intro:
          'À Candiac, les projets de béton estampé touchent souvent les terrasses, contours de piscine, trottoirs et aménagements extérieurs. Une demande claire commence par le volume et l’accès.',
        sections: [
          {
            title: 'Terrasses, piscines et surfaces extérieures',
            body: 'Le béton estampé peut convenir aux surfaces décoratives autour d’une maison lorsque la base, le drainage, l’épaisseur et la finition sont bien planifiés avec l’entrepreneur.',
          },
          {
            title: 'Prévoir les contraintes résidentielles',
            body: 'Indiquez si le camion peut approcher la cour, si l’accès passe par une entrée latérale, si une pompe pourrait être nécessaire et si la coulée doit se faire dans une fenêtre horaire précise.',
          },
          {
            title: 'Météo et finition',
            body: 'Le béton estampé est sensible au rythme de prise, à la température et à la coordination de finition. La date de coulée doit être réaliste pour l’équipe qui réalise la surface.',
          },
          {
            title: 'Volume de béton à commander',
            body: 'Estimez la surface et l’épaisseur, puis ajoutez une marge pour les variations de profondeur. Cette quantité aide à vérifier une option de livraison adaptée.',
          },
        ],
        ctaTitle: 'Préparer une demande pour Candiac',
        ctaBody:
          'Ajoutez les dimensions, la date, l’adresse et les détails d’accès afin de vérifier les options pour votre projet.',
        quoteCta: 'Obtenir une soumission à Candiac',
        calculatorCta: 'Calculer le volume',
        localConcreteCta: 'Voir béton à Candiac',
      },
      en: {
        metaTitle: 'Stamped Concrete in Candiac | BétonDispo',
        metaDescription:
          'Plan a stamped concrete project in Candiac for a patio, pool area, driveway or exterior surface. Calculate volume and request a quote.',
        eyebrow: 'Decorative concrete in Candiac',
        h1: 'Stamped concrete in Candiac',
        intro:
          'In Candiac, stamped concrete projects often involve patios, pool decks, sidewalks and exterior landscaping. A clear request starts with volume and access.',
        sections: [
          {
            title: 'Patios, pools and exterior surfaces',
            body: 'Stamped concrete can suit decorative surfaces around a home when base preparation, drainage, thickness and finishing are planned with the contractor.',
          },
          {
            title: 'Plan for residential constraints',
            body: 'Indicate whether the truck can approach the yard, whether access is through a side path, whether pumping may be needed and whether the pour must happen within a specific time window.',
          },
          {
            title: 'Weather and finishing',
            body: 'Stamped concrete is sensitive to set time, temperature and finishing coordination. The pour date must be realistic for the crew creating the surface.',
          },
          {
            title: 'Concrete volume to order',
            body: 'Estimate surface area and thickness, then add an allowance for depth variation. This quantity helps check a suitable delivery option.',
          },
        ],
        ctaTitle: 'Prepare a request for Candiac',
        ctaBody:
          'Add dimensions, date, address and access details so available options can be checked for your project.',
        quoteCta: 'Request a quote in Candiac',
        calculatorCta: 'Calculate volume',
        localConcreteCta: 'View concrete in Candiac',
      },
    },
  },
};

export function isStampedConcreteCitySlug(value: string): value is StampedConcreteCitySlug {
  return (stampedConcreteCitySlugs as readonly string[]).includes(value);
}

export function stampedConcretePath(slug: StampedConcreteCitySlug, locale: Locale): string {
  return `${seoLandingPath('stampedConcrete', locale)}/${slug}`;
}

export function stampedConcreteStaticParams() {
  return stampedConcreteCitySlugs.map((city) => ({ city }));
}

export function stampedConcreteAlternates(slug: StampedConcreteCitySlug): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[localeTags[locale]] = absoluteUrl(stampedConcretePath(slug, locale));
  }
  languages['x-default'] = absoluteUrl(stampedConcretePath(slug, defaultLocale));
  return languages;
}

export function buildStampedConcreteMetadata(
  slug: StampedConcreteCitySlug,
  locale: Locale,
): Metadata {
  const page = stampedConcretePages[slug].copy[locale];
  const dict = getDictionary(locale);
  const canonical = absoluteUrl(stampedConcretePath(slug, locale));
  const socialImage = {
    url: absoluteUrl(`/${locale}/opengraph-image`),
    width: 1200,
    height: 630,
    alt: dict.meta.siteName,
  };

  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: { canonical, languages: stampedConcreteAlternates(slug) },
    openGraph: {
      type: 'website',
      siteName: dict.meta.siteName,
      title: page.metaTitle,
      description: page.metaDescription,
      url: canonical,
      locale: dict.meta.ogLocale,
      alternateLocale: getDictionary(otherLocale(locale)).meta.ogLocale,
      images: [socialImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: page.metaTitle,
      description: page.metaDescription,
      images: [socialImage.url],
    },
  };
}

export function stampedConcreteLocalLinks(
  locale: Locale,
  current?: StampedConcreteCitySlug,
): { href: string; label: string }[] {
  return stampedConcreteCitySlugs
    .filter((slug) => slug !== current)
    .map((slug) => ({
      href: stampedConcretePath(slug, locale),
      label:
        locale === 'fr'
          ? `Béton estampé à ${stampedConcretePages[slug].name}`
          : `Stamped concrete in ${stampedConcretePages[slug].name}`,
    }));
}

export function stampedConcreteCityConcretePath(
  slug: StampedConcreteCitySlug,
  locale: Locale,
): string {
  return cityPath(slug, locale);
}

export function stampedConcreteQuoteHref(slug: StampedConcreteCitySlug, locale: Locale): string {
  const city = stampedConcretePages[slug].name;
  const project = locale === 'fr' ? 'Béton estampé' : 'Stamped concrete';
  return `${pathFor('quote', locale)}?city=${encodeURIComponent(city)}&project=${encodeURIComponent(project)}&landing_page=${encodeURIComponent(stampedConcretePath(slug, locale))}`;
}
