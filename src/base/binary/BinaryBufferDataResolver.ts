import { defined } from "../base/defined";

import { ResourceResolver } from "../io/ResourceResolver";

import { BinaryBufferData } from "./BinaryBufferData";
import { BinaryBufferStructure } from "./BinaryBufferStructure";
import { BinaryDataError } from "./BinaryDataError";

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
   * The given `binaryBuffer` will be used as the buffer data
   * for any buffer that does not have a URI (intended for
   * binary subtree files)
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
        const buffer = buffers[b];

        // If the buffer defines a URI, it will be resolved
        if (defined(buffer.uri)) {
          //console.log("Obtaining buffer data from " + buffer.uri);
          const bufferData = await resourceResolver.resolveData(buffer.uri);
          if (!bufferData) {
            const message = `Could not resolve buffer ${buffer.uri}`;
            throw new BinaryDataError(message);
          }
          buffersData.push(bufferData);
        } else {
          // If the buffer does not define a URI, then it might
          // be a "fallback" buffer from `EXT_meshopt_compression`.
          // In this case, the `EXT_meshopt_compression` extension
          // is required, and a dummy buffer with the appropriate
          // size will be returned.
          const isFallbackBuffer =
            BinaryBufferDataResolver.isMeshoptFallbackBuffer(
              binaryBufferStructure,
              b
            );
          if (isFallbackBuffer) {
            const fallbackBuffer = Buffer.alloc(buffer.byteLength);
            buffersData.push(fallbackBuffer);
          } else {
            // When the buffer does not have a URI and is not a fallback
            // buffer, then it must be the binary buffer
            if (!binaryBuffer) {
              throw new BinaryDataError(
                "Expected a binary buffer, but got undefined"
              );
            }
            buffersData.push(binaryBuffer);
          }
        }
      }
    }

    // Obtain the buffer view data objects: One `Buffer` for
    // each `BufferView`
    const bufferViewsData: Buffer[] = [];
    const bufferViews = binaryBufferStructure.bufferViews;
    if (bufferViews) {
      for (const bufferView of bufferViews) {
        // If the buffer view defines the `EXT_meshopt_compression`
        // extension, then decode the meshopt buffer
        const extensions = bufferView.extensions ?? {};
        const meshopt = extensions["EXT_meshopt_compression"];
        if (meshopt) {
          const compressedBufferData = buffersData[meshopt.buffer];
          const bufferViewData = await BinaryBufferDataResolver.decodeMeshopt(
            compressedBufferData,
            meshopt
          );
          bufferViewsData.push(bufferViewData);
        } else {
          // Otherwise, just slice out the required part of
          // the buffer that the buffer view refers to
          const bufferData = buffersData[bufferView.buffer];
          const start = bufferView.byteOffset ?? 0;
          const end = start + bufferView.byteLength;
          const bufferViewData = bufferData.subarray(start, end);
          bufferViewsData.push(bufferViewData);
        }
      }
    }

    const binaryBufferData: BinaryBufferData = {
      buffersData: buffersData,
      bufferViewsData: bufferViewsData,
    };
    return binaryBufferData;
  }

  /**
   * Decode the meshopt-compressed data for a buffer view that contained
   * the given `EXT_meshopt_compression` extension object.
   *
   * @param compressedBufferData - The buffer containing the compressed
   * data that the extension object refers to
   * @param meshopt The extension object
   * @returns The decoded buffer (view) data
   */
  private static async decodeMeshopt(
    compressedBufferData: Buffer,
    meshopt: any
  ): Promise<Buffer> {
    const byteOffset = meshopt.byteOffset ?? 0;
    const byteLength = meshopt.byteLength;
    const byteStride = meshopt.byteStride;
    const count = meshopt.count;
    const mode = meshopt.mode;
    const filter = meshopt.filter ?? "NONE";
    const compressedBufferViewData = compressedBufferData.subarray(
      byteOffset,
      byteOffset + byteLength
    );

    const uncompressedByteLength = byteStride * count;
    const uncompressedBufferViewData = new Uint8Array(uncompressedByteLength);

    await MeshoptDecoder.ready;
    MeshoptDecoder.decodeGltfBuffer(
      uncompressedBufferViewData,
      count,
      byteStride,
      compressedBufferViewData,
      mode,
      filter
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
