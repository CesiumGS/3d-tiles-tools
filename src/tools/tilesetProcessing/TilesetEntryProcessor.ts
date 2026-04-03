import { TilesetEntry } from "../../tilesets";

/**
 * A function that can process one `TilesetEntry` that is part
 * of a tileset dataset.
 *
 * This is used as the type for the functions that process one
 * entry in a `TilesetProcessor`.
 *
 * It receives the source entry, which may represent a content
 * of an (explicit) tile, a content of any (possibly implicit)
 * tile, or just one entry of the tileset source (i.e. a "file"
 * that is not a tile content).
 *
 * It returns the "processed" entry that is supposed to put into
 * the tileset target (which may be `undefined`, causing the
 * corresponding entry to be omitted in the target)
 *
 * @param sourceEntry - The source entry
 * @param type - The type of the entry data (see `ContentDataTypes`),
 * or `undefined` if the type could not be determined.
 * @returns A promise that resolves when the process is finished,
 * containing the resulting entry, or `undefined` if the entry
 * should be omitted in the target.
 * @throws TilesetError When the input could not be processed
 *
 * @internal
 */
export type TilesetEntryProcessor = (
  sourceEntry: TilesetEntry,
  type: string | undefined
) => Promise<TilesetEntry | undefined>;
