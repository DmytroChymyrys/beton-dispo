'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/server/auth';
import { testGoogleAdsConnection } from '@/lib/google-ads/client';
import { processOfflineConversions } from '@/lib/google-ads/conversions';
import { syncGoogleAdsPerformance } from '@/lib/google-ads/reporting';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function datePart(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

const syncSchema = z.object({
  range: z.enum(['7d', '30d', 'custom']).default('7d'),
  startDate: z.string().regex(ISO_DATE).optional().or(z.literal('')),
  endDate: z.string().regex(ISO_DATE).optional().or(z.literal('')),
});

export async function testGoogleAdsConnectionAction(): Promise<void> {
  await requireAdmin();
  const result = await testGoogleAdsConnection();
  console.info('google_ads.connection.tested', {
    configured: result.configured,
    connected: result.connected,
    customerId: result.customerId,
    errorCode: result.errorCode,
    errorMessage: result.errorMessage,
  });
  revalidatePath('/admin/integrations/google-ads');
}

export async function syncGoogleAdsAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = syncSchema.safeParse({
    range: formData.get('range') ?? '7d',
    startDate: formData.get('startDate') ?? '',
    endDate: formData.get('endDate') ?? '',
  });
  if (!parsed.success) return;

  const today = new Date();
  const yesterday = addDays(today, -1);
  let startDate = datePart(addDays(today, -7));
  let endDate = datePart(yesterday);

  if (parsed.data.range === '30d') {
    startDate = datePart(addDays(today, -30));
  } else if (parsed.data.range === 'custom') {
    if (!parsed.data.startDate || !parsed.data.endDate) {
      return;
    }
    startDate = parsed.data.startDate;
    endDate = parsed.data.endDate;
  }

  const summary = await syncGoogleAdsPerformance({ startDate, endDate, initiatedBy: 'admin' });
  console.info('google_ads.reporting.manual_sync_finished', {
    status: summary.status,
    rowsUpserted: summary.rowsUpserted,
    errorCode: summary.errorCode,
    errorMessage: summary.sanitizedError,
  });
  revalidatePath('/admin/analytics');
  revalidatePath('/admin/integrations/google-ads');
}

export async function processOfflineConversionsAction(): Promise<void> {
  await requireAdmin();
  const summary = await processOfflineConversions(50);
  console.info('google_ads.conversion.queue_processed', summary);
  revalidatePath('/admin/integrations/google-ads');
}
