import { RootProperty } from "../RootProperty";

/**
 * An object defining the offset into a section of the binary body of the
 * features table where the property values are stored if not defined
 * directly in the JSON.
 * @internal
 */
export interface BinaryBodyOffset extends RootProperty {
  /**
   * The offset into the buffer in bytes.
   */
  byteOffset: number;
}
