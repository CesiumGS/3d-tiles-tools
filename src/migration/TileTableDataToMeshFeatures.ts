import { Document } from "@gltf-transform/core";
import { Primitive } from "@gltf-transform/core";
import { Accessor } from "@gltf-transform/core";

import { TileFormatError } from "../tileFormats/TileFormatError";

import { EXTMeshFeatures } from "../gltfMetadata/EXTMeshFeatures";
import { FeatureId } from "../gltfMetadata/MeshFeatures";

/**
 * Methods related to the conversion of legacy tile table data
 * to the `EXT_mesh_features` extension.
 */
export class TileTableDataToMeshFeatures {
  /**
   * Convert the `_BATCHID` attribute in the given primitive into
   * an instance of the `ETX_mesh_features` extension that is
   * associated with this primitive, storing the former `_BATCHID`
   * attribute as a new `_FEATURE_ID_0` attribute.
   *
   * @param document - The glTF-Transform document
   * @param primitive - The glTF-Transform primitive
   * @returns The glTF-Transform `FeatureId` object that has
   * been created
   * @throws TileFormatError If the given primitive does not
   * contain a valid `_BATCHID` attribute.
   */
  static convertBatchIdToMeshFeatures(
    document: Document,
    primitive: Primitive
  ): FeatureId {
    let batchIdAttribute = primitive.getAttribute("_BATCHID");
    if (!batchIdAttribute) {
      batchIdAttribute = primitive.getAttribute("BATCHID");
      if (batchIdAttribute) {
        console.warn(
          "Found legacy BATCHID attribute. The name " +
            "should be _BATCHID, starting with an underscore"
        );
      } else {
        throw new TileFormatError(
          "The primitive did not contain a _BATCHID attribute"
        );
      }
    }
    const batchIdsArray = batchIdAttribute.getArray();
    if (!batchIdsArray) {
      throw new TileFormatError(
        "The primitive did not contain _BATCHID attribute values"
      );
    }

    const extMeshFeatures = document.createExtension(EXTMeshFeatures);

    // Assign a new accessor for the _FEATURE_ID_0 to the primitive,
    // containing the values of the _BATCHID accessor
    const featureIdAccessor = document.createAccessor();
    const buffer = document.getRoot().listBuffers()[0];
    featureIdAccessor.setBuffer(buffer);
    featureIdAccessor.setType(Accessor.Type.SCALAR);
    featureIdAccessor.setArray(batchIdsArray);
    primitive.setAttribute("_FEATURE_ID_0", featureIdAccessor);

    // Remove the former _BATCHID attribute
    primitive.setAttribute("_BATCHID", null);

    // Creates the mesh features extension object that
    // refers to the _FEATURE_ID_0 attribute
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
