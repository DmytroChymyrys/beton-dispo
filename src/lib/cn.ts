type ClassValue = string | false | null | undefined;

/** Minimal class joiner. Keeps the bundle free of a utility dependency. */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
