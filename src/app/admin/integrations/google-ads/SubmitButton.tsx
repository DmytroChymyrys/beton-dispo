'use client';

import { useFormStatus } from 'react-dom';

export function SubmitButton({
  children,
  pendingLabel,
}: {
  children: React.ReactNode;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="bg-accent hover:bg-accent-hover disabled:bg-accent/70 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-white shadow-sm transition duration-150 hover:-translate-y-0.5 hover:shadow-md disabled:translate-y-0 disabled:cursor-wait disabled:shadow-none"
    >
      {pending ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
          <span>{pendingLabel}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
