/**
 * A single configuration for a tileset data benchmark
 */
export interface BenchmarkConfig {
  /**
   * The number of entries for the tileset
   */
  numEntries: number;

  /**
   * The minimum size of each entry, inclusive
   */
  minSize: number;

  /**
   * The maximum size of each entry, exclusive
   */
  maxSize: number;
}
