import { Schema } from "../../structure";
import { Tileset } from "../../structure";

import { TilesetSource } from "../../tilesets";
import { TilesetTarget } from "../../tilesets";

/**
 * A class summarizing the data that a `TilesetProcessor` is operating on.
 *
 * This is initialized during the `TilesetProcessor.begin` call, if all
 * the source- and target information could be resolved, and is supposed
 * to represent a consistent, properly initialized state to work on.
 *
 * @internal
 */
export interface TilesetProcessorContext {
  /**
   * The tileset source for the input
   */
  tilesetSource: TilesetSource;

  /**
   * The name of the file that contains the tileset JSON
   * data in the source (usually `tileset.json`)
   */
  tilesetSourceJsonFileName: string;

  /**
   * The tileset that was parsed from the input
   */
  sourceTileset: Tileset;

  /**
   * The optional metadata schema associated with the tileset
   */
  schema: Schema | undefined;

  /**
   * The tileset target for the output.
   */
  tilesetTarget: TilesetTarget;

  /**
   * The name of the file that contains the tileset JSON
   * data in the target (usually `tileset.json`)
   */
  tilesetTargetJsonFileName: string;

  /**
   * The tileset that should be written into the tileset JSON
   * file of the target. This might be identical to the
   * `sourceTileset`.
   */
  targetTileset: Tileset;

  /**
   * The set of keys (file names) that have already been processed.
   *
   * This includes the original keys, as well as new keys that
   * have been assigned to entries while they have been processed.
   */
  processedKeys: { [key: string]: boolean };

  /**
   * A mapping from source keys (file names) to the target names
   * that they received during processing.
   */
  targetKeys: { [key: string]: string };
}
