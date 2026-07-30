import { Archivo, Inter } from 'next/font/google';

/** Body copy. */
export const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-inter',
});

/** Headings — slightly squarer and heavier, reads as construction/logistics. */
export const archivo = Archivo({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  weight: ['600', '700', '800'],
  variable: '--font-archivo',
});
