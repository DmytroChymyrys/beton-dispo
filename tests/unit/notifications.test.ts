import { describe, expect, it } from 'vitest';
import type { QuoteRequest, SupplierApplication } from '@/db/schema';
import {
  notificationHtml,
  notificationSubject,
  notificationText,
  supplierApplicationNotificationHtml,
  supplierApplicationNotificationSubject,
  supplierApplicationNotificationText,
} from '@/server/notifications';

const baseRequest: QuoteRequest = {
  id: '11111111-2222-3333-4444-555555555555',
  referenceNumber: 123,
  publicId: 'BD-000123',
  locale: 'fr',
  createdAt: new Date('2026-08-01T14:30:00Z'),
  updatedAt: new Date('2026-08-01T14:30:00Z'),
  customerType: 'BUSINESS',
  name: 'Martin Tremblay',
  companyName: 'Excavation Tremblay inc.',
  email: 'martin@example.com',
  phone: '450-555-0142',
  preferredContactMethod: 'PHONE',
  address: '145 rue des Érables',
  city: 'Brossard',
  postalCode: 'J4W 2K3',
  accessNotes: null,
  projectType: 'FOUNDATION',
  estimatedVolumeM3: '6.00',
  volumeUnknown: false,
  concreteStrength: 'MPA_30',
  pumpRequired: 'YES',
  pumpNotes: 'Cour arrière, 30 m de boyau.',
  desiredDate: '2026-08-12',
  preferredTime: 'MORNING',
  scheduleFlexible: false,
  additionalNotes: null,
  gclid: 'test-gclid-123',
  msclkid: null,
  fbclid: null,
  utmSource: 'google',
  utmMedium: 'cpc',
  utmCampaign: 'beton-rive-sud',
  utmTerm: null,
  utmContent: null,
  referrer: null,
  landingPage: '/fr',
  firstTouchSource: 'google',
  firstTouchMedium: 'cpc',
  firstTouchCampaign: 'beton-rive-sud',
  firstTouchTerm: null,
  firstTouchContent: null,
  firstTouchLandingPage: '/fr',
  firstTouchReferrer: null,
  firstTouchTimestamp: new Date('2026-08-01T14:20:00Z'),
  lastTouchSource: 'google',
  lastTouchMedium: 'cpc',
  lastTouchCampaign: 'beton-rive-sud',
  lastTouchTerm: null,
  lastTouchContent: null,
  lastTouchLandingPage: '/fr',
  lastTouchReferrer: null,
  lastTouchTimestamp: new Date('2026-08-01T14:20:00Z'),
  quoteEntryPage: '/fr/calculateur-beton',
  submissionPage: '/fr/soumission',
  deviceCategory: 'desktop',
  browserLanguage: 'fr-CA',
  abuseStatus: 'clean',
  sourceIpHash: 'hash',
  duplicateFingerprint: 'fingerprint',
  status: 'NEW',
  qualificationStatus: 'PENDING',
  qualifiedAt: null,
  qualifiedBy: null,
  qualificationReason: null,
  disqualificationReason: null,
  firstResponseAt: null,
  firstContactAt: null,
  resolvedAt: null,
  wonAt: null,
  lostAt: null,
  estimatedJobValueCad: null,
  finalJobValueCad: null,
  betondispoRevenueCad: null,
  supplierSelected: null,
  serviceDate: null,
  adUserDataConsent: 'UNKNOWN',
  adPersonalizationConsent: 'UNKNOWN',
  consentCapturedAt: null,
  consentSource: null,
  internalNotes: null,
  lostReason: null,
};

describe('notificationSubject', () => {
  it('names the city and the volume, so the operator can triage from the inbox', () => {
    expect(notificationSubject(baseRequest)).toBe('Nouvelle demande BétonDispo — Brossard — 6 m³');
  });

  it('says the volume is unknown rather than showing a misleading zero', () => {
    const subject = notificationSubject({
      ...baseRequest,
      volumeUnknown: true,
      estimatedVolumeM3: null,
    });
    expect(subject).toBe('Nouvelle demande BétonDispo — Brossard — volume inconnu');
  });

  it('keeps a fractional volume readable in French', () => {
    expect(notificationSubject({ ...baseRequest, estimatedVolumeM3: '6.50' })).toContain('6,50 m³');
  });
});

describe('notificationText', () => {
  const text = notificationText(baseRequest);

  it.each([
    'BD-000123',
    'Martin Tremblay',
    'Excavation Tremblay inc.',
    '450-555-0142',
    'martin@example.com',
    'Brossard',
    'Fondation',
    '6 m³',
    '2026-08-12',
    'Oui',
    'google / cpc / beton-rive-sud',
    'test-gclid-123',
  ])('includes %s', (fragment) => {
    expect(text).toContain(fragment);
  });

  it('links straight to the request in the admin', () => {
    expect(text).toContain('/admin/requests/11111111-2222-3333-4444-555555555555');
  });

  it('omits rows the customer left empty rather than printing blanks', () => {
    expect(text).not.toContain('Accès:');
    expect(text).not.toContain('Détails:');
  });

  it('flags a flexible schedule', () => {
    expect(notificationText({ ...baseRequest, scheduleFlexible: true })).toContain(
      'échéancier flexible',
    );
  });
});

describe('notificationHtml', () => {
  it('escapes customer-supplied text so it cannot inject markup', () => {
    const html = notificationHtml({
      ...baseRequest,
      name: '<script>alert(1)</script>',
      additionalNotes: 'Accès "difficile" & étroit',
    });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&quot;difficile&quot; &amp; étroit');
  });

  it('renders the admin link as an anchor', () => {
    expect(notificationHtml(baseRequest)).toContain(
      'href="http://localhost:3987/admin/requests/11111111-2222-3333-4444-555555555555"',
    );
  });
});

const baseSupplierApplication: SupplierApplication = {
  id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  referenceNumber: 7,
  publicId: 'BP-000007',
  locale: 'fr',
  status: 'NEW',
  companyName: 'Béton <Partenaire>',
  contactName: 'Sophie Gagnon',
  email: 'sophie@example.com',
  phone: '450-555-0199',
  website: 'https://betonpartenaire.ca',
  serviceAreaText: 'Brossard et Longueuil',
  services: ['READY_MIX', 'PUMPING'],
  message: 'Disponible "rapidement" & fin de semaine',
  landingPage: '/fr/devenir-partenaire',
  referrer: null,
  gclid: 'gclid-123',
  msclkid: null,
  fbclid: null,
  utmSource: 'google',
  utmMedium: 'cpc',
  utmCampaign: 'partenaires',
  utmTerm: null,
  utmContent: null,
  firstTouchSource: 'google',
  firstTouchMedium: 'cpc',
  firstTouchCampaign: 'partenaires',
  firstTouchTerm: null,
  firstTouchContent: null,
  firstTouchLandingPage: '/fr/devenir-partenaire',
  firstTouchReferrer: null,
  firstTouchTimestamp: new Date('2026-08-01T14:20:00Z'),
  lastTouchSource: 'google',
  lastTouchMedium: 'cpc',
  lastTouchCampaign: 'partenaires',
  lastTouchTerm: null,
  lastTouchContent: null,
  lastTouchLandingPage: '/fr/devenir-partenaire',
  lastTouchReferrer: null,
  lastTouchTimestamp: new Date('2026-08-01T14:25:00Z'),
  submissionPage: '/fr/devenir-partenaire',
  deviceCategory: 'desktop',
  browserLanguage: 'fr-CA',
  abuseStatus: 'clean',
  sourceIpHash: 'hash',
  duplicateFingerprint: 'fingerprint',
  internalNotes: null,
  firstContactedAt: null,
  qualifiedAt: null,
  approvedAt: null,
  rejectedAt: null,
  createdAt: new Date('2026-08-01T14:30:00Z'),
  updatedAt: new Date('2026-08-01T14:30:00Z'),
};

describe('supplier application notifications', () => {
  it('summarizes a partner application without writing into the quote workflow', () => {
    expect(supplierApplicationNotificationSubject(baseSupplierApplication)).toBe(
      'Nouvelle demande partenaire — Béton <Partenaire>',
    );

    const text = supplierApplicationNotificationText(baseSupplierApplication);
    expect(text).toContain('BP-000007');
    expect(text).toContain('Béton <Partenaire>');
    expect(text).toContain('Livraison de béton prêt à l’emploi, Pompage de béton');
    expect(text).toContain('/admin/suppliers/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
    expect(text).not.toContain('/admin/requests/');
  });

  it('escapes supplier-supplied text in the HTML notification', () => {
    const html = supplierApplicationNotificationHtml(baseSupplierApplication);
    expect(html).not.toContain('Béton <Partenaire>');
    expect(html).toContain('Béton &lt;Partenaire&gt;');
    expect(html).toContain('&quot;rapidement&quot; &amp; fin de semaine');
  });
});
