'use client';

import { useActionState } from 'react';
import { updateSupplierApplicationAction, type UpdateState } from '@/app/admin/actions';
import type { AdminLocale } from '@/app/admin/i18n';
import { buttonClass } from '@/components/ui/button-styles';
import {
  SUPPLIER_APPLICATION_STATUSES,
  SUPPLIER_APPLICATION_STATUS_LABELS,
  type SupplierApplicationStatus,
} from '@/lib/supplier-options';

export function SupplierApplicationEditor({
  id,
  status,
  internalNotes,
  locale,
}: {
  id: string;
  status: SupplierApplicationStatus;
  internalNotes: string;
  locale: AdminLocale;
}) {
  const [state, action, pending] = useActionState<UpdateState, FormData>(
    updateSupplierApplicationAction,
    {},
  );
  const labels = SUPPLIER_APPLICATION_STATUS_LABELS[locale];

  return (
    <form action={action} className="rounded-card border-line bg-surface space-y-5 border p-5">
      <input type="hidden" name="id" value={id} />
      <div>
        <label htmlFor="status" className="text-sm font-semibold">
          {locale === 'fr' ? 'Statut' : 'Status'}
        </label>
        <select
          id="status"
          name="status"
          defaultValue={status}
          className="border-line-strong bg-surface mt-2 min-h-11 w-full rounded-lg border px-3"
        >
          {SUPPLIER_APPLICATION_STATUSES.map((option) => (
            <option key={option} value={option}>
              {labels[option]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="internalNotes" className="text-sm font-semibold">
          {locale === 'fr' ? 'Notes internes' : 'Internal notes'}
        </label>
        <textarea
          id="internalNotes"
          name="internalNotes"
          defaultValue={internalNotes}
          rows={8}
          className="border-line-strong bg-surface mt-2 w-full rounded-lg border px-3 py-2"
        />
      </div>
      {state.error ? (
        <p className="text-danger text-sm font-semibold">
          {locale === 'fr' ? 'La mise à jour a échoué.' : 'The update failed.'}
        </p>
      ) : null}
      {state.savedAt ? (
        <p className="text-success text-sm font-semibold">
          {locale === 'fr' ? 'Enregistré.' : 'Saved.'}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className={buttonClass('primary', 'md', 'w-full')}>
        {pending
          ? locale === 'fr'
            ? 'Enregistrement…'
            : 'Saving…'
          : locale === 'fr'
            ? 'Enregistrer'
            : 'Save'}
      </button>
    </form>
  );
}
