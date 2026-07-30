import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { pathFor } from '@/i18n/routes';
import { buttonClass } from '@/components/ui/button-styles';
import { Section } from '@/components/ui/Section';
import { PageHeader } from '@/components/ui/PageHeader';

export function HowItWorksPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const page = dict.howItWorksPage;

  return (
    <>
      <PageHeader title={page.title} intro={page.intro} />

      <Section tone="ground">
        <ol className="grid gap-6 md:grid-cols-3">
          {page.steps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-card border-line bg-surface shadow-card border p-6"
            >
              <span className="bg-accent-tint font-display text-accent inline-flex size-10 items-center justify-center rounded-full text-lg font-bold">
                {index + 1}
              </span>
              <h2 className="mt-4 text-xl">{step.title}</h2>
              <p className="text-ink-muted mt-2 leading-relaxed">{step.body}</p>
            </li>
          ))}
        </ol>

        <div className="rounded-card border-line bg-surface mt-12 border p-6 md:p-8">
          <h2 className="text-xl">{page.notesTitle}</h2>
          <ul className="mt-4 space-y-3">
            {page.notes.map((note) => (
              <li key={note} className="text-ink-muted flex gap-3 leading-relaxed">
                <span
                  aria-hidden="true"
                  className="bg-accent mt-2 size-1.5 shrink-0 rounded-full"
                />
                {note}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10">
          <Link
            href={pathFor('quote', locale)}
            className={buttonClass('primary', 'lg', 'w-full sm:w-auto')}
          >
            {dict.common.ctaPrimary}
          </Link>
        </div>
      </Section>
    </>
  );
}
