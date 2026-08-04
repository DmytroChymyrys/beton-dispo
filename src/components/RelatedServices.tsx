import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import {
  relatedServices,
  serviceHref,
  serviceNeighbors,
  type ServiceNetworkKey,
} from '@/lib/service-network';

export function RelatedServices({
  locale,
  current,
}: {
  locale: Locale;
  current?: ServiceNetworkKey;
}) {
  const items = relatedServices({ locale, current });

  return (
    <section className="rounded-card border-line bg-surface border p-6">
      <h2 className="text-2xl">{locale === 'fr' ? 'Services connexes' : 'Related services'}</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {items.map((item) => {
          const copy = item.copy[locale];
          return (
            <article key={item.key} className="border-line rounded-card border p-4">
              <h3 className="font-display text-lg font-bold">{copy.title}</h3>
              <p className="text-ink-muted mt-2 text-sm leading-relaxed">{copy.description}</p>
              <Link
                href={serviceHref(item, locale)}
                className="text-accent mt-3 inline-flex min-h-10 items-center text-sm font-semibold hover:underline"
              >
                {copy.action}
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function ServicePrevNext({
  locale,
  current,
}: {
  locale: Locale;
  current: ServiceNetworkKey;
}) {
  const neighbors = serviceNeighbors(current, locale);
  if (!neighbors) return null;

  return (
    <nav
      aria-label={locale === 'fr' ? 'Navigation entre services' : 'Service navigation'}
      className="border-line flex flex-col justify-between gap-3 border-t pt-6 sm:flex-row"
    >
      <Link
        href={serviceHref(neighbors.previous, locale)}
        className="text-ink-soft hover:text-accent font-semibold"
      >
        ← {neighbors.previous.copy[locale].title}
      </Link>
      <Link
        href={serviceHref(neighbors.next, locale)}
        className="text-ink-soft hover:text-accent font-semibold sm:text-right"
      >
        {neighbors.next.copy[locale].title} →
      </Link>
    </nav>
  );
}
