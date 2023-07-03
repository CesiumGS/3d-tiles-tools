import { BatchTable } from "../structure/TileFormats/BatchTable";
import { PntsFeatureTable } from "../structure/TileFormats/PntsFeatureTable";

import { TileFormats } from "../tileFormats/TileFormats";

import { PntsPointClouds } from "./pointClouds/PntsPointClouds";
import { GltfPointClouds } from "./pointClouds/GltfPointClouds";

import { TileTableData } from "./TileTableData";
import { TilePropertyTableModels } from "../migration/TilePropertyTableModels";
import { PropertyTableModels } from "../metadata/PropertyTableModels";
import { BatchTableClassProperties } from "../migration/BatchTableClassProperties";
import { BatchTableSchemas } from "../migration/BatchTableSchemas";
import { GltfTransformPointClouds } from "./pointClouds/GltTransformfPointClouds";
import { GltfTransform } from "./GltfTransform";
import { TileTableDataToStructuralMetadata } from "./TileTableDataToStructuralMetadata";

export class TileFormatsMigration {
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

    const globalPosition =
      TileFormatsMigration.obtainGlobalPositionFromPntsRtcCenter(
        featureTable,
        featureTableBinary
      );
    const pntsPointCloud = await PntsPointClouds.create(
      featureTable,
      featureTableBinary
    );

    const gltfTransformPointCloud = GltfTransformPointClouds.build(
      pntsPointCloud,
      globalPosition
    );

    const document = gltfTransformPointCloud.document;
    const primitive = gltfTransformPointCloud.primitive;

    const numRows = featureTable.POINTS_LENGTH;
    TileTableDataToStructuralMetadata.assign(
      document,
      primitive,
      batchTable,
      batchTableBinary,
      numRows
    );

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
   * Obtains the value of the `RTC_CENTER` property of the given
   * feature table, or `undefined` if the feature table does not
   * define this property.
   *
   * @param featureTable - The feature table
   * @param binary - The binary blob of the feature table
   * @returns The `RTC_CENTER` value, or `undefined`
   */
  private static obtainGlobalPositionFromPntsRtcCenter(
    featureTable: PntsFeatureTable,
    binary: Buffer
  ): [number, number, number] | undefined {
    const rtcCenter = featureTable.RTC_CENTER;
    if (!rtcCenter) {
      return undefined;
    }
    const c = TileTableData.obtainNumberArray(binary, rtcCenter, 3, "FLOAT32");
    return [c[0], c[1], c[2]];
  }
}
