import { GLTF } from "@gltf-transform/core";
import { Primitive } from "@gltf-transform/core";
import { Extension } from "@gltf-transform/core";
import { ReaderContext } from "@gltf-transform/core";
import { WriterContext } from "@gltf-transform/core";

import { FeatureId } from "./MeshFeatures";
import { FeatureIdTexture } from "./MeshFeatures";
import { MeshFeatures } from "./MeshFeatures";
import { StructuralMetadata } from "./StructuralMetadata";

const NAME = "EXT_mesh_features";

/**
 * Returns the given value if it is **NOT** equal to the given
 * default value.
 *
 * Returns `null` if the given value **IS** equal to the
 * given default value.
 *
 * @param value - The value
 * @param defaultValue - The default value
 * @returns The result
 */
function ifNot<T>(value: T, defaultValue: T): T | null {
  if (value == defaultValue) {
    return null;
  }
  return value;
}

//============================================================================
// Interfaces for the JSON structure
//
// These interfaces reflect the structure of the JSON input, and can be
// derived directly from the JSON schema of the extension.
//
// The naming convention for these interfaces (and variables that refer
// to them) is that they end with `...Def`.
//
// In the 'read' method of the Extension class, they will be obtained
// from the `context.jsonDoc.json` in raw form, and translated into
// the "model" classes that are defined as
//   export class MeshFeatures extends ExtensionProperty<IMeshFeatures> {...}
//
// Note that textures are represented as a `GLTF.ITextureInfo`, with
// the `index` and `texCoord` properties. The "model" classes offer
// this as a `TextureInfo` object that is associated with the `Texture`
// object. This is used internally by glTF-Transform, to automatically
// do some sort of deduplication magic.
//
// In the 'write' method of the Extension class, these objects will be
// created from the "model" classes, and inserted into the JSON structure
// from the `context.jsonDoc.json`.
//
// The `GLTF.ITextureInfo` objects will be created with
// `context.createTextureInfoDef`, based on the `Texture´ and
// `TextureInfo` object from the model class.
//
interface MeshFeaturesDef {
  featureIds: FeatureIdDef[];
}
interface FeatureIdDef {
  featureCount: number;
  nullFeatureId?: number;
  label?: string;
  attribute?: FeatureIdAttributeDef;
  texture?: FeatureIdTextureDef;
  propertyTable?: number;
}
type FeatureIdAttributeDef = number;
interface FeatureIdTextureDef extends GLTF.ITextureInfo {
  channels?: number[];
}
//============================================================================

/**
 * [`EXT_mesh_features`](https://github.com/CesiumGS/glTF/tree/proposal-EXT_mesh_features/extensions/2.0/Vendor/EXT_mesh_features/)
 * defines a means of assigning identifiers to geometry and subcomponents of geometry within a glTF 2.0 asset.
 *
 * Properties:
 * - {@link MeshFeatures}
 * - {@link MeshFeaturesFeatureId}
 * - {@link FeatureIdTexture}
 *
 * ### Example
 *
 * ```typescript
 * const document = new Document();
 *
 * // Create an Extension attached to the Document.
 * const extMeshFeatures = document.createExtension(EXTMeshFeatures);
 *
 * // Define an array of IDs
 * const ids = [ 12, 23, 34, 45, 56, 78, 78, 89, 90 ];
 *
 * // Put the IDs into an `Accessor`
 * const buffer = document.createBuffer();
 * const accessor = document.createAccessor();
 * accessor.setBuffer(buffer);
 * accessor.setType(Accessor.Type.SCALAR);
 * accessor.setArray(new Int16Array(ids));
 *
 * // Create a mesh `Primitive`
 * const primitive = document.createPrimitive();
 *
 * // Set the IDs as one attribute of the `Primitive`
 * const attributeNumber = 2;
 * primitive.setAttribute(`_FEATURE_ID_${attributeNumber}`, accessor);
 *
 * // Create a `FeatureId` object. This object indicates that the IDs
 * // are stored in the attribute `_FEATURE_ID_${attributeNumber}`
 * const featureId = extMeshFeatures.createFeatureId();
 * featureId.setFeatureCount(new Set(ids).size);
 * featureId.setAttribute(attributeNumber);
 *
 * // Create a `MeshFeatures` object that contains the
 * // created `FeatureID`, and store it as an extension
 * // object in the `Primitive`
 * const meshFeatures = extMeshFeatures.createMeshFeatures();
 * meshFeatures.addFeatureId(featureId);
 * primitive.setExtension("EXT_mesh_features", meshFeatures);
 *
 * // Assign the `Primitive` to a `Mesh`
 * const mesh = document.createMesh();
 * mesh.addPrimitive(primitive);
 *
 * // Create an IO object and register the extension
 * const io = new NodeIO();
 * io.registerExtensions([EXTMeshFeatures]);
 *
 * // Write the document as JSON
 * const written = await io.writeJSON(document);
 * ```
 *
 * @internal
 */
export class EXTMeshFeatures extends Extension {
  public override readonly extensionName = NAME;
  public static override EXTENSION_NAME = NAME;

  createMeshFeatures() {
    return new MeshFeatures(this.document.getGraph());
  }

  createFeatureId() {
    return new FeatureId(this.document.getGraph());
  }

  createFeatureIdTexture() {
    return new FeatureIdTexture(this.document.getGraph());
  }

  public override read(context: ReaderContext): this {
    const jsonDoc = context.jsonDoc;
    const meshDefs = jsonDoc.json.meshes || [];
    meshDefs.forEach((meshDef, meshIndex) => {
      const primDefs = meshDef.primitives || [];
      primDefs.forEach((primDef, primIndex) => {
        this.readPrimitive(context, meshIndex, primDef, primIndex);
      });
    });
    return this;
  }

  private readPrimitive(
    context: ReaderContext,
    meshIndex: number,
    primDef: GLTF.IMeshPrimitive,
    primIndex: number
  ) {
    if (!primDef.extensions || !primDef.extensions[NAME]) {
      return;
    }

    const meshFeatures = this.createMeshFeatures();

    const meshFeaturesDef = primDef.extensions[NAME] as MeshFeaturesDef;
    const featureIdDefs = meshFeaturesDef.featureIds;
    for (const featureIdDef of featureIdDefs) {
      const featureId = this.createFeatureId();
      this.readFeatureId(context, featureId, featureIdDef);
      meshFeatures.addFeatureId(featureId);
    }

    const mesh = context.meshes[meshIndex];
    mesh.listPrimitives()[primIndex].setExtension(NAME, meshFeatures);
  }

  private readFeatureId(
    context: ReaderContext,
    featureId: FeatureId,
    featureIdDef: FeatureIdDef
  ) {
    featureId.setFeatureCount(featureIdDef.featureCount);
    if (featureIdDef.nullFeatureId !== undefined) {
      featureId.setNullFeatureId(featureIdDef.nullFeatureId);
    }
    if (featureIdDef.label !== undefined) {
      featureId.setLabel(featureIdDef.label);
    }
    if (featureIdDef.attribute !== undefined) {
      featureId.setAttribute(featureIdDef.attribute);
    }

    const featureIdTextureDef = featureIdDef.texture;
    if (featureIdTextureDef !== undefined) {
      const featureIdTexture = this.createFeatureIdTexture();
      this.readFeatureIdTexture(context, featureIdTexture, featureIdTextureDef);
      featureId.setTexture(featureIdTexture);
    }

    if (featureIdDef.propertyTable !== undefined) {
      const root = this.document.getRoot();
      const structuralMetadata = root.getExtension<StructuralMetadata>(
        "EXT_structural_metadata"
      );
      if (structuralMetadata) {
        const propertyTables = structuralMetadata.listPropertyTables();
        const propertyTable = propertyTables[featureIdDef.propertyTable];
        featureId.setPropertyTable(propertyTable);
      } else {
        throw new Error(
          `${NAME}: No EXT_structural_metadata definition for looking up property tables`
        );
      }
    }
  }

  private readFeatureIdTexture(
    context: ReaderContext,
    featureIdTexture: FeatureIdTexture,
    featureIdTextureDef: FeatureIdTextureDef
  ) {
    const jsonDoc = context.jsonDoc;
    const textureDefs = jsonDoc.json.textures || [];
    if (featureIdTextureDef.channels) {
      featureIdTexture.setChannels(featureIdTextureDef.channels);
    }
    const source = textureDefs[featureIdTextureDef.index].source;
    if (source !== undefined) {
      const texture = context.textures[source];
      featureIdTexture.setTexture(texture);
      const textureInfo = featureIdTexture.getTextureInfo();
      if (textureInfo) {
        context.setTextureInfo(textureInfo, featureIdTextureDef);
      }
    }
  }

  public override write(context: WriterContext): this {
    const jsonDoc = context.jsonDoc;
    const meshDefs = jsonDoc.json.meshes;
    if (!meshDefs) {
      return this;
    }

    for (const mesh of this.document.getRoot().listMeshes()) {
      const meshIndex = context.meshIndexMap.get(mesh);
      if (meshIndex === undefined) {
        continue;
      }
      const meshDef = meshDefs[meshIndex];
      mesh.listPrimitives().forEach((prim, primIndex) => {
        const primDef = meshDef.primitives[primIndex];
        this.writePrimitive(context, prim, primDef);
      });
    }
    return this;
  }

  private writePrimitive(
    context: WriterContext,
    prim: Primitive,
    primDef: GLTF.IMeshPrimitive
  ) {
    const meshFeatures = prim.getExtension<MeshFeatures>(NAME);
    if (!meshFeatures) {
      return;
    }

    const meshFeaturesDef = { featureIds: [] } as MeshFeaturesDef;
    meshFeatures.listFeatureIds().forEach((featureId) => {
      const featureIdDef = this.createFeatureIdDef(context, featureId);
      meshFeaturesDef.featureIds.push(featureIdDef);
    });
    primDef.extensions = primDef.extensions || {};
    primDef.extensions[NAME] = meshFeaturesDef;
  }

  private createFeatureIdDef(
    context: WriterContext,
    featureId: FeatureId
  ): FeatureIdDef {
    let textureDef: FeatureIdTextureDef | undefined = undefined;
    const featureIdTexture = featureId.getTexture();
    if (featureIdTexture) {
      const texture = featureIdTexture.getTexture();
      const textureInfo = featureIdTexture.getTextureInfo();
      if (texture && textureInfo) {
        const basicTextureDef = context.createTextureInfoDef(
          texture,
          textureInfo
        );
        textureDef = {
          channels: ifNot(featureIdTexture.getChannels(), [0]) ?? undefined,
          index: basicTextureDef.index,
          texCoord: basicTextureDef.texCoord,
        };
      }
    }

    let propertyTableDef: number | undefined;
    const propertyTable = featureId.getPropertyTable();
    if (propertyTable !== null) {
      const root = this.document.getRoot();
      const structuralMetadata = root.getExtension<StructuralMetadata>(
        "EXT_structural_metadata"
      );
      if (structuralMetadata) {
        const propertyTables = structuralMetadata.listPropertyTables();
        propertyTableDef = propertyTables.indexOf(propertyTable);
      } else {
        throw new Error(
          `${NAME}: No EXT_structural_metadata definition for looking up property table index`
        );
      }
    }

    const featureIdDef: FeatureIdDef = {
      featureCount: featureId.getFeatureCount(),
      nullFeatureId: featureId.getNullFeatureId() ?? undefined,
      label: featureId.getLabel() ?? undefined,
      attribute: featureId.getAttribute() ?? undefined,
      texture: textureDef,
      propertyTable: propertyTableDef,
    };
    return featureIdDef;
  }
}
