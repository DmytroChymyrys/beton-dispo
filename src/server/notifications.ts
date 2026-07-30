import 'server-only';

import { Resend } from 'resend';
import { getDictionary } from '@/i18n/dictionaries';
import type { QuoteRequest } from '@/db/schema';
import { absoluteUrl } from '@/lib/site';

/**
 * Internal notification for a new quote request.
 *
 * Written in French: the recipient is the internal Québec operator, not the
 * customer. The customer's own language is included as a field so the operator
 * knows which language to reply in.
 *
 * Sending must never be able to lose a lead — see `sendQuoteNotification`.
 */

let client: Resend | null = null;

function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  client ??= new Resend(apiKey);
  return client;
}

function recipients(): string[] {
  return (process.env.QUOTE_NOTIFICATION_EMAIL ?? '')
    .split(',')
    .map((address) => address.trim())
    .filter(Boolean);
}

function volumeLabel(request: QuoteRequest): string {
  if (request.volumeUnknown || !request.estimatedVolumeM3) return 'volume inconnu';
  // Trim the trailing ".00" that numeric(7,2) always carries.
  const value = Number(request.estimatedVolumeM3);
  const formatted = Number.isInteger(value) ? String(value) : value.toFixed(2).replace('.', ',');
  return `${formatted} m³`;
}

export function notificationSubject(request: QuoteRequest): string {
  return `Nouvelle demande BétonDispo — ${request.city} — ${volumeLabel(request)}`;
}

type Row = { label: string; value: string };

function buildRows(request: QuoteRequest): Row[] {
  const fr = getDictionary('fr').quote.options;
  const dash = '—';

  const rows: Row[] = [
    { label: 'Numéro', value: request.publicId },
    { label: 'Reçue le', value: request.createdAt.toLocaleString('fr-CA') },
    { label: 'Langue du client', value: request.locale === 'fr' ? 'Français' : 'Anglais' },
    { label: 'Type de client', value: fr.customerType[request.customerType] },
    { label: 'Nom', value: request.name },
  ];

  if (request.companyName) rows.push({ label: 'Entreprise', value: request.companyName });

  rows.push(
    { label: 'Téléphone', value: request.phone },
    { label: 'Courriel', value: request.email },
    { label: 'Contact préféré', value: fr.contactMethod[request.preferredContactMethod] },
    { label: 'Adresse', value: request.address },
    { label: 'Ville', value: `${request.city} ${request.postalCode}` },
    { label: 'Projet', value: fr.projectType[request.projectType] },
    { label: 'Quantité', value: volumeLabel(request) },
    { label: 'Spécification', value: fr.concreteStrength[request.concreteStrength] },
    { label: 'Pompe', value: fr.pumpRequired[request.pumpRequired] },
  );

  if (request.pumpNotes) rows.push({ label: 'Notes pompage', value: request.pumpNotes });

  rows.push({
    label: 'Date souhaitée',
    value: `${request.desiredDate}${
      request.preferredTime ? ` (${fr.preferredTime[request.preferredTime]})` : ''
    }${request.scheduleFlexible ? ' — échéancier flexible' : ''}`,
  });

  if (request.accessNotes) rows.push({ label: 'Accès', value: request.accessNotes });
  if (request.additionalNotes) rows.push({ label: 'Détails', value: request.additionalNotes });

  const source = [request.utmSource, request.utmMedium, request.utmCampaign]
    .filter(Boolean)
    .join(' / ');
  rows.push({ label: 'Source', value: source || request.referrer || dash });

  return rows;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function notificationText(request: QuoteRequest): string {
  const rows = buildRows(request);
  const link = absoluteUrl(`/admin/requests/${request.id}`);
  return [
    `Nouvelle demande — ${request.publicId}`,
    '',
    ...rows.map((row) => `${row.label}: ${row.value}`),
    '',
    `Ouvrir dans l'admin: ${link}`,
  ].join('\n');
}

export function notificationHtml(request: QuoteRequest): string {
  const rows = buildRows(request);
  const link = absoluteUrl(`/admin/requests/${request.id}`);

  const body = rows
    .map(
      (row) =>
        `<tr>` +
        `<td style="padding:6px 16px 6px 0;color:#5f6570;font-size:13px;white-space:nowrap;vertical-align:top">${escapeHtml(row.label)}</td>` +
        `<td style="padding:6px 0;color:#17181c;font-size:14px">${escapeHtml(row.value).replace(/\n/g, '<br>')}</td>` +
        `</tr>`,
    )
    .join('');

  return `<!doctype html>
<html lang="fr"><body style="margin:0;background:#f8f7f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
<div style="max-width:640px;margin:0 auto;padding:24px">
  <p style="margin:0 0 4px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#c2410c;font-weight:700">Nouvelle demande</p>
  <h1 style="margin:0 0 20px;font-size:26px;color:#17181c">${escapeHtml(request.publicId)} — ${escapeHtml(request.city)}</h1>
  <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e2dfda;border-radius:8px;padding:12px">
    ${body}
  </table>
  <p style="margin:24px 0 0">
    <a href="${link}" style="display:inline-block;background:#c2410c;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">Ouvrir dans l'admin</a>
  </p>
</div>
</body></html>`;
}

export type NotificationResult =
  { sent: true } | { sent: false; reason: 'not-configured' | 'failed' };

/**
 * Sends the internal notification.
 *
 * Never throws. The lead is already in Postgres by the time this runs, and a
 * transient email failure must not be reported to the customer as a failed
 * submission — it is logged instead so it can be picked up from the admin list.
 */
export async function sendQuoteNotification(request: QuoteRequest): Promise<NotificationResult> {
  const resend = getClient();
  const to = recipients();
  const from = process.env.QUOTE_NOTIFICATION_FROM;

  if (!resend || to.length === 0 || !from) {
    console.warn('[quote] notification skipped: email is not configured', {
      publicId: request.publicId,
      hasApiKey: Boolean(resend),
      hasRecipients: to.length > 0,
      hasFrom: Boolean(from),
    });
    return { sent: false, reason: 'not-configured' };
  }

  try {
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: request.email,
      subject: notificationSubject(request),
      text: notificationText(request),
      html: notificationHtml(request),
    });

    if (error) {
      console.error('[quote] notification failed', {
        publicId: request.publicId,
        error: error.message,
      });
      return { sent: false, reason: 'failed' };
    }

    return { sent: true };
  } catch (error) {
    console.error('[quote] notification threw', {
      publicId: request.publicId,
      error: error instanceof Error ? error.message : 'unknown error',
    });
    return { sent: false, reason: 'failed' };
  }
}
