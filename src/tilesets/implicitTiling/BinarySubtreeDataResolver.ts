import { Buffers } from "../../base";
import { ResourceResolver } from "../../base";
import { BinaryBufferDataResolver } from "../../base";
import { BinaryBufferStructure } from "../../base";
import { BinaryDataError } from "../../base";

import { Subtree } from "../../structure";

import { BinarySubtreeData } from "./BinarySubtreeData";
import { ImplicitTilingError } from "./ImplicitTilingError";

/**
 * A class for resolving the binary data that is associated with
 * a subtree.
 *
 * @internal
 */
export class BinarySubtreeDataResolver {
  /**
   * Creates a new `BinarySubtreeData` from the given subtree
   * that was parsed from a subtree JSON file.
   *
   * This will resolve all buffer references that are
   * contained in the subtree JSON.
   *
   * @param subtree - The `Subtree`
   * @param resourceResolver - The `ResourceResolver` that
   * will be used to resolve buffer URIs
   * @returns A promise with the `BinarySubtreeData`
   * @throws An ImplicitTilingError when there was a buffer without
   * a URI (which is not valid when no binary buffer was given),
   * or one of the requested buffers could not be resolved.
   */
  static async resolveFromJson(
    subtree: Subtree,
    resourceResolver: ResourceResolver
  ): Promise<BinarySubtreeData> {
    const binarySubtreeData = await BinarySubtreeDataResolver.resolveInternal(
      subtree,
      undefined,
      resourceResolver
    );
    return binarySubtreeData;
  }

  /**
   * Creates a new `BinarySubtreeData` from the given binary subtree
   * data that was directly read from a ".subtree" file.
   *
   * This will extract the JSON- and binary buffer part of the
   * subtree data, and resolve all buffer references that are
   * contained in the subtree JSON.
   *
   * @param input - The whole buffer of a binary subtree file
   * @param resourceResolver - The `ResourceResolver` that
   * will be used to resolve buffer URIs
   * @returns A promise with the `BinarySubtreeData`
   * @throws An ImplicitTilingError when the subtree JSON could
   * not be parsed, or there was a buffer without a URI
   * and no binary buffer was given, or one of the requested
   * buffers could not be resolved.
   */
  static async resolveFromBuffer(
    input: Buffer,
    resourceResolver: ResourceResolver
  ): Promise<BinarySubtreeData> {
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

    const binarySubtreeData = await BinarySubtreeDataResolver.resolveInternal(
      subtree,
      binaryBuffer,
      resourceResolver
    );
    return binarySubtreeData;
  }

  /**
   * A thin wrapper around `BinaryBufferDataResolver.resolve`
   * that obtains the binary buffer structure information from
   * the subtree, resolves it, and returns it as part of
   * the `BinarySubtreeData`
   *
   * @param subtree - The `Subtree`
   * @param binaryBuffer - The binary buffer of the subtree
   * @param resourceResolver - The resource resolver
   * @returns A promise to the resolved binary subtree data
   */
  static async resolveInternal(
    subtree: Subtree,
    binaryBuffer: Buffer | undefined,
    resourceResolver: ResourceResolver
  ): Promise<BinarySubtreeData> {
    const binaryBufferStructure: BinaryBufferStructure = {
      buffers: subtree.buffers ?? [],
      bufferViews: subtree.bufferViews ?? [],
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
    return {
      subtree: subtree,
      binaryBufferStructure: binaryBufferStructure,
      binaryBufferData: binaryBufferData,
    };
  }
}
