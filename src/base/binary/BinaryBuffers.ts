import { BufferObject } from "../../structure";
import { BufferView } from "../../structure";

import { BinaryBufferStructure } from "./BinaryBufferStructure";
import { BinaryBufferData } from "./BinaryBufferData";

/**
 * Methods related to binary buffers.
 *
 * This class can be used for building a basic `BinaryBufferData` structure
 * from a sequence of buffers that represent buffer views.
 *
 * @internal
 */
export class BinaryBuffers {
  /**
   * Add a set of buffer views to the given `BinaryBufferData`, and return
   * a `BinaryBufferStructure` that describes their layout.
   *
   * This will combine the given buffer views into a single buffer, and add the
   * buffer views and the generated buffer to the given `BinaryBufferData`.
   *
   * The layout (byte offset and lengths, and the `buffer` index) will be
   * returned via the `BinaryBufferStructure`.
   *
   * NOTE: This function could be generalized in many ways. Right now, it
   * creates a single `BufferObject` for the given data, without a `uri`.
   * Further configuration options might be added in the future.
   *
   * @param binaryBufferData - The `BinaryBufferData`
   * @param newBufferViewsData - The buffer views that should be added
   * @returns A `BinaryBufferStructure` that describes the structure
   * of the buffer views, after they have been assembled into a buffer.
   */
  static createBinaryBufferStructure(
    binaryBufferData: BinaryBufferData,
    newBufferViewsData: Buffer[]
  ): BinaryBufferStructure {
    const alignment = 8;
    const bufferViewsData = binaryBufferData.bufferViewsData;
    const buffersData = binaryBufferData.buffersData;

    // The arrays for the output data
    const buffers: BufferObject[] = [];
    const bufferViews: BufferView[] = [];
    const currentBufferIndex = buffersData.length;

    // Create a new buffer data combines all the given buffer views,
    // including possible padding bytes
    let currentBufferData = Buffer.alloc(0);
    let currentByteOffset = 0;
    for (let i = 0; i < newBufferViewsData.length; i++) {
      const newBufferViewData = newBufferViewsData[i];
      const requiredPadding =
        (alignment - (currentByteOffset % alignment)) % alignment;
      if (requiredPadding != 0) {
        const paddingBuffer = Buffer.alloc(requiredPadding);
        currentBufferData = Buffer.concat([currentBufferData, paddingBuffer]);
        currentByteOffset += requiredPadding;
      }
      currentBufferData = Buffer.concat([currentBufferData, newBufferViewData]);

      // Store the buffer view
      const bufferView: BufferView = {
        buffer: currentBufferIndex,
        byteOffset: currentByteOffset,
        byteLength: newBufferViewData.length,
      };
      bufferViews.push(bufferView);

      // Store the data of the buffer view. This should have the same
      // contents as the `newBufferViewData`, but will be a subarray
      // of the newly created buffer
      const bufferViewData = currentBufferData.subarray(
        currentByteOffset,
        currentByteOffset + newBufferViewData.length
      );
      bufferViewsData.push(bufferViewData);

      currentByteOffset += newBufferViewData.length;
    }

    // Store the buffer
    const buffer: BufferObject = {
      byteLength: currentBufferData.length,
    };
    buffers.push(buffer);

    // Store the buffer data
    buffersData.push(currentBufferData);

    // Return the resulting buffer structure
    const binaryBufferStructure: BinaryBufferStructure = {
      buffers: buffers,
      bufferViews: bufferViews,
    };
    return binaryBufferStructure;
  }
}
