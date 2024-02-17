import { Node, PropertyType, Scene } from "@gltf-transform/core";

import { ContentDataTypeRegistry } from "../../base";
import { ContentDataTypes } from "../../base";

import { B3dmFeatureTable } from "../../structure";
import { BatchTable } from "../../structure";
import { I3dmFeatureTable } from "../../structure";
import { PntsFeatureTable } from "../../structure";

import { TileFormats } from "../../tilesets";
import { TileFormatError } from "../../tilesets";
import { TileTableData } from "../../tilesets";
import { TileTableDataI3dm } from "../../tilesets";

import { GltfTransform } from "../contentProcessing/GltfTransform";
import { PntsPointClouds } from "../pointClouds/PntsPointClouds";

import { BoundingVolumes } from "./BoundingVolumes";

import { Loggers } from "../../base";
const logger = Loggers.get("tilesetProcessing");

/**
 * Methods to compute bounding volumes from tile content data.
 *
 * (The term "bounding volume box" refers to the 12-element
 * number arrays that are the `boundingVolume.box`)
 */
export class ContentBoundingVolumes {
  /**
   * Computes the bounding volume box from the given content data.
   *
   * The exact set of content data types that is supported by this
   * method is not specified (but it should include GLB and the
   * common 'legacy' content types).
   *
   * @param contentUri - The content URI
   * @param data - The content data
   * @param externalGlbResolver - The resolver for external GLBs in I3DMs
   * @returns The bounding volume box, or undefined if no bounding
   * volume box could be computed from the given content.
   * @throws Error if the I3DM referred to a GLB that could not be
   * resolved
   */
  static async computeContentDataBoundingVolumeBox(
    contentUri: string,
    data: Buffer,
    externalGlbResolver: (glbUri: string) => Promise<Buffer | undefined>
  ): Promise<number[] | undefined> {
    const contentDataType = await ContentDataTypeRegistry.findType(
      contentUri,
      data
    );
    if (contentDataType === ContentDataTypes.CONTENT_TYPE_GLB) {
      return ContentBoundingVolumes.computeBoundingVolumeBoxFromGlb(data);
    } else if (contentDataType === ContentDataTypes.CONTENT_TYPE_PNTS) {
      return ContentBoundingVolumes.computeBoundingBoxFromPnts(data);
    } else if (contentDataType === ContentDataTypes.CONTENT_TYPE_B3DM) {
      return ContentBoundingVolumes.computeBoundingVolumeBoxFromB3dm(data);
    } else if (contentDataType === ContentDataTypes.CONTENT_TYPE_I3DM) {
      return ContentBoundingVolumes.computeBoundingVolumeBoxFromI3dm(
        data,
        externalGlbResolver
      );
    } else if (contentDataType === ContentDataTypes.CONTENT_TYPE_CMPT) {
      return ContentBoundingVolumes.computeBoundingVolumeBoxFromCmpt(
        data,
        externalGlbResolver
      );
    }
    return undefined;
  }

  /**
   * Computes the bounding volume box of the given PNTS data
   *
   * @param pntsBuffer - The PNTS data buffer
   * @returns A promise to the bounding volume box
   */
  private static async computeBoundingBoxFromPnts(
    pntsBuffer: Buffer
  ): Promise<number[]> {
    // Read the tile data from the input data
    const tileData = TileFormats.readTileData(pntsBuffer);
    const batchTable = tileData.batchTable.json as BatchTable;
    const featureTable = tileData.featureTable.json as PntsFeatureTable;
    const featureTableBinary = tileData.featureTable.binary;

    // Create a `ReadablePointCloud` that allows accessing
    // the PNTS data
    const pntsPointCloud = await PntsPointClouds.create(
      featureTable,
      featureTableBinary,
      batchTable
    );

    // Compute the positions, taking the global position
    // into account
    const globalPosition = pntsPointCloud.getGlobalPosition() ?? [0, 0, 0];
    const localPositions = pntsPointCloud.getPositions();
    const positions: number[][] = [];
    for (const localPosition of localPositions) {
      const position: number[] = [
        localPosition[0] + globalPosition[0],
        localPosition[1] + globalPosition[1],
        localPosition[2] + globalPosition[2],
      ];
      positions.push(position);
    }
    return BoundingVolumes.createBoundingVolumeBoxFromPoints(positions);
  }

  /**
   * Computes the bounding volume box of the given B3DM data
   *
   * @param b3dmBuffer - The B3DM data buffer
   * @returns A promise to the bounding volume box
   */
  private static async computeBoundingVolumeBoxFromB3dm(
    b3dmBuffer: Buffer
  ): Promise<number[]> {
    // Compute the bounding volume box from the payload (GLB data)
    const tileData = TileFormats.readTileData(b3dmBuffer);
    const glbBuffer = tileData.payload;
    const gltfBoundingVolumeBox =
      await ContentBoundingVolumes.computeBoundingVolumeBoxFromGlb(glbBuffer);

    // If the feature table defines an `RTC_CENTER`, then
    // translate the bounding volume box by this amount
    const featureTable = tileData.featureTable.json as B3dmFeatureTable;
    if (featureTable.RTC_CENTER) {
      const featureTableBinary = tileData.featureTable.binary;
      const rtcCenter = TileTableData.obtainRtcCenter(
        featureTable.RTC_CENTER,
        featureTableBinary
      );
      const b3dmBoundingVolumeBox = BoundingVolumes.translateBoundingVolumeBox(
        gltfBoundingVolumeBox,
        rtcCenter
      );
      return b3dmBoundingVolumeBox;
    }
    return gltfBoundingVolumeBox;
  }

  /**
   * Computes the bounding volume box of the given I3DM data
   *
   * @param i3dmBuffer - The I3DM data buffer
   * @param externalGlbResolver - The resolver for external GLB data from I3DMs
   * @returns A promise to the bounding volume box
   * @throws Error if the I3DM referred to a GLB that could not be
   * resolved
   */
  private static async computeBoundingVolumeBoxFromI3dm(
    i3dmBuffer: Buffer,
    externalGlbResolver: (glbUri: string) => Promise<Buffer | undefined>
  ): Promise<number[]> {
    // Obtain the GLB buffer for the tile data. With `gltfFormat===1`, it
    // is stored directly as the payload. Otherwise (with `gltfFormat===0`)
    // the payload is a URI that has to be resolved.
    const tileData = TileFormats.readTileData(i3dmBuffer);
    const glbBuffer = await TileFormats.obtainGlbPayload(
      tileData,
      externalGlbResolver
    );
    if (!glbBuffer) {
      throw new TileFormatError(
        `Could not resolve external GLB from I3DM file`
      );
    }

    // Note: The approach here is to compute the bounding volume box
    // corners of the GLB, and then compute a bounding volume box
    // from these corners when they are transformed with each
    // instancing transform. A tighter bounding volume MIGHT be
    // achievable by computing the bounding volume from all
    // points of the GLB after the transformation. But this would
    // be VERY inefficient for MANY instances (and defeat the
    // purpose of instancing itself...)

    // Compute the bounding volume box from the payload (GLB data)
    const gltfBoundingVolumeBox =
      await ContentBoundingVolumes.computeBoundingVolumeBoxFromGlb(glbBuffer);
    const gltfCorners = BoundingVolumes.computeBoundingVolumeBoxCorners(
      gltfBoundingVolumeBox
    );

    // Compute the instance matrices of the I3DM data
    const featureTable = tileData.featureTable.json as I3dmFeatureTable;
    const featureTableBinary = tileData.featureTable.binary;
    const numInstances = featureTable.INSTANCES_LENGTH;
    const instanceMatrices = TileTableDataI3dm.createInstanceMatrices(
      featureTable,
      featureTableBinary,
      numInstances
    );

    // Compute the set of all corner points of the glTF bounding volume box
    // when they are transformed with the instancing transforms.
    const transformedCorners: number[][] = [];
    for (const matrix of instanceMatrices) {
      for (const gltfCorner of gltfCorners) {
        const transformedCorner = ContentBoundingVolumes.transformPoint3D(
          matrix,
          gltfCorner
        );
        transformedCorners.push(transformedCorner);
      }
    }
    return BoundingVolumes.createBoundingVolumeBoxFromPoints(
      transformedCorners
    );
  }

  /**
   * Computes the bounding volume box of the given CMPT data
   *
   * @param cmptBuffer - The CMPT data buffer
   * @returns A promise to the bounding volume box
   */
  private static async computeBoundingVolumeBoxFromCmpt(
    cmptBuffer: Buffer,
    externalGlbResolver: (glbUri: string) => Promise<Buffer | undefined>
  ): Promise<number[]> {
    const compositeTileData = TileFormats.readCompositeTileData(cmptBuffer);
    const buffers = compositeTileData.innerTileBuffers;
    const innerBoundingVolumeBoxes: number[][] = [];
    for (const buffer of buffers) {
      const innerBoundingVolumeBox =
        await ContentBoundingVolumes.computeContentDataBoundingVolumeBox(
          "[inner tile of CMPT]",
          buffer,
          externalGlbResolver
        );
      if (innerBoundingVolumeBox) {
        innerBoundingVolumeBoxes.push(innerBoundingVolumeBox);
      }
    }
    return BoundingVolumes.computeUnionBoundingVolumeBox(
      innerBoundingVolumeBoxes
    );
  }

  /**
   * Computes the bounding volume box of the given glTF asset.
   *
   * This will compute the bounding volume box of the default scene
   * (or the first scene of the asset). If there is no scene,
   * then a warning will be printed, and a unit cube bounding
   * box will be returned.
   *
   * @param glbBuffer - The buffer containing GLB data
   * @returns A promise to the bounding volume box
   */
  private static async computeBoundingVolumeBoxFromGlb(
    glbBuffer: Buffer
  ): Promise<number[]> {
    return ContentBoundingVolumes.computeOrientedBoundingVolumeBoxFromGlb(
      glbBuffer
    );
  }

  /**
   * Computes the bounding volume box of the given glTF asset.
   *
   * This will compute the bounding volume box of the default scene
   * (or the first scene of the asset). If there is no scene,
   * then a warning will be printed, and a unit cube bounding
   * box will be returned.
   *
   * @param glbBuffer - The buffer containing GLB data
   * @returns A promise to the bounding volume box
   */
  static async computeOrientedBoundingVolumeBoxFromGlb(
    glbBuffer: Buffer
  ): Promise<number[]> {
    const io = await GltfTransform.getIO();
    const document = await io.readBinary(glbBuffer);
    const root = document.getRoot();
    let scene = root.getDefaultScene();
    if (!scene) {
      const scenes = root.listScenes();
      if (scenes.length > 0) {
        scene = scenes[0];
      }
    }
    if (scene) {
      const positions: number[][] = [];
      ContentBoundingVolumes.processVertexPositions(scene, (p: number[]) => {
        // take y-up-to-z-up into account
        const q = [p[0], -p[2], p[1]];
        positions.push(q);
      });
      return BoundingVolumes.createBoundingVolumeBoxFromPoints(positions);
    }
    logger.warn("No scenes found in glTF - using unit bounding box");
    return BoundingVolumes.createUnitCubeBoundingVolumeBox();
  }

  private static processVertexPositions(
    root: Node | Scene,
    consumer: (p: number[]) => void
  ): void {
    const position = [0, 0, 0];
    const rootNodes =
      root.propertyType === PropertyType.NODE ? [root] : root.listChildren();
    for (const rootNode of rootNodes) {
      rootNode.traverse((node: Node) => {
        const mesh = node.getMesh();
        if (!mesh) {
          return;
        }
        const worldMatrix = node.getWorldMatrix();
        const primitives = mesh.listPrimitives();
        for (const primitive of primitives) {
          const positionAccessor = primitive.getAttribute("POSITION");
          if (!positionAccessor) {
            continue;
          }
          for (let i = 0; i < positionAccessor.getCount(); i++) {
            positionAccessor.getElement(i, position);
            ContentBoundingVolumes.transformPoint3D(
              worldMatrix,
              position,
              position
            );
            consumer(position);
          }
        }
      });
    }
  }

  /**
   * Transforms the given 3D point with the given 4x4 matrix, writes
   * the result into the given target, and returns it. If no target
   * is given, then a new point will be created and returned.
   *
   * @param matrix - The 4x4 matrix
   * @param point - The 3D point
   * @param target - The target
   * @returns The result
   */
  private static transformPoint3D(
    matrix: number[],
    point: number[],
    target?: number[]
  ): number[] {
    const px = point[0];
    const py = point[1];
    const pz = point[2];
    const x = matrix[0] * px + matrix[4] * py + matrix[8] * pz + matrix[12];
    const y = matrix[1] * px + matrix[5] * py + matrix[9] * pz + matrix[13];
    const z = matrix[2] * px + matrix[6] * py + matrix[10] * pz + matrix[14];
    if (!target) {
      return [x, y, z];
    }
    target[0] = x;
    target[1] = y;
    target[2] = z;
    return target;
  }
}
