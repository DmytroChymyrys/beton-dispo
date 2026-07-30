'use client';

import { useEffect } from 'react';
import { track } from '@/lib/analytics';

function readableText(element: HTMLElement): string {
  const label =
    element.getAttribute('data-analytics-label') ??
    element.getAttribute('aria-label') ??
    element.textContent ??
    '';

  return label.replace(/\s+/g, ' ').trim().slice(0, 80);
}

function linkArea(element: HTMLElement): string {
  if (element.closest('[data-analytics-area]')) {
    return (
      element.closest<HTMLElement>('[data-analytics-area]')!.dataset.analyticsArea ?? 'unknown'
    );
  }
  if (element.closest('header')) return 'header';
  if (element.closest('footer')) return 'footer';
  if (element.closest('main')) return 'main';
  return 'unknown';
}

function destinationType(path: string): string {
  if (path.includes('/soumission') || path.includes('/quote')) return 'quote';
  if (path.includes('/calculateur-beton') || path.includes('/concrete-calculator')) {
    return 'calculator';
  }
  if (path.includes('/services')) return 'services';
  if (path.includes('/faq')) return 'faq';
  if (path.includes('/comment-ca-marche') || path.includes('/how-it-works')) return 'how_it_works';
  if (path === '/fr' || path === '/en') return 'home';
  return 'internal';
}

function safeTargetPath(href: string): string {
  try {
    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) return url.hostname;
    return url.pathname;
  } catch {
    return 'unknown';
  }
}

export function AnalyticsInteractions() {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.closest('[data-analytics-ignore]')) return;

      const explicit = target.closest<HTMLElement>('[data-analytics-event]');
      if (explicit) {
        const eventName = explicit.dataset.analyticsEvent;
        if (eventName === 'mobile_menu_toggled') {
          track('mobile_menu_toggled', {
            area: linkArea(explicit),
            menuState: explicit.getAttribute('aria-expanded') === 'true' ? 'closing' : 'opening',
          });
        }
        return;
      }

      const link = target.closest<HTMLAnchorElement>('a[href]');
      if (!link) return;

      const href = link.getAttribute('href') ?? '';
      const area = linkArea(link);
      const linkText = readableText(link);
      const targetPath = safeTargetPath(href);

      if (href.startsWith('mailto:')) {
        track('contact_clicked', { area, destinationType: 'email', linkText });
        return;
      }

      if (href.startsWith('tel:')) {
        track('contact_clicked', { area, destinationType: 'phone', linkText });
        return;
      }

      if (link.hreflang) {
        track('language_switched', { area, targetPath, destinationType: link.hreflang });
        return;
      }

      const type = destinationType(targetPath);
      const payload = {
        area,
        targetPath,
        destinationType: type,
        hasPrefilledVolume: href.includes('volume=') ? 'yes' : 'no',
      };

      if (type === 'quote') {
        track('site_cta_clicked', payload);
      } else {
        track('site_link_clicked', { ...payload, linkText });
      }
    }

    document.addEventListener('click', handleClick, { capture: true });
    return () => document.removeEventListener('click', handleClick, { capture: true });
  }, []);

  return null;
}
