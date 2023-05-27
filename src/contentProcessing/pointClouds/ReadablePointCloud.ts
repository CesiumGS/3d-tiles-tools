export interface ReadablePointCloud {
  getPositions(): Iterable<number[]>;
  getNormals(): Iterable<number[]> | undefined;
  getNormalizedLinearColors(): Iterable<number[]> | undefined;

  getNormalizedLinearGlobalColor():
    | [number, number, number, number]
    | undefined;

  getAttributes(): string[];
  getAttributeValues(name: string): Iterable<number> | undefined;
  getAttributeType(name: string): string | undefined;
  getAttributeComponentType(name: string): string | undefined;
}
