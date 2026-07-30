import 'server-only';

import { cookies } from 'next/headers';
import { ADMIN_LOCALE_COOKIE, toAdminLocale, type AdminLocale } from './i18n';

export async function getAdminLocale(): Promise<AdminLocale> {
  const cookieStore = await cookies();
  return toAdminLocale(cookieStore.get(ADMIN_LOCALE_COOKIE)?.value);
}
