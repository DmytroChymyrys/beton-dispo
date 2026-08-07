import type { Metadata } from 'next';
import type { Locale } from '@/i18n/config';
import { defaultLocale, localeTags, locales, otherLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { locationSegment } from '@/i18n/routes';
import { absoluteUrl } from '@/lib/site';

export const citySlugs = [
  'longueuil',
  'brossard',
  'candiac',
  'greenfield-park',
  'la-prairie',
  'boucherville',
] as const;

export type CitySlug = (typeof citySlugs)[number];

export type CityPageCopy = {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  h1: string;
  intro: string;
  servicesTitle: string;
  servicesBody: string;
  projectsTitle: string;
  projectsBody: string;
  logisticsTitle: string;
  logisticsBody: string;
  calculatorTitle: string;
  calculatorBody: string;
  ctaTitle: string;
  ctaBody: string;
  quoteCta: string;
  calculatorCta: string;
  nearbyTitle: string;
};

export type CityPage = {
  slug: CitySlug;
  name: string;
  copy: Record<Locale, CityPageCopy>;
};

export const cityPages: Record<CitySlug, CityPage> = {
  longueuil: {
    slug: 'longueuil',
    name: 'Longueuil',
    copy: {
      fr: {
        metaTitle: 'Béton à Longueuil — Livraison et soumission | BétonDispo',
        metaDescription:
          'Besoin de béton à Longueuil? Estimez votre quantité, décrivez votre projet et demandez une soumission pour livraison, béton mobile ou pompage.',
        eyebrow: 'Rive-Sud',
        h1: 'Besoin de béton à Longueuil?',
        intro:
          'Pour une dalle, une fondation, un garage ou une rénovation à Longueuil, BétonDispo centralise votre demande et vérifie les options adaptées à votre chantier.',
        servicesTitle: 'Livraison, béton mobile et pompage à Longueuil',
        servicesBody:
          'Indiquez le type de projet, la quantité approximative, la date souhaitée et les contraintes d’accès. Selon le chantier, une livraison de béton, une solution de béton mobile ou du pompage peuvent être considérés.',
        projectsTitle: 'Projets courants à Longueuil',
        projectsBody:
          'Les demandes concernent souvent des dalles de garage, trottoirs, patios, semelles, murs de fondation et petits projets commerciaux. La quantité en mètres cubes aide à orienter rapidement la demande.',
        logisticsTitle: 'Accès au chantier',
        logisticsBody:
          'Les secteurs résidentiels de Longueuil peuvent varier beaucoup d’une rue à l’autre. Ajoutez les détails utiles : largeur d’entrée, cour arrière, fils aériens, stationnement et distance entre le camion et la zone de coulée.',
        calculatorTitle: 'Calculez votre volume avant de demander une soumission',
        calculatorBody:
          'Le calculateur vous aide à convertir les dimensions de votre projet en mètres cubes et à prévoir une marge selon l’incertitude du chantier.',
        ctaTitle: 'Prêt à vérifier la disponibilité à Longueuil?',
        ctaBody:
          'Envoyez les détails du projet. Nous vous revenons avec une option adaptée selon le secteur, la date et les besoins du chantier.',
        quoteCta: 'Obtenir une soumission à Longueuil',
        calculatorCta: 'Calculer la quantité de béton',
        nearbyTitle: 'Autres secteurs à proximité',
      },
      en: {
        metaTitle: 'Concrete in Longueuil — Delivery and Quote | BétonDispo',
        metaDescription:
          'Need concrete in Longueuil? Estimate your quantity, describe your project and request a quote for delivery, mobile concrete or pumping.',
        eyebrow: 'South Shore',
        h1: 'Need concrete in Longueuil?',
        intro:
          'For a slab, foundation, garage or renovation in Longueuil, BétonDispo centralizes your request and checks options suited to your job site.',
        servicesTitle: 'Delivery, mobile concrete and pumping in Longueuil',
        servicesBody:
          'Provide the project type, approximate quantity, desired date and access constraints. Depending on the site, concrete delivery, mobile concrete or pumping may be considered.',
        projectsTitle: 'Common projects in Longueuil',
        projectsBody:
          'Requests often involve garage slabs, walkways, patios, footings, foundation walls and small commercial work. A cubic metre estimate helps move the request forward quickly.',
        logisticsTitle: 'Site access',
        logisticsBody:
          'Residential areas in Longueuil can vary from street to street. Add useful details such as driveway width, backyard access, overhead wires, parking and distance from truck to pour area.',
        calculatorTitle: 'Calculate your volume before requesting a quote',
        calculatorBody:
          'The calculator helps convert your project dimensions into cubic metres and add an allowance based on site uncertainty.',
        ctaTitle: 'Ready to check availability in Longueuil?',
        ctaBody:
          'Send the project details. We will come back with an option suited to the area, date and site requirements.',
        quoteCta: 'Request a quote in Longueuil',
        calculatorCta: 'Calculate concrete quantity',
        nearbyTitle: 'Nearby service areas',
      },
    },
  },
  brossard: {
    slug: 'brossard',
    name: 'Brossard',
    copy: {
      fr: {
        metaTitle: 'Béton à Brossard — Livraison et soumission | BétonDispo',
        metaDescription:
          'Demandez une soumission de béton à Brossard pour dalle, fondation, garage ou rénovation. Calculez le volume en m³ avant d’envoyer votre demande.',
        eyebrow: 'Rive-Sud',
        h1: 'Besoin de béton à Brossard?',
        intro:
          'Brossard génère des demandes variées, des rénovations résidentielles aux petits chantiers commerciaux. BétonDispo vous aide à présenter une demande claire avec le volume, la date et l’accès.',
        servicesTitle: 'Solutions de béton pour Brossard',
        servicesBody:
          'La demande peut viser une livraison de béton prêt à l’emploi, du béton mobile lorsque le volume est plus difficile à prévoir, ou du pompage si l’accès à la coulée est limité.',
        projectsTitle: 'Dalles, garages et fondations',
        projectsBody:
          'Les projets à Brossard incluent souvent des dalles de garage, entrées, patios, agrandissements, semelles et murs de fondation. Le calcul du volume en m³ réduit les échanges avant la soumission.',
        logisticsTitle: 'Accès et contraintes urbaines',
        logisticsBody:
          'Mentionnez les rues étroites, stationnements, entrées partagées, travaux en cour arrière ou restrictions d’accès. Ces détails aident à déterminer si une pompe ou une autre approche est utile.',
        calculatorTitle: 'Commencez par une estimation en m³',
        calculatorBody:
          'Utilisez le calculateur pour obtenir une quantité approximative, puis joignez cette estimation à votre demande de soumission.',
        ctaTitle: 'Vérifier une option pour Brossard',
        ctaBody:
          'Ajoutez l’adresse, la date souhaitée, le type de projet et votre quantité estimée. BétonDispo vérifie ensuite les options possibles.',
        quoteCta: 'Obtenir une soumission à Brossard',
        calculatorCta: 'Calculer mon volume',
        nearbyTitle: 'Secteurs voisins',
      },
      en: {
        metaTitle: 'Concrete in Brossard — Delivery and Quote | BétonDispo',
        metaDescription:
          'Request a concrete quote in Brossard for slabs, foundations, garages or renovations. Calculate the m³ volume before sending your request.',
        eyebrow: 'South Shore',
        h1: 'Need concrete in Brossard?',
        intro:
          'Brossard brings a mix of residential renovation and light commercial requests. BétonDispo helps you submit clear project details with volume, date and access information.',
        servicesTitle: 'Concrete options for Brossard',
        servicesBody:
          'Your request may involve ready-mix delivery, mobile concrete when volume is harder to predict, or pumping if access to the pour area is limited.',
        projectsTitle: 'Slabs, garages and foundations',
        projectsBody:
          'Brossard projects often include garage slabs, driveways, patios, extensions, footings and foundation walls. A cubic metre estimate reduces back-and-forth before quoting.',
        logisticsTitle: 'Access and urban constraints',
        logisticsBody:
          'Mention narrow streets, parking, shared driveways, backyard work or access restrictions. These details help determine whether a pump or another approach may be useful.',
        calculatorTitle: 'Start with an m³ estimate',
        calculatorBody:
          'Use the calculator to get an approximate quantity, then include that estimate with your quote request.',
        ctaTitle: 'Check an option for Brossard',
        ctaBody:
          'Add the address, desired date, project type and estimated quantity. BétonDispo then checks possible options.',
        quoteCta: 'Request a quote in Brossard',
        calculatorCta: 'Calculate my volume',
        nearbyTitle: 'Nearby areas',
      },
    },
  },
  candiac: {
    slug: 'candiac',
    name: 'Candiac',
    copy: {
      fr: {
        metaTitle: 'Béton à Candiac — Livraison et soumission | BétonDispo',
        metaDescription:
          'Soumission de béton à Candiac pour dalle, garage, piscine, fondation ou aménagement. Estimez le volume en m³ avec le calculateur BétonDispo.',
        eyebrow: 'Rive-Sud',
        h1: 'Besoin de béton à Candiac?',
        intro:
          'Pour un projet résidentiel ou d’aménagement à Candiac, préparez votre demande avec les dimensions, l’accès au chantier et la quantité approximative de béton.',
        servicesTitle: 'Livraison de béton et options selon le chantier',
        servicesBody:
          'BétonDispo peut orienter votre demande selon le volume, la date souhaitée et l’accès. Le béton mobile ou le pompage peuvent être utiles lorsque le chantier demande plus de flexibilité.',
        projectsTitle: 'Dalles, piscines et aménagements',
        projectsBody:
          'À Candiac, les demandes peuvent concerner une dalle de cabanon ou garage, un trottoir, une piscine, une terrasse, des semelles ou une fondation résidentielle.',
        logisticsTitle: 'Préparer les détails avant la soumission',
        logisticsBody:
          'Précisez si le camion peut approcher la zone de coulée, si l’accès se fait par la cour arrière, ou si le projet nécessite de franchir une distance importante depuis la rue.',
        calculatorTitle: 'Estimez la quantité avant de remplir le formulaire',
        calculatorBody:
          'Le calculateur donne une base en mètres cubes pour mieux expliquer votre projet et éviter une demande trop vague.',
        ctaTitle: 'Envoyer une demande pour Candiac',
        ctaBody:
          'Décrivez le chantier, la date souhaitée et la quantité estimée. Nous vérifions les options adaptées à votre demande.',
        quoteCta: 'Obtenir une soumission à Candiac',
        calculatorCta: 'Estimer mon béton',
        nearbyTitle: 'Secteurs proches',
      },
      en: {
        metaTitle: 'Concrete in Candiac — Delivery and Quote | BétonDispo',
        metaDescription:
          'Concrete quotes in Candiac for slabs, garages, pools, foundations or landscaping. Estimate your m³ volume with the BétonDispo calculator.',
        eyebrow: 'South Shore',
        h1: 'Need concrete in Candiac?',
        intro:
          'For a residential or landscaping project in Candiac, prepare your request with dimensions, site access and an approximate concrete quantity.',
        servicesTitle: 'Concrete delivery and options by site',
        servicesBody:
          'BétonDispo can route your request based on volume, desired date and access. Mobile concrete or pumping may help when the site needs more flexibility.',
        projectsTitle: 'Slabs, pools and landscaping',
        projectsBody:
          'In Candiac, requests may involve a shed or garage slab, walkway, pool, terrace, footings or residential foundation.',
        logisticsTitle: 'Prepare details before requesting a quote',
        logisticsBody:
          'Specify whether the truck can approach the pour area, whether access is through the backyard, or whether concrete must travel a significant distance from the street.',
        calculatorTitle: 'Estimate quantity before filling the form',
        calculatorBody:
          'The calculator gives you a cubic metre baseline to explain the project clearly and avoid a vague request.',
        ctaTitle: 'Send a request for Candiac',
        ctaBody:
          'Describe the site, desired date and estimated quantity. We check options suited to your request.',
        quoteCta: 'Request a quote in Candiac',
        calculatorCta: 'Estimate my concrete',
        nearbyTitle: 'Nearby areas',
      },
    },
  },
  'greenfield-park': {
    slug: 'greenfield-park',
    name: 'Greenfield Park',
    copy: {
      fr: {
        metaTitle: 'Béton à Greenfield Park — Livraison et soumission | BétonDispo',
        metaDescription:
          'Besoin de béton à Greenfield Park? Estimez votre volume pour dalle, garage, trottoir, terrasse ou rénovation et demandez une soumission.',
        eyebrow: 'Agglomération de Longueuil',
        h1: 'Besoin de béton à Greenfield Park?',
        intro:
          'Pour une dalle, une terrasse, un trottoir, un garage ou une rénovation à Greenfield Park, BétonDispo vous aide à préparer une demande claire avec volume, date et accès au chantier.',
        servicesTitle: 'Livraison, béton mobile et pompage à Greenfield Park',
        servicesBody:
          'Le secteur est surtout résidentiel et l’accès peut varier selon la rue, la cour et le stationnement. Indiquez si une livraison directe est possible ou si une pompe pourrait être utile.',
        projectsTitle: 'Projets courants dans le secteur',
        projectsBody:
          'Les demandes peuvent concerner des patios, trottoirs, dalles de garage, petites fondations, agrandissements et travaux extérieurs. Une estimation en m³ rend la demande plus précise.',
        logisticsTitle: 'Accès urbain et préparation',
        logisticsBody:
          'Ajoutez les contraintes comme une entrée étroite, des fils aériens, un accès par ruelle, une cour arrière ou une distance importante entre le camion et la zone de coulée.',
        calculatorTitle: 'Calculer avant de demander une soumission',
        calculatorBody:
          'Utilisez le calculateur de béton pour obtenir une quantité approximative, puis transmettez cette estimation avec les détails du chantier.',
        ctaTitle: 'Vérifier une option pour Greenfield Park',
        ctaBody:
          'Envoyez le type de projet, l’adresse, la date souhaitée et la quantité estimée pour vérifier les options disponibles.',
        quoteCta: 'Obtenir une soumission à Greenfield Park',
        calculatorCta: 'Calculer mon volume',
        nearbyTitle: 'Secteurs voisins',
      },
      en: {
        metaTitle: 'Concrete in Greenfield Park — Delivery and Quote | BétonDispo',
        metaDescription:
          'Need concrete in Greenfield Park? Estimate volume for a slab, garage, sidewalk, patio or renovation and request a quote.',
        eyebrow: 'Longueuil agglomeration',
        h1: 'Need concrete in Greenfield Park?',
        intro:
          'For a slab, patio, sidewalk, garage or renovation in Greenfield Park, BétonDispo helps you prepare a clear request with volume, date and site access.',
        servicesTitle: 'Delivery, mobile concrete and pumping in Greenfield Park',
        servicesBody:
          'The area is mostly residential and access can vary by street, yard and parking. Note whether direct delivery is possible or whether pumping may be useful.',
        projectsTitle: 'Common projects in the area',
        projectsBody:
          'Requests may involve patios, sidewalks, garage slabs, small foundations, extensions and exterior work. An m³ estimate makes the request more precise.',
        logisticsTitle: 'Urban access and preparation',
        logisticsBody:
          'Add constraints such as a narrow driveway, overhead wires, lane access, backyard work or significant distance between the truck and the pour area.',
        calculatorTitle: 'Calculate before requesting a quote',
        calculatorBody:
          'Use the concrete calculator to get an approximate quantity, then send that estimate with the site details.',
        ctaTitle: 'Check an option for Greenfield Park',
        ctaBody:
          'Send the project type, address, desired date and estimated quantity to check available options.',
        quoteCta: 'Request a quote in Greenfield Park',
        calculatorCta: 'Calculate my volume',
        nearbyTitle: 'Nearby areas',
      },
    },
  },
  'la-prairie': {
    slug: 'la-prairie',
    name: 'La Prairie',
    copy: {
      fr: {
        metaTitle: 'Béton à La Prairie — Livraison et soumission | BétonDispo',
        metaDescription:
          'Besoin de béton à La Prairie? Calculez votre volume pour une dalle, fondation ou garage, puis envoyez une demande de soumission.',
        eyebrow: 'Rive-Sud',
        h1: 'Besoin de béton à La Prairie?',
        intro:
          'BétonDispo aide à préparer les demandes de béton à La Prairie pour les projets résidentiels, rénovations, garages, dalles et fondations.',
        servicesTitle: 'Une demande claire pour votre chantier',
        servicesBody:
          'Le formulaire permet de préciser le volume approximatif, l’adresse, la date souhaitée, l’accès et les besoins particuliers comme le pompage.',
        projectsTitle: 'Projets fréquents à La Prairie',
        projectsBody:
          'Les demandes peuvent viser une dalle de garage, une entrée, un patio, une fondation, des semelles ou des travaux de rénovation autour de la maison.',
        logisticsTitle: 'Accès, distance et planification',
        logisticsBody:
          'Indiquez si la coulée est près de la rue ou plus loin sur le terrain. Cette information aide à comprendre les contraintes avant de proposer une option.',
        calculatorTitle: 'Calculez les mètres cubes',
        calculatorBody:
          'Entrez les dimensions de votre projet pour obtenir une estimation en m³ et l’utiliser dans votre demande.',
        ctaTitle: 'Demander une soumission à La Prairie',
        ctaBody:
          'Plus votre demande contient d’informations utiles, plus il est simple de vérifier une option adaptée au chantier.',
        quoteCta: 'Obtenir une soumission à La Prairie',
        calculatorCta: 'Calculer mon volume',
        nearbyTitle: 'Autres secteurs desservis',
      },
      en: {
        metaTitle: 'Concrete in La Prairie — Delivery and Quote | BétonDispo',
        metaDescription:
          'Need concrete in La Prairie? Calculate your volume for a slab, foundation or garage, then send a quote request.',
        eyebrow: 'South Shore',
        h1: 'Need concrete in La Prairie?',
        intro:
          'BétonDispo helps prepare concrete requests in La Prairie for residential projects, renovations, garages, slabs and foundations.',
        servicesTitle: 'A clear request for your site',
        servicesBody:
          'The form lets you specify approximate volume, address, desired date, access and specific needs such as pumping.',
        projectsTitle: 'Common projects in La Prairie',
        projectsBody:
          'Requests may involve a garage slab, driveway, patio, foundation, footings or renovation work around the home.',
        logisticsTitle: 'Access, distance and planning',
        logisticsBody:
          'Indicate whether the pour area is near the street or farther onto the property. This helps clarify constraints before an option is proposed.',
        calculatorTitle: 'Calculate cubic metres',
        calculatorBody:
          'Enter your project dimensions to get an m³ estimate and use it in your request.',
        ctaTitle: 'Request a quote in La Prairie',
        ctaBody:
          'The more useful details your request includes, the easier it is to check an option suited to the site.',
        quoteCta: 'Request a quote in La Prairie',
        calculatorCta: 'Calculate my volume',
        nearbyTitle: 'Other service areas',
      },
    },
  },
  boucherville: {
    slug: 'boucherville',
    name: 'Boucherville',
    copy: {
      fr: {
        metaTitle: 'Béton à Boucherville — Livraison et soumission | BétonDispo',
        metaDescription:
          'Béton à Boucherville pour dalle, fondation, garage ou projet commercial léger. Estimez la quantité en m³ et demandez une soumission.',
        eyebrow: 'Rive-Sud',
        h1: 'Besoin de béton à Boucherville?',
        intro:
          'Pour un projet résidentiel ou commercial léger à Boucherville, BétonDispo vous aide à transmettre une demande structurée avec les informations essentielles.',
        servicesTitle: 'Béton pour résidentiel et petits chantiers commerciaux',
        servicesBody:
          'Selon le volume et l’accès, la demande peut être orientée vers une livraison de béton, du béton mobile ou du pompage lorsque la zone de coulée est difficile à atteindre.',
        projectsTitle: 'Fondations, dalles et agrandissements',
        projectsBody:
          'Les projets peuvent inclure des dalles, planchers de garage, trottoirs, semelles, murs de fondation, agrandissements et travaux autour de bâtiments commerciaux légers.',
        logisticsTitle: 'Informations utiles pour Boucherville',
        logisticsBody:
          'Ajoutez les détails sur l’accès au terrain, les contraintes de stationnement, la distance de pompage possible et l’échéancier souhaité.',
        calculatorTitle: 'Une estimation facilite la demande',
        calculatorBody:
          'Le calculateur de béton vous donne une quantité approximative en mètres cubes avant de demander une soumission.',
        ctaTitle: 'Vérifier une option à Boucherville',
        ctaBody:
          'Envoyez le type de projet, l’adresse, la date visée et l’estimation de volume pour lancer la vérification.',
        quoteCta: 'Obtenir une soumission à Boucherville',
        calculatorCta: 'Calculer la quantité',
        nearbyTitle: 'Secteurs à proximité',
      },
      en: {
        metaTitle: 'Concrete in Boucherville — Delivery and Quote | BétonDispo',
        metaDescription:
          'Concrete in Boucherville for slabs, foundations, garages or light commercial work. Estimate m³ quantity and request a quote.',
        eyebrow: 'South Shore',
        h1: 'Need concrete in Boucherville?',
        intro:
          'For a residential or light commercial project in Boucherville, BétonDispo helps you send a structured request with the essential information.',
        servicesTitle: 'Concrete for residential and light commercial sites',
        servicesBody:
          'Depending on volume and access, the request may involve concrete delivery, mobile concrete or pumping when the pour area is hard to reach.',
        projectsTitle: 'Foundations, slabs and extensions',
        projectsBody:
          'Projects may include slabs, garage floors, sidewalks, footings, foundation walls, extensions and work around light commercial buildings.',
        logisticsTitle: 'Useful information for Boucherville',
        logisticsBody:
          'Add details about property access, parking constraints, possible pumping distance and desired schedule.',
        calculatorTitle: 'An estimate makes the request clearer',
        calculatorBody:
          'The concrete calculator gives you an approximate quantity in cubic metres before requesting a quote.',
        ctaTitle: 'Check an option in Boucherville',
        ctaBody:
          'Send the project type, address, target date and volume estimate to start the check.',
        quoteCta: 'Request a quote in Boucherville',
        calculatorCta: 'Calculate quantity',
        nearbyTitle: 'Nearby areas',
      },
    },
  },
};

export function isCitySlug(value: string): value is CitySlug {
  return (citySlugs as readonly string[]).includes(value);
}

export function cityPath(slug: CitySlug, locale: Locale): string {
  return `/${locale}/${locationSegment[locale]}/${slug}`;
}

export function cityStaticParams() {
  return citySlugs.map((city) => ({ city }));
}

export function cityAlternates(slug: CitySlug): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[localeTags[locale]] = absoluteUrl(cityPath(slug, locale));
  }
  languages['x-default'] = absoluteUrl(cityPath(slug, defaultLocale));
  return languages;
}

export function buildCityMetadata(slug: CitySlug, locale: Locale): Metadata {
  const page = cityPages[slug].copy[locale];
  const canonical = absoluteUrl(cityPath(slug, locale));
  const dict = getDictionary(locale);
  const socialImage = {
    url: absoluteUrl(`/${locale}/opengraph-image`),
    width: 1200,
    height: 630,
    alt: dict.meta.siteName,
  };

  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: { canonical, languages: cityAlternates(slug) },
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
