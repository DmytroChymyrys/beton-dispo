import { Suspense } from 'react';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { QuoteForm } from '@/components/quote/QuoteForm';
import { Section } from '@/components/ui/Section';
import { issueQuoteFormToken } from '@/server/abuse';

export function QuotePage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const quote = dict.quote;
  const formToken = issueQuoteFormToken();

  return (
    <>
      <div className="border-line bg-surface border-b">
        {/* Same measure as the form below, so the heading and the card align. */}
        <div className="container-page py-10 md:py-14">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-4xl leading-[1.08] sm:text-5xl">{quote.title}</h1>
            <p className="text-ink-muted mt-4 text-lg leading-relaxed">{quote.intro}</p>
            <p className="text-ink-muted font-display mt-3 text-sm font-semibold tracking-wide uppercase">
              {quote.duration}
            </p>
          </div>
        </div>
      </div>

      <Section tone="ground" className="py-10 md:py-14">
        <div className="mx-auto max-w-3xl">
          <Suspense fallback={null}>
            <QuoteForm locale={locale} strings={quote} formToken={formToken} />
          </Suspense>

          <p className="text-ink-muted mt-8 text-center text-sm leading-relaxed">
            {dict.footer.networkDisclosure}
          </p>
        </div>
      </Section>
    </>
  );
}
