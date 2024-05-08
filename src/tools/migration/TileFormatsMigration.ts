import { Document } from "@gltf-transform/core";

import { TileFormatsMigrationPnts } from "./TileFormatsMigrationPnts";
import { TileFormatsMigrationB3dm } from "./TileFormatsMigrationB3dm";
import { TileFormatsMigrationI3dm } from "./TileFormatsMigrationI3dm";
import { TileFormatsMigrationCmpt } from "./TileFormatsMigrationCmpt";

/**
 * Methods for converting "legacy" tile formats into glTF assets
 * that use metadata extensions to represent the information from
 * the legacy formats.
 *
 * @internal
 */
export class TileFormatsMigration {
  // A compile-time flag to enable/disable printing VERY detailed information
  // about the  input and output files during the migration. This will, for
  // example, print the batch/feature table of the input, as well as the
  // output glTF JSON and its metadata information.
  static readonly DEBUG_LOG_FILE_CONTENT = false;

  /**
   * Convert the given PNTS data into a glTF asset
   *
   * @param pntsBuffer - The PNTS buffer
   * @returns The GLB buffer
   */
  static async convertPntsToGlb(pntsBuffer: Buffer): Promise<Buffer> {
    return await TileFormatsMigrationPnts.convertPntsToGlb(pntsBuffer);
  }

  /**
   * Convert the given B3DM data into a glTF asset
   *
   * @param b3dmBuffer - The B3DM buffer
   * @returns The GLB buffer
   */
  static async convertB3dmToGlb(b3dmBuffer: Buffer): Promise<Buffer> {
    return await TileFormatsMigrationB3dm.convertB3dmToGlb(b3dmBuffer);
  }

  /**
   * Convert the given I3DM data into a glTF asset
   *
   * @param i3dmBuffer - The I3DM buffer
   * @param externalResourceResolver - A function that will be used to resolve
   * external resources, like GLB data if the I3DM uses `header.gltfFormat=0`
   * (meaning that the payload is not GLB data, but only a GLB URI).
   * @returns The GLB buffer
   */
  static async convertI3dmToGlb(
    i3dmBuffer: Buffer,
    externalResourceResolver: (uri: string) => Promise<Buffer | undefined>
  ): Promise<Buffer> {
    return await TileFormatsMigrationI3dm.convertI3dmToGlb(
      i3dmBuffer,
      externalResourceResolver
    );
  }

  /**
   * Convert the given CMPT data into a single glTF asset
   *
   * @param cmptBuffer - The CMPT buffer
   * @param externalResourceResolver - A function that will be used to resolve
   * external resources, like GLB data if the CMPT contains I3DM that use
   * `header.gltfFormat=0` (meaning that the payload is not GLB data,
   * but only a GLB URI).
   * @returns The GLB buffer
   */
  static async convertCmptToGlb(
    cmptBuffer: Buffer,
    externalResourceResolver: (uri: string) => Promise<Buffer | undefined>
  ): Promise<Buffer> {
    return await TileFormatsMigrationCmpt.convertCmptToGlb(
      cmptBuffer,
      externalResourceResolver
    );
  }

  /**
   * Apply the given RTC_CENTER to the given glTF-Transform document,
   * by inserting a new root node that carries the given RTC_CENTER
   * as its translation, taking into account the y-up-vs-z-up
   * transform.
   *
   * @param document - The glTF-Transform document
   * @param rtcCenter - The RTC_CENTER
   */
  static applyRtcCenter(document: Document, rtcCenter: number[]) {
    const root = document.getRoot();
    const scenes = root.listScenes();
    for (const scene of scenes) {
      const oldChildren = scene.listChildren();
      for (const oldChild of oldChildren) {
        const rtcRoot = document.createNode();
        // Take the y-up-to-z-up transform into account
        const tx = rtcCenter[0];
        const ty = rtcCenter[2];
        const tz = -rtcCenter[1];
        rtcRoot.setTranslation([tx, ty, tz]);
        scene.removeChild(oldChild);
        rtcRoot.addChild(oldChild);
        scene.addChild(rtcRoot);
      }
    }
  }

  /**
   * Make sure that each scene in the given document has a single
   * root node. If there is a scene that contains multiple nodes
   * directly, then remove these nodes and insert a new root
   * that has the former scene nodes as its chilldren.
   *
   * @param document - The glTF-Transform document
   */
  static makeSingleRoot(document: Document) {
    const root = document.getRoot();
    const scenes = root.listScenes();
    for (const scene of scenes) {
      const oldChildren = scene.listChildren();
      if (oldChildren.length > 1) {
        const newRoot = document.createNode();
        for (const oldChild of oldChildren) {
          scene.removeChild(oldChild);
          newRoot.addChild(oldChild);
        }
        scene.addChild(newRoot);
      }
    }
  }
}
