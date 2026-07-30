import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import { pathFor } from '@/i18n/routes';
import { cn } from '@/lib/cn';

type Props = {
  locale: Locale;
  lead: string;
  accent: string;
  className?: string;
  /** Renders light-on-dark, for use inside the charcoal footer. */
  onDark?: boolean;
};

/**
 * Text-based wordmark: "Béton" in the type colour, "Dispo" in safety orange.
 * Phase 1 deliberately ships no illustrated logo.
 */
export function Logo({ locale, lead, accent, className, onDark = false }: Props) {
  return (
    <Link
      href={pathFor('home', locale)}
      className={cn(
        'font-display text-xl font-extrabold tracking-tight sm:text-2xl',
        onDark ? 'text-white' : 'text-ink',
        className,
      )}
    >
      <span>{lead}</span>
      <span className={onDark ? 'text-accent-bright' : 'text-accent'}>{accent}</span>
    </Link>
  );
}
