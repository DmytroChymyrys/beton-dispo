import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { isLocale, locales, localeTags } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { StickyMobileCta } from '@/components/StickyMobileCta';
import { AttributionTracker } from '@/components/AttributionTracker';
import { AnalyticsInteractions } from '@/components/AnalyticsInteractions';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';
import { MicrosoftClarity } from '@/components/MicrosoftClarity';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { JsonLd } from '@/components/JsonLd';
import { organizationSchema, websiteSchema } from '@/lib/structured-data';
import { archivo, inter } from '@/app/fonts';
import { siteConfig } from '@/lib/site';
import '@/app/globals.css';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
};

export const viewport: Viewport = {
  themeColor: '#f8f7f5',
  colorScheme: 'light',
};

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);

  return (
    <html
      lang={localeTags[locale]}
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${archivo.variable}`}
    >
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="focus:bg-accent sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:px-4 focus:py-3 focus:font-semibold focus:text-white"
        >
          {dict.common.skipToContent}
        </a>

        <SiteHeader
          locale={locale}
          strings={{
            logoLead: dict.meta.logoLead,
            logoAccent: dict.meta.logoAccent,
            ariaLabel: dict.nav.ariaLabel,
            openMenu: dict.nav.openMenu,
            closeMenu: dict.nav.closeMenu,
            ctaPrimary: dict.common.ctaPrimary,
            switchTo: dict.common.switchTo,
            switchToAria: dict.common.switchToAria,
            links: dict.nav.links,
          }}
        />

        <main id="main" className="flex-1">
          {children}
        </main>

        <SiteFooter locale={locale} dict={dict} />
        <StickyMobileCta locale={locale} label={dict.common.ctaPrimary} />
        <AttributionTracker />
        <AnalyticsInteractions />

        <JsonLd data={organizationSchema(locale)} />
        <JsonLd data={websiteSchema(locale)} />

        {/* Cookieless, aggregate-only. No customer detail is ever sent here —
            see the allowed event properties in `src/lib/analytics.ts`. */}
        <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        <MicrosoftClarity projectId={process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID ?? 'xyag8ub8mx'} />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
