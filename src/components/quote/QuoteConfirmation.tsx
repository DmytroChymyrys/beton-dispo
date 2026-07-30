'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import { pathFor } from '@/i18n/routes';
import { buttonClass } from '@/components/ui/button-styles';

type QuoteStrings = (typeof import('@/messages/fr.json'))['quote'];

/**
 * Post-submission screen.
 *
 * Careful with the wording: nothing here may suggest the concrete is booked.
 * The request has been received and is being looked into — that is all that has
 * happened.
 */
export function QuoteConfirmation({
  locale,
  strings,
  publicId,
}: {
  locale: Locale;
  strings: QuoteStrings;
  publicId: string;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Move focus to the confirmation so the outcome is announced rather than
  // leaving the visitor on a button that no longer exists.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const confirmation = strings.confirmation;

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-card border-line bg-surface shadow-card border p-6 md:p-10"
    >
      <span className="bg-success/10 text-success grid size-12 place-items-center rounded-full">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-6"
        >
          <path d="m4 12 5 5L20 6" />
        </svg>
      </span>

      <h2 ref={headingRef} tabIndex={-1} className="mt-5 text-3xl outline-none sm:text-4xl">
        {confirmation.title}
      </h2>
      <p className="text-ink-soft mt-3 max-w-2xl text-lg leading-relaxed">{confirmation.body}</p>

      <div className="bg-surface-sunken border-line mt-7 rounded-lg border p-5">
        <p className="text-ink-muted font-display text-xs font-bold tracking-[0.14em] uppercase">
          {confirmation.referenceLabel}
        </p>
        <p className="font-display text-accent mt-1 text-3xl font-extrabold tracking-tight">
          {publicId}
        </p>
        <p className="text-ink-muted mt-2 text-sm">{confirmation.referenceHint}</p>
      </div>

      <p className="border-accent-bright text-ink-soft mt-6 border-l-4 py-2 pl-4 text-sm leading-relaxed">
        {confirmation.notBooked}
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href={pathFor('home', locale)} className={buttonClass('primary', 'md')}>
          {confirmation.backHome}
        </Link>
        <Link href={pathFor('faq', locale)} className={buttonClass('secondary', 'md')}>
          {confirmation.readFaq}
        </Link>
      </div>
    </div>
  );
}
