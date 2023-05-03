import { FeatureTable } from "./FeatureTable";
import { BinaryBodyReference } from "./BinaryBodyReference";

/**
 * A set of Point Cloud semantics that contains values defining the
 * position and appearance properties for points in a tile.
 * @internal
 */
export interface PntsFeatureTable extends FeatureTable {
  /**
   * A `BinaryBodyReference` object defining the reference to a section of
   * the binary body where the property values are stored. Details about
   * this property are described in the 3D Tiles specification.
   */
  POSITION?: BinaryBodyReference;

  /**
   * A `BinaryBodyReference` object defining the reference to a section of
   * the binary body where the property values are stored. Details about
   * this property are described in the 3D Tiles specification.
   */
  POSITION_QUANTIZED?: BinaryBodyReference;

  /**
   * A `BinaryBodyReference` object defining the reference to a section of
   * the binary body where the property values are stored. Details about
   * this property are described in the 3D Tiles specification.
   */
  RGBA?: BinaryBodyReference;

  /**
   * A `BinaryBodyReference` object defining the reference to a section of
   * the binary body where the property values are stored. Details about
   * this property are described in the 3D Tiles specification.
   */
  RGB?: BinaryBodyReference;

  /**
   * A `BinaryBodyReference` object defining the reference to a section of
   * the binary body where the property values are stored. Details about
   * this property are described in the 3D Tiles specification.
   */
  RGB565?: BinaryBodyReference;

  /**
   * A `BinaryBodyReference` object defining the reference to a section of
   * the binary body where the property values are stored. Details about
   * this property are described in the 3D Tiles specification.
   */
  NORMAL?: BinaryBodyReference;

  /**
   * A `BinaryBodyReference` object defining the reference to a section of
   * the binary body where the property values are stored. Details about
   * this property are described in the 3D Tiles specification.
   */
  NORMAL_OCT16P?: BinaryBodyReference;

  /**
   * A `BinaryBodyReference` object defining the reference to a section of
   * the binary body where the property values are stored. Details about
   * this property are described in the 3D Tiles specification.
   */
  BATCH_ID?: BinaryBodyReference;

  /**
   * A `GlobalPropertyInteger` object defining an integer property for all
   * points. Details about this property are described in the 3D Tiles
   * specification.
   */
  POINTS_LENGTH: number;

  /**
   * A `GlobalPropertyCartesian3` object defining a 3-component numeric
   * property for all points. Details about this property are described in
   * the 3D Tiles specification.
   */
  RTC_CENTER?: BinaryBodyOffset | number[];

  /**
   * A `GlobalPropertyCartesian3` object defining a 3-component numeric
   * property for all points. Details about this property are described in
   * the 3D Tiles specification.
   */
  QUANTIZED_VOLUME_OFFSET?: BinaryBodyOffset | number[];

  /**
   * A `GlobalPropertyCartesian3` object defining a 3-component numeric
   * property for all points. Details about this property are described in
   * the 3D Tiles specification.
   */
  QUANTIZED_VOLUME_SCALE?: BinaryBodyOffset | number[];

  /**
   * A `GlobalPropertyCartesian4` object defining a 4-component numeric
   * property for all points. Details about this property are described in
   * the 3D Tiles specification.
   */
  CONSTANT_RGBA?: BinaryBodyOffset | number[];

  /**
   * A `GlobalPropertyInteger` object defining an integer property for all
   * points. Details about this property are described in the 3D Tiles
   * specification.
   */
  BATCH_LENGTH?: number;
}
