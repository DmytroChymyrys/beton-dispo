/**
 * First-touch acquisition attribution.
 *
 * Captured on the first page of a session and stored in `sessionStorage`, so a
 * visitor who lands on an ad, reads the FAQ, and only then opens the form still
 * carries the campaign that brought them in. Persisted with the quote request
 * so cost-per-request can be measured by source.
 *
 * Nothing here identifies a person: only campaign parameters, the referring
 * site and the landing path.
 */

const STORAGE_KEY = 'betondispo.attribution.v1';

export type Attribution = {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
  referrer: string;
  landingPage: string;
};

export const EMPTY_ATTRIBUTION: Attribution = {
  utmSource: '',
  utmMedium: '',
  utmCampaign: '',
  utmTerm: '',
  utmContent: '',
  referrer: '',
  landingPage: '',
};

function clamp(value: string | null | undefined, max: number): string {
  return (value ?? '').trim().slice(0, max);
}

/**
 * Records attribution once per session. Later calls are no-ops, which is what
 * makes it first-touch rather than last-touch.
 */
export function captureAttribution(): void {
  if (typeof window === 'undefined') return;

  try {
    if (window.sessionStorage.getItem(STORAGE_KEY)) return;

    const params = new URLSearchParams(window.location.search);

    // An internal navigation isn't a referral; only record external referrers.
    let referrer = '';
    if (document.referrer) {
      try {
        const url = new URL(document.referrer);
        if (url.host !== window.location.host) referrer = document.referrer;
      } catch {
        /* Malformed referrer — ignore it. */
      }
    }

    const attribution: Attribution = {
      utmSource: clamp(params.get('utm_source'), 120),
      utmMedium: clamp(params.get('utm_medium'), 120),
      utmCampaign: clamp(params.get('utm_campaign'), 160),
      utmTerm: clamp(params.get('utm_term'), 160),
      utmContent: clamp(params.get('utm_content'), 160),
      referrer: clamp(referrer, 512),
      landingPage: clamp(window.location.pathname, 512),
    };

    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    // Private browsing can throw on sessionStorage; attribution is optional.
  }
}

export function readAttribution(): Attribution {
  if (typeof window === 'undefined') return EMPTY_ATTRIBUTION;

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_ATTRIBUTION;
    const parsed = JSON.parse(raw) as Partial<Attribution>;
    return { ...EMPTY_ATTRIBUTION, ...parsed };
  } catch {
    return EMPTY_ATTRIBUTION;
  }
}
