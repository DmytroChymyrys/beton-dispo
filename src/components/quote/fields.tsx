'use client';

import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/*
 * Form primitives for the quote request.
 *
 * Accessibility rules enforced here rather than at each call site:
 * - every control has a real <label>, never a placeholder standing in for one;
 * - hints and errors are wired through `aria-describedby`;
 * - invalid controls carry `aria-invalid`, so the error is announced;
 * - targets are at least 48px tall for one-handed use on a phone.
 */

const controlBase =
  'w-full rounded-lg border bg-surface px-4 py-3 text-base text-ink min-h-12 ' +
  'placeholder:text-ink-muted/60 transition-colors';

function controlClass(invalid: boolean): string {
  return cn(
    controlBase,
    invalid ? 'border-danger bg-danger/[0.03]' : 'border-line-strong hover:border-ink-muted',
  );
}

type ShellProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
};

export function Field({ id, label, hint, error, required = false, children }: ShellProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-ink block text-[0.95rem] font-semibold">
        {label}
        {required ? (
          <span className="text-accent ml-1" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {hint ? (
        <p id={hintId} className="text-ink-muted text-sm">
          {hint}
        </p>
      ) : null}
      {children}
      {error ? (
        <p id={errorId} className="text-danger flex items-start gap-1.5 text-sm font-medium">
          <span aria-hidden="true">⚠</span>
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Builds the `aria-describedby` value for a control inside `<Field>`. */
export function describedBy(id: string, hint?: string, error?: string): string | undefined {
  const ids = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean);
  return ids.length ? ids.join(' ') : undefined;
}

type TextProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  required?: boolean;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'value' | 'onChange' | 'required'>;

export function TextField({
  id,
  label,
  value,
  onChange,
  hint,
  error,
  required,
  ...rest
}: TextProps) {
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      <input
        {...rest}
        id={id}
        name={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={controlClass(Boolean(error))}
      />
    </Field>
  );
}

type TextareaProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  required?: boolean;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'value' | 'onChange' | 'required'>;

export function TextareaField({
  id,
  label,
  value,
  onChange,
  hint,
  error,
  required,
  rows = 4,
  ...rest
}: TextareaProps) {
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      <textarea
        {...rest}
        id={id}
        name={id}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cn(controlClass(Boolean(error)), 'min-h-28 resize-y')}
      />
    </Field>
  );
}

export type Option = { value: string; label: string };

/**
 * Radio group rendered as tappable cards. Radios rather than a <select> so all
 * options are visible at once — faster on a phone and clearer for
 * "I don't know", which must never look like an afterthought.
 */
export function RadioCardsField({
  id,
  label,
  options,
  value,
  onChange,
  hint,
  error,
  required,
  columns = 2,
}: {
  id: string;
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  required?: boolean;
  columns?: 1 | 2 | 3;
}) {
  const columnClass =
    columns === 1 ? 'grid-cols-1' : columns === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2';

  return (
    // The group is the labelled control here, so the label is a real <legend>
    // and the hint/error are attached to the fieldset via aria-describedby.
    <fieldset id={id} aria-describedby={describedBy(id, hint, error)} className="space-y-2">
      <legend className="text-ink mb-2 block text-[0.95rem] font-semibold">
        {label}
        {required ? (
          <span className="text-accent ml-1" aria-hidden="true">
            *
          </span>
        ) : null}
      </legend>

      {hint ? (
        <p id={`${id}-hint`} className="text-ink-muted text-sm">
          {hint}
        </p>
      ) : null}

      <div className={cn('grid gap-2', columnClass)}>
        {options.map((option) => {
          const optionId = `${id}-${option.value}`;
          const selected = value === option.value;
          return (
            <label
              key={option.value}
              htmlFor={optionId}
              className={cn(
                'flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-base transition-colors',
                selected
                  ? 'border-accent bg-accent-tint text-ink font-semibold'
                  : 'border-line-strong bg-surface text-ink-soft hover:border-ink-muted',
                error && !value ? 'border-danger' : '',
              )}
            >
              <input
                type="radio"
                id={optionId}
                name={id}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                // No aria-invalid: the role doesn't support it. The error is
                // announced through the fieldset's aria-describedby instead.
                className="accent-accent size-5 shrink-0"
              />
              {option.label}
            </label>
          );
        })}
      </div>

      {error ? (
        <p id={`${id}-error`} className="text-danger flex items-start gap-1.5 text-sm font-medium">
          <span aria-hidden="true">⚠</span>
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

export function CheckboxField({
  id,
  label,
  checked,
  onChange,
  error,
  children,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  /** Extra content rendered under the label, e.g. policy links. */
  children?: ReactNode;
}) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="space-y-2">
      <div
        className={cn(
          'flex items-start gap-3 rounded-lg border p-4',
          error ? 'border-danger bg-danger/[0.03]' : 'border-line-strong bg-surface',
        )}
      >
        <input
          type="checkbox"
          id={id}
          name={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className="accent-accent mt-0.5 size-5 shrink-0"
        />
        <div>
          <label htmlFor={id} className="text-ink block cursor-pointer text-[0.95rem]">
            {label}
          </label>
          {children}
        </div>
      </div>
      {error ? (
        <p id={errorId} className="text-danger flex items-start gap-1.5 text-sm font-medium">
          <span aria-hidden="true">⚠</span>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function SelectField({
  id,
  label,
  options,
  value,
  onChange,
  hint,
  error,
  required,
  placeholder,
}: {
  id: string;
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      <select
        id={id}
        name={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={controlClass(Boolean(error))}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

/**
 * Honeypot. Off-screen rather than `display:none` (some bots skip hidden
 * inputs), removed from the tab order and hidden from assistive technology, so
 * only an automated filler will populate it.
 */
export function Honeypot({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <div aria-hidden="true" className="absolute top-0 left-[-9999px] h-0 w-0 overflow-hidden">
      <label htmlFor="websiteUrl">{label}</label>
      <input
        id="websiteUrl"
        name="websiteUrl"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
