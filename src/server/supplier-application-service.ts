import 'server-only';

import { and, eq, gte } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { supplierApplications, type SupplierApplication } from '@/db/schema';
import type { SupplierApplicationSubmission } from '@/lib/supplier-application-schema';
import type { SupplierApplicationStatus } from '@/lib/supplier-options';
import { hashForAbuse } from '@/server/abuse';

function nullIfBlank(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function nullDateIfInvalid(value: string | undefined): Date | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
}

function duplicateFingerprint(input: SupplierApplicationSubmission): string {
  return hashForAbuse(
    [
      input.companyName.trim().toLowerCase(),
      input.email.trim().toLowerCase(),
      input.phone,
      input.serviceAreaText.trim().toLowerCase(),
      [...input.services].sort().join(','),
    ].join('|'),
  );
}

function recentDuplicateCutoff(): Date {
  return new Date(Date.now() - 24 * 60 * 60 * 1000);
}

export type SupplierApplicationMetadata = {
  sourceIpHash: string | null;
  abuseStatus?: 'clean' | 'suspect';
};

export async function createSupplierApplication(
  input: SupplierApplicationSubmission,
  metadata: SupplierApplicationMetadata,
): Promise<{ row: SupplierApplication; duplicate: boolean }> {
  const db = await getDb();
  const fingerprint = duplicateFingerprint(input);

  const [duplicate] = await db
    .select()
    .from(supplierApplications)
    .where(
      and(
        eq(supplierApplications.duplicateFingerprint, fingerprint),
        gte(supplierApplications.createdAt, recentDuplicateCutoff()),
      ),
    )
    .limit(1);

  if (duplicate) return { row: duplicate, duplicate: true };

  const [row] = await db
    .insert(supplierApplications)
    .values({
      locale: input.locale,
      companyName: input.companyName,
      contactName: input.contactName,
      email: input.email,
      phone: input.phone,
      website: nullIfBlank(input.website),
      serviceAreaText: input.serviceAreaText,
      services: input.services,
      message: nullIfBlank(input.message),
      landingPage: nullIfBlank(input.landingPage),
      referrer: nullIfBlank(input.referrer),
      gclid: nullIfBlank(input.gclid),
      msclkid: nullIfBlank(input.msclkid),
      fbclid: nullIfBlank(input.fbclid),
      utmSource: nullIfBlank(input.utmSource),
      utmMedium: nullIfBlank(input.utmMedium),
      utmCampaign: nullIfBlank(input.utmCampaign),
      utmTerm: nullIfBlank(input.utmTerm),
      utmContent: nullIfBlank(input.utmContent),
      firstTouchSource: nullIfBlank(input.firstTouchSource),
      firstTouchMedium: nullIfBlank(input.firstTouchMedium),
      firstTouchCampaign: nullIfBlank(input.firstTouchCampaign),
      firstTouchTerm: nullIfBlank(input.firstTouchTerm),
      firstTouchContent: nullIfBlank(input.firstTouchContent),
      firstTouchLandingPage: nullIfBlank(input.firstTouchLandingPage),
      firstTouchReferrer: nullIfBlank(input.firstTouchReferrer),
      firstTouchTimestamp: nullDateIfInvalid(input.firstTouchTimestamp),
      lastTouchSource: nullIfBlank(input.lastTouchSource),
      lastTouchMedium: nullIfBlank(input.lastTouchMedium),
      lastTouchCampaign: nullIfBlank(input.lastTouchCampaign),
      lastTouchTerm: nullIfBlank(input.lastTouchTerm),
      lastTouchContent: nullIfBlank(input.lastTouchContent),
      lastTouchLandingPage: nullIfBlank(input.lastTouchLandingPage),
      lastTouchReferrer: nullIfBlank(input.lastTouchReferrer),
      lastTouchTimestamp: nullDateIfInvalid(input.lastTouchTimestamp),
      submissionPage: nullIfBlank(input.submissionPage),
      deviceCategory: nullIfBlank(input.deviceCategory),
      browserLanguage: nullIfBlank(input.browserLanguage),
      sourceIpHash: metadata.sourceIpHash,
      abuseStatus: metadata.abuseStatus ?? 'clean',
      duplicateFingerprint: fingerprint,
    })
    .returning();

  if (!row) throw new Error('Insert returned no row.');
  return { row, duplicate: false };
}

export function statusTimestampPatch(status: SupplierApplicationStatus) {
  const now = new Date();
  if (status === 'CONTACTED') return { firstContactedAt: now };
  if (status === 'QUALIFIED') return { qualifiedAt: now };
  if (status === 'APPROVED') return { approvedAt: now };
  if (status === 'REJECTED') return { rejectedAt: now };
  return {};
}
