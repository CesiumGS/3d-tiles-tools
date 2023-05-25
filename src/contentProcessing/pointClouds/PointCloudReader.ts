export interface PointCloudReader {
  getPositions(): Iterable<number[]>;
  getNormals(): Iterable<number[]> | undefined;
  getColors(): Iterable<number[]> | undefined;

  getGlobalColor(): [number, number, number, number] | undefined;

  getAttributes(): string[];
  getAttributeValues(name: string): Iterable<number> | undefined;
  getAttributeType(name: string): string | undefined;
  getAttributeComponentType(name: string): string | undefined;
}
