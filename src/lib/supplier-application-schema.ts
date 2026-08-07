import { z } from 'zod';
import { LOCALES } from '@/lib/quote-options';
import { normalizePhone } from '@/lib/quote-schema';
import { SUPPLIER_SERVICE_CODES } from '@/lib/supplier-options';

const key = (k: string) => ({ message: k });
const trimmed = (max: number) => z.string().trim().max(max, key('tooLong'));

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

function normalizeWebsite(value: string): string {
  const trimmedValue = value.trim();
  if (!trimmedValue) return '';
  const withProtocol = /^https?:\/\//i.test(trimmedValue)
    ? trimmedValue
    : `https://${trimmedValue}`;
  try {
    const url = new URL(withProtocol);
    if (!['http:', 'https:'].includes(url.protocol)) return trimmedValue;
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return trimmedValue;
  }
}

const attributionShape = {
  gclid: trimmed(256).optional().or(z.literal('')),
  msclkid: trimmed(256).optional().or(z.literal('')),
  fbclid: trimmed(256).optional().or(z.literal('')),
  utmSource: trimmed(120).optional().or(z.literal('')),
  utmMedium: trimmed(120).optional().or(z.literal('')),
  utmCampaign: trimmed(160).optional().or(z.literal('')),
  utmTerm: trimmed(160).optional().or(z.literal('')),
  utmContent: trimmed(160).optional().or(z.literal('')),
  referrer: trimmed(512).optional().or(z.literal('')),
  landingPage: trimmed(512).optional().or(z.literal('')),
  firstTouchSource: trimmed(120).optional().or(z.literal('')),
  firstTouchMedium: trimmed(120).optional().or(z.literal('')),
  firstTouchCampaign: trimmed(160).optional().or(z.literal('')),
  firstTouchTerm: trimmed(160).optional().or(z.literal('')),
  firstTouchContent: trimmed(160).optional().or(z.literal('')),
  firstTouchLandingPage: trimmed(512).optional().or(z.literal('')),
  firstTouchReferrer: trimmed(512).optional().or(z.literal('')),
  firstTouchTimestamp: trimmed(40).optional().or(z.literal('')),
  lastTouchSource: trimmed(120).optional().or(z.literal('')),
  lastTouchMedium: trimmed(120).optional().or(z.literal('')),
  lastTouchCampaign: trimmed(160).optional().or(z.literal('')),
  lastTouchTerm: trimmed(160).optional().or(z.literal('')),
  lastTouchContent: trimmed(160).optional().or(z.literal('')),
  lastTouchLandingPage: trimmed(512).optional().or(z.literal('')),
  lastTouchReferrer: trimmed(512).optional().or(z.literal('')),
  lastTouchTimestamp: trimmed(40).optional().or(z.literal('')),
  submissionPage: trimmed(512).optional().or(z.literal('')),
  deviceCategory: z.enum(['mobile', 'tablet', 'desktop']).optional().or(z.literal('')),
  browserLanguage: trimmed(80).optional().or(z.literal('')),
};

export const supplierApplicationSubmission = z
  .object({
    locale: z.enum(LOCALES),
    companyName: trimmed(160).min(2, key('companyNameRequired')),
    contactName: trimmed(120).min(2, key('contactNameRequired')),
    email: trimmed(254)
      .min(1, key('emailRequired'))
      .pipe(z.email(key('emailInvalid'))),
    phone: trimmed(32)
      .min(1, key('phoneRequired'))
      .refine((value) => {
        const digits = digitsOnly(value);
        return digits.length === 10 || (digits.length === 11 && digits.startsWith('1'));
      }, key('phoneInvalid')),
    website: trimmed(255)
      .optional()
      .or(z.literal(''))
      .transform((value) => normalizeWebsite(value ?? ''))
      .refine((value) => {
        if (!value) return true;
        try {
          const url = new URL(value);
          return ['http:', 'https:'].includes(url.protocol);
        } catch {
          return false;
        }
      }, key('websiteInvalid')),
    serviceAreaText: trimmed(500).min(2, key('serviceAreaRequired')),
    services: z.array(z.enum(SUPPLIER_SERVICE_CODES)).min(1, key('servicesRequired')).max(10),
    message: trimmed(2000).optional().or(z.literal('')),
    consent: z.literal(true, key('consentRequired')),
    websiteUrl: z.literal('', key('spam')),
    formIssuedAt: z
      .string()
      .trim()
      .regex(/^\d{10,16}$/, key('spam')),
    formToken: trimmed(256).min(32, key('spam')),
    ...attributionShape,
  })
  .strict()
  .transform((value) => ({
    ...value,
    email: value.email.trim().toLowerCase(),
    phone: normalizePhone(value.phone),
    companyName: value.companyName.trim(),
    contactName: value.contactName.trim(),
    serviceAreaText: value.serviceAreaText.trim(),
    message: value.message?.trim() ?? '',
  }));

export type SupplierApplicationSubmissionInput = z.input<typeof supplierApplicationSubmission>;
export type SupplierApplicationSubmission = z.output<typeof supplierApplicationSubmission>;

export function supplierApplicationFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === 'string' && !out[field]) out[field] = issue.message;
  }
  return out;
}
