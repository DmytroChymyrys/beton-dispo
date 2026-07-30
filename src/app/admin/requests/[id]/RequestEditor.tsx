'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { updateRequestAction, type UpdateState } from '@/app/admin/actions';
import { STATUS_LABELS } from '@/app/admin/labels';
import { adminText, type AdminLocale } from '@/app/admin/i18n';
import { QUOTE_STATUSES, type QuoteStatus } from '@/lib/quote-options';
import { buttonClass } from '@/components/ui/button-styles';

const controlClass =
  'w-full min-h-11 rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink';

/**
 * The operator's working panel: status, internal notes, and — when a request is
 * marked lost — why. Nothing here is ever rendered on the public site.
 */
export function RequestEditor({
  id,
  status,
  internalNotes,
  lostReason,
  locale,
}: {
  id: string;
  status: QuoteStatus;
  internalNotes: string;
  lostReason: string;
  locale: AdminLocale;
}) {
  const [state, formAction] = useActionState<UpdateState, FormData>(updateRequestAction, {});
  const [currentStatus, setCurrentStatus] = useState<QuoteStatus>(status);
  const t = adminText[locale].editor;

  return (
    <form
      action={formAction}
      className="rounded-card border-line bg-surface shadow-card space-y-5 border p-5 lg:sticky lg:top-6"
    >
      <input type="hidden" name="id" value={id} />

      <h2 className="text-ink-muted font-display text-xs font-bold tracking-[0.12em] uppercase">
        {t.title}
      </h2>

      <div className="space-y-1.5">
        <label htmlFor="status" className="block text-sm font-semibold">
          {t.status}
        </label>
        <select
          id="status"
          name="status"
          value={currentStatus}
          onChange={(e) => setCurrentStatus(e.target.value as QuoteStatus)}
          className={controlClass}
        >
          {QUOTE_STATUSES.map((value) => (
            <option key={value} value={value}>
              {STATUS_LABELS[locale][value]}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-2 pt-1">
          <QuickStatus
            current={currentStatus}
            value="WON"
            label={t.markWon}
            onSelect={setCurrentStatus}
          />
          <QuickStatus
            current={currentStatus}
            value="LOST"
            label={t.markLost}
            onSelect={setCurrentStatus}
          />
        </div>
      </div>

      {/* A lost reason is only meaningful on a lost request, and the server
          clears it for any other status. */}
      {currentStatus === 'LOST' ? (
        <div className="space-y-1.5">
          <label htmlFor="lostReason" className="block text-sm font-semibold">
            {t.lostReason}
          </label>
          <input
            id="lostReason"
            name="lostReason"
            defaultValue={lostReason}
            maxLength={500}
            placeholder={t.lostReasonPlaceholder}
            className={controlClass}
          />
        </div>
      ) : (
        <input type="hidden" name="lostReason" value="" />
      )}

      <div className="space-y-1.5">
        <label htmlFor="internalNotes" className="block text-sm font-semibold">
          {t.internalNotes}
        </label>
        <textarea
          id="internalNotes"
          name="internalNotes"
          rows={8}
          maxLength={5000}
          defaultValue={internalNotes}
          placeholder={t.internalNotesPlaceholder}
          className={`${controlClass} min-h-40 resize-y`}
        />
      </div>

      <div aria-live="polite" className="min-h-5">
        {state.error ? (
          <p className="text-danger text-sm font-medium">
            {state.error === 'validation' ? t.validationError : t.serverError}
          </p>
        ) : null}
        {state.savedAt ? (
          <p className="text-success text-sm font-medium">{t.saved}</p>
        ) : null}
      </div>

      <SaveButton save={t.save} saving={t.saving} />
    </form>
  );
}

function QuickStatus({
  current,
  value,
  label,
  onSelect,
}: {
  current: QuoteStatus;
  value: Extract<QuoteStatus, 'WON' | 'LOST'>;
  label: string;
  onSelect: (status: QuoteStatus) => void;
}) {
  const active = current === value;
  const tone =
    value === 'WON'
      ? 'border-success/40 text-success hover:bg-success/10'
      : 'border-danger/40 text-danger hover:bg-danger/10';
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      aria-pressed={active}
      className={`inline-flex min-h-10 items-center rounded-lg border px-3 text-sm font-semibold ${tone} ${
        active ? 'ring-accent ring-2' : ''
      }`}
    >
      {label}
    </button>
  );
}

function SaveButton({ save, saving }: { save: string; saving: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClass('primary', 'md', 'w-full')}>
      {pending ? saving : save}
    </button>
  );
}
