/**
 * One entry of a ZIP index, as it is found in the `"@3dtilesIndex1@"` file
 * according to the 3TZ specification.
 *
 * @internal
 */
export interface IndexEntry {
  /**
   * The hash of the entry. This is the MD5 hash of the 'file path',
   * as of the 3TZ specification.
   */
  hash: Buffer;

  /**
   * The Local File Offset of the entry, as of the 3TZ
   * specification.
   */
  offset: bigint;
}
