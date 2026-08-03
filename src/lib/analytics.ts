import { track as vercelTrack } from '@vercel/analytics';

declare global {
  interface Window {
    gtag?: (command: 'event', eventName: string, params?: Record<string, string | number>) => void;
  }
}

/**
 * Phase-1 funnel events.
 *
 * The Phase-1 KPI is *qualified quote requests*, not traffic, so these events
 * exist to measure the funnel that produces them: how many visitors start the
 * form, how far they get, and how many finish.
 */
export type QuoteEvent =
  | 'site_link_clicked'
  | 'site_cta_clicked'
  | 'language_switched'
  | 'contact_clicked'
  | 'mobile_menu_toggled'
  | 'quote_form_started'
  | 'quote_form_prefilled'
  | 'quote_step_viewed'
  | 'quote_step_completed'
  | 'quote_step_validation_failed'
  | 'quote_step_back_clicked'
  | 'quote_submitted'
  | 'quote_submit_failed'
  | 'concrete_calculator_viewed'
  | 'concrete_calculator_geometry_changed'
  | 'concrete_calculator_allowance_changed'
  | 'concrete_calculator_validation_failed'
  | 'concrete_calculator_calculated'
  | 'calculator_quote_clicked'
  | 'local_calculator_page_view';

/**
 * Properties allowed on analytics events.
 *
 * Deliberately narrow: name, phone, email, street address and anything else
 * that could identify a person must never leave the server. Everything here is
 * either a low-cardinality category or a coarse bucket.
 */
export type QuoteEventProps = {
  locale?: string;
  /** 1-based, so "step 2 completed" reads naturally in the dashboard. */
  step?: number;
  stepName?: string;
  projectType?: string;
  customerType?: string;
  pumpRequired?: string;
  /** Bucketed, never the exact figure a customer typed. */
  volumeBucket?: string;
  leadTimeBucket?: string;
  reason?: string;
  geometryType?: string;
  unitsType?: string;
  wastePercentage?: number;
  source?: string;
  area?: string;
  city?: string;
  landing_page?: string;
  targetPath?: string;
  linkText?: string;
  destinationType?: string;
  hasPrefilledVolume?: string;
  errorCount?: number;
  menuState?: string;
};

export function track(event: QuoteEvent, props: QuoteEventProps = {}): void {
  // Drop undefined keys so the dashboard doesn't fill with empty dimensions.
  const clean: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(props)) {
    if (v !== undefined && v !== '') clean[k] = v;
  }

  try {
    vercelTrack(event, clean);
    window.gtag?.('event', event, clean);
  } catch {
    // Analytics must never break a submission.
  }
}

/** Coarse volume buckets — enough to see demand shape, not a customer's figure. */
export function volumeBucket(volume: number | null): string {
  if (volume === null) return 'unknown';
  if (volume < 3) return '0-3';
  if (volume < 6) return '3-6';
  if (volume < 10) return '6-10';
  if (volume < 20) return '10-20';
  return '20+';
}

/** Days between today and the requested pour date. */
export function leadTimeBucket(desiredDate: string): string {
  const target = new Date(`${desiredDate}T12:00:00`);
  if (Number.isNaN(target.getTime())) return 'unknown';

  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const days = Math.round((target.getTime() - today.getTime()) / 86_400_000);

  if (days <= 2) return '0-2d';
  if (days <= 7) return '3-7d';
  if (days <= 14) return '8-14d';
  if (days <= 30) return '15-30d';
  return '30d+';
}
