import { Buffers } from "../base/Buffers";

import { ResourceResolver } from "../io/ResourceResolver";

import { SubtreeInfo } from "./SubtreeInfo";
import { AvailabilityInfos } from "./AvailabilityInfos";
import { ImplicitTilingError } from "./ImplicitTilingError";

import { Subtree } from "../structure/Subtree";
import { TileImplicitTiling } from "../structure/TileImplicitTiling";

import { BinaryBufferDataResolver } from "../binary/BinaryBufferDataResolver";
import { BinaryBufferStructure } from "../binary/BinaryBufferStructure";
import { BinaryDataError } from "../binary/BinaryDataError";

/**
 * Methods to create `SubtreeInfo` instances.
 */
export class SubtreeInfos {
  /**
   * Creates a new `SubtreeInfo` from the given binary subtree data.
   *
   * This method assumes that the given binary data is consistent
   * and valid. This can be checked with the `SubtreeValidator`
   * class.
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
    const headerByteLength = 24;
    const jsonByteLength = input.readBigUint64LE(8);
    const binaryByteLength = input.readBigUint64LE(16);

    // Extract the JSON data
    const jsonStartByteOffset = headerByteLength;
    const jsonEndByteOffset = jsonStartByteOffset + Number(jsonByteLength);
    const jsonBuffer = input.subarray(jsonStartByteOffset, jsonEndByteOffset);
    let subtreeJson: any;
    let subtree: Subtree;
    try {
      subtreeJson = Buffers.getJson(jsonBuffer);
      subtree = subtreeJson;
    } catch (error) {
      throw new ImplicitTilingError("Could not parse subtree JSON data");
    }

    // Extract the binary buffer
    const binaryStartByteOffset = jsonEndByteOffset;
    const binaryEndByteOffset =
      binaryStartByteOffset + Number(binaryByteLength);
    const binaryBufferSlice = input.subarray(
      binaryStartByteOffset,
      binaryEndByteOffset
    );
    const binaryBuffer =
      binaryBufferSlice.length > 0 ? binaryBufferSlice : undefined;

    return SubtreeInfos.create(
      subtree,
      binaryBuffer,
      implicitTiling,
      resourceResolver
    );
  }

  /**
   * Creates a new `SubtreeInfo` from the given `Subtree` object
   * and the (optional) binary buffer.
   *
   * This method assumes that the given data is consistent
   * and valid. This can be checked with the `SubtreeValidator`
   * class.
   *
   * @param subtree - The `Subtree` object
   * @param binaryBuffer - The optional binary buffer
   * @param implicitTiling - The `TileImplicitTiling` that
   * defines the expected structure of the subtree data
   * @param resourceResolver - The `ResourceResolver` that
   * will be used to resolve buffer URIs
   * @returns A promise with the `SubtreeInfo`
   * @throws A ImplicitTilingError when there was a buffer without
   * a URI and no binary buffer was given, or the requested buffer
   * data could not be resolved.
   */
  static async create(
    subtree: Subtree,
    binaryBuffer: Buffer | undefined,
    implicitTiling: TileImplicitTiling,
    resourceResolver: ResourceResolver
  ): Promise<SubtreeInfo> {
    if (!subtree.buffers) {
      throw new ImplicitTilingError("The subtree did not define any buffers");
    }
    if (!subtree.bufferViews) {
      throw new ImplicitTilingError(
        "The subtree did not define any buffer views"
      );
    }
    const binaryBufferStructure: BinaryBufferStructure = {
      buffers: subtree.buffers,
      bufferViews: subtree.bufferViews,
    };
    let binaryBufferData;
    try {
      binaryBufferData = await BinaryBufferDataResolver.resolve(
        binaryBufferStructure,
        binaryBuffer,
        resourceResolver
      );
    } catch (error) {
      if (error instanceof BinaryDataError) {
        const message = `Could not read subtree data: ${error.message}`;
        throw new ImplicitTilingError(message);
      }
      throw error;
    }
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
    const contentAvailabilityInfos = [];
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

    const result = new SubtreeInfo(
      tileAvailabilityInfo,
      contentAvailabilityInfos,
      childSubtreeAvailabilityInfo
    );
    return result;
  }
}
