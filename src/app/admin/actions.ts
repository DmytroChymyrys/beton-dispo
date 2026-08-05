'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createSession, destroySession, requireAdmin, verifyCredentials } from '@/server/auth';
import { updateQuoteRequest } from '@/server/admin-queries';
import { QUOTE_STATUSES } from '@/lib/quote-options';

export type SignInState = {
  error?: 'invalid';
  /**
   * Echoed back so a failed attempt doesn't wipe the field the operator
   * already typed. The password is deliberately never returned.
   */
  email?: string;
};

const credentialsSchema = z.object({
  email: z.string().trim().min(1).max(254),
  password: z.string().min(1).max(200),
});

export async function signInAction(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  // One generic message for every failure: never reveal whether the email
  // exists or only the password was wrong.
  if (!parsed.success || !verifyCredentials(parsed.data)) {
    return {
      error: 'invalid',
      email: typeof formData.get('email') === 'string' ? String(formData.get('email')) : '',
    };
  }

  await createSession();
  redirect('/admin');
}

export async function signOutAction(): Promise<void> {
  await destroySession();
  redirect('/admin/login');
}

const updateSchema = z.object({
  id: z.uuid(),
  status: z.enum(QUOTE_STATUSES),
  internalNotes: z.string().trim().max(5000),
  lostReason: z.string().trim().max(500),
  estimatedJobValueCad: z.string().trim().max(16),
  finalJobValueCad: z.string().trim().max(16),
  betondispoRevenueCad: z.string().trim().max(16),
  supplierSelected: z.string().trim().max(160),
  serviceDate: z.string().trim().max(10),
});

export type UpdateState = { error?: 'validation' | 'server'; savedAt?: number };

function moneyOrNull(value: string): string | null {
  if (!value) return null;
  const normalized = value.replace(',', '.');
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(normalized)) return 'invalid';
  return Number(normalized).toFixed(2);
}

function dateOrNull(value: string): string | null {
  if (!value) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : 'invalid';
}

export async function updateRequestAction(
  _prev: UpdateState,
  formData: FormData,
): Promise<UpdateState> {
  // Server actions are their own HTTP entry point — re-check auth here, not
  // just in the layout that rendered the form.
  await requireAdmin();

  const parsed = updateSchema.safeParse({
    id: formData.get('id'),
    status: formData.get('status'),
    internalNotes: formData.get('internalNotes') ?? '',
    lostReason: formData.get('lostReason') ?? '',
    estimatedJobValueCad: formData.get('estimatedJobValueCad') ?? '',
    finalJobValueCad: formData.get('finalJobValueCad') ?? '',
    betondispoRevenueCad: formData.get('betondispoRevenueCad') ?? '',
    supplierSelected: formData.get('supplierSelected') ?? '',
    serviceDate: formData.get('serviceDate') ?? '',
  });

  if (!parsed.success) {
    return { error: 'validation' };
  }

  const {
    id,
    status,
    internalNotes,
    lostReason,
    estimatedJobValueCad,
    finalJobValueCad,
    betondispoRevenueCad,
    supplierSelected,
    serviceDate,
  } = parsed.data;
  const estimatedValue = moneyOrNull(estimatedJobValueCad);
  const finalValue = moneyOrNull(finalJobValueCad);
  const revenueValue = moneyOrNull(betondispoRevenueCad);
  const serviceDateValue = dateOrNull(serviceDate);

  if (
    estimatedValue === 'invalid' ||
    finalValue === 'invalid' ||
    revenueValue === 'invalid' ||
    serviceDateValue === 'invalid'
  ) {
    return { error: 'validation' };
  }

  try {
    await updateQuoteRequest(id, {
      status,
      internalNotes: internalNotes || null,
      // A lost reason only means anything on a lost request.
      lostReason: status === 'LOST' ? lostReason || null : null,
      estimatedJobValueCad: estimatedValue,
      finalJobValueCad: finalValue,
      betondispoRevenueCad: revenueValue,
      supplierSelected: supplierSelected || null,
      serviceDate: serviceDateValue,
    });
  } catch (error) {
    console.error('[admin] update failed', {
      id,
      error: error instanceof Error ? error.message : 'unknown error',
    });
    return { error: 'server' };
  }

  revalidatePath('/admin');
  revalidatePath('/admin/requests');
  revalidatePath(`/admin/requests/${id}`);

  return { savedAt: Date.now() };
}
