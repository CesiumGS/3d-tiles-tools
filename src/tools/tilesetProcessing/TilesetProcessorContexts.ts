import path from "path";

import { TilesetSources } from "../../tilesets";
import { TilesetTargets } from "../../tilesets";

import { Tileset } from "../../structure";

import { TilesetProcessing } from "./TilesetProcessing";
import { TilesetProcessorContext } from "./TilesetProcessorContext";

/**
 * A class summarizing the data that a `TilesetProcessor` is operating on.
 *
 * This is initialized during the `TilesetProcessor.begin` call, if all
 * the source- and target information could be resolved, and is supposed
 * to represent a consistent, properly initialized state to work on.
 *
 * @internal
 */
export class TilesetProcessorContexts {
  /**
   * Creates a `TilesetProcessorContext` for the given source- and
   * target name.
   *
   * This will open the source and target, and collect the required
   * information for creating a valid, consistent
   * `TilesetProcessorContext`.
   *
   * @param tilesetSourceName - The tileset source name
   * @param tilesetTargetName - The tileset target name
   * @param overwrite - Whether the target should be overwritten if
   * it already exists
   * @returns A promise that resolves when this processor has been
   * initialized
   * @throws TilesetError When the input could not be opened,
   * or when the output already exists and `overwrite` was `false`.
   */
  static async create(
    tilesetSourceName: string,
    tilesetTargetName: string,
    overwrite: boolean
  ): Promise<TilesetProcessorContext> {
    let tilesetSource;
    let tilesetTarget;
    try {
      tilesetSource = TilesetSources.createAndOpen(tilesetSourceName);
      tilesetTarget = TilesetTargets.createAndBegin(
        tilesetTargetName,
        overwrite
      );

      const tilesetSourceJsonFileName =
        TilesetProcessorContexts.determineTilesetJsonFileName(
          tilesetSourceName
        );

      const tilesetTargetJsonFileName =
        TilesetProcessorContexts.determineTilesetJsonFileName(
          tilesetTargetName
        );

      // Obtain the tileset object from the tileset JSON file
      const sourceTileset = TilesetProcessing.parseSourceValue<Tileset>(
        tilesetSource,
        tilesetSourceJsonFileName
      );

      // Resolve the schema, either from the `tileset.schema`
      // or the `tileset.schemaUri`
      const schema = TilesetProcessing.resolveSchema(
        tilesetSource,
        sourceTileset
      );

      // If nothing has thrown up to this point, then
      // a `TilesetProcessorContext` with a valid
      // state can be created:
      const context = {
        tilesetSource: tilesetSource,
        tilesetSourceJsonFileName: tilesetSourceJsonFileName,
        sourceTileset: sourceTileset,
        schema: schema,
        tilesetTarget: tilesetTarget,
        tilesetTargetJsonFileName: tilesetTargetJsonFileName,
        targetTileset: sourceTileset,
        processedKeys: {},
        targetKeys: {},
      };
      return context;
    } catch (error) {
      if (tilesetSource) {
        try {
          tilesetSource.close();
        } catch (e) {
          // Error already about to be re-thrown
        }
      }
      if (tilesetTarget) {
        try {
          await tilesetTarget.end();
        } catch (e) {
          // Error already about to be re-thrown
        }
      }
      throw error;
    }
  }

  /**
   * Close the source and the target that are contained in the given
   * context.
   *
   * @param context - The context
   * @throws TilesetError If closing caused an error
   */
  static async close(context: TilesetProcessorContext) {
    try {
      context.tilesetSource.close();
    } catch (error) {
      try {
        await context.tilesetTarget.end();
      } catch (e) {
        // Error already about to be re-thrown
      }
      throw error;
    }
    await context.tilesetTarget.end();
  }

  // Note: This is the same method as in `Tilesets`, but importing the
  // `Tilesets` type will cause a circular dependency.
  // Welcome to the 1990's.

  /**
   * Determine the name of the file that contains the tileset JSON data.
   *
   * If the given name ends with '.json' (case insensitively), then the
   * name is the last path component of the given name.
   *
   * Otherwise (if the given name is a directory, or the name of a file
   * that does not end with '.json' - for example, an archive file
   * that ends with `.3tz` or `.3dtiles`), then the default name
   * 'tileset.json' is returned.
   *
   * @param tilesetDataName - The name of the tileset data
   * @returns The tileset file name
   */
  private static determineTilesetJsonFileName(tilesetDataName: string): string {
    if (tilesetDataName.toLowerCase().endsWith(".json")) {
      return path.basename(tilesetDataName);
    }
    return "tileset.json";
  }
}
