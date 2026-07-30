import type { ReactNode } from 'react';

/**
 * Pass-through root layout.
 *
 * `<html>` and `<body>` are rendered by `app/[locale]/layout.tsx` because the
 * `lang` attribute depends on the locale segment. Every public route lives
 * under `[locale]`; `/admin` renders its own document shell.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
