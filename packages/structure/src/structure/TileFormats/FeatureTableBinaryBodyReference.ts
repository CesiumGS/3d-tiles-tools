import { BinaryBodyOffset } from "./BinaryBodyOffset";

/**
 * An object defining the reference to a section of the binary body of
 * the batch table where the property values are stored if not defined
 * directly in the JSON.
 * @internal
 */
export interface FeatureTableBinaryBodyReference extends BinaryBodyOffset {
  /**
   * The datatype of components in the property. This is defined only
   * if the semantic allows for overriding the implicit component type.
   * These cases are specified in each tile format.
   */
  componentType?: string;
}
