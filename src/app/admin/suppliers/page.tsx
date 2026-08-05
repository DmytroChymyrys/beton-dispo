import { requireAdmin } from '@/server/auth';
import { getSupplierAnalytics } from '@/server/admin-queries';
import { getAdminLocale } from '@/app/admin/locale';

export const dynamic = 'force-dynamic';

export default async function SuppliersPage() {
  await requireAdmin();
  const [rows, locale] = await Promise.all([getSupplierAnalytics(), getAdminLocale()]);
  const t = locale === 'fr' ? copy.fr : copy.en;

  return (
    <div className="container-page max-w-[1400px] space-y-6">
      <div>
        <h1 className="text-3xl">{t.title}</h1>
        <p className="text-ink-muted mt-2 max-w-3xl">{t.intro}</p>
      </div>

      <section className="rounded-card border-line bg-surface overflow-x-auto border">
        <table className="w-full min-w-[70rem] text-sm">
          <thead className="text-ink-muted bg-surface-sunken text-left">
            <tr>
              <Th>{t.supplier}</Th>
              <Th>{t.status}</Th>
              <Th>{t.sent}</Th>
              <Th>{t.responded}</Th>
              <Th>{t.responseRate}</Th>
              <Th>{t.medianResponse}</Th>
              <Th>{t.quoted}</Th>
              <Th>{t.accepted}</Th>
              <Th>{t.won}</Th>
              <Th>{t.winRate}</Th>
              <Th>{t.revenue}</Th>
            </tr>
          </thead>
          <tbody className="divide-line divide-y">
            {rows.length ? (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-surface-sunken">
                  <td className="px-4 py-3 font-bold">{row.name}</td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{row.leadsSent}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{row.responded}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {percent(row.responseRate, locale)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {minutes(row.medianResponseMinutes, locale)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{row.quotesSupplied}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{row.acceptedJobs}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{row.wonJobs}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {percent(row.winRate, locale)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {money(row.betondispoRevenueCad, locale)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="text-ink-muted px-4 py-8 text-center" colSpan={11}>
                  {t.empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-xs font-bold tracking-wider uppercase">{children}</th>;
}

function percent(value: number | null, locale: 'fr' | 'en'): string {
  if (value == null) return '—';
  return new Intl.NumberFormat(locale === 'fr' ? 'fr-CA' : 'en-CA', {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(value);
}

function minutes(value: number | null, locale: 'fr' | 'en'): string {
  if (value == null) return '—';
  if (value < 60) return `${Math.round(value)} min`;
  const hours = Math.floor(value / 60);
  const mins = Math.round(value % 60);
  return locale === 'fr' ? `${hours} h ${mins} min` : `${hours} h ${mins} min`;
}

function money(value: number, locale: 'fr' | 'en'): string {
  if (!value) return '—';
  return new Intl.NumberFormat(locale === 'fr' ? 'fr-CA' : 'en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(value);
}

const copy = {
  fr: {
    title: 'Fournisseurs',
    intro:
      'Mesurez les réponses, les devis, les gains et les revenus par fournisseur. Les demandes en attente ne sont pas traitées comme perdues.',
    supplier: 'Fournisseur',
    status: 'Statut',
    sent: 'Envoyées',
    responded: 'Réponses',
    responseRate: 'Taux réponse',
    medianResponse: 'Réponse médiane',
    quoted: 'Devis',
    accepted: 'Acceptées',
    won: 'Gagnées',
    winRate: 'Taux gagné',
    revenue: 'Revenu',
    empty: 'Aucun fournisseur ou assignation pour le moment.',
  },
  en: {
    title: 'Suppliers',
    intro:
      'Measure supplier responses, quotes, wins, and revenue. Pending assignments are not counted as losses.',
    supplier: 'Supplier',
    status: 'Status',
    sent: 'Sent',
    responded: 'Responded',
    responseRate: 'Response rate',
    medianResponse: 'Median response',
    quoted: 'Quotes',
    accepted: 'Accepted',
    won: 'Won',
    winRate: 'Win rate',
    revenue: 'Revenue',
    empty: 'No suppliers or assignments yet.',
  },
} as const;
