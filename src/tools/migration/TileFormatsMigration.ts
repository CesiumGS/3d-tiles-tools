import { Document } from "@gltf-transform/core";
import { mat4 } from "@gltf-transform/core";
import { vec3 } from "@gltf-transform/core";

import { TileFormatsMigrationPnts } from "./TileFormatsMigrationPnts";
import { TileFormatsMigrationB3dm } from "./TileFormatsMigrationB3dm";
import { TileFormatsMigrationI3dm } from "./TileFormatsMigrationI3dm";
import { TileFormatsMigrationCmpt } from "./TileFormatsMigrationCmpt";

import { VecMath } from "../../tilesets/";

import { Loggers } from "../../base";
const logger = Loggers.get("migration");

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
   * @param gltfUpAxis - The up-axis to assume for the glTF data in
   * the given B3DM, defaulting to "Y".
   * @returns The GLB buffer
   */
  static async convertB3dmToGlb(
    b3dmBuffer: Buffer,
    gltfUpAxis: "X" | "Y" | "Z" | undefined
  ): Promise<Buffer> {
    return await TileFormatsMigrationB3dm.convertB3dmToGlb(
      b3dmBuffer,
      gltfUpAxis
    );
  }

  /**
   * Convert the given I3DM data into a glTF asset
   *
   * @param i3dmBuffer - The I3DM buffer
   * @param externalResourceResolver - A function that will be used to resolve
   * external resources, like GLB data if the I3DM uses `header.gltfFormat=0`
   * (meaning that the payload is not GLB data, but only a GLB URI).
   * @param gltfUpAxis - The up-axis to assume for the glTF data in
   * the given I3DM, defaulting to "Y".
   * @returns The GLB buffer
   */
  static async convertI3dmToGlb(
    i3dmBuffer: Buffer,
    externalResourceResolver: (uri: string) => Promise<Buffer | undefined>,
    gltfUpAxis: "X" | "Y" | "Z" | undefined
  ): Promise<Buffer> {
    return await TileFormatsMigrationI3dm.convertI3dmToGlb(
      i3dmBuffer,
      externalResourceResolver,
      gltfUpAxis
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
   * @param gltfUpAxis - The glTF up-axis, defaulting to "Y"
   * @returns The GLB buffer
   */
  static async convertCmptToGlb(
    cmptBuffer: Buffer,
    externalResourceResolver: (uri: string) => Promise<Buffer | undefined>,
    gltfUpAxis: "X" | "Y" | "Z" | undefined
  ): Promise<Buffer> {
    return await TileFormatsMigrationCmpt.convertCmptToGlb(
      cmptBuffer,
      externalResourceResolver,
      gltfUpAxis
    );
  }

  /**
   * Apply the transform for the given glTF up-axis to the given document.
   *
   * When the input glTF document was part of a (pre-1.0) legacy tileset,
   * then this tileset may have specified an `asset.gltfUpAxis` that could
   * be `X`, `Y`, or `Z`, denoting the up-axis to assume for the glTF.
   * (With glTF 2.0, the up-axis became specified as "Y").
   *
   * If the given glTF up axis is not ("Y" or undefined), then this
   * will insert a root node into the given glTF that matches the
   * transform that was applied by clients to handle the `gltfUpAxis`.
   *
   * @param document - The document
   * @param gltfUpAxis - The glTF up axis, defaulting to "Y"
   */
  static applyGltfUpAxis(
    document: Document,
    gltfUpAxis: "X" | "Y" | "Z" | undefined
  ) {
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
    // Take the y-up-to-z-up transform into account
    const tx = rtcCenter[0];
    const ty = rtcCenter[2];
    const tz = -rtcCenter[1];
    TileFormatsMigration.applyTranslation(document, [tx, ty, tz]);
  }

  /**
   * Apply the given translation to the given glTF-Transform document,
   * by inserting a new root node that carries the given translation
   *
   * @param document - The glTF-Transform document
   * @param rtcCenter - The RTC_CENTER
   */
  private static applyTranslation(document: Document, translation: vec3) {
    const root = document.getRoot();
    const scenes = root.listScenes();
    for (const scene of scenes) {
      const oldChildren = scene.listChildren();
      for (const oldChild of oldChildren) {
        const rtcRoot = document.createNode();
        rtcRoot.setTranslation(translation);
        scene.removeChild(oldChild);
        rtcRoot.addChild(oldChild);
        scene.addChild(rtcRoot);
      }
    }
  }

  /**
   * Apply the given transform to a new root in the given glTF-Transform
   * document.
   *
   * The given transform is assumed to be a 16-element array that
   * describes the 4x4 transform matrix, in column major order.
   *
   * @param document - The glTF-Transform document
   * @param transform - The transform
   */
  static applyTransform(document: Document, transform: number[]) {
    const root = document.getRoot();
    const scenes = root.listScenes();
    for (const scene of scenes) {
      const oldChildren = scene.listChildren();
      for (const oldChild of oldChildren) {
        const newRoot = document.createNode();
        newRoot.setMatrix(transform as mat4);
        scene.removeChild(oldChild);
        newRoot.addChild(oldChild);
        scene.addChild(newRoot);
      }
    }
  }
  /**
   * Make sure that each scene in the given document has a single
   * root node. If there is a scene that contains multiple nodes
   * directly, then remove these nodes and insert a new root
   * that has the former scene nodes as its children.
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
