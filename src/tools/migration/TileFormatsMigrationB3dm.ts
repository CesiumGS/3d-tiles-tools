import { Accessor } from "@gltf-transform/core";

import { BatchTable } from "../../structure";
import { B3dmFeatureTable } from "../../structure";

import { TileFormats, VecMath } from "../../tilesets";

import { TileTableData } from "../../tilesets";

import { GltfTransform } from "../contentProcessing/GltfTransform";

import { TileTableDataToStructuralMetadata } from "./TileTableDataToStructuralMetadata";
import { TileTableDataToMeshFeatures } from "./TileTableDataToMeshFeatures";
import { TileFormatsMigration } from "./TileFormatsMigration";
import { GltfUpgrade } from "./GltfUpgrade";

import { InstanceFeaturesUtils } from "../gltfExtensionsUtils/InstanceFeaturesUtils";
import { StructuralMetadataUtils } from "../gltfExtensionsUtils/StructuralMetadataUtils";

import { Loggers } from "../../base";
const logger = Loggers.get("migration");

/**
 * Methods for converting B3DM tile data into GLB
 *
 * @internal
 */
export class TileFormatsMigrationB3dm {
  /**
   * Convert the given B3DM data into a glTF asset
   *
   * @param b3dmBuffer - The B3DM buffer
   * @param gltfUpAxis - The up-axis to assume for the glTF data in
   * the given B3DM, defaulting to "Y".
   * @returns The GLB buffer
   */
  static async convertB3dmToGlb(
    b3dmBuffer: Buffer,
    gltfUpAxis?: "X" | "Y" | "Z"
  ): Promise<Buffer> {
    const tileData = TileFormats.readTileData(b3dmBuffer);

    const batchTable = tileData.batchTable.json as BatchTable;
    const batchTableBinary = tileData.batchTable.binary;

    const featureTable = tileData.featureTable.json as B3dmFeatureTable;
    const featureTableBinary = tileData.featureTable.binary;

    if (
      TileFormatsMigration.DEBUG_LOG_FILE_CONTENT &&
      logger.isLevelEnabled("trace")
    ) {
      logger.trace("Batch table:\n" + JSON.stringify(batchTable, null, 2));
      logger.trace("Feature table:\n" + JSON.stringify(featureTable, null, 2));
    }

    const document = await GltfUpgrade.obtainDocument(tileData.payload);
    const root = document.getRoot();

    if (gltfUpAxis === "Z") {
      logger.info("Applying axis conversion from Z-up to Y-up");
      const axisConversion = VecMath.createZupToYupPacked4();
      TileFormatsMigration.applyTransform(document, axisConversion);
    } else if (gltfUpAxis === "X") {
      logger.info("Applying axis conversion from X-up to Y-up");
      // This obscure part has to take into account what CesiumJS is doing
      // with its "getAxisCorrectionMatrix", depending on the various
      // defaults. It was obtained via trial-and-error.
      const matrixXupToYup = VecMath.createXupToYupPacked4();
      const matrixZupToYup = VecMath.createZupToYupPacked4();
      const axisConversion = VecMath.multiplyAll4([
        matrixXupToYup,
        matrixZupToYup,
      ]);
      TileFormatsMigration.applyTransform(document, axisConversion);
    } else {
      // The gltfUpAxis is "Y" or "undefined". No conversion needed.
    }

    // If the feature table defines an `RTC_CENTER`, then insert
    // a new root node above each scene node, that carries the
    // RTC_CENTER as its translation
    if (featureTable.RTC_CENTER) {
      const rtcCenter = TileTableData.obtainRtcCenter(
        featureTable.RTC_CENTER,
        featureTableBinary
      );
      TileFormatsMigration.applyRtcCenter(document, rtcCenter);
    }

    // If there are batches, then convert the batch table into
    // an `EXT_structural_metadata` property table, and convert
    // the `_BATCHID` attributes of the primitives into
    // `_FEATURE_ID_0` attributes
    const numRows = featureTable.BATCH_LENGTH;
    if (numRows > 0) {
      const propertyTable =
        TileTableDataToStructuralMetadata.convertBatchTableToPropertyTable(
          document,
          batchTable,
          batchTableBinary,
          numRows
        );

      const batchIdToFeatureIdAccessor = new Map<Accessor, Accessor>();
      const meshes = root.listMeshes();
      for (const mesh of meshes) {
        const primitives = mesh.listPrimitives();
        for (const primitive of primitives) {
          // Convert the `_BATCHID` attribute into a `_FEATURE_ID_0`
          // attribute using the `EXT_mesh_features` extension
          const featureId =
            TileTableDataToMeshFeatures.convertBatchIdToMeshFeatures(
              document,
              primitive,
              batchIdToFeatureIdAccessor
            );
          if (featureId && propertyTable) {
            featureId.setPropertyTable(propertyTable);
          }
        }
      }

      // Dispose all former batch ID accessors that have been
      // converted into feature ID accessors
      for (const batchIdAccessor of batchIdToFeatureIdAccessor.keys()) {
        batchIdAccessor.dispose();
      }
    }

    const io = await GltfTransform.getIO();

    if (
      TileFormatsMigration.DEBUG_LOG_FILE_CONTENT &&
      logger.isLevelEnabled("trace")
    ) {
      const jsonDocument = await io.writeJSON(document);
      const json = jsonDocument.json;
      logger.trace("Output glTF JSON:\n" + JSON.stringify(json, null, 2));
      logger.trace("Metadata information:");
      logger.trace(
        InstanceFeaturesUtils.createInstanceFeaturesInfoString(document)
      );
      logger.trace(
        StructuralMetadataUtils.createStructuralMetadataInfoString(document)
      );
    }

    // Create the GLB buffer
    const glb = await io.writeBinary(document);
    return Buffer.from(glb);
  }
}
