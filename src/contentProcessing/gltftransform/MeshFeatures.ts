import { Extension, Primitive } from "@gltf-transform/core";
import { GLTF } from "@gltf-transform/core";
import { ReaderContext } from "@gltf-transform/core";
import { WriterContext } from "@gltf-transform/core";
import { FeatureId } from "./MeshFeature";
import { FeatureIdTexture } from "./MeshFeature";
import { MeshFeature } from "./MeshFeature";

const NAME = "EXT_mesh_features";

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
//   export class MeshFeature extends ExtensionProperty<IMeshFeature> {...}
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
interface MeshFeatureDef {
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

export class MeshFeatures extends Extension {
  override extensionName = NAME;
  static override EXTENSION_NAME = NAME;

  createMeshFeature() {
    return new MeshFeature(this.document.getGraph());
  }

  createFeatureId() {
    return new FeatureId(this.document.getGraph());
  }

  createFeatureIdTexture() {
    return new FeatureIdTexture(this.document.getGraph());
  }

  public read(context: ReaderContext): this {
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

    console.log("There it is " + primDef.extensions[NAME]);

    const meshFeature = this.createMeshFeature();

    const meshFeatureDef = primDef.extensions[NAME] as MeshFeatureDef;
    const featureIdDefs = meshFeatureDef.featureIds;
    for (const featureIdDef of featureIdDefs) {
      const featureId = this.createFeatureId();
      this.readFeatureId(context, featureId, featureIdDef);
      meshFeature.addFeatureId(featureId);
    }

    const mesh = context.meshes[meshIndex];
    mesh.listPrimitives()[primIndex].setExtension(NAME, meshFeature);

    console.log("So are we good now...?");
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
      featureId.setPropertyTable(featureIdDef.propertyTable);
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

  public write(context: WriterContext): this {
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
    const meshFeature = prim.getExtension<MeshFeature>(NAME);
    if (!meshFeature) {
      return;
    }

    const meshFeatureDef = { featureIds: [] } as MeshFeatureDef;
    meshFeature.listFeatureIds().forEach((featureId) => {
      const featureIdDef = this.createFeatureIdDef(context, featureId);
      meshFeatureDef.featureIds.push(featureIdDef);
    });
    primDef.extensions = primDef.extensions || {};
    primDef.extensions[NAME] = meshFeatureDef;
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
          channels: featureIdTexture.getChannels(),
          index: basicTextureDef.index,
          texCoord: basicTextureDef.texCoord,
        };
      }
    }
    const featureIdDef: FeatureIdDef = {
      featureCount: featureId.getFeatureCount(),
      nullFeatureId: featureId.getNullFeatureId(),
      label: featureId.getLabel(),
      attribute: featureId.getAttribute(),
      texture: textureDef,
      propertyTable: featureId.getPropertyTable(),
    };
    return featureIdDef;
  }
}
