export interface PointCloudWriter {
  addPosition(x: number, y: number, z: number): void;
  addNormal(x: number, y: number, z: number): void;
  addColor(r: number, g: number, b: number, a: number): void;

  setGlobalColor(r: number, g: number, b: number, a: number): void;
}
