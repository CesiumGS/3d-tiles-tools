import { FeatureTable } from "./FeatureTable";
import { FeatureTableBinaryBodyReference } from "./FeatureTableBinaryBodyReference";
import { BinaryBodyOffset } from "./BinaryBodyOffset";

/**
 * A set of Instanced 3D Model semantics that contains values defining
 * the position and appearance properties for instanced models in a tile.
 * @internal
 */
export interface I3dmFeatureTable extends FeatureTable {
  /**
   * A `BinaryBodyReference` object defining the reference to a section of
   * the binary body where the property values are stored. Details about
   * this property are described in the 3D Tiles specification.
   */
  POSITION?: FeatureTableBinaryBodyReference;

  /**
   * A `BinaryBodyReference` object defining the reference to a section of
   * the binary body where the property values are stored. Details about
   * this property are described in the 3D Tiles specification.
   */
  POSITION_QUANTIZED?: FeatureTableBinaryBodyReference;

  /**
   * A `BinaryBodyReference` object defining the reference to a section of
   * the binary body where the property values are stored. Details about
   * this property are described in the 3D Tiles specification.
   */
  NORMAL_UP?: FeatureTableBinaryBodyReference;

  /**
   * A `BinaryBodyReference` object defining the reference to a section of
   * the binary body where the property values are stored. Details about
   * this property are described in the 3D Tiles specification.
   */
  NORMAL_RIGHT?: FeatureTableBinaryBodyReference;

  /**
   * A `BinaryBodyReference` object defining the reference to a section of
   * the binary body where the property values are stored. Details about
   * this property are described in the 3D Tiles specification.
   */
  NORMAL_UP_OCT32P?: FeatureTableBinaryBodyReference;

  /**
   * A `BinaryBodyReference` object defining the reference to a section of
   * the binary body where the property values are stored. Details about
   * this property are described in the 3D Tiles specification.
   */
  NORMAL_RIGHT_OCT32P?: FeatureTableBinaryBodyReference;

  /**
   * A `BinaryBodyReference` object defining the reference to a section of
   * the binary body where the property values are stored. Details about
   * this property are described in the 3D Tiles specification.
   */
  SCALE?: FeatureTableBinaryBodyReference;

  /**
   * A `BinaryBodyReference` object defining the reference to a section of
   * the binary body where the property values are stored. Details about
   * this property are described in the 3D Tiles specification.
   */
  SCALE_NON_UNIFORM?: FeatureTableBinaryBodyReference;

  /**
   * A `BinaryBodyReference` object defining the reference to a section of
   * the binary body where the property values are stored. Details about
   * this property are described in the 3D Tiles specification.
   */
  BATCH_ID?: FeatureTableBinaryBodyReference;

  /**
   * A `GlobalPropertyInteger` object defining an integer property for all
   * features. Details about this property are described in the 3D Tiles
   * specification.
   */
  INSTANCES_LENGTH: number;

  /**
   * A `GlobalPropertyCartesian3` object defining a 3-component numeric
   * property for all features. Details about this property are described
   * in the 3D Tiles specification.
   */
  RTC_CENTER?: BinaryBodyOffset | number[];

  /**
   * A `GlobalPropertyCartesian3` object defining a 3-component numeric
   * property for all features. Details about this property are described
   * in the 3D Tiles specification.
   */
  QUANTIZED_VOLUME_OFFSET?: BinaryBodyOffset | number[];

  /**
   * A `GlobalPropertyCartesian3` object defining a 3-component numeric
   * property for all features. Details about this property are described
   * in the 3D Tiles specification.
   */
  QUANTIZED_VOLUME_SCALE?: BinaryBodyOffset | number[];

  /**
   * A `GlobalPropertyBoolean` object defining a boolean property for all
   * features. Details about this property are described in the 3D Tiles
   * specification.
   */
  EAST_NORTH_UP?: boolean;
}
