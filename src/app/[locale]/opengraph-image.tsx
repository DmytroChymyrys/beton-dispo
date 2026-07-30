import { ImageResponse } from 'next/og';
import { defaultLocale, isLocale, locales } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'BétonDispo';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/**
 * Social share card, generated at build time for each locale and inherited by
 * every nested page. Deliberately typographic — no photography, so nothing here
 * can imply BétonDispo owns equipment.
 */
export default async function OpengraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const dict = getDictionary(locale);

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#1b1e24',
        padding: '72px 80px',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', fontSize: 44, fontWeight: 800, letterSpacing: '-0.02em' }}>
        <span style={{ color: '#ffffff' }}>{dict.meta.logoLead}</span>
        <span style={{ color: '#f97316' }}>{dict.meta.logoAccent}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            fontSize: 78,
            fontWeight: 800,
            color: '#ffffff',
            lineHeight: 1.06,
            letterSpacing: '-0.03em',
            maxWidth: 940,
          }}
        >
          {dict.home.hero.title}
        </div>
        <div style={{ marginTop: 28, fontSize: 30, color: 'rgba(255,255,255,0.7)' }}>
          {dict.footer.serviceArea}
        </div>
      </div>

      <div style={{ display: 'flex', height: 12, width: 240, backgroundColor: '#f97316' }} />
    </div>,
    size,
  );
}
