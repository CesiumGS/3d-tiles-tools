import { GLTF, Primitive } from "@gltf-transform/core";
import { Node } from "@gltf-transform/core";
import { Extension } from "@gltf-transform/core";
import { ReaderContext } from "@gltf-transform/core";
import { WriterContext } from "@gltf-transform/core";

import { PrimitiveOutline } from "./PrimitiveOutline";

const NAME = "CESIUM_primitive_outline";

interface PrimitiveOutlineDef {
  indices: number;
}

/**
 * [`CESIUM_primitive_outline`](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Vendor/CESIUM_primitive_outline/)
 * defines a means of highlighting certain edges of a primitive.
 *
 * @internal
 */
export class CESIUMPrimitiveOutline extends Extension {
  public override readonly extensionName = NAME;
  public static override EXTENSION_NAME = NAME;

  createPrimitiveOutline() {
    return new PrimitiveOutline(this.document.getGraph());
  }

  public override read(context: ReaderContext): this {
    const jsonDoc = context.jsonDoc;
    const gltfDef = jsonDoc.json;
    const meshDefs = gltfDef.meshes || [];
    meshDefs.forEach((meshDef, meshIndex) => {
      const mesh = context.meshes[meshIndex];
      const primitives = mesh.listPrimitives();
      const primitiveDefs = meshDef.primitives;
      for (let i = 0; i < primitiveDefs.length; i++) {
        const primitive = primitives[i];
        const primitiveDef = primitiveDefs[i];
        this.readPrimitive(context, primitive, primitiveDef);
      }
    });
    return this;
  }

  private readPrimitive(
    context: ReaderContext,
    primitive: Primitive,
    primitiveDef: GLTF.IMeshPrimitive
  ) {
    if (!primitiveDef.extensions || !primitiveDef.extensions[NAME]) {
      return;
    }
    const primitiveOutline = this.createPrimitiveOutline();
    const primitiveOutlineDef = primitiveDef.extensions[
      NAME
    ] as PrimitiveOutlineDef;
    const indices = context.accessors[primitiveOutlineDef.indices];
    primitiveOutline.setIndices(indices);
    primitive.setExtension(NAME, primitiveOutline);
  }

  public override write(context: WriterContext): this {
    const jsonDoc = context.jsonDoc;
    const meshDefs = jsonDoc.json.meshes;
    if (!meshDefs) {
      return this;
    }

    const meshes = this.document.getRoot().listMeshes();
    for (let m = 0; m < meshes.length; m++) {
      const mesh = meshes[m];
      const meshDef = meshDefs[m];
      const primitives = mesh.listPrimitives();
      const primitiveDefs = meshDef.primitives;
      for (let p = 0; p < primitiveDefs.length; p++) {
        const primitive = primitives[p];
        const primitiveDef = primitiveDefs[p];
        this.writePrimitive(context, primitive, primitiveDef);
      }
    }
    return this;
  }

  private writePrimitive(
    context: WriterContext,
    primitive: Primitive,
    primitiveDef: GLTF.IMeshPrimitive
  ) {
    const primitiveOutline = primitive.getExtension<PrimitiveOutline>(NAME);
    if (!primitiveOutline) {
      return;
    }
    const indices = primitiveOutline.getIndices();
    if (!indices) {
      const logger = this.document.getLogger();
      logger.warn("Ignoring Invalid CESIUM_primitive_outline extension");
      return;
    }
    const indicesIndex = context.accessorIndexMap.get(indices);
    const primitiveOutlineDef = {
      indices: indicesIndex,
    };
    primitiveDef.extensions = primitiveDef.extensions || {};
    primitiveDef.extensions[NAME] = primitiveOutlineDef;
  }
}
