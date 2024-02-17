import { BatchTable } from "../../structure";
import { PntsFeatureTable } from "../../structure";

import { TileFormats } from "../../tilesets";
import { TileTableData } from "../../tilesets";
import { BatchTables } from "../../tilesets";

import { MeshFeatures } from "../../gltf-extensions";

import { PropertyModel } from "../../metadata";
import { DefaultPropertyModel } from "../../metadata";

import { GltfTransform } from "../contentProcessing/GltfTransform";

import { PntsPointClouds } from "../pointClouds/PntsPointClouds";
import { GltfTransformPointClouds } from "../pointClouds/GltfTransformPointClouds";
import { ReadablePointCloud } from "../pointClouds/ReadablePointCloud";

import { TileFormatsMigration } from "./TileFormatsMigration";
import { TileTableDataToStructuralMetadata } from "./TileTableDataToStructuralMetadata";
import { Ids } from "./Ids";

import { InstanceFeaturesUtils } from "../gltfExtensionsUtils/InstanceFeaturesUtils";
import { StructuralMetadataUtils } from "../gltfExtensionsUtils/StructuralMetadataUtils";

import { Loggers } from "../../base";
const logger = Loggers.get("migration");

/**
 * Methods for converting PNTS tile data into GLB
 *
 * @internal
 */
export class TileFormatsMigrationPnts {
  /**
   * Convert the given PNTS data into a glTF asset
   *
   * @param pntsBuffer - The PNTS buffer
   * @returns The GLB buffer
   */
  static async convertPntsToGlb(pntsBuffer: Buffer): Promise<Buffer> {
    const tileData = TileFormats.readTileData(pntsBuffer);

    const batchTable = tileData.batchTable.json as BatchTable;
    const batchTableBinary = tileData.batchTable.binary;

    const featureTable = tileData.featureTable.json as PntsFeatureTable;
    const featureTableBinary = tileData.featureTable.binary;

    if (
      TileFormatsMigration.DEBUG_LOG_FILE_CONTENT &&
      logger.isLevelEnabled("trace")
    ) {
      logger.trace("Batch table:\n" + JSON.stringify(batchTable, null, 2));
      logger.trace("Feature table:\n" + JSON.stringify(featureTable, null, 2));
    }

    // Create a `ReadablePointCloud` that allows accessing
    // the PNTS data
    const pntsPointCloud = await PntsPointClouds.create(
      featureTable,
      featureTableBinary,
      batchTable
    );

    // Check if the point cloud contains color information that may
    // require an alpha component (i.e. RGBA or CONSTANT_RGBA)
    const mayRequireAlpha = PntsPointClouds.mayRequireAlpha(featureTable);

    // Create a glTF-Transform document+primitive that represent
    // the point cloud
    const gltfTransformPointCloud = GltfTransformPointClouds.build(
      pntsPointCloud,
      mayRequireAlpha
    );
    const document = gltfTransformPointCloud.document;
    const primitive = gltfTransformPointCloud.primitive;

    // Apply quantization to the point cloud, if the input positions
    // had been quantized, or the normals had been oct-encoded
    const hasQuantizedPositions =
      PntsPointClouds.hasQuantizedPositions(featureTable);
    const hasOctEncodedNormals =
      PntsPointClouds.hasOctEncodedNormals(featureTable);
    await GltfTransformPointClouds.applyQuantization(
      document,
      hasQuantizedPositions,
      hasOctEncodedNormals
    );

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
      const externalProperties =
        TileFormatsMigrationPnts.computeExternalProperties(
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

    const glb = await io.writeBinary(document);
    return Buffer.from(glb);
  }

  /**
   * Computes a mapping from property IDs to `PropertyModel` objects
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
   * @param batchTable - The batch table
   * @returns The mapping
   */
  private static computeExternalProperties(
    pntsPointCloud: ReadablePointCloud,
    batchTable: BatchTable
  ): { [key: string]: PropertyModel } {
    const externalPropertiesById: { [key: string]: PropertyModel } = {};
    const dracoPropertyNames = BatchTables.obtainDracoPropertyNames(batchTable);
    for (const propertyName of dracoPropertyNames) {
      const propertyValue = batchTable[propertyName];
      if (propertyValue) {
        if (TileTableData.isBatchTableBinaryBodyReference(propertyValue)) {
          const propertyId = Ids.sanitize(propertyName);
          const attributeValues = pntsPointCloud.getAttributeValues(propertyId);
          if (attributeValues) {
            const propertyModel = new DefaultPropertyModel([
              ...attributeValues,
            ]);
            externalPropertiesById[propertyId] = propertyModel;
          }
        }
      }
    }
    return externalPropertiesById;
  }
}
