import frMessages from '@/messages/fr.json';
import enMessages from '@/messages/en.json';
import type { AdminLocale } from '@/app/admin/i18n';
import type { QuoteStatus } from '@/lib/quote-options';

/*
 * This module is imported by client components, so it reads the static message
 * files directly rather than through `getDictionary`, which is server-only.
 * Option labels are reused from the public dictionaries so an option never ends
 * up with two different names; only the workflow vocabulary is defined here.
 */
export const frOptions = frMessages.quote.options;
export const enOptions = enMessages.quote.options;

export function adminOptions(locale: AdminLocale) {
  return locale === 'en' ? enOptions : frOptions;
}

export const STATUS_LABELS: Record<AdminLocale, Record<QuoteStatus, string>> = {
  fr: {
    NEW: 'Nouvelle',
    CONTACTED: 'Contactée',
    QUALIFIED: 'Qualifiée',
    QUOTING: 'En recherche',
    OFFER_SENT: 'Option envoyée',
    WON: 'Gagnée',
    LOST: 'Perdue',
    INVALID: 'Non valide',
  },
  en: {
    NEW: 'New',
    CONTACTED: 'Contacted',
    QUALIFIED: 'Qualified',
    QUOTING: 'Searching',
    OFFER_SENT: 'Option sent',
    WON: 'Won',
    LOST: 'Lost',
    INVALID: 'Invalid',
  },
};

/** Badge colours. Won/lost read at a glance; everything else stays neutral. */
export const STATUS_CLASSES: Record<QuoteStatus, string> = {
  NEW: 'bg-accent-tint text-accent border-accent/30',
  CONTACTED: 'bg-surface-sunken text-ink-soft border-line-strong',
  QUALIFIED: 'bg-surface-sunken text-ink-soft border-line-strong',
  QUOTING: 'bg-surface-sunken text-ink-soft border-line-strong',
  OFFER_SENT: 'bg-surface-sunken text-ink-soft border-line-strong',
  WON: 'bg-success/10 text-success border-success/30',
  LOST: 'bg-danger/10 text-danger border-danger/30',
  INVALID: 'bg-surface-sunken text-ink-muted border-line-strong',
};

export function formatVolume(value: string | null, unknown: boolean, locale: AdminLocale): string {
  if (unknown || !value) return locale === 'en' ? 'Unknown' : 'Inconnu';
  const n = Number(value);
  const formatted = Number.isInteger(n)
    ? String(n)
    : n.toLocaleString(locale === 'en' ? 'en-CA' : 'fr-CA', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
  return `${formatted} m³`;
}

export function formatDateTime(value: Date, locale: AdminLocale): string {
  return value.toLocaleString(locale === 'en' ? 'en-CA' : 'fr-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatPercent(fraction: number, locale: AdminLocale): string {
  if (locale === 'en') return `${Math.round(fraction * 100)}%`;
  return `${Math.round(fraction * 100)} %`;
}
