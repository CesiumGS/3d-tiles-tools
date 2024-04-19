import { ContentDataTypeRegistry } from "../../base";
import { ContentDataTypes } from "../../base";

import { TileFormats } from "../../tilesets";

import { GltfTransform } from "../contentProcessing/GltfTransform";

import { TileFormatsMigration } from "./TileFormatsMigration";

import { Loggers } from "../../base";
const logger = Loggers.get("migration");

/**
 * Methods for converting CMPT tile data into GLB
 *
 * @internal
 */
export class TileFormatsMigrationCmpt {
  /**
   * Convert the given CMPT data into a glTF asset
   *
   * @param cmptBuffer - The CMPT buffer
   * @param externalGlbResolver - A function that will be used to resolve
   * external GLB data if the CMPT contains I3DM that use
   * `header.gltfFormat=0` (meaning that the payload is not GLB data,
   * but only a GLB URI).
   * @returns The GLB buffer
   * @throws TileFormatError If the CMPT contained I3DM with an external
   * GLB URI * that could not resolved by the given resolver
   */
  static async convertCmptToGlb(
    cmptBuffer: Buffer,
    externalGlbResolver: (uri: string) => Promise<Buffer | undefined>
  ): Promise<Buffer> {
    const compositeTileData = TileFormats.readCompositeTileData(cmptBuffer);
    const innerTileBuffers = compositeTileData.innerTileBuffers;

    const innerTileGlbs: Buffer[] = [];
    for (const innerTileBuffer of innerTileBuffers) {
      const innerTileType = await ContentDataTypeRegistry.findType(
        "",
        innerTileBuffer
      );
      if (innerTileType === ContentDataTypes.CONTENT_TYPE_PNTS) {
        logger.trace("Converting inner PNTS tile to GLB...");
        const innerTileGlb = await TileFormatsMigration.convertPntsToGlb(
          innerTileBuffer
        );
        innerTileGlbs.push(innerTileGlb);
      } else if (innerTileType === ContentDataTypes.CONTENT_TYPE_B3DM) {
        logger.trace("Converting inner B3DM tile to GLB...");
        const innerTileGlb = await TileFormatsMigration.convertB3dmToGlb(
          innerTileBuffer
        );
        innerTileGlbs.push(innerTileGlb);
      } else if (innerTileType === ContentDataTypes.CONTENT_TYPE_I3DM) {
        logger.trace("Converting inner I3DM tile to GLB...");
        const innerTileGlb = await TileFormatsMigration.convertI3dmToGlb(
          innerTileBuffer,
          externalGlbResolver
        );
        innerTileGlbs.push(innerTileGlb);
      } else if (innerTileType === ContentDataTypes.CONTENT_TYPE_CMPT) {
        logger.trace("Converting inner CMPT tile to GLB...");
        const innerTileGlb = await TileFormatsMigration.convertCmptToGlb(
          innerTileBuffer,
          externalGlbResolver
        );
        innerTileGlbs.push(innerTileGlb);
      } else {
        logger.warn(
          "Unknown type for inner tile of CMPT: " +
            innerTileType +
            " - ignoring"
        );
      }
    }
    const document = await GltfTransform.merge(innerTileGlbs);
    const io = await GltfTransform.getIO();
    const glb = await io.writeBinary(document);
    return Buffer.from(glb);
  }
}
