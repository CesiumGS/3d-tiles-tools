import { Node } from "@gltf-transform/core";
import { Scene } from "@gltf-transform/core";
import { PropertyType } from "@gltf-transform/core";

import { ContentDataTypeRegistry } from "../../base";
import { ContentDataTypes } from "../../base";

import { BatchTable } from "../../structure";
import { B3dmFeatureTable } from "../../structure";
import { I3dmFeatureTable } from "../../structure";
import { PntsFeatureTable } from "../../structure";

import { TileData } from "../../tilesets";
import { TileFormatError } from "../../tilesets";
import { TileFormats } from "../../tilesets";
import { TileTableData } from "../../tilesets";
import { TileTableDataI3dm } from "../../tilesets";

import { PntsPointClouds } from "../pointClouds/PntsPointClouds";

import { BoundingVolumes } from "../tilesetProcessing/BoundingVolumes";

import { GltfUpgrade } from "../migration/GltfUpgrade";

/**
 * Methods to process the vertices that are contained in tile content.
 *
 * @internal
 */
export class VertexProcessing {
  /**
   * Process all vertices from the specified tile content.
   *
   * This will examine the given content data, and process it based on
   * its type, passing the positions of all vertices of the tile data
   * to the given consumer.
   *
   * The consumer may always receive the same array instance. The
   * consumer should not store or modify this instance.
   *
   * The consumer will receive the positions of
   * - points in PNTS data
   * - vertices of mesh primitives of GLB data
   * - vertices of mesh primitives of GLB in B3DM data
   * - vertices from I3DM data (see notes below)
   * - the points/vertices from CMPT data, recursively
   *
   * For I3DM data, there are two options:
   *
   * When `processInstancePoints` is `true`, then this will process
   * all points of the instanced GLB model, transformed with EACH
   * of the instancing matrices. When `processInstancePoints` is
   * `false`, then it will compute the bounding box of the GLB model,
   * and process only the CORNERS of the bounding box, transformed
   * with each of the instancing matrices.
   * (Note that `processInstancePoints` may be slow when there are
   * many instances)
   *
   * @param contentUri - The content URI
   * @param data - The content data
   * @param externalGlbResolver - The resolver for external GLBs in I3DMs
   * @param processInstancePoints - Whether the points from instances should
   * be processed individually
   * @param consumer - The consumer that will receive the vertices
   * @throws TileFormatError if the I3DM referred to a GLB that could not be
   * resolved
   */
  static async fromContent(
    contentUri: string,
    data: Buffer,
    externalGlbResolver: (glbUri: string) => Promise<Buffer | undefined>,
    processInstancePoints: boolean,
    consumer: (p: number[]) => void
  ): Promise<void> {
    const contentDataType = await ContentDataTypeRegistry.findType(
      contentUri,
      data
    );
    if (contentDataType === ContentDataTypes.CONTENT_TYPE_GLB) {
      await VertexProcessing.fromGlb(data, consumer);
    } else if (contentDataType === ContentDataTypes.CONTENT_TYPE_PNTS) {
      await VertexProcessing.fromPnts(data, consumer);
    } else if (contentDataType === ContentDataTypes.CONTENT_TYPE_B3DM) {
      await VertexProcessing.fromB3dm(data, consumer);
    } else if (contentDataType === ContentDataTypes.CONTENT_TYPE_I3DM) {
      await VertexProcessing.fromI3dm(
        data,
        externalGlbResolver,
        processInstancePoints,
        consumer
      );
    } else if (contentDataType === ContentDataTypes.CONTENT_TYPE_CMPT) {
      await VertexProcessing.fromCmpt(
        data,
        externalGlbResolver,
        processInstancePoints,
        consumer
      );
    }
  }

  /**
   * Implementation of `fromContent` for PNTS (see `fromContent`)
   *
   * @param pntsBuffer - The PNTS data buffer
   * @param consumer - The consumer that will receive the vertices
   */
  private static async fromPnts(
    pntsBuffer: Buffer,
    consumer: (p: number[]) => void
  ): Promise<void> {
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
    const vertexPosition = Array<number>(3);
    for (const localPosition of localPositions) {
      vertexPosition[0] = localPosition[0] + globalPosition[0];
      vertexPosition[1] = localPosition[1] + globalPosition[1];
      vertexPosition[2] = localPosition[2] + globalPosition[2];
      consumer(vertexPosition);
    }
  }

  /**
   * Implementation of `fromContent` for B3DM (see `fromContent`)
   *
   * @param b3dmBuffer - The B3DM data buffer
   * @param consumer - The consumer that will receive the vertices
   */
  private static async fromB3dm(
    b3dmBuffer: Buffer,
    consumer: (p: number[]) => void
  ): Promise<void> {
    // Compute the bounding volume box from the payload (GLB data)
    const tileData = TileFormats.readTileData(b3dmBuffer);
    const glbBuffer = tileData.payload;

    const positionForTileset = Array<number>(3);

    // If the feature table defines an `RTC_CENTER`, then
    // translate the bounding volume box by this amount
    const featureTable = tileData.featureTable.json as B3dmFeatureTable;
    if (featureTable.RTC_CENTER) {
      const featureTableBinary = tileData.featureTable.binary;
      const rtcCenter = TileTableData.obtainRtcCenter(
        featureTable.RTC_CENTER,
        featureTableBinary
      );
      await VertexProcessing.fromGlb(glbBuffer, (position) => {
        // Apply RTC_CENTER
        positionForTileset[0] = position[0] + rtcCenter[0];
        positionForTileset[1] = position[1] + rtcCenter[1];
        positionForTileset[2] = position[2] + rtcCenter[2];

        consumer(positionForTileset);
      });
    } else {
      await VertexProcessing.fromGlb(glbBuffer, (position) => {
        consumer(position);
      });
    }
  }

  /**
   * Implementation of `fromContent` for I3DM (see `fromContent`)
   *
   * @param i3dmBuffer - The I3DM data buffer
   * @param externalGlbResolver - The resolver for external GLB data from I3DMs
   * @param processInstancePoints - Whether the points from instances should
   * be processed individually
   * @param consumer - The consumer that will receive the vertices
   * @throws TileFormatError if the I3DM referred to a GLB that could not be
   * resolved
   */
  private static async fromI3dm(
    i3dmBuffer: Buffer,
    externalGlbResolver: (glbUri: string) => Promise<Buffer | undefined>,
    processInstancePoints: boolean,
    consumer: (p: number[]) => void
  ): Promise<void> {
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
    if (processInstancePoints) {
      await VertexProcessing.fromI3dmPoints(tileData, glbBuffer, consumer);
    } else {
      await VertexProcessing.fromI3dmCorners(tileData, glbBuffer, consumer);
    }
  }

  /**
   * Implementation of `fromContent` for I3DM (see `fromContent`),
   * for the case that `processInstancePoints` was `false`.
   *
   * This will compute the bounding volume box corners of the GLB,
   * and then transform these corners with each instancing
   * transform, passing the results to the given consumer.
   *
   * @param tileData - The tile data
   * @param glbBuffer - The GLB data buffer
   * @param consumer - The consumer that will receive the vertices
   */
  private static async fromI3dmCorners(
    tileData: TileData,
    glbBuffer: Buffer,
    consumer: (p: number[]) => void
  ): Promise<void> {
    const positions: number[][] = [];
    await VertexProcessing.fromGlb(glbBuffer, (p: number[]) => {
      positions.push(p.slice());
    });
    const gltfBoundingVolumeBox =
      BoundingVolumes.createBoundingVolumeBoxFromPoints(positions);

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
    const transformedCorner = Array<number>(3);
    for (const matrix of instanceMatrices) {
      for (const gltfCorner of gltfCorners) {
        VertexProcessing.transformPoint3D(
          matrix,
          gltfCorner,
          transformedCorner
        );
        consumer(transformedCorner);
      }
    }
  }

  /**
   * Implementation of `fromContent` for I3DM (see `fromContent`),
   * for the case that `processInstancePoints` was `true`.
   *
   * This will process all points of the GLB data, transformed
   * with each instancing transform.
   *
   * Note that this may be slow when there are many instances.
   *
   * @param tileData - The tile data
   * @param glbBuffer - The GLB data buffer
   * @param consumer - The consumer that will receive the vertices
   */
  private static async fromI3dmPoints(
    tileData: TileData,
    glbBuffer: Buffer,
    consumer: (p: number[]) => void
  ): Promise<void> {
    const positions: number[][] = [];
    await VertexProcessing.fromGlb(glbBuffer, (p: number[]) => {
      positions.push(p.slice());
    });

    // Compute the instance matrices of the I3DM data
    const featureTable = tileData.featureTable.json as I3dmFeatureTable;
    const featureTableBinary = tileData.featureTable.binary;
    const numInstances = featureTable.INSTANCES_LENGTH;
    const instanceMatrices = TileTableDataI3dm.createInstanceMatrices(
      featureTable,
      featureTableBinary,
      numInstances
    );

    // Transform all positions with the instancing transforms, and
    // pass the resulting positions to the consumer
    const transformedPosition = Array<number>(3);
    for (const matrix of instanceMatrices) {
      for (const position of positions) {
        VertexProcessing.transformPoint3D(
          matrix,
          position,
          transformedPosition
        );
        consumer(transformedPosition);
      }
    }
  }

  /**
   * Implementation of `fromContent` for CMPT (see `fromContent`)
   *
   * @param cmptBuffer - The CMPT data buffer
   * @param externalGlbResolver - The resolver for external GLB data from I3DMs
   * @param processInstancePoints - Whether the points from instances should
   * be processed individually
   * @param consumer - The consumer that will receive the vertices
   */
  private static async fromCmpt(
    cmptBuffer: Buffer,
    externalGlbResolver: (glbUri: string) => Promise<Buffer | undefined>,
    processInstancePoints: boolean,
    consumer: (p: number[]) => void
  ): Promise<void> {
    const compositeTileData = TileFormats.readCompositeTileData(cmptBuffer);
    const buffers = compositeTileData.innerTileBuffers;
    for (const buffer of buffers) {
      await VertexProcessing.fromContent(
        "[inner tile of CMPT]",
        buffer,
        externalGlbResolver,
        processInstancePoints,
        consumer
      );
    }
  }

  /**
   * Implementation of `fromContent` for GLB (see `fromContent`)
   *
   * This will pass the vertices of all meshes that are contained in
   * the default scene (or the first scene, if there is no default)
   * to the given consumer.
   *
   * @param glbBuffer - The buffer containing GLB data
   * @param consumer - The consumer that will receive the vertices
   */
  private static async fromGlb(
    glbBuffer: Buffer,
    consumer: (p: number[]) => void
  ): Promise<void> {
    //const io = await GltfTransform.getIO();
    //const document = await io.readBinary(glbBuffer);
    // TODO Obtaining document, INCLUDING possible upgrades - OK?
    const document = await GltfUpgrade.obtainDocument(glbBuffer);
    const root = document.getRoot();
    let scene = root.getDefaultScene();
    if (!scene) {
      const scenes = root.listScenes();
      if (scenes.length > 0) {
        scene = scenes[0];
      }
    }
    if (scene) {
      VertexProcessing.fromGltfNode(scene, consumer);
    }
  }

  /**
   * Process all vertex positions from the given glTF.
   *
   * This will traverse the node hierarchy of the given glTF, fetch
   * the POSITION attribute of all primitives, fetch the 3D vertices
   * from the POSITION attribute, transform them with the global
   * transform of the respective node, and pass that transformed
   * position to the given consumer.
   *
   * @param root The root scene or note of the glTF
   * @param consumer The consumer that will receive the points as 3-element arrays
   */
  private static fromGltfNode(
    root: Node | Scene,
    consumer: (p: number[]) => void
  ): void {
    const position = [0, 0, 0];
    const positionZup = [0, 0, 0];
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
            VertexProcessing.transformPoint3D(worldMatrix, position, position);
            // Take y-up-to-z-up into account
            positionZup[0] = position[0];
            positionZup[1] = -position[2];
            positionZup[2] = position[1];
            consumer(positionZup);
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
