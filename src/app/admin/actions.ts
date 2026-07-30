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
});

export type UpdateState = { error?: 'validation' | 'server'; savedAt?: number };

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
  });

  if (!parsed.success) {
    return { error: 'validation' };
  }

  const { id, status, internalNotes, lostReason } = parsed.data;

  try {
    await updateQuoteRequest(id, {
      status,
      internalNotes: internalNotes || null,
      // A lost reason only means anything on a lost request.
      lostReason: status === 'LOST' ? lostReason || null : null,
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
