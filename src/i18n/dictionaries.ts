import 'server-only';

import type { Locale } from './config';
import fr from '@/messages/fr.json';
import en from '@/messages/en.json';

/**
 * The French dictionary is the canonical shape: French is the primary market
 * language, so every key exists there first. `en.json` is checked against it at
 * compile time, which means a missing or renamed English key is a type error
 * rather than a blank string in production.
 */
export type Dictionary = typeof fr;

const dictionaries = { fr, en } satisfies Record<Locale, Dictionary>;

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
