import { BatchTable } from "../structure/TileFormats/BatchTable";
import { PntsFeatureTable } from "../structure/TileFormats/PntsFeatureTable";

import { TileFormats } from "../tileFormats/TileFormats";

import { PntsData } from "./PntsData";
import { TileTableData } from "./TileTableData";
import { GltfPointCloudBuilder } from "./GltfPointCloudBuilder";

export class TileFormatsMigration {
  static async convertPntsToGlb(
    pntsBuffer: Buffer
  ): Promise<Buffer | undefined> {
    const tileData = TileFormats.readTileData(pntsBuffer);

    const batchTable = tileData.batchTable.json as BatchTable;
    const featureTable = tileData.featureTable.json as PntsFeatureTable;
    const binary = tileData.featureTable.binary;

    /*
    console.log("Batch table");
    console.log(JSON.stringify(batchTable, null, 2));

    console.log("Feature table");
    console.log(JSON.stringify(featureTable, null, 2));
    */

    const pointCloudBuilder = new GltfPointCloudBuilder();

    const positions = PntsData.createPositions(featureTable, binary);
    for (const position of positions) {
      pointCloudBuilder.addPoint(position[0], position[1], position[2]);
    }
    const normals = PntsData.createNormals(featureTable, binary);
    if (normals) {
      for (const normal of normals) {
        pointCloudBuilder.addNormal(normal[0], normal[1], normal[2]);
      }
    }
    const colors = PntsData.createColors(featureTable, binary);
    if (colors) {
      for (const color of colors) {
        pointCloudBuilder.addColor(color[0], color[1], color[2], color[3]);
      }
    }

    if (featureTable.CONSTANT_RGBA) {
      const constantRgba = TileTableData.obtainNumberArray(
        binary,
        featureTable.CONSTANT_RGBA,
        4,
        "UNSIGNED_BYTE"
      );
      const rgba = PntsData.bytesToFloats(constantRgba);
      pointCloudBuilder.setGlobalColor(rgba[0], rgba[1], rgba[2], rgba[3]);
    }

    const glbBuffer = pointCloudBuilder.build();
    return glbBuffer;
  }
}
