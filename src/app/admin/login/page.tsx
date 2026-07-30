import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/server/auth';
import { adminText } from '@/app/admin/i18n';
import { getAdminLocale } from '@/app/admin/locale';
import { SignInForm } from './SignInForm';

export default async function AdminLoginPage() {
  if (await isAuthenticated()) redirect('/admin');
  const locale = await getAdminLocale();
  const t = adminText[locale];

  return (
    <div className="container-page">
      <div className="rounded-card border-line bg-surface shadow-card mx-auto mt-8 max-w-sm border p-7">
        <h1 className="font-display text-2xl font-extrabold">
          Béton<span className="text-accent">Dispo</span>
        </h1>
        <div className="flex items-center justify-between gap-4">
          <p className="text-ink-muted mt-1 text-sm">{t.login.subtitle}</p>
          <a
            href={`/admin/language?lang=${t.otherLocale}&next=/admin/login`}
            className="text-accent text-sm font-semibold hover:underline"
          >
            {t.languageToggle}
          </a>
        </div>
        <SignInForm labels={t.login} />
      </div>
    </div>
  );
}
