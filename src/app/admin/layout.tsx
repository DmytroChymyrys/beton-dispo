import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AdminLanguageToggle } from '@/app/admin/AdminLanguageToggle';
import { isAuthenticated } from '@/server/auth';
import { signOutAction } from '@/app/admin/actions';
import { archivo, inter } from '@/app/fonts';
import { adminText } from '@/app/admin/i18n';
import { getAdminLocale } from '@/app/admin/locale';
import '@/app/globals.css';

/**
 * Document shell for the internal admin.
 *
 * The root layout is a pass-through, so this renders its own `<html>`. It is
 * deliberately *not* the auth guard: `/admin/login` lives underneath it, and a
 * guard here would redirect the sign-in page to itself. Each page and each
 * server action calls `requireAdmin()` instead.
 */
export const metadata: Metadata = {
  title: 'Admin — BétonDispo',
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const [signedIn, locale] = await Promise.all([isAuthenticated(), getAdminLocale()]);
  const t = adminText[locale];

  return (
    <html
      lang={t.lang}
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${archivo.variable}`}
    >
      <body className="bg-ground flex min-h-dvh flex-col">
        {signedIn ? (
          <header className="border-line bg-surface border-b">
            <div className="container-page flex h-16 items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <Link href="/admin" className="font-display text-lg font-extrabold">
                  Béton<span className="text-accent">Dispo</span>
                  <span className="text-ink-muted ml-2 text-xs font-semibold tracking-widest uppercase">
                    Admin
                  </span>
                </Link>
                <nav aria-label={t.navLabel} className="flex gap-1">
                  <Link
                    href="/admin"
                    className="text-ink-soft hover:bg-surface-sunken hover:text-ink inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-medium"
                  >
                    {t.dashboard}
                  </Link>
                  <Link
                    href="/admin/requests"
                    className="text-ink-soft hover:bg-surface-sunken hover:text-ink inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-medium"
                  >
                    {t.requests}
                  </Link>
                </nav>
              </div>

              <div className="flex items-center gap-2">
                <AdminLanguageToggle label={t.languageToggle} nextLocale={t.otherLocale} />
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="border-line-strong text-ink-soft hover:bg-surface-sunken inline-flex min-h-10 items-center rounded-lg border px-3 text-sm font-medium"
                  >
                    {t.signOut}
                  </button>
                </form>
              </div>
            </div>
          </header>
        ) : null}

        <main className="flex-1 py-8">{children}</main>
      </body>
    </html>
  );
}
