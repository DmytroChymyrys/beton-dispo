export type LengthUnit = 'mm' | 'cm' | 'm' | 'in' | 'ft';

export type GeometryType = 'rectangular' | 'cylinder' | 'circularSlab' | 'hollowCylinder';

export type WastePercent = 0 | 5 | 10 | 15;

export interface Dimension {
  value: number;
  unit: LengthUnit;
}

export interface RectangularInput {
  length: Dimension;
  width: Dimension;
  thickness: Dimension;
  quantity: number;
}

export interface CylinderInput {
  diameter: Dimension;
  height: Dimension;
  quantity: number;
}

export interface CircularSlabInput {
  diameter: Dimension;
  thickness: Dimension;
  quantity: number;
}

export interface HollowCylinderInput {
  outerDiameter: Dimension;
  innerDiameter: Dimension;
  height: Dimension;
  quantity: number;
}
