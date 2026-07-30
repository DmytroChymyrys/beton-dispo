import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { Section } from '@/components/ui/Section';
import { PageHeader } from '@/components/ui/PageHeader';

export function LegalPage({ locale, doc }: { locale: Locale; doc: 'privacy' | 'terms' }) {
  const dict = getDictionary(locale);
  const { lastUpdated, lastUpdatedLabel } = dict.legal;
  const page = dict.legal[doc];

  return (
    <>
      <PageHeader title={page.title} intro={page.intro} />

      <Section tone="ground">
        <div className="rounded-card border-line bg-surface mx-auto max-w-3xl border p-6 md:p-10">
          <p className="text-ink-muted text-sm">
            {lastUpdatedLabel} : {lastUpdated}
          </p>

          {page.sections.map((section) => (
            <section key={section.heading} className="mt-8 first:mt-6">
              <h2 className="text-xl">{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-ink-muted mt-3 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </Section>
    </>
  );
}
