'use client';

import { useEffect, useId, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { Locale } from '@/i18n/config';
import { pathFor } from '@/i18n/routes';
import { buttonClass } from '@/components/ui/button-styles';
import {
  CheckboxField,
  Honeypot,
  RadioCardsField,
  SelectField,
  TextField,
  TextareaField,
  type Option,
} from '@/components/quote/fields';
import { QuoteConfirmation } from '@/components/quote/QuoteConfirmation';
import { submitQuoteAction } from '@/app/actions/submit-quote';
import {
  CONCRETE_STRENGTHS,
  CONTACT_METHODS,
  CUSTOMER_TYPES,
  PREFERRED_TIMES,
  PROJECT_TYPES,
  TRI_STATES,
} from '@/lib/quote-options';
import { STEP_SCHEMAS, fieldErrors, type StepIndex } from '@/lib/quote-schema';
import { leadTimeBucket, track, volumeBucket } from '@/lib/analytics';
import { readAttribution } from '@/lib/attribution';
import { cn } from '@/lib/cn';

/** The dictionary slice this form needs. Typed from the French source. */
type QuoteStrings = (typeof import('@/messages/fr.json'))['quote'];

type Values = {
  address: string;
  city: string;
  postalCode: string;
  accessNotes: string;
  projectType: string;
  volumeUnknown: boolean;
  estimatedVolumeM3: string;
  concreteStrength: string;
  pumpRequired: string;
  pumpNotes: string;
  desiredDate: string;
  preferredTime: string;
  scheduleFlexible: boolean;
  customerType: string;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  preferredContactMethod: string;
  additionalNotes: string;
  consent: boolean;
  websiteUrl: string;
};

const INITIAL: Values = {
  address: '',
  city: '',
  postalCode: '',
  accessNotes: '',
  projectType: '',
  volumeUnknown: false,
  estimatedVolumeM3: '',
  concreteStrength: 'UNKNOWN',
  pumpRequired: 'UNKNOWN',
  pumpNotes: '',
  desiredDate: '',
  preferredTime: '',
  scheduleFlexible: false,
  customerType: '',
  name: '',
  companyName: '',
  email: '',
  phone: '',
  preferredContactMethod: 'PHONE',
  additionalNotes: '',
  consent: false,
  websiteUrl: '',
};

/** Which fields belong to which step, for scoping validation and error focus. */
const STEP_FIELDS: readonly (readonly (keyof Values)[])[] = [
  ['address', 'city', 'postalCode', 'accessNotes'],
  [
    'projectType',
    'volumeUnknown',
    'estimatedVolumeM3',
    'concreteStrength',
    'pumpRequired',
    'pumpNotes',
  ],
  ['desiredDate', 'preferredTime', 'scheduleFlexible'],
  [
    'customerType',
    'name',
    'companyName',
    'email',
    'phone',
    'preferredContactMethod',
    'additionalNotes',
    'consent',
  ],
];

const STEP_NAMES = ['location', 'project', 'schedule', 'contact'] as const;

const TOTAL_STEPS = STEP_FIELDS.length;

function readPrefilledVolume(value: string | null): string {
  if (!value) return '';
  const parsed = Number(value.replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed < 0.1 || parsed > 2000) return '';
  return parsed.toFixed(2);
}

function formatVolume(locale: Locale, value: string): string {
  const parsed = Number(value.replace(',', '.'));
  return new Intl.NumberFormat(locale === 'fr' ? 'fr-CA' : 'en-CA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parsed);
}

function todayIso(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export function QuoteForm({ locale, strings }: { locale: Locale; strings: QuoteStrings }) {
  const searchParams = useSearchParams();
  const prefilledVolume = readPrefilledVolume(searchParams.get('volume'));
  const [step, setStep] = useState<StepIndex>(prefilledVolume ? 1 : 0);
  const [values, setValues] = useState<Values>(() => ({
    ...INITIAL,
    estimatedVolumeM3: prefilledVolume,
    volumeUnknown: false,
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const startedRef = useRef(false);
  const prefilledTrackedRef = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const formId = useId();

  const options = strings.options;
  const t = strings.fields;

  useEffect(() => {
    track('quote_step_viewed', {
      locale,
      step: step + 1,
      stepName: STEP_NAMES[step],
      hasPrefilledVolume: prefilledVolume ? 'yes' : 'no',
    });
  }, [locale, prefilledVolume, step]);

  useEffect(() => {
    if (!prefilledVolume || prefilledTrackedRef.current) return;
    prefilledTrackedRef.current = true;
    track('quote_form_prefilled', {
      locale,
      source: 'calculator',
      volumeBucket: volumeBucket(Number(prefilledVolume)),
    });
  }, [locale, prefilledVolume]);

  function set<K extends keyof Values>(field: K, value: Values[K]) {
    // The visitor is fixing something; drop that field's error as they type.
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });

    if (!startedRef.current) {
      startedRef.current = true;
      track('quote_form_started', { locale });
    }
  }

  function errorFor(field: keyof Values): string | undefined {
    const key = errors[field];
    if (!key) return undefined;
    return strings.errors[key as keyof typeof strings.errors] ?? strings.errors.server;
  }

  /** Validates the current step and returns whether it passed. */
  function validateStep(index: StepIndex): boolean {
    const schema = STEP_SCHEMAS[index];
    const result = schema.safeParse(values);
    if (result.success) {
      setErrors({});
      return true;
    }
    setErrors(fieldErrors(result.error));
    return false;
  }

  function stepErrorCount(index: StepIndex): number {
    const result = STEP_SCHEMAS[index].safeParse(values);
    if (result.success) return 0;
    return Object.keys(fieldErrors(result.error)).length;
  }

  function focusSummary() {
    // Announce and move focus to the error list rather than silently failing.
    requestAnimationFrame(() => summaryRef.current?.focus());
  }

  function goNext() {
    if (!validateStep(step)) {
      track('quote_step_validation_failed', {
        locale,
        step: step + 1,
        stepName: STEP_NAMES[step],
        errorCount: stepErrorCount(step),
      });
      focusSummary();
      return;
    }
    track('quote_step_completed', {
      locale,
      step: step + 1,
      stepName: STEP_NAMES[step],
    });
    const next = Math.min(step + 1, TOTAL_STEPS - 1) as StepIndex;
    setStep(next);
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  function goBack() {
    setErrors({});
    setFormError(null);
    track('quote_step_back_clicked', {
      locale,
      step: step + 1,
      stepName: STEP_NAMES[step],
    });
    const prev = Math.max(step - 1, 0) as StepIndex;
    setStep(prev);
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!validateStep(step)) {
      track('quote_step_validation_failed', {
        locale,
        step: step + 1,
        stepName: STEP_NAMES[step],
        errorCount: stepErrorCount(step),
      });
      focusSummary();
      return;
    }

    track('quote_step_completed', { locale, step: TOTAL_STEPS, stepName: STEP_NAMES[3] });

    const payload = {
      ...values,
      locale,
      ...readAttribution(),
    };

    startTransition(async () => {
      const result = await submitQuoteAction(payload);

      if (result.ok) {
        track('quote_submitted', {
          locale,
          projectType: values.projectType,
          customerType: values.customerType,
          pumpRequired: values.pumpRequired,
          volumeBucket: volumeBucket(
            values.volumeUnknown ? null : Number(values.estimatedVolumeM3.replace(',', '.')),
          ),
          leadTimeBucket: leadTimeBucket(values.desiredDate),
        });
        setConfirmedId(result.publicId);
        return;
      }

      track('quote_submit_failed', { locale, reason: result.formError ?? 'validation' });

      if (result.fieldErrors) {
        setErrors(result.fieldErrors);
        // Jump back to the earliest step that has a problem.
        const bad = STEP_FIELDS.findIndex((fields) =>
          fields.some((field) => result.fieldErrors?.[field]),
        );
        if (bad >= 0 && bad !== step) setStep(bad as StepIndex);
      }
      setFormError(result.formError ?? null);
      focusSummary();
    });
  }

  if (confirmedId) {
    return <QuoteConfirmation locale={locale} strings={strings} publicId={confirmedId} />;
  }

  const stepStrings = strings.steps[step]!;
  const visibleErrors = STEP_FIELDS[step]!.filter((field) => errors[field]);
  const formErrorText = formError
    ? (strings.errors[formError as keyof typeof strings.errors] ?? strings.errors.server)
    : null;

  const toOptions = (values: readonly string[], labels: Record<string, string>): Option[] =>
    values.map((value) => ({ value, label: labels[value] ?? value }));

  return (
    <form onSubmit={handleSubmit} noValidate className="relative">
      <noscript>
        <p className="border-accent bg-accent-tint text-ink mb-6 rounded-lg border-l-4 p-4">
          {strings.noscript}
        </p>
      </noscript>

      <Stepper current={step} total={TOTAL_STEPS} strings={strings} />

      <div className="rounded-card border-line bg-surface shadow-card mt-6 border p-5 md:p-8">
        <h2
          ref={headingRef}
          tabIndex={-1}
          id={`${formId}-legend`}
          className="text-2xl outline-none sm:text-3xl"
        >
          {stepStrings.legend}
        </h2>
        <p className="text-ink-muted mt-2">{stepStrings.description}</p>
        <p className="text-ink-muted mt-1 text-sm">{strings.requiredHint}</p>

        {/* Errors are announced together and receive focus, so a keyboard or
            screen-reader user is never left guessing why the step didn't advance. */}
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          aria-live="assertive"
          className="outline-none"
        >
          {formErrorText || visibleErrors.length > 0 ? (
            <div className="border-danger bg-danger/[0.04] mt-5 rounded-lg border-l-4 p-4">
              <p className="text-danger font-semibold">
                {formErrorText ??
                  (visibleErrors.length === 1
                    ? strings.errorSummary.single
                    : strings.errorSummary.title)}
              </p>
              {visibleErrors.length > 0 ? (
                <ul className="text-danger mt-2 space-y-1 text-sm">
                  {visibleErrors.map((field) => (
                    <li key={field}>
                      <a href={`#${field}`} className="underline">
                        {errorFor(field)}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mt-7 space-y-6">
          {step === 0 ? (
            <>
              <TextField
                id="address"
                label={t.address.label}
                placeholder={t.address.placeholder}
                autoComplete="street-address"
                required
                value={values.address}
                onChange={(v) => set('address', v)}
                error={errorFor('address')}
              />
              <div className="grid gap-6 sm:grid-cols-2">
                <TextField
                  id="city"
                  label={t.city.label}
                  placeholder={t.city.placeholder}
                  autoComplete="address-level2"
                  required
                  value={values.city}
                  onChange={(v) => set('city', v)}
                  error={errorFor('city')}
                />
                <TextField
                  id="postalCode"
                  label={t.postalCode.label}
                  placeholder={t.postalCode.placeholder}
                  autoComplete="postal-code"
                  autoCapitalize="characters"
                  required
                  value={values.postalCode}
                  onChange={(v) => set('postalCode', v)}
                  error={errorFor('postalCode')}
                />
              </div>
              <TextareaField
                id="accessNotes"
                label={t.accessNotes.label}
                hint={t.accessNotes.hint}
                placeholder={t.accessNotes.placeholder}
                value={values.accessNotes}
                onChange={(v) => set('accessNotes', v)}
                error={errorFor('accessNotes')}
              />
            </>
          ) : null}

          {step === 1 ? (
            <>
              <RadioCardsField
                id="projectType"
                label={t.projectType.label}
                required
                columns={2}
                options={toOptions(PROJECT_TYPES, options.projectType)}
                value={values.projectType}
                onChange={(v) => set('projectType', v)}
                error={errorFor('projectType')}
              />

              <div className="space-y-3">
                {prefilledVolume && values.estimatedVolumeM3 === prefilledVolume ? (
                  <p className="border-accent bg-accent-tint rounded-lg border-l-4 p-3 text-sm font-semibold">
                    {strings.prefilledVolume.replace(
                      '{volume}',
                      formatVolume(locale, prefilledVolume),
                    )}
                  </p>
                ) : null}
                <TextField
                  id="estimatedVolumeM3"
                  label={`${t.volume.label} (${t.volume.unit})`}
                  hint={t.volume.hint}
                  placeholder="6"
                  type="text"
                  inputMode="decimal"
                  required={!values.volumeUnknown}
                  disabled={values.volumeUnknown}
                  value={values.estimatedVolumeM3}
                  onChange={(v) => set('estimatedVolumeM3', v)}
                  error={errorFor('estimatedVolumeM3')}
                />
                <CheckboxField
                  id="volumeUnknown"
                  label={t.volume.unknown}
                  checked={values.volumeUnknown}
                  onChange={(checked) => {
                    set('volumeUnknown', checked);
                    if (checked) set('estimatedVolumeM3', '');
                  }}
                />
              </div>

              <RadioCardsField
                id="concreteStrength"
                label={t.concreteStrength.label}
                hint={t.concreteStrength.hint}
                required
                columns={3}
                options={toOptions(CONCRETE_STRENGTHS, options.concreteStrength)}
                value={values.concreteStrength}
                onChange={(v) => set('concreteStrength', v)}
                error={errorFor('concreteStrength')}
              />

              <RadioCardsField
                id="pumpRequired"
                label={t.pumpRequired.label}
                required
                columns={3}
                options={toOptions(TRI_STATES, options.pumpRequired)}
                value={values.pumpRequired}
                onChange={(v) => set('pumpRequired', v)}
                error={errorFor('pumpRequired')}
              />

              {values.pumpRequired !== 'NO' ? (
                <TextareaField
                  id="pumpNotes"
                  label={t.pumpNotes.label}
                  hint={t.pumpNotes.hint}
                  placeholder={t.pumpNotes.placeholder}
                  value={values.pumpNotes}
                  onChange={(v) => set('pumpNotes', v)}
                  error={errorFor('pumpNotes')}
                />
              ) : null}
            </>
          ) : null}

          {step === 2 ? (
            <>
              <TextField
                id="desiredDate"
                label={t.desiredDate.label}
                type="date"
                min={todayIso()}
                required
                value={values.desiredDate}
                onChange={(v) => set('desiredDate', v)}
                error={errorFor('desiredDate')}
              />
              <SelectField
                id="preferredTime"
                label={t.preferredTime.label}
                hint={t.preferredTime.hint}
                placeholder={t.preferredTime.none}
                options={toOptions(PREFERRED_TIMES, options.preferredTime)}
                value={values.preferredTime}
                onChange={(v) => set('preferredTime', v)}
                error={errorFor('preferredTime')}
              />
              <CheckboxField
                id="scheduleFlexible"
                label={t.scheduleFlexible.label}
                checked={values.scheduleFlexible}
                onChange={(checked) => set('scheduleFlexible', checked)}
              />
            </>
          ) : null}

          {step === 3 ? (
            <>
              <RadioCardsField
                id="customerType"
                label={t.customerType.label}
                required
                options={toOptions(CUSTOMER_TYPES, options.customerType)}
                value={values.customerType}
                onChange={(v) => set('customerType', v)}
                error={errorFor('customerType')}
              />
              <TextField
                id="name"
                label={t.name.label}
                placeholder={t.name.placeholder}
                autoComplete="name"
                required
                value={values.name}
                onChange={(v) => set('name', v)}
                error={errorFor('name')}
              />
              {values.customerType === 'BUSINESS' ? (
                <TextField
                  id="companyName"
                  label={t.companyName.label}
                  hint={t.companyName.hint}
                  placeholder={t.companyName.placeholder}
                  autoComplete="organization"
                  value={values.companyName}
                  onChange={(v) => set('companyName', v)}
                  error={errorFor('companyName')}
                />
              ) : null}
              <div className="grid gap-6 sm:grid-cols-2">
                <TextField
                  id="phone"
                  label={t.phone.label}
                  placeholder={t.phone.placeholder}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  value={values.phone}
                  onChange={(v) => set('phone', v)}
                  error={errorFor('phone')}
                />
                <TextField
                  id="email"
                  label={t.email.label}
                  placeholder={t.email.placeholder}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="off"
                  spellCheck={false}
                  required
                  value={values.email}
                  onChange={(v) => set('email', v)}
                  error={errorFor('email')}
                />
              </div>
              <RadioCardsField
                id="preferredContactMethod"
                label={t.preferredContactMethod.label}
                required
                columns={3}
                options={toOptions(CONTACT_METHODS, options.contactMethod)}
                value={values.preferredContactMethod}
                onChange={(v) => set('preferredContactMethod', v)}
                error={errorFor('preferredContactMethod')}
              />
              <TextareaField
                id="additionalNotes"
                label={t.additionalNotes.label}
                hint={t.additionalNotes.hint}
                placeholder={t.additionalNotes.placeholder}
                value={values.additionalNotes}
                onChange={(v) => set('additionalNotes', v)}
                error={errorFor('additionalNotes')}
              />
              <CheckboxField
                id="consent"
                label={t.consent.label}
                checked={values.consent}
                onChange={(checked) => set('consent', checked)}
                error={errorFor('consent')}
              >
                <p className="text-ink-muted mt-2 text-sm">
                  {t.consent.linksIntro}{' '}
                  <Link href={pathFor('privacy', locale)} className="text-accent underline">
                    {strings.privacyLinkLabel}
                  </Link>{' '}
                  ·{' '}
                  <Link href={pathFor('terms', locale)} className="text-accent underline">
                    {strings.termsLinkLabel}
                  </Link>
                </p>
              </CheckboxField>
            </>
          ) : null}
        </div>

        <Honeypot
          value={values.websiteUrl}
          onChange={(v) => set('websiteUrl', v)}
          label={t.honeypot.label}
        />

        <div className="border-line mt-8 flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-between">
          {step > 0 ? (
            <button
              type="button"
              onClick={goBack}
              className={buttonClass('secondary', 'md', 'w-full sm:w-auto')}
            >
              {strings.actions.back}
            </button>
          ) : (
            <span className="hidden sm:block" />
          )}

          {step < TOTAL_STEPS - 1 ? (
            <button
              type="button"
              onClick={goNext}
              className={buttonClass('primary', 'lg', 'w-full sm:w-auto')}
            >
              {strings.actions.next}
            </button>
          ) : (
            <button
              type="submit"
              disabled={isPending}
              className={buttonClass('primary', 'lg', 'w-full sm:w-auto')}
            >
              {isPending ? strings.actions.submitting : strings.actions.submit}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

function Stepper({
  current,
  total,
  strings,
}: {
  current: number;
  total: number;
  strings: QuoteStrings;
}) {
  return (
    <div>
      <p className="text-ink-muted font-display text-sm font-semibold tracking-wide uppercase">
        {strings.progress} {current + 1} {strings.progressOf} {total} —{' '}
        {strings.steps[current]!.title}
      </p>
      <ol className="mt-3 flex gap-2" aria-hidden="true">
        {strings.steps.map((s, index) => (
          <li
            key={s.title}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors',
              index <= current ? 'bg-accent' : 'bg-line-strong',
            )}
          />
        ))}
      </ol>
    </div>
  );
}
