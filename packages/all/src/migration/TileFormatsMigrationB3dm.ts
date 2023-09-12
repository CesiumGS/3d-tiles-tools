import { BatchTable } from "@3d-tiles-tools/structure";
import { B3dmFeatureTable } from "@3d-tiles-tools/structure";

import { TileFormats } from "../tileFormats/TileFormats";

import { GltfTransform } from "../contentProcessing/GltfTransform";
import { GltfUtilities } from "../contentProcessing/GltfUtilities";

import { TileTableData } from "../tileTableData/TileTableData";

import { TileTableDataToStructuralMetadata } from "./TileTableDataToStructuralMetadata";
import { TileTableDataToMeshFeatures } from "./TileTableDataToMeshFeatures";
import { TileFormatsMigration } from "./TileFormatsMigration";

import { InstanceFeaturesUtils } from "../gltfExtensionsUtils/InstanceFeaturesUtils";
import { StructuralMetadataUtils } from "../gltfExtensionsUtils/StructuralMetadataUtils";

import { Loggers } from "../logging/Loggers";
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
   * @returns The GLB buffer
   */
  static async convertB3dmToGlb(b3dmBuffer: Buffer): Promise<Buffer> {
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

    // If the B3DM contained glTF 1.0 data, try to upgrade it
    // with the gltf-pipeline first
    let glbBuffer = tileData.payload;
    const gltfVersion = GltfUtilities.getGltfVersion(glbBuffer);
    if (gltfVersion < 2.0) {
      logger.info("Found glTF 1.0 - upgrading to glTF 2.0 with gltf-pipeline");
      glbBuffer = await GltfUtilities.upgradeGlb(glbBuffer, undefined);
      glbBuffer = await GltfUtilities.replaceCesiumRtcExtension(glbBuffer);
    }

    // Read the GLB data from the payload of the tile
    const io = await GltfTransform.getIO();
    const document = await io.readBinary(glbBuffer);
    const root = document.getRoot();
    root.getAsset().generator = "glTF-Transform";

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
      const meshes = root.listMeshes();
      for (const mesh of meshes) {
        const primitives = mesh.listPrimitives();
        for (const primitive of primitives) {
          // Convert the `_BATCHID` attribute into a `_FEATURE_ID_0`
          // attribute using the `EXT_mesh_features` extension
          const featureId =
            TileTableDataToMeshFeatures.convertBatchIdToMeshFeatures(
              document,
              primitive
            );
          if (propertyTable) {
            featureId.setPropertyTable(propertyTable);
          }
        }
      }
    }

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
