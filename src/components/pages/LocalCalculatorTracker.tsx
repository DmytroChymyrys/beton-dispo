'use client';

import { useEffect } from 'react';
import type { Locale } from '@/i18n/config';
import { track } from '@/lib/analytics';

export function LocalCalculatorTracker({
  locale,
  city,
  landingPage,
}: {
  locale: Locale;
  city: string;
  landingPage: string;
}) {
  useEffect(() => {
    track('local_calculator_page_view', {
      locale,
      city,
      landing_page: landingPage,
    });
  }, [city, landingPage, locale]);

  return null;
}
