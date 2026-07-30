import { describe, expect, it } from 'vitest';
import { leadTimeBucket, volumeBucket } from '@/lib/analytics';

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
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
