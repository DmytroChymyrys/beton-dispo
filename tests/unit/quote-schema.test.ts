import { describe, expect, it } from 'vitest';
import {
  contactStepSchema,
  fieldErrors,
  locationStepSchema,
  normalizePhone,
  normalizePostalCode,
  projectStepSchema,
  quoteSubmission,
  scheduleStepSchema,
} from '@/lib/quote-schema';

/** A date far enough out to stay valid regardless of when the suite runs. */
function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const validSubmission = {
  locale: 'fr' as const,
  address: '145 rue des Érables',
  city: 'Brossard',
  postalCode: 'J4W 2K3',
  accessNotes: '',
  projectType: 'FOUNDATION' as const,
  volumeUnknown: false,
  estimatedVolumeM3: '6',
  concreteStrength: 'MPA_30' as const,
  pumpRequired: 'YES' as const,
  pumpNotes: '',
  desiredDate: daysFromNow(14),
  preferredTime: 'MORNING' as const,
  scheduleFlexible: false,
  customerType: 'BUSINESS' as const,
  name: 'Martin Tremblay',
  companyName: 'Excavation Tremblay inc.',
  email: 'martin@example.com',
  phone: '450-555-0142',
  preferredContactMethod: 'PHONE' as const,
  additionalNotes: '',
  consent: true as const,
  websiteUrl: '',
  utmSource: '',
  utmMedium: '',
  utmCampaign: '',
  utmTerm: '',
  utmContent: '',
  referrer: '',
  landingPage: '/fr',
};

/** Parses and returns `{ field: errorKey }`, or `{}` when valid. */
function errorsFor(input: Record<string, unknown>): Record<string, string> {
  const result = quoteSubmission.safeParse(input);
  return result.success ? {} : fieldErrors(result.error);
}

describe('quoteSubmission', () => {
  it('accepts a complete, valid request', () => {
    const result = quoteSubmission.safeParse(validSubmission);
    expect(result.success).toBe(true);
  });

  it('normalizes the volume to two decimals', () => {
    const result = quoteSubmission.safeParse({ ...validSubmission, estimatedVolumeM3: '6' });
    expect(result.success && result.data.estimatedVolumeM3).toBe('6.00');
  });

  it('accepts a comma decimal separator, as typed on a French keyboard', () => {
    const result = quoteSubmission.safeParse({ ...validSubmission, estimatedVolumeM3: '6,5' });
    expect(result.success && result.data.estimatedVolumeM3).toBe('6.50');
  });

  it('stores no volume when the customer does not know it', () => {
    const result = quoteSubmission.safeParse({
      ...validSubmission,
      volumeUnknown: true,
      estimatedVolumeM3: '',
    });
    expect(result.success && result.data.estimatedVolumeM3).toBeNull();
  });

  it('requires a volume when the customer did not tick "I don\'t know"', () => {
    expect(errorsFor({ ...validSubmission, estimatedVolumeM3: '' })).toEqual({
      estimatedVolumeM3: 'volumeRequired',
    });
  });

  it.each([
    ['0', 'volumeRange'],
    ['5000', 'volumeRange'],
    ['abc', 'volumeInvalid'],
  ])('rejects volume %s', (volume, expected) => {
    expect(errorsFor({ ...validSubmission, estimatedVolumeM3: volume })).toEqual({
      estimatedVolumeM3: expected,
    });
  });

  it.each(['J4W 2K3', 'j4w2k3', 'H2X-1Y4', 'G1A 0A9'])('accepts postal code %s', (postalCode) => {
    expect(errorsFor({ ...validSubmission, postalCode })).toEqual({});
  });

  it.each(['12345', 'ABCDEF', 'J4W', 'D1A 1A1'])('rejects postal code %s', (postalCode) => {
    expect(errorsFor({ ...validSubmission, postalCode })).toEqual({
      postalCode: 'postalCodeInvalid',
    });
  });

  it.each(['450-555-0142', '(450) 555-0142', '+1 450 555 0142', '4505550142'])(
    'accepts phone %s',
    (phone) => {
      expect(errorsFor({ ...validSubmission, phone })).toEqual({});
    },
  );

  it.each(['123', '5550142', '1234567890123'])('rejects phone %s', (phone) => {
    expect(errorsFor({ ...validSubmission, phone })).toEqual({ phone: 'phoneInvalid' });
  });

  it('rejects an invalid email', () => {
    expect(errorsFor({ ...validSubmission, email: 'not-an-email' })).toEqual({
      email: 'emailInvalid',
    });
  });

  it('rejects a date in the past', () => {
    expect(errorsFor({ ...validSubmission, desiredDate: daysFromNow(-1) })).toEqual({
      desiredDate: 'desiredDatePast',
    });
  });

  it('accepts today as the desired date', () => {
    expect(errorsFor({ ...validSubmission, desiredDate: daysFromNow(0) })).toEqual({});
  });

  it('rejects a date more than two years out', () => {
    expect(errorsFor({ ...validSubmission, desiredDate: daysFromNow(900) })).toEqual({
      desiredDate: 'desiredDateFar',
    });
  });

  it('requires consent', () => {
    expect(errorsFor({ ...validSubmission, consent: false })).toEqual({
      consent: 'consentRequired',
    });
  });

  it('rejects a filled honeypot', () => {
    expect(errorsFor({ ...validSubmission, websiteUrl: 'http://spam.example' })).toEqual({
      websiteUrl: 'spam',
    });
  });

  it('rejects an unknown enum value rather than storing it', () => {
    expect(errorsFor({ ...validSubmission, projectType: 'BRIDGE' })).toEqual({
      projectType: 'projectTypeRequired',
    });
  });

  it('rejects an over-long free-text field', () => {
    expect(errorsFor({ ...validSubmission, additionalNotes: 'x'.repeat(2001) })).toEqual({
      additionalNotes: 'tooLong',
    });
  });

  it('reports every invalid field at once, not just the first', () => {
    const errors = errorsFor({
      ...validSubmission,
      email: 'nope',
      phone: '1',
      postalCode: 'ZZZ',
    });
    expect(Object.keys(errors).sort()).toEqual(['email', 'phone', 'postalCode']);
  });
});

describe('step schemas', () => {
  it('validate only their own fields, so a step can pass before later ones are filled', () => {
    expect(locationStepSchema.safeParse(validSubmission).success).toBe(true);
    expect(projectStepSchema.safeParse(validSubmission).success).toBe(true);
    expect(scheduleStepSchema.safeParse(validSubmission).success).toBe(true);
    expect(contactStepSchema.safeParse(validSubmission).success).toBe(true);

    // An empty contact step must not block the location step.
    const locationOnly = { address: '1 rue Test', city: 'Laval', postalCode: 'H7A 1A1' };
    expect(locationStepSchema.safeParse(locationOnly).success).toBe(true);
    expect(contactStepSchema.safeParse(locationOnly).success).toBe(false);
  });
});

describe('normalizers', () => {
  it.each([
    ['(450) 555-0142', '450-555-0142'],
    ['+1 450 555 0142', '450-555-0142'],
    ['4505550142', '450-555-0142'],
    ['1-450-555-0142', '450-555-0142'],
  ])('normalizes phone %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each([
    ['j4w2k3', 'J4W 2K3'],
    ['J4W 2K3', 'J4W 2K3'],
    ['j4w-2k3', 'J4W 2K3'],
  ])('normalizes postal code %s', (input, expected) => {
    expect(normalizePostalCode(input)).toBe(expected);
  });
});
