import { Document } from "@gltf-transform/core";
import { NodeIO } from "@gltf-transform/core";
import { Accessor } from "@gltf-transform/core";
import { Primitive } from "@gltf-transform/core";

import { TileFormatError } from "../tileFormats/TileFormatError";

export class GltfPointCloudBuilder {
  private readonly attributes: { [key: string]: number[] } = {};
  private globalColor: [number, number, number, number] | undefined;

  constructor() {
    //
  }

  private obtainAttribute(name: string): number[] {
    let attribute = this.attributes[name];
    if (!attribute) {
      attribute = [];
      this.attributes[name] = attribute;
    }
    return attribute;
  }

  private getAttribute(name: string): number[] | undefined {
    return this.attributes[name];
  }

  addPoint(x: number, y: number, z: number) {
    const attribute = this.obtainAttribute("POSITION");
    attribute.push(x);
    attribute.push(y);
    attribute.push(z);
  }
  addNormal(x: number, y: number, z: number) {
    const attribute = this.obtainAttribute("NORMAL");
    attribute.push(x);
    attribute.push(y);
    attribute.push(z);
  }
  addColor(r: number, g: number, b: number, a: number) {
    const attribute = this.obtainAttribute("COLOR_0");
    attribute.push(r);
    attribute.push(g);
    attribute.push(b);
    attribute.push(a);
  }

  setGlobalColor(r: number, g: number, b: number, a: number) {
    this.globalColor = [r, g, b, a];
  }

  async build() {
    const document = new Document();

    const buffer = document.createBuffer();
    buffer.setURI("buffer.bin");

    const primitive = document.createPrimitive();
    primitive.setMode(Primitive.Mode.POINTS);

    const positionData = this.getAttribute("POSITION");
    if (!positionData) {
      throw new TileFormatError("No POSITION attribute data was given");
    }
    const positionAccessor = document.createAccessor();
    positionAccessor.setBuffer(buffer);
    positionAccessor.setType(Accessor.Type.VEC3);
    positionAccessor.setArray(new Float32Array(positionData));
    primitive.setAttribute("POSITION", positionAccessor);

    const colorData = this.getAttribute("COLOR_0");
    if (colorData) {
      const colorAccessor = document.createAccessor();
      colorAccessor.setBuffer(buffer);
      colorAccessor.setType(Accessor.Type.VEC4);

      colorAccessor.setNormalized(true);
      const colors = colorData.map((c: number) => 255.0 * c);
      colorAccessor.setArray(new Uint8Array(colors));

      primitive.setAttribute("COLOR_0", colorAccessor);
    }

    const normalData = this.getAttribute("NORMAL");
    if (normalData) {
      const normalAccessor = document.createAccessor();
      normalAccessor.setBuffer(buffer);
      normalAccessor.setType(Accessor.Type.VEC3);
      normalAccessor.setArray(new Float32Array(normalData));
      primitive.setAttribute("NORMAL", normalAccessor);
    }

    if (this.globalColor) {
      const material = document.createMaterial();
      material.setBaseColorFactor(this.globalColor);
      material.setMetallicFactor(0.0);
      material.setRoughnessFactor(1.0);
      primitive.setMaterial(material);
    }

    const mesh = document.createMesh();
    mesh.addPrimitive(primitive);

    const node = document.createNode();
    node.setMesh(mesh);

    const scene = document.createScene();
    scene.addChild(node);

    const io = new NodeIO();
    const glb = await io.writeBinary(document);
    return Buffer.from(glb);
  }
}
