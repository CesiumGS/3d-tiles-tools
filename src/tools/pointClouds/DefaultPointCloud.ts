import { Iterables } from "../../base";

import { TileFormatError } from "../../tilesets";

import { ReadablePointCloud } from "./ReadablePointCloud";

/**
 * Implementation of a `ReadablePointCloud` where the
 * attribute values may be set directly.
 *
 * @internal
 */
export class DefaultPointCloud implements ReadablePointCloud {
  /**
   * The mapping from attribute names to values
   */
  private readonly attributeValues: { [key: string]: Iterable<number> } = {};

  /**
   * The mapping from attribute names to their types,
   * e.g. `SCALAR` or `VEC3`
   */
  private readonly attributeTypes: { [key: string]: string } = {};

  /**
   * The mapping from attribute names to their component types,
   * e.g. `UINT8` or `FLOAT32`
   */
  private readonly attributeComponentTypes: { [key: string]: string } = {};

  /**
   * An optional global color (linear RGBA, in [0.0, 1.0])
   */
  private globalColor: [number, number, number, number] | undefined;

  /**
   * An optional position that the positions are relative to
   */
  private globalPosition: [number, number, number] | undefined;

  /**
   * Set the given positions as the POSITION attribute
   *
   * @param positions - The positions, as 3D floating point values
   */
  setPositions(positions: Iterable<number[]>) {
    this.addAttribute(
      "POSITION",
      "VEC3",
      "FLOAT32",
      Iterables.flatten(positions)
    );
  }

  /**
   * Set the given normals as the NORMAL attribute
   *
   * @param normals - The normals, as 3D floating point values
   */
  setNormals(normals: Iterable<number[]>) {
    this.addAttribute("NORMAL", "VEC3", "FLOAT32", Iterables.flatten(normals));
  }

  /**
   * Set the given colors as the COLOR_0 attribute
   *
   * @param colors - The colors, as linear RGBA values in [0.0, 1.0]
   */
  setNormalizedLinearColors(colors: Iterable<number[]>) {
    this.addAttribute("COLOR_0", "VEC4", "FLOAT32", Iterables.flatten(colors));
  }

  /**
   * Add the given attribute to this point cloud
   *
   * @param name - The name, e.g. `"POSITION"`
   * @param type - The type, e.g. `"VEC3"`
   * @param componentType - The component type, e.g. `"FLOAT32"`
   * @param attribute - The attribute values
   */
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

  /** {@inheritDoc ReadablePointCloud.getPositions} */
  getPositions(): Iterable<number[]> {
    const values = this.getAttributeValues("POSITION");
    if (!values) {
      throw new TileFormatError("No POSITION values have been added");
    }
    return Iterables.segmentize(values, 3);
  }

  /** {@inheritDoc ReadablePointCloud.getGlobalPosition} */
  getGlobalPosition(): [number, number, number] | undefined {
    return this.globalPosition;
  }

  setGlobalPosition(globalPosition: [number, number, number] | undefined) {
    this.globalPosition = globalPosition;
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

  setNormalizedLinearGlobalColor(
    globalColor: [number, number, number, number] | undefined
  ) {
    this.globalColor = globalColor;
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

  /** {@inheritDoc ReadablePointCloud.getAttributes} */
  getAttributes(): string[] {
    return Object.keys(this.attributeValues);
  }

  /** {@inheritDoc ReadablePointCloud.getAttributeValues} */
  getAttributeValues(name: string): Iterable<number> | undefined {
    const values = this.attributeValues[name];
    if (!values) {
      return undefined;
    }
    return values;
  }

  /** {@inheritDoc ReadablePointCloud.getAttributeType} */
  getAttributeType(name: string): string | undefined {
    return this.attributeTypes[name];
  }

  /** {@inheritDoc ReadablePointCloud.getAttributeComponentType} */
  getAttributeComponentType(name: string): string | undefined {
    return this.attributeComponentTypes[name];
  }
}
