import {
  type CircularSlabInput,
  type CylinderInput,
  type Dimension,
  type HollowCylinderInput,
  type RectangularInput,
  type WastePercent,
} from './types';
import { toMeters } from './units';

export const MAX_DIMENSION_METERS = 1000;
export const MAX_QUANTITY = 1000;

export function dimensionToMeters(dimension: Dimension): number {
  const meters = toMeters(dimension.value, dimension.unit);
  if (!Number.isFinite(meters) || meters <= 0 || meters > MAX_DIMENSION_METERS) {
    throw new Error('Invalid dimension.');
  }
  return meters;
}

export function assertQuantity(quantity: number): void {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
    throw new Error('Invalid quantity.');
  }
}

export function calculateRectangularVolume(input: RectangularInput): number {
  assertQuantity(input.quantity);
  return (
    dimensionToMeters(input.length) *
    dimensionToMeters(input.width) *
    dimensionToMeters(input.thickness) *
    input.quantity
  );
}

export function calculateCylinderVolume(input: CylinderInput): number {
  assertQuantity(input.quantity);
  const radius = dimensionToMeters(input.diameter) / 2;
  return Math.PI * radius * radius * dimensionToMeters(input.height) * input.quantity;
}

export function calculateCircularSlabVolume(input: CircularSlabInput): number {
  assertQuantity(input.quantity);
  const radius = dimensionToMeters(input.diameter) / 2;
  return Math.PI * radius * radius * dimensionToMeters(input.thickness) * input.quantity;
}

export function calculateHollowCylinderVolume(input: HollowCylinderInput): number {
  assertQuantity(input.quantity);
  const outerRadius = dimensionToMeters(input.outerDiameter) / 2;
  const innerRadius = dimensionToMeters(input.innerDiameter) / 2;

  if (innerRadius >= outerRadius) {
    throw new Error('Inner diameter must be smaller than outer diameter.');
  }

  return (
    Math.PI *
    (outerRadius ** 2 - innerRadius ** 2) *
    dimensionToMeters(input.height) *
    input.quantity
  );
}

export function addWasteFactor(volume: number, wastePercent: WastePercent): number {
  return volume * (1 + wastePercent / 100);
}
