import { Iterables } from "../../base/Iterables";

import { TileFormatError } from "../../tileFormats/TileFormatError";

import { ReadablePointCloud } from "./ReadablePointCloud";

export class DefaultPointCloud implements ReadablePointCloud {
  private readonly attributeValues: { [key: string]: Iterable<number> } = {};
  private readonly attributeTypes: { [key: string]: string } = {};
  private readonly attributeComponentTypes: { [key: string]: string } = {};
  private globalColor: [number, number, number, number] | undefined;

  setPositions(positions: Iterable<number[]>) {
    this.addAttribute(
      "POSITION",
      "VEC3",
      "FLOAT32",
      Iterables.flatten(positions)
    );
  }

  setNormals(normals: Iterable<number[]>) {
    this.addAttribute("NORMAL", "VEC3", "FLOAT32", Iterables.flatten(normals));
  }

  setNormalizedLinearColors(colors: Iterable<number[]>) {
    this.addAttribute("COLOR_0", "VEC4", "FLOAT32", Iterables.flatten(colors));
  }

  addAttribute(
    name: string,
    type: string,
    componentType: string,
    attribute: Iterable<number>
  ) {
    this.attributeTypes[name] = type;
    this.attributeComponentTypes[name] = componentType;
    this.attributeValues[name] = attribute;
  }

  /** {@inheritDoc WritablePointCloud.setNormalizedLinearGlobalColor} */
  setNormalizedLinearGlobalColor(r: number, g: number, b: number, a: number) {
    this.globalColor = [r, g, b, a];
  }

  /** {@inheritDoc ReadablePointCloud.getPositions} */
  getPositions(): Iterable<number[]> {
    const values = this.getAttributeValues("POSITION");
    if (!values) {
      throw new TileFormatError("No POSITION values have been added");
    }
    return Iterables.segmentize(values, 3);
  }

  /** {@inheritDoc ReadablePointCloud.getNormals} */
  getNormals(): Iterable<number[]> | undefined {
    const values = this.getAttributeValues("NORMAL");
    if (!values) {
      return undefined;
    }
    return Iterables.segmentize(values, 3);
  }

  /** {@inheritDoc ReadablePointCloud.getNormalizedLinearColors} */
  getNormalizedLinearColors(): Iterable<number[]> | undefined {
    const values = this.getAttributeValues("COLOR_0");
    if (!values) {
      return undefined;
    }
    return Iterables.segmentize(values, 4);
  }

  /** {@inheritDoc ReadablePointCloud.getNormalizedLinearGlobalColor} */
  getNormalizedLinearGlobalColor():
    | [number, number, number, number]
    | undefined {
    if (this.globalColor) {
      return [...this.globalColor];
    }
    return undefined;
  }

  getAttributes(): string[] {
    return Object.keys(this.attributeValues);
  }
  getAttributeValues(name: string): Iterable<number> | undefined {
    const values = this.attributeValues[name];
    if (!values) {
      return undefined;
    }
    return values;
  }
  getAttributeType(name: string): string | undefined {
    return this.attributeTypes[name];
  }
  getAttributeComponentType(name: string): string | undefined {
    return this.attributeComponentTypes[name];
  }
}
