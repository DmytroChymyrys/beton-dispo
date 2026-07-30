import type { QuoteStatus } from '@/lib/quote-options';
import { STATUS_CLASSES, STATUS_LABELS } from '@/app/admin/labels';
import type { AdminLocale } from '@/app/admin/i18n';

export function StatusBadge({ status, locale }: { status: QuoteStatus; locale: AdminLocale }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_CLASSES[status]}`}
    >
      {STATUS_LABELS[locale][status]}
    </span>
  );
}
