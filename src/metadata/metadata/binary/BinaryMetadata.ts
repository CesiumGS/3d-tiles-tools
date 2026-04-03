import { BinaryBufferData } from "../../../base";
import { BinaryBufferStructure } from "../../../base";

import { MetadataClass } from "../../../structure";

import { BinaryEnumInfo } from "./BinaryEnumInfo";

/**
 * A basic structure summarizing the (raw) elements of binary metadata.
 *
 * It contains information about the structure of the data (given
 * as the `MetadataClass`), as well as the binary data, stored in
 * `Buffer` objects.
 *
 * @internal
 */
export interface BinaryMetadata {
  /**
   * The `MetadataClass` that describes the structure of this metadata
   */
  metadataClass: MetadataClass;

  /**
   * Information about the binary representation of `MetadataEnum`
   * values
   */
  binaryEnumInfo: BinaryEnumInfo;

  /**
   * The binary buffer structure, containing the `BufferObject` and
   * `BufferView` objects.
   *
   * The metadata property objects contain indices (e.g. the
   * `propertyTableProperty.values` index) that refer to this
   * structure.
   */
  binaryBufferStructure: BinaryBufferStructure;

  /**
   * The binary buffer data. These are the actual buffers with
   * the binary data that correspond to the elements of the
   * `BinaryBufferStructure`.
   */
  binaryBufferData: BinaryBufferData;
}
