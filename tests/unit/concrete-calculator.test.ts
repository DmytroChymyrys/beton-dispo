import { describe, expect, it } from 'vitest';
import {
  addWasteFactor,
  calculateCircularSlabVolume,
  calculateCylinderVolume,
  calculateHollowCylinderVolume,
  calculateRectangularVolume,
} from '@/lib/concrete-calculator/formulas';
import { cubicMetersToCubicYards, toMeters } from '@/lib/concrete-calculator/units';

describe('concrete calculator units', () => {
  it('converts supported length units to metres', () => {
    expect(toMeters(1000, 'mm')).toBeCloseTo(1);
    expect(toMeters(100, 'cm')).toBeCloseTo(1);
    expect(toMeters(1, 'm')).toBeCloseTo(1);
    expect(toMeters(12, 'in')).toBeCloseTo(0.3048);
    expect(toMeters(10, 'ft')).toBeCloseTo(3.048);
  });

  it('converts cubic metres to cubic yards', () => {
    expect(cubicMetersToCubicYards(5.19)).toBeCloseTo(6.788, 3);
  });
});

describe('concrete calculator formulas', () => {
  it('calculates rectangular slab volume after unit conversion', () => {
    const volume = calculateRectangularVolume({
      length: { value: 10, unit: 'ft' },
      width: { value: 10, unit: 'ft' },
      thickness: { value: 4, unit: 'in' },
      quantity: 1,
    });

    expect(volume).toBeCloseTo(0.9439, 4);
  });

  it('calculates solid cylinder volume', () => {
    const volume = calculateCylinderVolume({
      diameter: { value: 1, unit: 'm' },
      height: { value: 1, unit: 'm' },
      quantity: 1,
    });

    expect(volume).toBeCloseTo(0.7854, 4);
  });

  it('calculates circular slab volume', () => {
    const volume = calculateCircularSlabVolume({
      diameter: { value: 2, unit: 'm' },
      thickness: { value: 10, unit: 'cm' },
      quantity: 1,
    });

    expect(volume).toBeCloseTo(0.3142, 4);
  });

  it('calculates hollow cylinder volume', () => {
    const volume = calculateHollowCylinderVolume({
      outerDiameter: { value: 1, unit: 'm' },
      innerDiameter: { value: 0.5, unit: 'm' },
      height: { value: 1, unit: 'm' },
      quantity: 1,
    });

    expect(volume).toBeCloseTo(0.589, 3);
  });

  it('rejects hollow cylinders with an inner diameter greater than or equal to the outer diameter', () => {
    expect(() =>
      calculateHollowCylinderVolume({
        outerDiameter: { value: 1, unit: 'm' },
        innerDiameter: { value: 1, unit: 'm' },
        height: { value: 1, unit: 'm' },
        quantity: 1,
      }),
    ).toThrow(/Inner diameter/);
  });

  it('adds the selected waste factor without rounding the input volume', () => {
    expect(addWasteFactor(4.72, 10)).toBeCloseTo(5.192);
  });
});
