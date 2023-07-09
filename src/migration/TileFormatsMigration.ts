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
import { MeshFeatures } from "../gltfMetadata/MeshFeatures";
import { PropertyModel } from "../metadata/PropertyModel";
import { DefaultPropertyModel } from "../metadata/DefaultPropertyModel";
import { ReadablePointCloud } from "../contentProcessing/pointClouds/ReadablePointCloud";
import { BatchTables } from "./BatchTables";

/**
 * Methods for converting "legacy" tile formats into glTF assets
 * that use metadata extensions to represent the information from
 * the legacy formats.
 */
export class TileFormatsMigration {
  static readonly DEBUG_LOG = false;

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
    if (TileFormatsMigration.DEBUG_LOG) {
      console.log("Batch table");
      console.log(JSON.stringify(batchTable, null, 2));

      console.log("Feature table");
      console.log(JSON.stringify(featureTable, null, 2));
    }
    //*/

    // Create a `ReadablePointCloud` that allows accessing
    // the PNTS data
    const pntsPointCloud = await PntsPointClouds.create(
      featureTable,
      featureTableBinary,
      batchTable
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
      const externalProperties = TileFormatsMigration.computeExternalProperties(
        pntsPointCloud,
        batchTable
      );
      const numRows = featureTable.POINTS_LENGTH;
      TileTableDataToStructuralMetadata.assignPerPointProperties(
        document,
        primitive,
        batchTable,
        batchTableBinary,
        externalProperties,
        numRows
      );
    }

    // Create the GLB buffer
    const io = await GltfTransform.getIO();

    //*/
    if (TileFormatsMigration.DEBUG_LOG) {
      console.log("JSON document");
      const jsonDocument = await io.writeJSON(document);
      console.log(JSON.stringify(jsonDocument.json, null, 2));
    }
    //*/

    const glb = await io.writeBinary(document);
    return Buffer.from(glb);
  }

  /**
   * Computes a mapping from property names to `PropertyModel` objects
   * for properties that are defined in the batch table, but not stored
   * in the batch table binary.
   *
   * Yeah, I'm looking at you, 3DTILES_draco_point_compression...
   *
   * The properties of the batch table that are draco-compressed
   * are actually read during the Draco decoding pass of the
   * feature table. The decoded values are stored as plain
   * attributes in the `ReadablePointCloud`. This method will
   * create `PropertyModel` objects for these attributes, so that
   * they can later be used for creating the accessors of the
   * attributes in the `EXT_structural_metadata` extension.
   *
   * @param pntsPointCloud - The point cloud that contains the PNTS data
   * @param batchTable The batch table
   * @returns The mapping
   */
  private static computeExternalProperties(
    pntsPointCloud: ReadablePointCloud,
    batchTable: BatchTable
  ): { [key: string]: PropertyModel } {
    const externalProperties: { [key: string]: PropertyModel } = {};
    const dracoPropertyNames = BatchTables.obtainDracoPropertyNames(batchTable);
    for (const propertyName of dracoPropertyNames) {
      const propertyValue = batchTable[propertyName];
      if (propertyValue) {
        if (TileTableData.isBatchTableBinaryBodyReference(propertyValue)) {
          const attributeValues =
            pntsPointCloud.getAttributeValues(propertyName);
          if (attributeValues) {
            const propertyModel = new DefaultPropertyModel([
              ...attributeValues,
            ]);
            externalProperties[propertyName] = propertyModel;
          }
        }
      }
    }
    return externalProperties;
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
    if (TileFormatsMigration.DEBUG_LOG) {
      console.log("Batch table");
      console.log(JSON.stringify(batchTable, null, 2));

      console.log("Feature table");
      console.log(JSON.stringify(featureTable, null, 2));
    }
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
          scene.removeChild(oldChild);
          rtcRoot.addChild(oldChild);
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
    if (TileFormatsMigration.DEBUG_LOG) {
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
