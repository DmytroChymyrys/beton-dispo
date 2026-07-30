import Link from 'next/link';
import { defaultLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { buttonClass } from '@/components/ui/button-styles';

/**
 * 404 inside a valid locale — rendered within the localized layout so the
 * header, footer and language switcher stay available.
 *
 * Next.js does not pass params to not-found boundaries, so the copy falls back
 * to the default locale.
 */
export default function LocaleNotFound() {
  const dict = getDictionary(defaultLocale);

  return (
    <div className="container-page grid min-h-[60vh] place-items-center py-20 text-center">
      <div>
        <p className="font-display text-accent text-sm font-bold tracking-[0.14em] uppercase">
          404
        </p>
        <h1 className="mt-3 text-4xl">{dict.notFound.title}</h1>
        <p className="text-ink-muted mt-3 text-lg">{dict.notFound.body}</p>
        <Link href={`/${defaultLocale}`} className={buttonClass('primary', 'md', 'mt-8')}>
          {dict.notFound.cta}
        </Link>
      </div>
    </div>
  );
}
