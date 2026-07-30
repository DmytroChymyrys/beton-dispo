/**
 * Canonical option values for a quote request.
 *
 * Single source of truth: the Postgres enums (`src/db/schema.ts`), the Zod
 * validation (`src/lib/quote-schema.ts`) and the form UI all read from here, so
 * a value can never exist in one layer and not another.
 *
 * Values are locale-independent codes. Labels live in the dictionaries under
 * `quote.options`, keyed by these same codes.
 *
 * This module must stay free of server-only imports — it is bundled into the
 * client form.
 */

export const CUSTOMER_TYPES = ['BUSINESS', 'INDIVIDUAL'] as const;
export type CustomerType = (typeof CUSTOMER_TYPES)[number];

export const CONTACT_METHODS = ['PHONE', 'SMS', 'EMAIL'] as const;
export type ContactMethod = (typeof CONTACT_METHODS)[number];

export const PROJECT_TYPES = [
  'FOUNDATION',
  'SLAB',
  'GARAGE',
  'POOL',
  'LANDSCAPING',
  'COMMERCIAL',
  'REPAIR',
  'OTHER',
] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const CONCRETE_STRENGTHS = [
  'UNKNOWN',
  'MPA_25',
  'MPA_30',
  'MPA_32',
  'MPA_35',
  'OTHER',
] as const;
export type ConcreteStrength = (typeof CONCRETE_STRENGTHS)[number];

/** Yes / No / I don't know. Customers are never forced to guess. */
export const TRI_STATES = ['YES', 'NO', 'UNKNOWN'] as const;
export type TriState = (typeof TRI_STATES)[number];

export const PREFERRED_TIMES = ['MORNING', 'AFTERNOON', 'FLEXIBLE'] as const;
export type PreferredTime = (typeof PREFERRED_TIMES)[number];

export const QUOTE_STATUSES = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'QUOTING',
  'OFFER_SENT',
  'WON',
  'LOST',
  'INVALID',
] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

/** Statuses an operator treats as a real, workable lead. */
export const QUALIFIED_STATUSES = [
  'QUALIFIED',
  'QUOTING',
  'OFFER_SENT',
  'WON',
] as const satisfies readonly QuoteStatus[];

export const LOCALES = ['fr', 'en'] as const;
