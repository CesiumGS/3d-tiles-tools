import { FeatureTable } from "./FeatureTable";
import { BinaryBodyOffset } from "./BinaryBodyOffset";

/**
 * A set of Batched 3D Model semantics that contain additional
 * information about features in a tile.
 * @internal
 */
export interface B3dmFeatureTable extends FeatureTable {
  /**
   * A `GlobalPropertyInteger` object defining an integer property for all
   * features. Details about this property are described in the 3D Tiles
   * specification.
   */
  BATCH_LENGTH: number;

  /**
   * A `GlobalPropertyCartesian3` object defining a 3-component numeric
   * property for all features. Details about this property are described
   * in the 3D Tiles specification.
   */
  RTC_CENTER?: BinaryBodyOffset | number[];
}
