/**
 * Acquisition attribution.
 *
 * First touch is retained for 90 days so a returning visitor keeps the original
 * acquisition context. Last touch is session-scoped and only updates when a
 * meaningful new external/campaign touch exists. No customer PII is captured.
 */

const FIRST_TOUCH_KEY = 'betondispo.attribution.first.v2';
const LAST_TOUCH_KEY = 'betondispo.attribution.last.v2';
const LEGACY_KEY = 'betondispo.attribution.v1';
const FIRST_TOUCH_TTL_MS = 90 * 24 * 60 * 60 * 1000;

type Touch = {
  gclid: string;
  msclkid: string;
  fbclid: string;
  source: string;
  medium: string;
  campaign: string;
  term: string;
  content: string;
  landingPage: string;
  referrer: string;
  timestamp: string;
};

type StoredFirstTouch = Touch & {
  expiresAt: number;
};

export type Attribution = {
  gclid: string;
  msclkid: string;
  fbclid: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
  referrer: string;
  landingPage: string;
  firstTouchSource: string;
  firstTouchMedium: string;
  firstTouchCampaign: string;
  firstTouchTerm: string;
  firstTouchContent: string;
  firstTouchLandingPage: string;
  firstTouchReferrer: string;
  firstTouchTimestamp: string;
  lastTouchSource: string;
  lastTouchMedium: string;
  lastTouchCampaign: string;
  lastTouchTerm: string;
  lastTouchContent: string;
  lastTouchLandingPage: string;
  lastTouchReferrer: string;
  lastTouchTimestamp: string;
  quoteEntryPage: string;
  submissionPage: string;
  deviceCategory: 'mobile' | 'tablet' | 'desktop' | '';
  browserLanguage: string;
};

export const EMPTY_ATTRIBUTION: Attribution = {
  gclid: '',
  msclkid: '',
  fbclid: '',
  utmSource: '',
  utmMedium: '',
  utmCampaign: '',
  utmTerm: '',
  utmContent: '',
  referrer: '',
  landingPage: '',
  firstTouchSource: '',
  firstTouchMedium: '',
  firstTouchCampaign: '',
  firstTouchTerm: '',
  firstTouchContent: '',
  firstTouchLandingPage: '',
  firstTouchReferrer: '',
  firstTouchTimestamp: '',
  lastTouchSource: '',
  lastTouchMedium: '',
  lastTouchCampaign: '',
  lastTouchTerm: '',
  lastTouchContent: '',
  lastTouchLandingPage: '',
  lastTouchReferrer: '',
  lastTouchTimestamp: '',
  quoteEntryPage: '',
  submissionPage: '',
  deviceCategory: '',
  browserLanguage: '',
};

function clamp(value: string | null | undefined, max: number): string {
  return (value ?? '').trim().slice(0, max);
}

function safePath(pathname: string | null | undefined): string {
  const path = clamp(pathname, 512);
  if (!path || !path.startsWith('/') || path.startsWith('//')) return '';
  return path.split('#')[0]?.split('?')[0] ?? '';
}

function safeHostname(value: string | null | undefined): string {
  if (!value) return '';
  try {
    const url = new URL(value);
    return clamp(url.hostname.replace(/^www\./, '').toLowerCase(), 512);
  } catch {
    return '';
  }
}

function externalReferrer(): string {
  if (typeof document === 'undefined' || typeof window === 'undefined') return '';
  if (!document.referrer) return '';

  try {
    const referrer = new URL(document.referrer);
    if (referrer.host === window.location.host) return '';
    return safeHostname(document.referrer);
  } catch {
    return '';
  }
}

function deviceCategory(): Attribution['deviceCategory'] {
  if (typeof window === 'undefined') return '';
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const width = window.innerWidth;
  if (coarse && width < 768) return 'mobile';
  if (coarse && width < 1100) return 'tablet';
  return 'desktop';
}

function classifySource(params: URLSearchParams, referrerHost: string): Pick<Touch, 'source' | 'medium'> {
  const utmSource = clamp(params.get('utm_source'), 120);
  const utmMedium = clamp(params.get('utm_medium'), 120);
  if (utmSource || utmMedium) {
    return {
      source: utmSource || 'unknown',
      medium: utmMedium || 'unknown',
    };
  }

  if (params.get('gclid')) return { source: 'google', medium: 'cpc' };
  if (params.get('msclkid')) return { source: 'bing', medium: 'cpc' };
  if (params.get('fbclid')) return { source: 'facebook', medium: 'social' };

  if (referrerHost) {
    if (/(^|\.)google\./.test(referrerHost)) return { source: 'google', medium: 'organic' };
    if (/(^|\.)bing\./.test(referrerHost)) return { source: 'bing', medium: 'organic' };
    return { source: referrerHost, medium: 'referral' };
  }

  return { source: 'direct', medium: 'none' };
}

function touchFromCurrentPage(): Touch {
  const params = new URLSearchParams(window.location.search);
  const referrer = externalReferrer();
  const classified = classifySource(params, referrer);

  return {
    ...classified,
    campaign: clamp(params.get('utm_campaign'), 160),
    term: clamp(params.get('utm_term'), 160),
    content: clamp(params.get('utm_content'), 160),
    landingPage: safePath(window.location.pathname),
    referrer,
    timestamp: new Date().toISOString(),
    gclid: clamp(params.get('gclid'), 256),
    msclkid: clamp(params.get('msclkid'), 256),
    fbclid: clamp(params.get('fbclid'), 256),
  };
}

function hasMeaningfulTouch(touch: Touch): boolean {
  return Boolean(
    touch.gclid ||
      touch.msclkid ||
      touch.fbclid ||
      touch.campaign ||
      touch.term ||
      touch.content ||
      touch.referrer ||
      (touch.source !== 'direct' && touch.medium !== 'none'),
  );
}

function readLocalFirstTouch(): StoredFirstTouch | null {
  try {
    const raw = window.localStorage.getItem(FIRST_TOUCH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredFirstTouch>;
    if (!parsed.expiresAt || parsed.expiresAt < Date.now()) {
      window.localStorage.removeItem(FIRST_TOUCH_KEY);
      return null;
    }
    return { ...EMPTY_TOUCH, ...parsed } as StoredFirstTouch;
  } catch {
    return null;
  }
}

function writeFirstTouch(touch: Touch): void {
  const payload: StoredFirstTouch = { ...touch, expiresAt: Date.now() + FIRST_TOUCH_TTL_MS };
  try {
    window.localStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(payload));
  } catch {
    try {
      window.sessionStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(payload));
    } catch {
      /* Attribution is optional. */
    }
  }
}

function readFirstTouch(): Touch | null {
  const local = readLocalFirstTouch();
  if (local) return local;
  try {
    const raw = window.sessionStorage.getItem(FIRST_TOUCH_KEY);
    return raw ? ({ ...EMPTY_TOUCH, ...JSON.parse(raw) } as Touch) : null;
  } catch {
    return null;
  }
}

function readLastTouch(): Touch | null {
  try {
    const raw = window.sessionStorage.getItem(LAST_TOUCH_KEY);
    return raw ? ({ ...EMPTY_TOUCH, ...JSON.parse(raw) } as Touch) : null;
  } catch {
    return null;
  }
}

function writeLastTouch(touch: Touch): void {
  try {
    window.sessionStorage.setItem(LAST_TOUCH_KEY, JSON.stringify(touch));
  } catch {
    /* Attribution is optional. */
  }
}

const EMPTY_TOUCH: Touch = {
  gclid: '',
  msclkid: '',
  fbclid: '',
  source: '',
  medium: '',
  campaign: '',
  term: '',
  content: '',
  landingPage: '',
  referrer: '',
  timestamp: '',
};

function legacyAttribution(): Partial<Attribution> {
  try {
    const raw = window.sessionStorage.getItem(LEGACY_KEY);
    return raw ? (JSON.parse(raw) as Partial<Attribution>) : {};
  } catch {
    return {};
  }
}

/**
 * Records attribution on each page view. First-touch is set only once; last
 * touch updates only on a meaningful campaign or external referral touch.
 */
export function captureAttribution(): void {
  if (typeof window === 'undefined') return;

  try {
    const current = touchFromCurrentPage();
    if (!readFirstTouch()) writeFirstTouch(current);
    if (hasMeaningfulTouch(current) || !readLastTouch()) writeLastTouch(current);
  } catch {
    // Private browsing can throw on storage; attribution must not break UX.
  }
}

export function readAttribution(): Attribution {
  if (typeof window === 'undefined') return EMPTY_ATTRIBUTION;

  try {
    const first = readFirstTouch();
    const last = readLastTouch();
    const legacy = legacyAttribution();
    const currentPath = safePath(window.location.pathname);

    return {
      ...EMPTY_ATTRIBUTION,
      ...legacy,
      gclid: last?.gclid || first?.gclid || legacy.gclid || '',
      msclkid: last?.msclkid || first?.msclkid || legacy.msclkid || '',
      fbclid: last?.fbclid || first?.fbclid || legacy.fbclid || '',
      utmSource: last?.source || legacy.utmSource || '',
      utmMedium: last?.medium || legacy.utmMedium || '',
      utmCampaign: last?.campaign || legacy.utmCampaign || '',
      utmTerm: last?.term || legacy.utmTerm || '',
      utmContent: last?.content || legacy.utmContent || '',
      referrer: last?.referrer || legacy.referrer || '',
      landingPage: last?.landingPage || legacy.landingPage || '',
      firstTouchSource: first?.source || '',
      firstTouchMedium: first?.medium || '',
      firstTouchCampaign: first?.campaign || '',
      firstTouchTerm: first?.term || '',
      firstTouchContent: first?.content || '',
      firstTouchLandingPage: first?.landingPage || '',
      firstTouchReferrer: first?.referrer || '',
      firstTouchTimestamp: first?.timestamp || '',
      lastTouchSource: last?.source || '',
      lastTouchMedium: last?.medium || '',
      lastTouchCampaign: last?.campaign || '',
      lastTouchTerm: last?.term || '',
      lastTouchContent: last?.content || '',
      lastTouchLandingPage: last?.landingPage || '',
      lastTouchReferrer: last?.referrer || '',
      lastTouchTimestamp: last?.timestamp || '',
      submissionPage: currentPath,
      deviceCategory: deviceCategory(),
      browserLanguage: clamp(window.navigator.language, 80),
    };
  } catch {
    return EMPTY_ATTRIBUTION;
  }
}
