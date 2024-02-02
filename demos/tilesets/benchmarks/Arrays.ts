import seedrandom from "seedrandom";

/**
 * Utility methods related to arrays.
 */
export class Arrays {
  /**
   * Performs a Fisher-Yates shuffle on the given array, in-place,
   * and returns it.
   *
   * @param array The array
   * @param seed The optional random seed
   * @returns The given array
   */
  static shuffle<T>(array: Array<T>, seed?: string): Array<T> {
    const random = seedrandom(seed ?? "0");
    for (let i = array.length - 1; i > 0; i--) {
      const r = random.int32();
      const n = i + 1;
      const j = ((r % n) + n) % n;
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
    return array;
  }
}
