import { VertexProcessing } from "../contentProcessing/VertexProcessing";

import { BoundingVolumes } from "./BoundingVolumes";

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
   * @throws TileFormatError if the I3DM referred to a GLB that could not be
   * resolved
   */
  static async computeContentDataBoundingVolumeBox(
    contentUri: string,
    data: Buffer,
    externalGlbResolver: (glbUri: string) => Promise<Buffer | undefined>
  ): Promise<number[] | undefined> {
    const processInstancePoints = false;
    const points: number[][] = [];
    const consumer = (p: number[]) => {
      points.push(p.slice());
    };
    await VertexProcessing.fromContent(
      contentUri,
      data,
      externalGlbResolver,
      processInstancePoints,
      consumer
    );
    const boundingVolumeBox =
      BoundingVolumes.createBoundingVolumeBoxFromPoints(points);
    return boundingVolumeBox;
  }
}
