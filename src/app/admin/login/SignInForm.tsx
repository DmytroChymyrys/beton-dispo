'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { signInAction, type SignInState } from '@/app/admin/actions';
import { buttonClass } from '@/components/ui/button-styles';

const inputClass =
  'w-full min-h-12 rounded-lg border border-line-strong bg-surface px-4 py-3 text-base text-ink';

type LoginLabels = {
  email: string;
  password: string;
  submit: string;
  pending: string;
  invalid: string;
};

export function SignInForm({ labels }: { labels: LoginLabels }) {
  const [state, formAction] = useActionState<SignInState, FormData>(signInAction, {});

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-semibold">
          {labels.email}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          defaultValue={state.email ?? ''}
          required
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-semibold">
          {labels.password}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </div>

      {state.error ? (
        <p role="alert" className="text-danger text-sm font-medium">
          {labels.invalid}
        </p>
      ) : null}

      <SubmitButton labels={labels} />
    </form>
  );
}

function SubmitButton({ labels }: { labels: LoginLabels }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClass('primary', 'md', 'w-full')}>
      {pending ? labels.pending : labels.submit}
    </button>
  );
}
