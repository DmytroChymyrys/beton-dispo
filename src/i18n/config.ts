/**
 * Locale configuration.
 *
 * Québec is the primary market, so French is both the default and the
 * fallback locale. Adding a locale means: add it here, add a matching
 * dictionary in `src/messages/`, and add its slugs to `src/i18n/routes.ts`.
 */
export const locales = ['fr', 'en'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'fr';

/** BCP-47 tags used for `<html lang>`, hreflang and Open Graph. */
export const localeTags: Record<Locale, string> = {
  fr: 'fr-CA',
  en: 'en-CA',
};

export const localeLabels: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

/** The other locale — used by the language switcher. */
export function otherLocale(locale: Locale): Locale {
  return locale === 'fr' ? 'en' : 'fr';
}
