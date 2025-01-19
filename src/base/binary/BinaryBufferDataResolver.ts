import { defined } from "../base/defined";

import { ResourceResolver } from "../io/ResourceResolver";

import { BinaryBufferData } from "./BinaryBufferData";
import { BinaryBufferStructure } from "./BinaryBufferStructure";
import { BinaryDataError } from "./BinaryDataError";

import { BufferView } from "../../structure";

import { MeshoptDecoder } from "meshoptimizer";

/**
 * A class for resolving binary buffer data.
 *
 * @internal
 */
export class BinaryBufferDataResolver {
  /**
   * Resolves the buffer data that is defined in the given structure.
   *
   * It receives a `BinaryBufferStructure` that contains the
   * `BufferObject` and `BufferView` definitions, resolves the
   * data from the buffer URIs using the given resource resolver,
   * and returns a `BinaryBufferData` that contains the actual
   * binary buffer data.
   *
   * If any of the given buffer views uses the `EXT_meshopt_compression`
   * glTF extension, then this data will be decompressed.
   *
   * The given `binaryBuffer` will be used as the buffer data
   * for any buffer that does not have a URI and that is not
   * a meshopt fallback buffer (intended for binary subtree files)
   *
   * @param binaryBufferStructure - The `BinaryBufferStructure`
   * @param binaryBuffer - The optional binary buffer
   * @param resourceResolver - The `ResourceResolver`
   * @returns The `BinaryBufferData`
   * @throws BinaryDataError If the data could not be resolved
   */
  static async resolve(
    binaryBufferStructure: BinaryBufferStructure,
    binaryBuffer: Buffer | undefined,
    resourceResolver: ResourceResolver
  ): Promise<BinaryBufferData> {
    // Obtain the buffer data objects: One `Buffer` for
    // each `BufferObject`
    const buffersData: Buffer[] = [];
    const buffers = binaryBufferStructure.buffers;
    if (buffers) {
      for (let b = 0; b < buffers.length; b++) {
        const bufferData = await BinaryBufferDataResolver.resolveBufferData(
          binaryBufferStructure,
          binaryBuffer,
          b,
          resourceResolver
        );
        buffersData.push(bufferData);
      }
    }

    // Obtain the buffer view data objects: One `Buffer` for
    // each `BufferView`
    const bufferViewsData: Buffer[] = [];
    const bufferViews = binaryBufferStructure.bufferViews;
    if (bufferViews) {
      for (const bufferView of bufferViews) {
        const bufferViewData =
          await BinaryBufferDataResolver.resolveBufferViewData(
            buffersData,
            bufferView
          );
        bufferViewsData.push(bufferViewData);
      }
    }

    const binaryBufferData: BinaryBufferData = {
      buffersData: buffersData,
      bufferViewsData: bufferViewsData,
    };
    return binaryBufferData;
  }

  /**
   * Resolve the data for the specified buffer from the given structure.
   *
   * This will...
   * - resolve the buffer URI if it is present
   * - return a zero-filled buffer if the specified buffer is a
   *   meshopt fallback buffer
   * - return the given binary buffer otherwise
   *
   * @param binaryBufferStructure - Tbe `BinaryBufferStructure`
   * @param binaryBuffer - The optional binary buffer
   * @param bufferIndex - The index of the buffer to resolve
   * @param resourceResolver - The `ResourceResolver` that will be
   * used for resolving buffer URIs
   * @returns The `Buffer` containing the data for the specified
   * buffer.
   * @throws BinaryDataError If the buffer data cannot be resolved
   */
  private static async resolveBufferData(
    binaryBufferStructure: BinaryBufferStructure,
    binaryBuffer: Buffer | undefined,
    bufferIndex: number,
    resourceResolver: ResourceResolver
  ): Promise<Buffer> {
    const buffer = binaryBufferStructure.buffers[bufferIndex];

    // If the buffer defines a URI, it will be resolved
    if (defined(buffer.uri)) {
      //console.log("Obtaining buffer data from " + buffer.uri);
      const bufferData = await resourceResolver.resolveData(buffer.uri);
      if (!bufferData) {
        const message = `Could not resolve buffer ${buffer.uri}`;
        throw new BinaryDataError(message);
      }
      return bufferData;
    }

    // If the buffer does not define a URI, then it might
    // be a "fallback" buffer from `EXT_meshopt_compression`.
    // In this case, a dummy buffer with the appropriate
    // size will be returned. Later, when the buffer views
    // are processed, slices of this buffer will be filled
    // with the data that results from uncompressing the
    // meshopt-compressed data
    const isFallbackBuffer = BinaryBufferDataResolver.isMeshoptFallbackBuffer(
      binaryBufferStructure,
      bufferIndex
    );
    if (isFallbackBuffer) {
      const fallbackBuffer = Buffer.alloc(buffer.byteLength);
      return fallbackBuffer;
    }

    // When the buffer does not have a URI and is not a fallback
    // buffer, then it must be the binary buffer
    if (!binaryBuffer) {
      throw new BinaryDataError("Expected a binary buffer, but got undefined");
    }
    return binaryBuffer;
  }

  /**
   * Resolve the data for the given buffer view against the given
   * buffers data.
   *
   * This will slice out the data for the buffer view from the
   * data that corresponds to its `buffer`.
   *
   * If the given buffer view uses the `EXT_meshopt_compression`
   * glTF extension, then its data will be uncompressed into
   * the appropriate slice of the uncompressed buffer, and this
   * slice will be returned.
   *
   * @param buffersData - The buffers data
   * @param bufferView - The `BufferView` object
   * @returns The `Buffer` for the buffer view
   */
  private static async resolveBufferViewData(
    buffersData: Buffer[],
    bufferView: BufferView
  ): Promise<Buffer> {
    // If the buffer view defines the `EXT_meshopt_compression`
    // extension, then decode the meshopt buffer
    const extensions = bufferView.extensions ?? {};
    const meshopt = extensions["EXT_meshopt_compression"];
    if (meshopt) {
      const compressedBufferData = buffersData[meshopt.buffer];
      const uncompressedBufferData = buffersData[bufferView.buffer];
      const bufferViewData = await BinaryBufferDataResolver.decodeMeshopt(
        compressedBufferData,
        uncompressedBufferData,
        bufferView,
        meshopt
      );
      return bufferViewData;
    }

    // Otherwise, just slice out the required part of
    // the buffer that the buffer view refers to
    const bufferData = buffersData[bufferView.buffer];
    const start = bufferView.byteOffset ?? 0;
    const end = start + bufferView.byteLength;
    const bufferViewData = bufferData.subarray(start, end);
    return bufferViewData;
  }

  /**
   * Decode the meshopt-compressed data for a buffer view that contained
   * the given `EXT_meshopt_compression` extension object.
   *
   * The returned uncompressed buffer view will be a slice/subarray
   * of the given uncompressed buffer.
   *
   * @param compressedBufferData - The buffer containing the compressed
   * data that the extension object refers to
   * @param uncompressedBufferData - The buffer for the uncompressed
   * data. This may be a "fallback" buffer that was created when
   * initializing the `buffersData` array.
   * @param bufferView - The buffer view that contained the extension
   * @param meshopt - The extension object
   * @returns The decoded buffer (view) data
   */
  private static async decodeMeshopt(
    compressedBufferData: Buffer,
    uncompressedBufferData: Buffer,
    bufferView: BufferView,
    meshopt: any
  ): Promise<Buffer> {
    // Slice out the compressed buffer view data from the compressed
    // buffer, based on the meshopt byte offset and length
    const meshoptByteOffset = meshopt.byteOffset ?? 0;
    const meshoptByteLength = meshopt.byteLength;
    const compressedBufferViewData = compressedBufferData.subarray(
      meshoptByteOffset,
      meshoptByteOffset + meshoptByteLength
    );

    // Slice out the data for the uncompressed buffer view from the
    // uncompressed buffer, based on the buffer view offset and length,
    // The buffer is a "fallback buffer" that is initially zero-filled.
    const meshoptCount = meshopt.count;
    const meshoptByteStride = meshopt.byteStride;
    const uncompressedByteLength = meshoptByteStride * meshoptCount;
    const bufferViewByteOffset = bufferView.byteOffset ?? 0;
    const uncompressedBufferViewData = uncompressedBufferData.subarray(
      bufferViewByteOffset,
      bufferViewByteOffset + uncompressedByteLength
    );

    // Use the meshopt decoder to fill the uncompressed buffer view
    // data from the compressed buffer view data
    await MeshoptDecoder.ready;
    const meshoptMode = meshopt.mode;
    const meshoptFilter = meshopt.filter ?? "NONE";
    MeshoptDecoder.decodeGltfBuffer(
      uncompressedBufferViewData,
      meshoptCount,
      meshoptByteStride,
      compressedBufferViewData,
      meshoptMode,
      meshoptFilter
    );

    return Buffer.from(uncompressedBufferViewData);
  }

  /**
   * Returns whether the given buffer is a "fallback" buffer for the
   * `EXT_meshopt_compression` extension.
   *
   * This is the case when it is either itself marked with
   * an `EXT_meshopt_compression` extension object that
   * defines `fallback: true`, or when it is referred to by
   * a buffer view that defines the `EXT_meshopt_compression`
   * extension.
   *
   * @param binaryBufferStructure - The BinaryBufferStructure
   * @param bufferIndex - The buffer index
   * @returns Whether the given buffer is a fallback buffer
   */
  private static isMeshoptFallbackBuffer(
    binaryBufferStructure: BinaryBufferStructure,
    bufferIndex: number
  ) {
    const buffers = binaryBufferStructure.buffers;
    const buffer = buffers[bufferIndex];
    if (buffer.extensions) {
      const meshopt = buffer.extensions["EXT_meshopt_compression"];
      if (meshopt) {
        if (meshopt["fallback"] === true) {
          return true;
        }
      }
    }
    const bufferViews = binaryBufferStructure.bufferViews;
    for (const bufferView of bufferViews) {
      if (bufferView.extensions) {
        const meshopt = bufferView.extensions["EXT_meshopt_compression"];
        if (meshopt) {
          if (bufferView.buffer === bufferIndex) {
            return true;
          }
        }
      }
    }
    return false;
  }
}
