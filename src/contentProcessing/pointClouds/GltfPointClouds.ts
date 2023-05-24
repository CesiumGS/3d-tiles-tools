import { Document } from "@gltf-transform/core";
import { NodeIO } from "@gltf-transform/core";
import { Accessor } from "@gltf-transform/core";
import { Primitive } from "@gltf-transform/core";
import { PointCloudReader } from "./PointCloudReader";

export class GltfPointClouds {
  static async build(pointCloudReader: PointCloudReader) {
    const document = new Document();

    const buffer = document.createBuffer();
    buffer.setURI("buffer.bin");

    const primitive = document.createPrimitive();
    primitive.setMode(Primitive.Mode.POINTS);

    const positions = pointCloudReader.getPositions();
    const flatPositions = [...positions].flat();

    const positionAccessor = document.createAccessor();
    positionAccessor.setBuffer(buffer);
    positionAccessor.setType(Accessor.Type.VEC3);
    positionAccessor.setArray(new Float32Array(flatPositions));
    primitive.setAttribute("POSITION", positionAccessor);

    const colors = pointCloudReader.getColors();
    if (colors) {
      const flatColors = [...colors].flat();

      const colorAccessor = document.createAccessor();
      colorAccessor.setBuffer(buffer);
      colorAccessor.setType(Accessor.Type.VEC4);

      colorAccessor.setNormalized(true);
      const colorBytes = flatColors.map((c: number) => 255.0 * c);
      colorAccessor.setArray(new Uint8Array(colorBytes));

      primitive.setAttribute("COLOR_0", colorAccessor);
    }

    const normals = pointCloudReader.getNormals();
    if (normals) {
      const flatNormals = [...normals].flat();

      const normalAccessor = document.createAccessor();
      normalAccessor.setBuffer(buffer);
      normalAccessor.setType(Accessor.Type.VEC3);
      normalAccessor.setArray(new Float32Array(flatNormals));
      primitive.setAttribute("NORMAL", normalAccessor);
    }

    const globalColor = pointCloudReader.getGlobalColor();
    if (globalColor) {
      const material = document.createMaterial();
      material.setBaseColorFactor(globalColor);
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
