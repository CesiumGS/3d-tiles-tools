import { ResourceResolver } from "../../base";

import { Subtree } from "../../structure";
import { TileImplicitTiling } from "../../structure";

import { SubtreeInfo } from "./SubtreeInfo";
import { AvailabilityInfos } from "./AvailabilityInfos";
import { BinarySubtreeData } from "./BinarySubtreeData";
import { BinarySubtreeDataResolver } from "./BinarySubtreeDataResolver";
import { AvailabilityInfo } from "./AvailabilityInfo";

/**
 * Methods to create `SubtreeInfo` instances.
 *
 * @internal
 */
export class SubtreeInfos {
  /**
   * Creates a new `SubtreeInfo` from the given binary subtree data
   * that was directly read from a ".subtree" file.
   *
   * This method assumes that the given binary data is consistent
   * and valid.
   *
   * @param input - The whole buffer of a binary subtree file
   * @param implicitTiling - The `TileImplicitTiling` that
   * defines the expected structure of the subtree data
   * @param resourceResolver - The `ResourceResolver` that
   * will be used to resolve buffer URIs
   * @returns A promise with the `SubtreeInfo`
   * @throws An ImplicitTilingError when the subtree JSON could
   * not be parsed, or there was a buffer without a URI
   * and no binary buffer was given, or one of the requested
   * buffers could not be resolved.
   */
  static async createFromBuffer(
    input: Buffer,
    implicitTiling: TileImplicitTiling,
    resourceResolver: ResourceResolver
  ): Promise<SubtreeInfo> {
    const binarySubtreeData = await BinarySubtreeDataResolver.resolveFromBuffer(
      input,
      resourceResolver
    );
    const result = SubtreeInfos.create(binarySubtreeData, implicitTiling);
    return result;
  }

  /**
   * Creates a new `SubtreeInfo` from the given subtree
   * that was read from a subtree JSON file.
   *
   * @param subtree - The parsed subtree
   * @param implicitTiling - The `TileImplicitTiling` that
   * defines the expected structure of the subtree data
   * @param resourceResolver - The `ResourceResolver` that
   * will be used to resolve buffer URIs
   * @returns A promise with the `SubtreeInfo`
   * @throws An ImplicitTilingError when there was a buffer without
   * a URI, or one of the requested buffers could not be resolved.
   */
  static async createFromJson(
    subtree: Subtree,
    implicitTiling: TileImplicitTiling,
    resourceResolver: ResourceResolver
  ): Promise<SubtreeInfo> {
    const binarySubtreeData = await BinarySubtreeDataResolver.resolveFromJson(
      subtree,
      resourceResolver
    );
    const result = SubtreeInfos.create(binarySubtreeData, implicitTiling);
    return result;
  }

  /**
   * Creates a new `SubtreeInfo` from the given binary subtree data.
   *
   * This method assumes that the given data is consistent
   * and valid.
   *
   * @param binarySubtreeData - The `BinarySubtreeData`
   * @param implicitTiling - The `TileImplicitTiling` that
   * defines the expected structure of the subtree data
   * @returns The `SubtreeInfo`
   * @throws A ImplicitTilingError when there was a buffer without
   * a URI and no binary buffer was given, or the requested buffer
   * data could not be resolved.
   */
  static create(
    binarySubtreeData: BinarySubtreeData,
    implicitTiling: TileImplicitTiling
  ): SubtreeInfo {
    const subtree = binarySubtreeData.subtree;
    const binaryBufferData = binarySubtreeData.binaryBufferData;
    const bufferViewsData = binaryBufferData.bufferViewsData;

    // Create the `AvailabilityInfo` for the tile availability
    const tileAvailability = subtree.tileAvailability;
    const tileAvailabilityInfo = AvailabilityInfos.createTileOrContent(
      tileAvailability,
      bufferViewsData,
      implicitTiling
    );

    // Create the `AvailabilityInfo` objects, one for
    // each content availability
    const contentAvailabilityInfos: AvailabilityInfo[] = [];
    const contentAvailabilities = subtree.contentAvailability;
    if (contentAvailabilities) {
      for (const contentAvailability of contentAvailabilities) {
        const contentAvailabilityInfo = AvailabilityInfos.createTileOrContent(
          contentAvailability,
          bufferViewsData,
          implicitTiling
        );
        contentAvailabilityInfos.push(contentAvailabilityInfo);
      }
    }

    // Create the `AvailabilityInfo` for the child subtree availability
    const childSubtreeAvailability = subtree.childSubtreeAvailability;
    const childSubtreeAvailabilityInfo = AvailabilityInfos.createChildSubtree(
      childSubtreeAvailability,
      bufferViewsData,
      implicitTiling
    );

    const result: SubtreeInfo = {
      tileAvailabilityInfo: tileAvailabilityInfo,
      contentAvailabilityInfos: contentAvailabilityInfos,
      childSubtreeAvailabilityInfo: childSubtreeAvailabilityInfo,
    };
    return result;
  }
}
