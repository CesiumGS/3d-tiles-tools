/**
 * One entry that has been added to an 'IndexBuilder'.
 *
 * These entries will be converted into 'IndexEntry' objects
 * when the index buffer is built.
 *
 * @internal
 */
export interface IndexBuilderEntry {
  /**
   * The key, which is the 'file path' as of the 3TZ specification
   */
  key: string;

  /**
   * The ZIP Local File Offset, as of the 3TZ specification
   */
  offset: bigint;
}
