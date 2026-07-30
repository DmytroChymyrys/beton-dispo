import { z } from 'zod';
import {
  CONCRETE_STRENGTHS,
  CONTACT_METHODS,
  CUSTOMER_TYPES,
  LOCALES,
  PREFERRED_TIMES,
  PROJECT_TYPES,
  TRI_STATES,
} from './quote-options';

/**
 * Validation for a quote request, shared by the browser and the server.
 *
 * The server re-runs the *whole* schema on submit — the client copy exists only
 * to give fast per-step feedback and is never trusted. Error messages are
 * returned as stable keys (`errors.email`), not sentences, so the client can
 * render them in the visitor's language.
 */

/** Every issue is emitted as a dictionary key under `quote.errors`. */
const key = (k: string) => ({ message: k });

const trimmed = (max: number) => z.string().trim().max(max, key('tooLong'));

/**
 * Canadian postal code, with or without the middle space. Deliberately not
 * restricted to Québec's G/H/J prefixes: a contractor may pour just across a
 * regional boundary and we would rather receive that lead than reject it.
 */
const POSTAL_CODE = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d$/i;

/** 10 North American digits, optionally prefixed with a 1, in any punctuation. */
function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

export const MAX_VOLUME_M3 = 2000;
export const MIN_VOLUME_M3 = 0.1;

/** Requests further out than this are almost certainly a typo in the year. */
export const MAX_DAYS_AHEAD = 730;

/* -------------------------------------------------------------------------- */
/* Steps                                                                       */
/* -------------------------------------------------------------------------- */

const locationShape = {
  address: trimmed(240).min(3, key('addressRequired')),
  city: trimmed(120).min(2, key('cityRequired')),
  postalCode: trimmed(12)
    .min(1, key('postalCodeRequired'))
    .refine((v) => POSTAL_CODE.test(v), key('postalCodeInvalid')),
  accessNotes: trimmed(1000).optional().or(z.literal('')),
};

export const locationStepSchema = z.object(locationShape);

const projectShape = {
  projectType: z.enum(PROJECT_TYPES, key('projectTypeRequired')),
  volumeUnknown: z.boolean(),
  /** Empty string when the visitor selected "I don't know". */
  estimatedVolumeM3: z.string().trim(),
  concreteStrength: z.enum(CONCRETE_STRENGTHS, key('concreteStrengthRequired')),
  pumpRequired: z.enum(TRI_STATES, key('pumpRequiredRequired')),
  pumpNotes: trimmed(500).optional().or(z.literal('')),
};

export const projectStepSchema = z.object(projectShape).superRefine((value, ctx) => {
  if (value.volumeUnknown) return;

  if (value.estimatedVolumeM3 === '') {
    ctx.addIssue({
      code: 'custom',
      path: ['estimatedVolumeM3'],
      message: 'volumeRequired',
    });
    return;
  }

  const parsed = Number(value.estimatedVolumeM3.replace(',', '.'));
  if (!Number.isFinite(parsed)) {
    ctx.addIssue({ code: 'custom', path: ['estimatedVolumeM3'], message: 'volumeInvalid' });
    return;
  }
  if (parsed < MIN_VOLUME_M3 || parsed > MAX_VOLUME_M3) {
    ctx.addIssue({ code: 'custom', path: ['estimatedVolumeM3'], message: 'volumeRange' });
  }
});

const scheduleShape = {
  desiredDate: z
    .string()
    .trim()
    .min(1, key('desiredDateRequired'))
    .regex(/^\d{4}-\d{2}-\d{2}$/, key('desiredDateInvalid')),
  preferredTime: z.enum(PREFERRED_TIMES).optional().or(z.literal('')),
  scheduleFlexible: z.boolean(),
};

export const scheduleStepSchema = z.object(scheduleShape).superRefine((value, ctx) => {
  const date = new Date(`${value.desiredDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    ctx.addIssue({ code: 'custom', path: ['desiredDate'], message: 'desiredDateInvalid' });
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) {
    ctx.addIssue({ code: 'custom', path: ['desiredDate'], message: 'desiredDatePast' });
    return;
  }

  const limit = new Date(today);
  limit.setDate(limit.getDate() + MAX_DAYS_AHEAD);
  if (date > limit) {
    ctx.addIssue({ code: 'custom', path: ['desiredDate'], message: 'desiredDateFar' });
  }
});

const contactShape = {
  customerType: z.enum(CUSTOMER_TYPES, key('customerTypeRequired')),
  name: trimmed(120).min(2, key('nameRequired')),
  companyName: trimmed(160).optional().or(z.literal('')),
  email: trimmed(254)
    .min(1, key('emailRequired'))
    .pipe(z.email(key('emailInvalid'))),
  phone: trimmed(32)
    .min(1, key('phoneRequired'))
    .refine((v) => {
      const digits = digitsOnly(v);
      return digits.length === 10 || (digits.length === 11 && digits.startsWith('1'));
    }, key('phoneInvalid')),
  preferredContactMethod: z.enum(CONTACT_METHODS, key('preferredContactRequired')),
  additionalNotes: trimmed(2000).optional().or(z.literal('')),
  consent: z.literal(true, key('consentRequired')),
};

export const contactStepSchema = z.object(contactShape).superRefine((value, ctx) => {
  // SMS only makes sense on a mobile-reachable number; we cannot verify that,
  // so this only guards the obviously-contradictory case of no phone at all.
  if (value.preferredContactMethod !== 'EMAIL' && digitsOnly(value.phone).length === 0) {
    ctx.addIssue({ code: 'custom', path: ['phone'], message: 'phoneRequired' });
  }
});

/* -------------------------------------------------------------------------- */
/* Attribution + anti-spam                                                     */
/* -------------------------------------------------------------------------- */

const attributionShape = {
  utmSource: trimmed(120).optional().or(z.literal('')),
  utmMedium: trimmed(120).optional().or(z.literal('')),
  utmCampaign: trimmed(160).optional().or(z.literal('')),
  utmTerm: trimmed(160).optional().or(z.literal('')),
  utmContent: trimmed(160).optional().or(z.literal('')),
  referrer: trimmed(512).optional().or(z.literal('')),
  landingPage: trimmed(512).optional().or(z.literal('')),
};

/* -------------------------------------------------------------------------- */
/* Full submission                                                             */
/* -------------------------------------------------------------------------- */

export const quoteSubmissionSchema = z
  .object({
    locale: z.enum(LOCALES),
    ...locationShape,
    ...projectShape,
    ...scheduleShape,
    ...contactShape,
    ...attributionShape,
    /**
     * Honeypot. Hidden from sighted users and skipped by assistive technology;
     * only a bot fills it in. Must be empty.
     */
    websiteUrl: z.literal('', key('spam')),
    /** Signed server-issued timing token. Verified only on the server. */
    formIssuedAt: z
      .string()
      .trim()
      .regex(/^\d{10,16}$/, key('spam')),
    formToken: trimmed(256).min(32, key('spam')),
  })
  .strict();

/** Re-applies the cross-field rules that `.shape` spreading drops. */
export const quoteSubmission = quoteSubmissionSchema
  .superRefine((value, ctx) => {
    for (const schema of [projectStepSchema, scheduleStepSchema, contactStepSchema]) {
      const result = schema.safeParse(value);
      if (result.success) continue;
      for (const issue of result.error.issues) {
        // Field-level issues are already reported by the base shape; only the
        // cross-field ones (added in superRefine) need forwarding.
        if (issue.code === 'custom') {
          ctx.addIssue({ code: 'custom', path: issue.path, message: issue.message });
        }
      }
    }
  })
  .transform((value) => ({
    ...value,
    estimatedVolumeM3: value.volumeUnknown
      ? null
      : Number(value.estimatedVolumeM3.replace(',', '.')).toFixed(2),
  }));

export type QuoteSubmissionInput = z.input<typeof quoteSubmission>;
export type QuoteSubmission = z.output<typeof quoteSubmission>;

export const STEP_SCHEMAS = [
  locationStepSchema,
  projectStepSchema,
  scheduleStepSchema,
  contactStepSchema,
] as const;

export type StepIndex = 0 | 1 | 2 | 3;

/** Flattens Zod issues to `{ fieldName: errorKey }` for rendering. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === 'string' && !out[field]) out[field] = issue.message;
  }
  return out;
}

/** Stores phone numbers in a single readable format. */
export function normalizePhone(value: string): string {
  const digits = digitsOnly(value);
  const ten = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  if (ten.length !== 10) return value.trim();
  return `${ten.slice(0, 3)}-${ten.slice(3, 6)}-${ten.slice(6)}`;
}

/** Uppercases and spaces a Canadian postal code: "j4w2k3" -> "J4W 2K3". */
export function normalizePostalCode(value: string): string {
  const compact = value.replace(/[\s-]/g, '').toUpperCase();
  if (compact.length !== 6) return value.trim().toUpperCase();
  return `${compact.slice(0, 3)} ${compact.slice(3)}`;
}
