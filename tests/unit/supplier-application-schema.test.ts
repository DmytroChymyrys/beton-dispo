import { describe, expect, it } from 'vitest';
import {
  supplierApplicationFieldErrors,
  supplierApplicationSubmission,
} from '@/lib/supplier-application-schema';

const validApplication = {
  locale: 'fr' as const,
  companyName: 'Béton Partenaire Rive-Sud',
  contactName: 'Martin Tremblay',
  email: 'MARTIN@EXAMPLE.COM',
  phone: '(450) 555-0142',
  website: 'betonpartenaire.ca',
  serviceAreaText: 'Brossard, Candiac, La Prairie et Longueuil',
  services: ['READY_MIX', 'PUMPING'] as const,
  message: 'Disponible pour projets résidentiels et commerciaux.',
  consent: true as const,
  websiteUrl: '',
  formIssuedAt: '1785433200000',
  formToken: 'x'.repeat(64),
  utmSource: 'google',
  utmMedium: 'cpc',
  utmCampaign: 'partenaires',
  utmTerm: '',
  utmContent: '',
  referrer: '',
  landingPage: '/fr/devenir-partenaire',
  gclid: '',
  msclkid: '',
  fbclid: '',
  firstTouchSource: 'google',
  firstTouchMedium: 'cpc',
  firstTouchCampaign: 'partenaires',
  firstTouchTerm: '',
  firstTouchContent: '',
  firstTouchLandingPage: '/fr/devenir-partenaire',
  firstTouchReferrer: '',
  firstTouchTimestamp: '2026-08-07T12:00:00.000Z',
  lastTouchSource: 'google',
  lastTouchMedium: 'cpc',
  lastTouchCampaign: 'partenaires',
  lastTouchTerm: '',
  lastTouchContent: '',
  lastTouchLandingPage: '/fr/devenir-partenaire',
  lastTouchReferrer: '',
  lastTouchTimestamp: '2026-08-07T12:05:00.000Z',
  submissionPage: '/fr/devenir-partenaire',
  deviceCategory: 'desktop' as const,
  browserLanguage: 'fr-CA',
};

function errorsFor(input: Record<string, unknown>): Record<string, string> {
  const result = supplierApplicationSubmission.safeParse(input);
  return result.success ? {} : supplierApplicationFieldErrors(result.error);
}

describe('supplierApplicationSubmission', () => {
  it('accepts and normalizes a complete partner application', () => {
    const result = supplierApplicationSubmission.safeParse(validApplication);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.email).toBe('martin@example.com');
    expect(result.data.phone).toBe('450-555-0142');
    expect(result.data.website).toBe('https://betonpartenaire.ca');
    expect(result.data.companyName).toBe('Béton Partenaire Rive-Sud');
  });

  it('allows an optional website to be empty', () => {
    expect(errorsFor({ ...validApplication, website: '' })).toEqual({});
  });

  it('rejects missing required contact fields', () => {
    expect(
      errorsFor({
        ...validApplication,
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
        serviceAreaText: '',
        services: [],
      }),
    ).toEqual({
      companyName: 'companyNameRequired',
      contactName: 'contactNameRequired',
      email: 'emailRequired',
      phone: 'phoneRequired',
      serviceAreaText: 'serviceAreaRequired',
      services: 'servicesRequired',
    });
  });

  it('rejects invalid email, phone, website and service codes', () => {
    expect(
      errorsFor({
        ...validApplication,
        email: 'nope',
        phone: '123',
        website: 'not a valid website',
        services: ['BRIDGE'],
      }),
    ).toEqual({
      email: 'emailInvalid',
      phone: 'phoneInvalid',
      website: 'websiteInvalid',
      services:
        'Invalid option: expected one of "READY_MIX"|"MOBILE_CONCRETE"|"PUMPING"|"FINISHING"|"SLABS"|"FOUNDATIONS"|"FOOTINGS"|"PATIOS"|"COMMERCIAL"|"OTHER"',
    });
  });

  it('rejects a filled honeypot and missing consent', () => {
    expect(
      errorsFor({
        ...validApplication,
        consent: false,
        websiteUrl: 'https://spam.example',
      }),
    ).toEqual({
      consent: 'consentRequired',
      websiteUrl: 'spam',
    });
  });

  it('rejects unknown fields rather than storing them', () => {
    const result = supplierApplicationSubmission.safeParse({
      ...validApplication,
      approvedImmediately: true,
    });

    expect(result.success).toBe(false);
  });

  it('puts reasonable maximum lengths on public text fields', () => {
    expect(
      errorsFor({
        ...validApplication,
        companyName: 'x'.repeat(161),
        contactName: 'x'.repeat(121),
        serviceAreaText: 'x'.repeat(501),
        message: 'x'.repeat(2001),
      }),
    ).toEqual({
      companyName: 'tooLong',
      contactName: 'tooLong',
      serviceAreaText: 'tooLong',
      message: 'tooLong',
    });
  });
});
