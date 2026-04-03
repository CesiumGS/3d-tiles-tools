import { Document } from "@gltf-transform/core";
import { Primitive } from "@gltf-transform/core";
import { Accessor } from "@gltf-transform/core";

import { TileFormatError } from "../../tilesets";

import { EXTMeshFeatures } from "../../gltf-extensions";
import { MeshFeaturesFeatureId as FeatureId } from "../../gltf-extensions";

import { Loggers } from "../../base";
const logger = Loggers.get("migration");

/**
 * Methods related to the conversion of legacy tile table data
 * to the `EXT_mesh_features` extension.
 *
 * @internal
 */
export class TileTableDataToMeshFeatures {
  /**
   * Convert the `_BATCHID` or `BATCHID` attribute in the given
   * primitive into an instance of the `ETX_mesh_features`
   * extension that is associated with this primitive, storing
   * the former batch ID attribute as a new `_FEATURE_ID_0` attribute.
   *
   * Note that this will set the former batch ID attributes
   * in the given primitive to `null`, but it will not dispose
   * the corresponding accessors. These have to be disposed
   * after all primitives have been processed.
   *
   * If the given primitive does not contain a batch ID attribute,
   * then a warning will be printed, and `undefined` will be
   * returned.
   *
   * @param document - The glTF-Transform document
   * @param primitive - The glTF-Transform primitive
   * @param batchIdToFeatureIdAccessor - A mapping from former
   * batch ID accessors to feature ID acccessors, to keep
   * track of the accessors that have already been converted
   * @returns The glTF-Transform `FeatureId` object that has
   * been created
   * @throws TileFormatError If the given primitive does not
   * contain a valid `_BATCHID` or `BATCHID` attribute.
   */
  static convertBatchIdToMeshFeatures(
    document: Document,
    primitive: Primitive,
    batchIdToFeatureIdAccessor: Map<Accessor, Accessor>
  ): FeatureId | undefined {
    let batchIdAttribute = primitive.getAttribute("_BATCHID");
    if (!batchIdAttribute) {
      batchIdAttribute = primitive.getAttribute("BATCHID");
      if (batchIdAttribute) {
        logger.warn(
          "Found legacy BATCHID attribute. The name " +
            "should be _BATCHID, starting with an underscore"
        );
      } else {
        logger.warn(
          "The primitive did not contain a _BATCHID or BATCHID attribute"
        );
        return undefined;
      }
    }

    const batchIdsArray = batchIdAttribute.getArray();
    if (!batchIdsArray) {
      throw new TileFormatError(
        "The primitive did not contain _BATCHID attribute values"
      );
    }

    // Re-use any existing feature ID accessor that may already
    // have been created for the batch ID accessor
    let featureIdAccessor = batchIdToFeatureIdAccessor.get(batchIdAttribute);
    if (featureIdAccessor === undefined) {
      // Create a new accessor for the _FEATURE_ID_0,
      // containing the values of the _BATCHID accessor
      featureIdAccessor = document.createAccessor();
      const buffer = document.getRoot().listBuffers()[0];
      featureIdAccessor.setBuffer(buffer);
      featureIdAccessor.setType(Accessor.Type.SCALAR);
      featureIdAccessor.setArray(batchIdsArray);

      batchIdToFeatureIdAccessor.set(batchIdAttribute, featureIdAccessor);
    }

    // Assign the feature ID accessor to the primitive
    primitive.setAttribute("_FEATURE_ID_0", featureIdAccessor);

    // Remove the former _BATCHID OR BATCHID attribute
    primitive.setAttribute("_BATCHID", null);
    primitive.setAttribute("BATCHID", null);

    // Creates the mesh features extension object that
    // refers to the _FEATURE_ID_0 attribute
    const extMeshFeatures = document.createExtension(EXTMeshFeatures);
    const meshFeatures = extMeshFeatures.createMeshFeatures();
    const featureId = extMeshFeatures.createFeatureId();
    featureId.setAttribute(0);
    const featureCount = new Set(batchIdsArray).size;
    featureId.setFeatureCount(featureCount);
    meshFeatures.addFeatureId(featureId);

    primitive.setExtension("EXT_mesh_features", meshFeatures);

    return featureId;
  }
}
