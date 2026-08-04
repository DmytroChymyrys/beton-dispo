import { beforeEach, describe, expect, it, vi } from 'vitest';
import { leadTimeBucket, trackQuoteSubmit, volumeBucket } from '@/lib/analytics';

const mocks = vi.hoisted(() => ({
  vercelTrack: vi.fn(),
}));

vi.mock('@vercel/analytics', () => ({
  track: mocks.vercelTrack,
}));

beforeEach(() => {
  mocks.vercelTrack.mockClear();
  const storage = new Map<string, string>();
  vi.stubGlobal('window', {
    sessionStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      clear: () => storage.clear(),
    },
    gtag: vi.fn(),
  });
});

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

describe('volumeBucket', () => {
  it.each([
    [null, 'unknown'],
    [1, '0-3'],
    [2.9, '0-3'],
    [3, '3-6'],
    [5.5, '3-6'],
    [6, '6-10'],
    [12, '10-20'],
    [40, '20+'],
  ])('buckets %s as %s', (volume, expected) => {
    expect(volumeBucket(volume)).toBe(expected);
  });

  it('never returns a value that could identify a customer', () => {
    // The bucket for an unusual, identifying figure must not contain it.
    expect(volumeBucket(7.37)).toBe('6-10');
  });
});

describe('leadTimeBucket', () => {
  it.each([
    [0, '0-2d'],
    [2, '0-2d'],
    [5, '3-7d'],
    [10, '8-14d'],
    [20, '15-30d'],
    [60, '30d+'],
  ])('buckets a date %s days out as %s', (days, expected) => {
    expect(leadTimeBucket(daysFromNow(days))).toBe(expected);
  });

  it('handles a malformed date without throwing', () => {
    expect(leadTimeBucket('not-a-date')).toBe('unknown');
  });
});

describe('trackQuoteSubmit', () => {
  it('emits quote_submit once per request id with safe GA4 parameters', () => {
    trackQuoteSubmit({
      locale: 'fr',
      requestId: 'BD-000002',
      projectType: 'Terrasse',
      sourcePage: '/fr/beton-terrasse-exterieure?project=terrasse',
      calculatedVolumeM3: 2.2,
      unit: 'M',
      marginPercent: 10,
      city: 'Montréal',
      volumeBucket: '0-3',
      leadTimeBucket: '8-14d',
    });
    trackQuoteSubmit({
      locale: 'fr',
      requestId: 'BD-000002',
      projectType: 'terrasse',
    });

    expect(mocks.vercelTrack).toHaveBeenCalledTimes(1);
    expect(mocks.vercelTrack).toHaveBeenCalledWith('quote_submit', {
      locale: 'fr',
      request_id: 'BD-000002',
      project_type: 'terrasse',
      source_page: '/fr/beton-terrasse-exterieure?project=terrasse',
      calculated_volume_m3: 2.2,
      unit: 'm',
      margin_percent: 10,
      city: 'montréal',
      form_variant: 'website_quote',
      currency: 'CAD',
      value: 1,
      volumeBucket: '0-3',
      leadTimeBucket: '8-14d',
    });
    expect(window.gtag).toHaveBeenCalledTimes(1);
  });

  it('does not emit without a request id', () => {
    trackQuoteSubmit({
      locale: 'en',
      requestId: '',
      projectType: 'garage',
    });

    expect(mocks.vercelTrack).not.toHaveBeenCalled();
    expect(window.gtag).not.toHaveBeenCalled();
  });
});
