import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'onDark';
export type ButtonSize = 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold ' +
  'transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 ' +
  'text-center leading-tight';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-hover shadow-card',
  secondary: 'bg-surface text-ink border border-line-strong hover:bg-surface-sunken',
  ghost: 'text-ink hover:bg-surface-sunken',
  onDark: 'bg-white text-steel hover:bg-ground',
};

/** 48px / 56px tall — comfortable one-handed targets on mobile. */
const sizes: Record<ButtonSize, string> = {
  md: 'min-h-12 px-5 py-3 text-base',
  lg: 'min-h-14 px-7 py-4 text-lg',
};

export function buttonClass(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  extra?: string,
): string {
  return cn(base, variants[variant], sizes[size], extra);
}
