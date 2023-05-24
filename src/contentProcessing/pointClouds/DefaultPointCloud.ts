import { TileFormatError } from "../../tileFormats/TileFormatError";
import { PointCloudReader } from "./PointCloudReader";
import { Iterables } from "../../base/Iterables";

export class DefaultPointCloud implements PointCloudReader {
  private readonly attributeValues: { [key: string]: Iterable<number> } = {};
  private readonly attributeTypes: { [key: string]: string } = {};
  private readonly attributeComponentTypes: { [key: string]: string } = {};
  private globalColor: [number, number, number, number] | undefined;

  addPositions(positions: Iterable<number[]>) {
    this.addAttribute("POSITION", "VEC3", "FLOAT32", [...positions].flat());
  }

  addNormals(normals: Iterable<number[]>) {
    this.addAttribute("NORMAL", "VEC3", "FLOAT32", [...normals].flat());
  }

  addColors(colors: Iterable<number[]>) {
    this.addAttribute("COLOR_0", "VEC4", "FLOAT32", [...colors].flat());
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
    const values = this.attributeValues["POSITION"];
    if (!values) {
      throw new TileFormatError("No POSITION values have been added");
    }
    return Iterables.segmentize(values, 3);
  }

  /** {@inheritDoc PointCloudReader.getNormals} */
  getNormals(): Iterable<number[]> | undefined {
    const values = this.attributeValues["NORMAL"];
    if (!values) {
      return undefined;
    }
    return Iterables.segmentize(values, 3);
  }

  /** {@inheritDoc PointCloudReader.getColors} */
  getColors(): Iterable<number[]> | undefined {
    const values = this.attributeValues["COLOR_0"];
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
  getAttribute(name: string): Iterable<any> | undefined {
    const array = this.attributeValues[name];
    if (!array) {
      return undefined;
    }
    const type = this.getAttributeType(name);
    if (type === "SCALAR") {
      return array;
    }
    if (type === "VEC2") {
      return Iterables.segmentize(array, 2);
    }
    if (type === "VEC3") {
      return Iterables.segmentize(array, 3);
    }
    if (type === "VEC4") {
      return Iterables.segmentize(array, 4);
    }
    throw new TileFormatError("Invalid attribute type " + type);
  }
  getAttributeType(name: string): string | undefined {
    return this.attributeTypes[name];
  }
  getAttributeComponentType(name: string): string | undefined {
    return this.attributeComponentTypes[name];
  }
}
