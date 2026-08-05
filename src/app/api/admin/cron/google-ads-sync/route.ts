import { NextResponse } from 'next/server';
import { syncGoogleAdsPerformance } from '@/lib/google-ads/reporting';

export const dynamic = 'force-dynamic';

function datePart(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function authorized(request: Request): boolean {
  const secret = process.env.ADMIN_CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get('authorization');
  return header === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const now = new Date();
  const summary = await syncGoogleAdsPerformance({
    startDate: datePart(addDays(now, -7)),
    endDate: datePart(addDays(now, -1)),
    initiatedBy: 'cron',
  });

  return NextResponse.json({
    ok: summary.status === 'SUCCEEDED',
    rowsUpserted: summary.rowsUpserted,
    status: summary.status,
    errorCode: summary.errorCode,
  });
}
