/**
 * An interface that describes the availability information
 * in a subtree. This is used for tile, content, and child
 * subtree availability.
 *
 * @internal
 */
export interface AvailabilityInfo {
  /**
   * Returns the length of the availability information.
   *
   * @returns The length
   */
  get length(): number;

  /**
   * Returns whether the element at the specified index is
   * available.
   *
   * @param index - The index
   * @throws RangeError If the index is negative or not smaller
   * than the length.
   */
  isAvailable(index: number): boolean;
}
