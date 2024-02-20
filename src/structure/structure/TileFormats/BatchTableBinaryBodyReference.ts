import { RootProperty } from "../RootProperty";

/**
 * An object defining the reference to a section of the binary body of
 * the batch table where the property values are stored if not defined
 * directly in the JSON.
 * @internal
 */
export interface BatchTableBinaryBodyReference extends RootProperty {
  /**
   * The offset into the buffer in bytes.
   */
  byteOffset: number;

  /**
   * The datatype of components in the property.
   */
  componentType: string;

  /**
   * Specifies if the property is a scalar or vector.
   */
  type: string;
}
