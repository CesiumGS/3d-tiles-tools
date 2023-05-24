import { TileFormatError } from "../../tileFormats/TileFormatError";
import { PointCloudReader } from "./PointCloudReader";
import { PointCloudWriter } from "./PointCloudWriter";
import { Iterables } from "../../base/Iterables";

export class DefaultPointCloudBuilder
  implements PointCloudReader, PointCloudWriter
{
  private readonly attributeValues: { [key: string]: number[] } = {};
  private readonly attributeTypes: { [key: string]: string } = {};
  private readonly attributeComponentTypes: { [key: string]: string } = {};
  private globalColor: [number, number, number, number] | undefined;

  private ensureAttribute(name: string, type: string, componentType: string) {
    let attribute = this.attributeValues[name];
    if (!attribute) {
      attribute = [];
      this.attributeValues[name] = attribute;
      this.attributeTypes[name] = type;
      this.attributeComponentTypes[name] = componentType;
    }
  }

  /** {@inheritDoc PointCloudWriter.addPosition} */
  addPosition(x: number, y: number, z: number) {
    this.ensureAttribute("POSITION", "VEC3", "FLOAT32");
    const attributeValues = this.attributeValues["POSITION"];
    attributeValues.push(x);
    attributeValues.push(y);
    attributeValues.push(z);
  }

  /** {@inheritDoc PointCloudWriter.addNormal} */
  addNormal(x: number, y: number, z: number) {
    this.ensureAttribute("NORMAL", "VEC3", "FLOAT32");
    const attributeValues = this.attributeValues["NORMAL"];
    attributeValues.push(x);
    attributeValues.push(y);
    attributeValues.push(z);
  }

  /** {@inheritDoc PointCloudWriter.addColor} */
  addColor(r: number, g: number, b: number, a: number) {
    this.ensureAttribute("COLOR_0", "VEC4", "FLOAT32");
    const attributeValues = this.attributeValues["COLOR_0"];
    attributeValues.push(r);
    attributeValues.push(g);
    attributeValues.push(b);
    attributeValues.push(a);
  }

  /** {@inheritDoc PointCloudWriter.setGlobalColor} */
  setGlobalColor(r: number, g: number, b: number, a: number) {
    this.globalColor = [r, g, b, a];
  }

  /** {@inheritDoc PointCloudReader.getPositions} */
  getPositions(): Iterable<number[]> {
    const array = this.attributeValues["POSITION"];
    if (!array) {
      throw new TileFormatError("No POSITION values have been added");
    }
    return Iterables.segmentize(array, 3);
  }

  /** {@inheritDoc PointCloudReader.getNormals} */
  getNormals(): Iterable<number[]> | undefined {
    const array = this.attributeValues["NORMAL"];
    if (!array) {
      return undefined;
    }
    return Iterables.segmentize(array, 3);
  }

  /** {@inheritDoc PointCloudReader.getColors} */
  getColors(): Iterable<number[]> | undefined {
    const array = this.attributeValues["COLOR_0"];
    if (!array) {
      return undefined;
    }
    return Iterables.segmentize(array, 4);
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
      return Iterables.segmentize(array, 2);
    }
    if (type === "VEC4") {
      return Iterables.segmentize(array, 2);
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
