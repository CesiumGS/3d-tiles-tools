/**
 * A function that can process a single tile content.
 *
 * It receives the tile content data (as a Buffer), along with its
 * type information, and returns the processed tile content.
 * (This may be the same buffer as the input).
 *
 * This is used in the `TileContentProcessing` class, to process
 * tile content without changing the URI/name of that content.
 * (If the URI has to be changed, `TilesetEntryProcessor` has
 * to be used)
 *
 * @param content - The tile content
 * @param type - The type of the tile content, as one of the
 * `ContentDataTypes` strings, or `undefined` if the type
 * could not be determined.
 * @returns The processed tile content
 *
 * @internal
 */
export type TileContentProcessor = (
  content: Buffer,
  type: string | undefined
) => Promise<Buffer>;
