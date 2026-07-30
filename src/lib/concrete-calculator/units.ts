import type { LengthUnit } from './types';

export const UNIT_TO_METERS: Record<LengthUnit, number> = {
  mm: 0.001,
  cm: 0.01,
  m: 1,
  in: 0.0254,
  ft: 0.3048,
};

export const CUBIC_METERS_TO_CUBIC_YARDS = 1.30795062;

export function toMeters(value: number, unit: LengthUnit): number {
  return value * UNIT_TO_METERS[unit];
}

export function cubicMetersToCubicYards(m3: number): number {
  return m3 * CUBIC_METERS_TO_CUBIC_YARDS;
}
