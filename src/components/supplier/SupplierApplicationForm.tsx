'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import { pathFor } from '@/i18n/routes';
import { buttonClass } from '@/components/ui/button-styles';
import { CheckboxField, Honeypot, TextareaField, TextField } from '@/components/quote/fields';
import { track } from '@/lib/analytics';
import { readAttribution } from '@/lib/attribution';
import {
  supplierApplicationFieldErrors,
  supplierApplicationSubmission,
} from '@/lib/supplier-application-schema';
import {
  SUPPLIER_SERVICE_CODES,
  SUPPLIER_SERVICE_LABELS,
  type SupplierServiceCode,
} from '@/lib/supplier-options';
import { cn } from '@/lib/cn';

type Copy = {
  title: string;
  intro: string;
  fields: Record<
    | 'companyName'
    | 'contactName'
    | 'email'
    | 'phone'
    | 'website'
    | 'serviceAreaText'
    | 'services'
    | 'message'
    | 'consent'
    | 'honeypot',
    string
  >;
  optional: string;
  servicesHint: string;
  submit: string;
  submitting: string;
  successTitle: string;
  successBody: string;
  backHome: string;
  privacyPrefix: string;
  privacyLink: string;
  errors: Record<string, string>;
};

type Values = {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  serviceAreaText: string;
  services: SupplierServiceCode[];
  message: string;
  consent: boolean;
  websiteUrl: string;
  formIssuedAt: string;
  formToken: string;
};

const initialValues: Omit<Values, 'formIssuedAt' | 'formToken'> = {
  companyName: '',
  contactName: '',
  email: '',
  phone: '',
  website: '',
  serviceAreaText: '',
  services: [],
  message: '',
  consent: false,
  websiteUrl: '',
};

type Result =
  | { ok: true; publicId: string }
  | { ok: false; fieldErrors?: Record<string, string>; formError?: string };

export function SupplierApplicationForm({
  locale,
  copy,
  formToken,
}: {
  locale: Locale;
  copy: Copy;
  formToken: { issuedAt: string; token: string };
}) {
  const [values, setValues] = useState<Values>(() => ({
    ...initialValues,
    formIssuedAt: formToken.issuedAt,
    formToken: formToken.token,
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const startedRef = useRef(false);

  useEffect(() => {
    track('supplier_partner_page_view', {
      locale,
      landing_page: typeof window === 'undefined' ? undefined : window.location.pathname,
    });
  }, [locale]);

  function update<K extends keyof Values>(key: K, value: Values[K]) {
    if (!startedRef.current) {
      startedRef.current = true;
      track('supplier_application_start', { locale });
    }
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function toggleService(code: SupplierServiceCode) {
    update(
      'services',
      values.services.includes(code)
        ? values.services.filter((item) => item !== code)
        : [...values.services, code],
    );
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const payload = {
      ...values,
      locale,
      ...readAttribution(),
    };
    const parsed = supplierApplicationSubmission.safeParse(payload);
    if (!parsed.success) {
      setErrors(supplierApplicationFieldErrors(parsed.error));
      return;
    }

    startTransition(async () => {
      try {
        track('supplier_application_submit', {
          locale,
          serviceCount: parsed.data.services.length,
          source: parsed.data.utmSource || parsed.data.firstTouchSource,
          landing_page: parsed.data.landingPage || parsed.data.submissionPage,
        });

        const response = await fetch('/api/supplier-application', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed.data),
        });
        const result = (await response.json()) as Result;

        if (!result.ok) {
          if (result.fieldErrors) setErrors(result.fieldErrors);
          setFormError(result.formError ?? 'server');
          return;
        }

        setConfirmedId(result.publicId);
        track('supplier_application_success', {
          locale,
          request_id: result.publicId,
          serviceCount: parsed.data.services.length,
          source: parsed.data.utmSource || parsed.data.firstTouchSource,
          landing_page: parsed.data.landingPage || parsed.data.submissionPage,
        });
      } catch {
        setFormError('server');
      }
    });
  }

  if (confirmedId) {
    return (
      <div className="rounded-card border-line bg-surface border p-6 shadow-sm md:p-8">
        <p className="text-accent font-display text-sm font-bold tracking-widest uppercase">
          {confirmedId}
        </p>
        <h2 className="mt-3 text-3xl">{copy.successTitle}</h2>
        <p className="text-ink-muted mt-3 leading-relaxed">{copy.successBody}</p>
        <Link href={pathFor('home', locale)} className={cn(buttonClass('primary', 'md'), 'mt-6')}>
          {copy.backHome}
        </Link>
      </div>
    );
  }

  const serviceLabels = SUPPLIER_SERVICE_LABELS[locale];

  return (
    <form
      id="partner-form"
      onSubmit={submit}
      noValidate
      className="rounded-card border-line bg-surface space-y-6 border p-5 shadow-sm md:p-8"
    >
      <div>
        <h2 className="text-3xl">{copy.title}</h2>
        <p className="text-ink-muted mt-2 leading-relaxed">{copy.intro}</p>
      </div>

      <Honeypot
        value={values.websiteUrl}
        onChange={(value) => update('websiteUrl', value)}
        label={copy.fields.honeypot}
      />

      <div className="grid gap-5 md:grid-cols-2">
        <TextField
          id="companyName"
          label={copy.fields.companyName}
          value={values.companyName}
          onChange={(value) => update('companyName', value)}
          error={errors.companyName ? copy.errors[errors.companyName] : undefined}
          required
          autoComplete="organization"
        />
        <TextField
          id="contactName"
          label={copy.fields.contactName}
          value={values.contactName}
          onChange={(value) => update('contactName', value)}
          error={errors.contactName ? copy.errors[errors.contactName] : undefined}
          required
          autoComplete="name"
        />
        <TextField
          id="email"
          type="email"
          label={copy.fields.email}
          value={values.email}
          onChange={(value) => update('email', value)}
          error={errors.email ? copy.errors[errors.email] : undefined}
          required
          autoComplete="email"
        />
        <TextField
          id="phone"
          type="tel"
          label={copy.fields.phone}
          value={values.phone}
          onChange={(value) => update('phone', value)}
          error={errors.phone ? copy.errors[errors.phone] : undefined}
          required
          autoComplete="tel"
        />
      </div>

      <TextField
        id="website"
        type="url"
        label={`${copy.fields.website} (${copy.optional})`}
        value={values.website}
        onChange={(value) => update('website', value)}
        error={errors.website ? copy.errors[errors.website] : undefined}
        autoComplete="url"
      />

      <TextareaField
        id="serviceAreaText"
        label={copy.fields.serviceAreaText}
        value={values.serviceAreaText}
        onChange={(value) => update('serviceAreaText', value)}
        error={errors.serviceAreaText ? copy.errors[errors.serviceAreaText] : undefined}
        required
        rows={3}
      />

      <fieldset className="space-y-3">
        <legend className="text-ink text-[0.95rem] font-semibold">
          {copy.fields.services}
          <span className="text-accent ml-1" aria-hidden="true">
            *
          </span>
        </legend>
        <p className="text-ink-muted text-sm">{copy.servicesHint}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {SUPPLIER_SERVICE_CODES.map((code) => (
            <label
              key={code}
              className={cn(
                'border-line-strong bg-surface hover:border-ink-muted flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors',
                values.services.includes(code) ? 'border-accent bg-accent-tint font-semibold' : '',
              )}
            >
              <input
                type="checkbox"
                checked={values.services.includes(code)}
                onChange={() => toggleService(code)}
                className="accent-accent size-5"
              />
              {serviceLabels[code]}
            </label>
          ))}
        </div>
        {errors.services ? (
          <p className="text-danger text-sm font-medium">{copy.errors[errors.services]}</p>
        ) : null}
      </fieldset>

      <TextareaField
        id="message"
        label={`${copy.fields.message} (${copy.optional})`}
        value={values.message}
        onChange={(value) => update('message', value)}
        error={errors.message ? copy.errors[errors.message] : undefined}
      />

      <CheckboxField
        id="consent"
        label={copy.fields.consent}
        checked={values.consent}
        onChange={(value) => update('consent', value)}
        error={errors.consent ? copy.errors[errors.consent] : undefined}
      >
        <p className="text-ink-muted mt-1 text-sm">
          {copy.privacyPrefix}{' '}
          <Link
            href={pathFor('privacy', locale)}
            className="text-accent font-semibold hover:underline"
          >
            {copy.privacyLink}
          </Link>
          .
        </p>
      </CheckboxField>

      {formError ? (
        <p className="text-danger bg-danger/[0.05] rounded-lg p-3 text-sm font-semibold">
          {copy.errors[formError] ?? copy.errors.server}
        </p>
      ) : null}

      <button type="submit" disabled={isPending} className={buttonClass('primary', 'lg', 'w-full')}>
        {isPending ? copy.submitting : copy.submit}
      </button>
    </form>
  );
}
