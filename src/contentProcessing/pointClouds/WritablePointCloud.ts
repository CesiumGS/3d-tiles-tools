export interface WritablePointCloud {
  addPosition(x: number, y: number, z: number): void;
  addNormal(x: number, y: number, z: number): void;
  addNormalizedLinearColor(r: number, g: number, b: number, a: number): void;

  setNormalizedLinearGlobalColor(
    r: number,
    g: number,
    b: number,
    a: number
  ): void;
}
