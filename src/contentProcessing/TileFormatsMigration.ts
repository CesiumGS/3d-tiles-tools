import { BatchTable } from "../structure/TileFormats/BatchTable";
import { PntsFeatureTable } from "../structure/TileFormats/PntsFeatureTable";

import { TileFormats } from "../tileFormats/TileFormats";

import { PntsPointClouds } from "./pointClouds/PntsPointClouds";
import { GltfPointClouds } from "./pointClouds/GltfPointClouds";
import { TileFormatError } from "../tileFormats/TileFormatError";
import { TileTableData } from "./TileTableData";

export class TileFormatsMigration {
  static async convertPntsToGlb(
    pntsBuffer: Buffer
  ): Promise<Buffer | undefined> {
    const tileData = TileFormats.readTileData(pntsBuffer);

    const batchTable = tileData.batchTable.json as BatchTable;
    const featureTable = tileData.featureTable.json as PntsFeatureTable;
    const binary = tileData.featureTable.binary;

    //*/
    console.log("Batch table");
    console.log(JSON.stringify(batchTable, null, 2));

    console.log("Feature table");
    console.log(JSON.stringify(featureTable, null, 2));
    //*/

    let globalPosition: [number, number, number] | undefined = undefined;
    const rtcCenter = featureTable.RTC_CENTER;
    if (rtcCenter) {
      const c = TileTableData.obtainNumberArray(
        binary,
        rtcCenter,
        3,
        "FLOAT32"
      );
      globalPosition = [c[0], c[1], c[2]];
    }
    const pntsPointCloud = await PntsPointClouds.create(featureTable, binary);
    const glbBuffer = await GltfPointClouds.build(
      pntsPointCloud,
      globalPosition
    );
    return glbBuffer;
  }
}
