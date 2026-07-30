import Link from 'next/link';
import { defaultLocale, localeTags } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { buttonClass } from '@/components/ui/button-styles';
import { archivo, inter } from '@/app/fonts';
import '@/app/globals.css';

/**
 * Global 404 boundary. Reached when the URL has no valid locale segment, so the
 * `[locale]` layout never ran — this file renders its own document shell and
 * falls back to French, the default market language.
 */
export default function NotFound() {
  const dict = getDictionary(defaultLocale);

  return (
    <html
      lang={localeTags[defaultLocale]}
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${archivo.variable}`}
    >
      <body className="bg-ground grid min-h-dvh place-items-center px-6 text-center">
        <div>
          <p className="font-display text-accent text-sm font-bold tracking-[0.14em] uppercase">
            404
          </p>
          <h1 className="mt-3 text-4xl">{dict.notFound.title}</h1>
          <p className="text-ink-muted mt-3 text-lg">{dict.notFound.body}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/fr" className={buttonClass('primary', 'md')}>
              {dict.notFound.cta}
            </Link>
            <Link href="/en" className={buttonClass('secondary', 'md')}>
              English
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
