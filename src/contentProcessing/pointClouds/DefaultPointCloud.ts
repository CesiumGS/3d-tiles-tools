import { TileFormatError } from "../../tileFormats/TileFormatError";
import { PointCloudReader } from "./PointCloudReader";
import { Iterables } from "../../base/Iterables";

export class DefaultPointCloud implements PointCloudReader {
  private readonly attributeValues: { [key: string]: Iterable<number> } = {};
  private readonly attributeTypes: { [key: string]: string } = {};
  private readonly attributeComponentTypes: { [key: string]: string } = {};
  private globalColor: [number, number, number, number] | undefined;

  addPositions(positions: Iterable<number[]>) {
    this.addAttribute(
      "POSITION",
      "VEC3",
      "FLOAT32",
      Iterables.flatten(positions)
    );
  }

  addNormals(normals: Iterable<number[]>) {
    this.addAttribute("NORMAL", "VEC3", "FLOAT32", Iterables.flatten(normals));
  }

  addColors(colors: Iterable<number[]>) {
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

  /** {@inheritDoc PointCloudWriter.setGlobalColor} */
  setGlobalColor(r: number, g: number, b: number, a: number) {
    this.globalColor = [r, g, b, a];
  }

  /** {@inheritDoc PointCloudReader.getPositions} */
  getPositions(): Iterable<number[]> {
    const values = this.getAttributeValues("POSITION");
    if (!values) {
      throw new TileFormatError("No POSITION values have been added");
    }
    return Iterables.segmentize(values, 3);
  }

  /** {@inheritDoc PointCloudReader.getNormals} */
  getNormals(): Iterable<number[]> | undefined {
    const values = this.getAttributeValues("NORMAL");
    if (!values) {
      return undefined;
    }
    return Iterables.segmentize(values, 3);
  }

  /** {@inheritDoc PointCloudReader.getColors} */
  getColors(): Iterable<number[]> | undefined {
    const values = this.getAttributeValues("COLOR_0");
    if (!values) {
      return undefined;
    }
    return Iterables.segmentize(values, 4);
  }

  /** {@inheritDoc PointCloudReader.getGlobalColor} */
  getGlobalColor(): [number, number, number, number] | undefined {
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
