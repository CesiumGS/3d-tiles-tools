import { RootProperty } from "./RootProperty";

/**
 * An object describing the availability of a set of elements.
 * @internal
 */
export interface Availability extends RootProperty {
  /**
   * Index of a buffer view that indicates whether each element is
   * available. The bitstream conforms to the boolean array encoding
   * described in the 3D Metadata specification. If an element is available
   * its bit is 1 and if it is unavailable its bit is 0.
   */
  bitstream?: number;

  /**
   * A number indicating how many 1 bits exist in the availability
   * bitstream.
   */
  availableCount?: number;

  /**
   * Integer indicating whether all of the elements are available (1) or
   * all are unavailable (0).
   */
  constant?: number;
}
