import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { pathFor } from '@/i18n/routes';
import { buttonClass } from '@/components/ui/button-styles';
import { Eyebrow, Lead, Section, SectionTitle } from '@/components/ui/Section';
import { Photo } from '@/components/Photo';

export function HomePage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const { hero, howItWorks, services, audience, network, finalCta } = dict.home;
  const quoteHref = pathFor('quote', locale);

  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="border-line bg-surface border-b">
        <div className="container-page grid gap-10 py-14 md:py-20 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16">
          <div>
            <Eyebrow>{hero.eyebrow}</Eyebrow>
            <h1 className="mt-4 text-[2.5rem] leading-[1.05] sm:text-5xl lg:text-6xl">
              {hero.title}
            </h1>
            <p className="text-ink-soft mt-5 max-w-xl text-lg leading-relaxed sm:text-xl">
              {hero.subtitle}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href={quoteHref} className={buttonClass('primary', 'lg', 'w-full sm:w-auto')}>
                {dict.common.ctaPrimary}
              </Link>
              <Link
                href={pathFor('howItWorks', locale)}
                className={buttonClass('secondary', 'lg', 'w-full sm:w-auto')}
              >
                {dict.common.ctaSecondary}
              </Link>
            </div>

            <p className="text-ink-muted mt-4 text-sm">{hero.microcopy}</p>

            <p className="border-line font-display text-ink-soft mt-8 border-t pt-5 text-sm font-semibold tracking-wider uppercase">
              {hero.trust}
            </p>
          </div>

          <Photo
            photo="heroPour"
            alt={hero.imageAlt}
            aspect="aspect-[4/3] lg:aspect-[5/4]"
            sizes="(min-width: 1024px) 45vw, 100vw"
            priority
            imageClassName="object-[52%_48%]"
          />
        </div>
      </section>

      {/* -------------------------------------------------------- How it works */}
      <Section tone="ground" labelledBy="home-how">
        <Eyebrow>{howItWorks.eyebrow}</Eyebrow>
        <SectionTitle id="home-how">{howItWorks.title}</SectionTitle>

        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {howItWorks.steps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-card border-line bg-surface shadow-card border p-6"
            >
              <span className="bg-accent-tint font-display text-accent inline-flex size-10 items-center justify-center rounded-full text-lg font-bold">
                {index + 1}
              </span>
              <h3 className="mt-4 text-xl">{step.title}</h3>
              <p className="text-ink-muted mt-2 leading-relaxed">{step.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* ------------------------------------------------------------ Services */}
      <Section tone="surface" labelledBy="home-services">
        <Eyebrow>{services.eyebrow}</Eyebrow>
        <SectionTitle id="home-services">{services.title}</SectionTitle>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {dict.servicesPage.items.map((item) => (
            <article
              key={item.key}
              className="rounded-card border-line bg-ground flex flex-col border p-6"
            >
              <ServiceIcon name={item.key} />
              <h3 className="mt-4 text-xl">{item.title}</h3>
              <p className="text-ink-muted mt-2 flex-1 leading-relaxed">{item.short}</p>
              <Link
                href={`${pathFor('services', locale)}#${item.key}`}
                className="text-accent hover:text-accent-hover mt-4 inline-flex min-h-11 items-center font-semibold"
              >
                {services.linkLabel}
                <span aria-hidden="true" className="ml-1">
                  →
                </span>
              </Link>
            </article>
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------------------ Audience */}
      <Section tone="ground" labelledBy="home-audience">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <Eyebrow>{audience.eyebrow}</Eyebrow>
            <SectionTitle id="home-audience">{audience.title}</SectionTitle>
            <Lead>{audience.body}</Lead>

            <ul className="mt-6 flex flex-wrap gap-2">
              {audience.items.map((item) => (
                <li
                  key={item}
                  className="border-line-strong bg-surface text-ink-soft rounded-full border px-4 py-2 text-sm font-medium"
                >
                  {item}
                </li>
              ))}
            </ul>

            <p className="border-accent-bright bg-surface text-ink-soft mt-6 border-l-4 py-3 pr-3 pl-4 text-sm leading-relaxed">
              {audience.repeatNote}
            </p>
          </div>

          <Photo photo="slabFinishing" alt={audience.imageAlt} aspect="aspect-[4/3]" />
        </div>
      </Section>

      {/* ------------------------------------------------------------- Network */}
      <Section tone="steel" labelledBy="home-network">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <div>
            <SectionTitle id="home-network" onDark className="mt-0">
              {network.title}
            </SectionTitle>
            <Lead onDark>{network.body}</Lead>
          </div>
          <ul className="space-y-4 self-center">
            {network.points.map((point) => (
              <li key={point} className="flex gap-3 text-white/85">
                <CheckIcon />
                <span className="leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* ----------------------------------------------------------- Final CTA */}
      <Section tone="surface" labelledBy="home-cta">
        <div className="rounded-card border-line bg-ground grid items-center gap-8 overflow-hidden border p-8 md:grid-cols-2 md:p-12">
          <div>
            <SectionTitle id="home-cta" className="mt-0">
              {finalCta.title}
            </SectionTitle>
            <Lead>{finalCta.body}</Lead>
            <Link
              href={quoteHref}
              className={buttonClass('primary', 'lg', 'mt-8 w-full sm:w-auto')}
            >
              {dict.common.ctaPrimary}
            </Link>
          </div>
          <Photo
            photo="boomPump"
            alt={finalCta.imageAlt}
            aspect="aspect-[3/2]"
            sizes="(min-width: 768px) 45vw, 100vw"
          />
        </div>
      </Section>
    </>
  );
}

function ServiceIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    delivery:
      'M3 16V7h11v9M14 10h4l3 3v3h-7M6.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm11 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
    mobile:
      'M4 17V8h9l4 4v5M4 12h9M7 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
    pumping: 'M3 20h18M6 20v-6l6-8h5M17 6v5M12 12h5',
  };
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-accent size-9"
    >
      <path d={paths[name] ?? paths.delivery!} />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-accent-bright mt-1 size-5 shrink-0"
    >
      <path d="m4 12 5 5L20 6" />
    </svg>
  );
}
