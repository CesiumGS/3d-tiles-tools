import { GltfTransform } from "../GltfTransform";

import { ReadablePointCloud } from "./ReadablePointCloud";
import { GltfTransformPointClouds } from "./GltTransformPointClouds";

/**
 * Methods to create glTF representations of point clouds
 */
export class GltfPointClouds {
  /**
   * Creates a binary glTF (GLB) for a point cloud that was
   * created from the given `ReadablePointCloud` input.
   *
   * Many details about the result are intentionally not
   * specified. It is supposed to be "just a point cloud".
   *
   * @param readablePointCloud - The `ReadablePointCloud`
   * @param globalPosition The optional global position, to
   * be set as the `translation` component of the root node.
   * @returns The buffer containing the GLB data
   * @throws TileFormatError If the input data does not
   * at least contain a `POSITION` attribute.
   */
  static async build(
    readablePointCloud: ReadablePointCloud,
    globalPosition: [number, number, number] | undefined
  ): Promise<Buffer> {
    const gltfTransformPointCloud = GltfTransformPointClouds.build(
      readablePointCloud,
      globalPosition
    );
    const document = gltfTransformPointCloud.document;

    // Create the GLB buffer
    const io = await GltfTransform.getIO();
    const glb = await io.writeBinary(document);
    return Buffer.from(glb);
  }
}
