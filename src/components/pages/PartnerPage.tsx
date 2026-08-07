import { Suspense } from 'react';
import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { pathFor } from '@/i18n/routes';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Section } from '@/components/ui/Section';
import { buttonClass } from '@/components/ui/button-styles';
import { JsonLd } from '@/components/JsonLd';
import { SupplierApplicationForm } from '@/components/supplier/SupplierApplicationForm';
import { issueSupplierApplicationFormToken } from '@/server/abuse';
import { absoluteUrl } from '@/lib/site';
import { breadcrumbSchema } from '@/lib/structured-data';

const copy = {
  fr: {
    eyebrow: 'Partenaires',
    title: 'Recevez de nouvelles demandes de béton dans votre secteur',
    intro:
      'BétonDispo reçoit des demandes reliées au béton. Les partenaires approuvés peuvent recevoir des opportunités pertinentes selon leur territoire, leurs services et leur disponibilité.',
    disclaimer:
      'La demande est gratuite et sans obligation. BétonDispo révise les informations avant d’activer un partenaire.',
    cta: 'Devenir partenaire',
    secondary: 'Voir les services',
    whyTitle: 'Pourquoi devenir partenaire?',
    benefits: [
      {
        title: 'Demandes pertinentes',
        body: 'Indiquez les types de projets et les secteurs où vous souhaitez recevoir des opportunités.',
      },
      {
        title: 'Contrôle opérationnel',
        body: 'Un partenaire peut choisir de répondre seulement aux demandes qui conviennent à sa capacité.',
      },
      {
        title: 'Canal centralisé',
        body: 'Les informations clés d’une demande sont regroupées pour faciliter le suivi initial.',
      },
    ],
    stepsTitle: 'Comment ça fonctionne',
    steps: [
      'Vous soumettez les informations de votre entreprise.',
      'BétonDispo révise votre secteur et vos services.',
      'Les partenaires approuvés peuvent recevoir des demandes pertinentes.',
      'Vous choisissez si et comment répondre à chaque opportunité.',
    ],
    form: {
      title: 'Demande de partenariat',
      intro: 'Dites-nous qui vous êtes et dans quels secteurs vous opérez.',
      optional: 'facultatif',
      servicesHint: 'Sélectionnez tous les services que votre entreprise peut offrir.',
      submit: 'Envoyer la demande',
      submitting: 'Envoi en cours…',
      successTitle: 'Merci — votre demande de partenariat a été reçue.',
      successBody:
        'BétonDispo examinera les informations et vous contactera si votre entreprise correspond aux besoins du réseau.',
      backHome: 'Retour à l’accueil',
      privacyPrefix:
        'BétonDispo utilisera ces informations pour évaluer et gérer votre demande de partenariat.',
      privacyLink: 'Politique de confidentialité',
      fields: {
        companyName: 'Nom de l’entreprise',
        contactName: 'Nom du contact',
        email: 'Courriel',
        phone: 'Téléphone',
        website: 'Site web',
        serviceAreaText: 'Secteurs desservis / villes principales',
        services: 'Services offerts',
        message: 'Message ou notes',
        consent: 'BétonDispo peut me contacter au sujet de cette demande de partenariat.',
        honeypot: 'Site web',
      },
      errors: {
        companyNameRequired: 'Indiquez le nom de l’entreprise.',
        contactNameRequired: 'Indiquez le nom du contact.',
        emailRequired: 'Indiquez un courriel.',
        emailInvalid: 'Indiquez un courriel valide.',
        phoneRequired: 'Indiquez un téléphone.',
        phoneInvalid: 'Indiquez un numéro de téléphone valide.',
        websiteInvalid: 'Indiquez une adresse web valide.',
        serviceAreaRequired: 'Indiquez au moins une ville ou région.',
        servicesRequired: 'Sélectionnez au moins un service.',
        consentRequired: 'Confirmez que BétonDispo peut vous contacter.',
        tooLong: 'Ce champ est trop long.',
        spam: 'La demande n’a pas pu être envoyée.',
        rateLimited: 'Trop de demandes ont été envoyées. Réessayez plus tard.',
        server: 'La demande n’a pas pu être envoyée. Réessayez plus tard.',
      },
    },
  },
  en: {
    eyebrow: 'Partners',
    title: 'Receive new concrete requests in your service area',
    intro:
      'BétonDispo receives concrete-related requests. Approved partners may receive relevant opportunities based on their territory, services and availability.',
    disclaimer:
      'Applying is free and non-binding. BétonDispo reviews applications before activating partners.',
    cta: 'Become a partner',
    secondary: 'View services',
    whyTitle: 'Why partner with BétonDispo?',
    benefits: [
      {
        title: 'Relevant requests',
        body: 'Tell us which project types and areas you want to receive opportunities for.',
      },
      {
        title: 'Operational control',
        body: 'A partner can choose to respond only to requests that fit their capacity.',
      },
      {
        title: 'One central channel',
        body: 'Key request information is grouped together so initial follow-up is easier.',
      },
    ],
    stepsTitle: 'How it works',
    steps: [
      'You submit your company information.',
      'BétonDispo reviews your service area and capabilities.',
      'Approved partners may receive relevant requests.',
      'You choose whether and how to respond to each opportunity.',
    ],
    form: {
      title: 'Partner application',
      intro: 'Tell us who you are and where you operate.',
      optional: 'optional',
      servicesHint: 'Select every service your company can provide.',
      submit: 'Submit application',
      submitting: 'Submitting…',
      successTitle: 'Thank you — your partnership application has been received.',
      successBody:
        'BétonDispo will review the information and contact you if your company matches network needs.',
      backHome: 'Back to home',
      privacyPrefix:
        'BétonDispo will use this information to evaluate and manage your partnership application.',
      privacyLink: 'Privacy policy',
      fields: {
        companyName: 'Company name',
        contactName: 'Contact name',
        email: 'Email',
        phone: 'Phone',
        website: 'Website',
        serviceAreaText: 'Service area / main cities',
        services: 'Services offered',
        message: 'Message or notes',
        consent: 'BétonDispo may contact me about this partnership application.',
        honeypot: 'Website',
      },
      errors: {
        companyNameRequired: 'Enter the company name.',
        contactNameRequired: 'Enter the contact name.',
        emailRequired: 'Enter an email.',
        emailInvalid: 'Enter a valid email.',
        phoneRequired: 'Enter a phone number.',
        phoneInvalid: 'Enter a valid phone number.',
        websiteInvalid: 'Enter a valid website URL.',
        serviceAreaRequired: 'Enter at least one city or region.',
        servicesRequired: 'Select at least one service.',
        consentRequired: 'Confirm that BétonDispo may contact you.',
        tooLong: 'This field is too long.',
        spam: 'The application could not be submitted.',
        rateLimited: 'Too many applications were submitted. Try again later.',
        server: 'The application could not be submitted. Try again later.',
      },
    },
  },
} as const;

export function PartnerPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const t = copy[locale];
  const formToken = issueSupplierApplicationFormToken();
  const path = pathFor('partner', locale);

  const breadcrumbs = [
    { label: dict.meta.siteName, href: pathFor('home', locale) },
    { label: t.cta, href: path },
  ];

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: dict.meta.pages.partner.title,
    description: dict.meta.pages.partner.description,
    url: absoluteUrl(path),
    inLanguage: locale === 'fr' ? 'fr-CA' : 'en-CA',
  };

  return (
    <>
      <JsonLd
        data={breadcrumbSchema(breadcrumbs.map((item) => ({ name: item.label, url: item.href })))}
      />
      <JsonLd data={webPageSchema} />

      <Section tone="surface" className="border-line border-b py-10 md:py-14">
        <div className="container-page">
          <Breadcrumbs items={breadcrumbs} />
          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(380px,0.72fr)] lg:items-start">
            <div className="max-w-3xl">
              <p className="text-accent font-display text-sm font-bold tracking-widest uppercase">
                {t.eyebrow}
              </p>
              <h1 className="mt-4 text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">{t.title}</h1>
              <p className="text-ink-muted mt-5 text-lg leading-relaxed">{t.intro}</p>
              <p className="text-ink-muted mt-4 leading-relaxed">{t.disclaimer}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="#partner-form" className={buttonClass('primary', 'lg')}>
                  {t.cta}
                </a>
                <Link href={pathFor('services', locale)} className={buttonClass('secondary', 'lg')}>
                  {t.secondary}
                </Link>
              </div>
            </div>

            <div className="rounded-card bg-accent-tint border-line border p-5 md:p-6">
              <h2 className="text-2xl">{t.stepsTitle}</h2>
              <ol className="mt-5 space-y-4">
                {t.steps.map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="bg-accent text-surface flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                      {index + 1}
                    </span>
                    <span className="text-ink-soft leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </Section>

      <Section tone="ground" className="py-12 md:py-16">
        <div className="container-page grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(420px,0.88fr)] lg:items-start">
          <div>
            <h2 className="text-3xl">{t.whyTitle}</h2>
            <div className="mt-6 grid gap-4">
              {t.benefits.map((benefit) => (
                <article
                  key={benefit.title}
                  className="rounded-card border-line bg-surface border p-5"
                >
                  <h3 className="text-xl">{benefit.title}</h3>
                  <p className="text-ink-muted mt-2 leading-relaxed">{benefit.body}</p>
                </article>
              ))}
            </div>
          </div>

          <Suspense fallback={null}>
            <SupplierApplicationForm locale={locale} copy={t.form} formToken={formToken} />
          </Suspense>
        </div>
      </Section>
    </>
  );
}
