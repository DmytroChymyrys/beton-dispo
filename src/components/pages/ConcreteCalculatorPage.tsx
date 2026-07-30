import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { pathFor } from '@/i18n/routes';
import { ConcreteCalculator } from '@/components/concrete-calculator/ConcreteCalculator';
import { JsonLd } from '@/components/JsonLd';
import { buttonClass } from '@/components/ui/button-styles';
import { Section, SectionTitle } from '@/components/ui/Section';
import { absoluteUrl } from '@/lib/site';

export function ConcreteCalculatorPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const page = dict.concreteCalculator;
  const appName = locale === 'fr' ? 'Calculateur de béton' : 'Concrete Calculator';

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: appName,
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          url: absoluteUrl(pathFor('calculator', locale)),
          inLanguage: locale === 'fr' ? 'fr-CA' : 'en-CA',
          provider: {
            '@type': 'Organization',
            name: 'BétonDispo',
            url: absoluteUrl(pathFor('home', locale)),
          },
        }}
      />

      <div className="border-line bg-surface border-b">
        <div className="container-page grid gap-8 py-8 md:py-10 lg:grid-cols-[minmax(17rem,0.3fr)_minmax(0,0.7fr)] lg:items-start xl:gap-10">
          <div className="max-w-md">
            <p className="text-accent font-display text-sm font-bold tracking-wide uppercase">
              {page.hero.eyebrow}
            </p>
            <h1 className="mt-3 text-4xl leading-[1.05] sm:text-5xl">{page.hero.title}</h1>
            <p className="text-ink-muted mt-4 text-lg leading-relaxed">{page.hero.intro}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="#calculator" className={buttonClass('primary', 'lg', 'w-full sm:w-auto')}>
                {page.hero.primaryCta}
              </Link>
              <Link
                href={pathFor('quote', locale)}
                className={buttonClass('secondary', 'lg', 'w-full sm:w-auto')}
              >
                {dict.common.ctaPrimary}
              </Link>
            </div>
          </div>

          <div id="calculator" className="scroll-mt-24">
            <ConcreteCalculator locale={locale} strings={page} />
          </div>
        </div>
      </div>

      <Section tone="ground" labelledBy="calculator-seo-title">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="divide-line divide-y">
            <div className="pb-6">
              <SectionTitle id="calculator-seo-title">{page.seo.howTitle}</SectionTitle>
              <p className="text-ink-muted mt-3 leading-relaxed">{page.seo.howBody}</p>
            </div>
            <div className="py-6">
              <h2 className="text-2xl">{page.seo.wasteTitle}</h2>
              <p className="text-ink-muted mt-3 leading-relaxed">{page.seo.wasteBody}</p>
            </div>
            <div className="py-6">
              <h2 className="text-2xl">{page.seo.unitsTitle}</h2>
              <p className="text-ink-muted mt-3 leading-relaxed">{page.seo.unitsBody}</p>
            </div>
            <div className="pt-6">
              <h2 className="text-2xl">{page.seo.unsureTitle}</h2>
              <p className="text-ink-muted mt-3 leading-relaxed">{page.seo.unsureBody}</p>
            </div>
          </div>

          <aside className="border-line bg-surface rounded-card h-fit border p-6">
            <h2 className="text-2xl">{page.seo.ctaTitle}</h2>
            <p className="text-ink-muted mt-3 leading-relaxed">{page.seo.ctaBody}</p>
            <div className="mt-5 flex flex-col gap-3">
              <Link
                href={pathFor('quote', locale)}
                className={buttonClass('primary', 'lg', 'w-full')}
              >
                {dict.common.ctaPrimary}
              </Link>
              <Link
                href={pathFor('services', locale)}
                className={buttonClass('secondary', 'md', 'w-full')}
              >
                {page.seo.servicesLink}
              </Link>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
