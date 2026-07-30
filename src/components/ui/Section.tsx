import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'ground' | 'surface' | 'sunken' | 'steel';

const tones: Record<Tone, string> = {
  ground: 'bg-ground',
  surface: 'bg-surface',
  sunken: 'bg-surface-sunken',
  steel: 'bg-steel text-white/80',
};

export function Section({
  children,
  tone = 'ground',
  className,
  id,
  labelledBy,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  id?: string;
  labelledBy?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn('py-16 md:py-24', tones[tone], className)}
    >
      <div className="container-page">{children}</div>
    </section>
  );
}

export function Eyebrow({ children, onDark = false }: { children: ReactNode; onDark?: boolean }) {
  return (
    <p
      className={cn(
        'font-display text-xs font-bold tracking-[0.14em] uppercase',
        onDark ? 'text-accent-bright' : 'text-accent',
      )}
    >
      {children}
    </p>
  );
}

export function SectionTitle({
  children,
  id,
  onDark = false,
  className,
}: {
  children: ReactNode;
  id?: string;
  onDark?: boolean;
  className?: string;
}) {
  return (
    <h2
      id={id}
      className={cn(
        'mt-3 text-3xl leading-[1.1] sm:text-4xl md:text-[2.75rem]',
        onDark && 'text-white',
        className,
      )}
    >
      {children}
    </h2>
  );
}

export function Lead({
  children,
  onDark = false,
  className,
}: {
  children: ReactNode;
  onDark?: boolean;
  className?: string;
}) {
  return (
    <p
      className={cn(
        'mt-4 max-w-2xl text-lg leading-relaxed',
        onDark ? 'text-white/75' : 'text-ink-muted',
        className,
      )}
    >
      {children}
    </p>
  );
}
