import { BatchTable } from "../structure/TileFormats/BatchTable";
import { PntsFeatureTable } from "../structure/TileFormats/PntsFeatureTable";

import { TileFormats } from "../tileFormats/TileFormats";

import { GltfTransform } from "../contentProcessing/GltfTransform";
import { PntsPointClouds } from "../contentProcessing/pointClouds/PntsPointClouds";
import { GltfTransformPointClouds } from "../contentProcessing/pointClouds/GltTransformfPointClouds";

import { TileTableData } from "./TileTableData";
import { TileTableDataToStructuralMetadata } from "./TileTableDataToStructuralMetadata";
import { B3dmFeatureTable } from "../structure/TileFormats/B3dmFeatureTable";
import { BinaryBodyOffset } from "../structure/TileFormats/BinaryBodyOffset";
import { TileTableDataToMeshFeatures } from "./TileTableDataToMeshFeatures";
import { MeshFeatures } from "../contentProcessing/gltftransform/MeshFeatures";

/**
 * Methods for converting "legacy" tile formats into glTF assets
 * that use metadata extensions to represent the information from
 * the legacy formats.
 */
export class TileFormatsMigration {
  /**
   * Convert the given PNTS data into a glTF asset
   *
   * @param pntsBuffer - The PNTS buffer
   * @returns The GLB buffer
   */
  static async convertPntsToGlb(
    pntsBuffer: Buffer
  ): Promise<Buffer | undefined> {
    const tileData = TileFormats.readTileData(pntsBuffer);

    const batchTable = tileData.batchTable.json as BatchTable;
    const batchTableBinary = tileData.batchTable.binary;

    const featureTable = tileData.featureTable.json as PntsFeatureTable;
    const featureTableBinary = tileData.featureTable.binary;

    //*/
    console.log("Batch table");
    console.log(JSON.stringify(batchTable, null, 2));

    console.log("Feature table");
    console.log(JSON.stringify(featureTable, null, 2));
    //*/

    // Create a `ReadablePointCloud` that allows accessing
    // the PNTS data
    const pntsPointCloud = await PntsPointClouds.create(
      featureTable,
      featureTableBinary
    );

    // Fetch the `RTC_CENTER` from the feature table, to be used
    // as the "global position" of the point cloud
    let globalPosition = undefined;
    if (featureTable.RTC_CENTER) {
      globalPosition = TileFormatsMigration.obtainGlobalPositionFromRtcCenter(
        featureTable.RTC_CENTER,
        featureTableBinary
      );
    }

    // Create a glTF-Transform document+primitive that represent
    // the point cloud
    const gltfTransformPointCloud = GltfTransformPointClouds.build(
      pntsPointCloud,
      globalPosition
    );
    const document = gltfTransformPointCloud.document;
    const primitive = gltfTransformPointCloud.primitive;

    // If the point cloud is batched, then convert any batch table
    // information into a property table
    if (featureTable.BATCH_LENGTH) {
      const numRows = featureTable.BATCH_LENGTH;
      const propertyTable =
        TileTableDataToStructuralMetadata.convertBatchTableToPropertyTable(
          document,
          batchTable,
          batchTableBinary,
          numRows
        );
      if (propertyTable) {
        const meshFeatures =
          primitive.getExtension<MeshFeatures>("EXT_mesh_features");
        if (meshFeatures) {
          const featureIds = meshFeatures.listFeatureIds();
          for (const featureId of featureIds) {
            featureId.setPropertyTable(propertyTable);
          }
        }
      }
    } else {
      // The point cloud is not batched. Assign any batch table
      // information as per-point properties
      const numRows = featureTable.POINTS_LENGTH;
      TileTableDataToStructuralMetadata.assignPerPointProperties(
        document,
        primitive,
        batchTable,
        batchTableBinary,
        numRows
      );
    }

    // Create the GLB buffer
    const io = await GltfTransform.getIO();

    //*/
    {
      console.log("JSON document");
      const jsonDocument = await io.writeJSON(document);
      console.log(JSON.stringify(jsonDocument.json, null, 2));
    }
    //*/

    const glb = await io.writeBinary(document);
    return Buffer.from(glb);
  }

  /**
   * Convert the given B3DM data into a glTF asset
   *
   * @param b3dmBuffer - The B3DM buffer
   * @returns The GLB buffer
   */
  static async convertB3dmToGlb(
    b3dmBuffer: Buffer
  ): Promise<Buffer | undefined> {
    const tileData = TileFormats.readTileData(b3dmBuffer);

    const batchTable = tileData.batchTable.json as BatchTable;
    const batchTableBinary = tileData.batchTable.binary;

    const featureTable = tileData.featureTable.json as B3dmFeatureTable;
    const featureTableBinary = tileData.featureTable.binary;

    //*/
    console.log("Batch table");
    console.log(JSON.stringify(batchTable, null, 2));

    console.log("Feature table");
    console.log(JSON.stringify(featureTable, null, 2));
    //*/

    // Read the GLB data from the payload of the tile
    const io = await GltfTransform.getIO();
    const document = await io.readBinary(tileData.payload);
    const root = document.getRoot();

    // If the feature table defines an `RTC_CENTER`, then insert
    // a new root node above each scene node, that carries the
    // RTC_CENTER as its translation
    if (featureTable.RTC_CENTER) {
      const globalPosition =
        TileFormatsMigration.obtainGlobalPositionFromRtcCenter(
          featureTable.RTC_CENTER,
          featureTableBinary
        );

      const scenes = root.listScenes();
      for (const scene of scenes) {
        const oldChildren = scene.listChildren();
        for (const oldChild of oldChildren) {
          const rtcRoot = document.createNode();
          rtcRoot.setTranslation(globalPosition);
          rtcRoot.addChild(oldChild);
          scene.removeChild(oldChild);
          scene.addChild(rtcRoot);
        }
      }
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

    // Create the GLB buffer
    //*/
    {
      console.log("JSON document");
      const jsonDocument = await io.writeJSON(document);
      console.log(JSON.stringify(jsonDocument.json, null, 2));
    }
    //*/

    const glb = await io.writeBinary(document);
    return Buffer.from(glb);
  }

  /**
   * Obtains the value of the given `RTC_CENTER` property of a
   * feature table, or `undefined` if the input is undefined
   *
   * @param featureTable - The feature table
   * @param binary - The binary blob of the feature table
   * @returns The `RTC_CENTER` value, or `undefined`
   */
  private static obtainGlobalPositionFromRtcCenter(
    rtcCenter: BinaryBodyOffset | number[],
    binary: Buffer
  ): [number, number, number] {
    const c = TileTableData.obtainNumberArray(binary, rtcCenter, 3, "FLOAT32");
    return [c[0], c[1], c[2]];
  }
}
