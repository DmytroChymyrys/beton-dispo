import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { pathFor } from '@/i18n/routes';
import { buttonClass } from '@/components/ui/button-styles';
import { Section } from '@/components/ui/Section';
import { PageHeader } from '@/components/ui/PageHeader';
import { JsonLd } from '@/components/JsonLd';
import { faqSchema } from '@/lib/structured-data';

export function FaqPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const page = dict.faqPage;

  return (
    <>
      <PageHeader title={page.title} intro={page.intro} />
      <JsonLd data={faqSchema(locale)} />

      <Section tone="ground">
        {/* Native <details> keeps this section fully functional with zero JS. */}
        <div className="divide-line rounded-card border-line bg-surface mx-auto max-w-3xl divide-y overflow-hidden border">
          {page.items.map((item) => (
            <details key={item.question} className="group">
              <summary className="font-display text-ink hover:bg-surface-sunken flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 text-lg font-semibold md:px-7">
                {item.question}
                <span
                  aria-hidden="true"
                  className="border-line-strong text-accent grid size-7 shrink-0 place-items-center rounded-full border transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <div className="px-5 pb-6 md:px-7">
                <p className="text-ink-muted max-w-2xl leading-relaxed">{item.answer}</p>
              </div>
            </details>
          ))}
        </div>

        <div className="rounded-card border-line bg-surface mx-auto mt-10 max-w-3xl border p-6 md:p-8">
          <h2 className="text-xl">{page.stillHaveQuestions}</h2>
          <p className="text-ink-muted mt-2 leading-relaxed">{page.stillHaveQuestionsBody}</p>
          <Link
            href={pathFor('quote', locale)}
            className={buttonClass('primary', 'md', 'mt-5 w-full sm:w-auto')}
          >
            {dict.common.ctaPrimary}
          </Link>
        </div>
      </Section>
    </>
  );
}
