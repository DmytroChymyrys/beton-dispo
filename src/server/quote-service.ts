import 'server-only';

import { getDb } from '@/db/client';
import { quoteRequests, type QuoteRequest } from '@/db/schema';
import { normalizePhone, normalizePostalCode, type QuoteSubmission } from '@/lib/quote-schema';

/** Empty optional strings are stored as NULL rather than ''. */
function nullIfBlank(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * Persists a validated quote request and returns the row.
 *
 * The caller is responsible for validation — this function assumes the input
 * already passed `quoteSubmission`. Notification email is sent *after* this
 * resolves, never inside it: a failed email must not lose a lead.
 */
export async function createQuoteRequest(input: QuoteSubmission): Promise<QuoteRequest> {
  const db = await getDb();

  const [row] = await db
    .insert(quoteRequests)
    .values({
      locale: input.locale,

      customerType: input.customerType,
      name: input.name,
      // A company name only means something for a business request.
      companyName: input.customerType === 'BUSINESS' ? nullIfBlank(input.companyName) : null,
      email: input.email.toLowerCase(),
      phone: normalizePhone(input.phone),
      preferredContactMethod: input.preferredContactMethod,

      address: input.address,
      city: input.city,
      postalCode: normalizePostalCode(input.postalCode),
      accessNotes: nullIfBlank(input.accessNotes),

      projectType: input.projectType,
      estimatedVolumeM3: input.estimatedVolumeM3,
      volumeUnknown: input.volumeUnknown,
      concreteStrength: input.concreteStrength,
      pumpRequired: input.pumpRequired,
      // Pump notes are meaningless unless a pump is actually in play.
      pumpNotes: input.pumpRequired === 'NO' ? null : nullIfBlank(input.pumpNotes),

      desiredDate: input.desiredDate,
      preferredTime: input.preferredTime ? input.preferredTime : null,
      scheduleFlexible: input.scheduleFlexible,

      additionalNotes: nullIfBlank(input.additionalNotes),

      utmSource: nullIfBlank(input.utmSource),
      utmMedium: nullIfBlank(input.utmMedium),
      utmCampaign: nullIfBlank(input.utmCampaign),
      utmTerm: nullIfBlank(input.utmTerm),
      utmContent: nullIfBlank(input.utmContent),
      referrer: nullIfBlank(input.referrer),
      landingPage: nullIfBlank(input.landingPage),
    })
    .returning();

  if (!row) throw new Error('Insert returned no row.');
  return row;
}
