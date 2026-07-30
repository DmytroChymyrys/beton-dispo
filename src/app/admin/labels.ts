import frMessages from '@/messages/fr.json';
import type { QuoteStatus } from '@/lib/quote-options';

/*
 * The admin is internal and single-language (French), unlike the public site.
 *
 * This module is imported by client components, so it reads the French
 * messages directly rather than through `getDictionary`, which is server-only.
 * Option labels are reused from that dictionary so an option never ends up with
 * two different names; only the workflow vocabulary is defined here.
 */
export const frOptions = frMessages.quote.options;

export const STATUS_LABELS: Record<QuoteStatus, string> = {
  NEW: 'Nouvelle',
  CONTACTED: 'Contactée',
  QUALIFIED: 'Qualifiée',
  QUOTING: 'En recherche',
  OFFER_SENT: 'Option envoyée',
  WON: 'Gagnée',
  LOST: 'Perdue',
  INVALID: 'Non valide',
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

export function formatVolume(value: string | null, unknown: boolean): string {
  if (unknown || !value) return 'Inconnu';
  const n = Number(value);
  return `${Number.isInteger(n) ? n : n.toFixed(2).replace('.', ',')} m³`;
}

export function formatDateTime(value: Date): string {
  return value.toLocaleString('fr-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatPercent(fraction: number): string {
  return `${Math.round(fraction * 100)} %`;
}
