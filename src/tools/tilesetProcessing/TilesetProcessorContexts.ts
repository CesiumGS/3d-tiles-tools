import path from "path";

import { TilesetSource } from "../../tilesets";
import { TilesetTarget } from "../../tilesets";
import { TilesetSources } from "../../tilesets";
import { TilesetTargets } from "../../tilesets";

import { Tileset } from "../../structure";

import { TilesetProcessing } from "./TilesetProcessing";
import { TilesetProcessorContext } from "./TilesetProcessorContext";

/**
 * A class summarizing the data that a `TilesetProcessor` is operating on.
 *
 * This is initialized during the `TilesetProcessor.begin` or `beginData`
 * call, if all the source- and target information could be resolved,
 * and is supposed to represent a consistent, properly initialized
 * state to work on.
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
   * @returns A promise that resolves when this the context
   * has been created
   * @throws TilesetError When the input could not be opened,
   * or when the output already exists and `overwrite` was `false`.
   */
  static async create(
    tilesetSourceName: string,
    tilesetTargetName: string,
    overwrite: boolean
  ): Promise<TilesetProcessorContext> {
    let tilesetSource: TilesetSource | undefined;
    let tilesetTarget: TilesetTarget | undefined;
    try {
      tilesetSource = TilesetSources.createFromName(tilesetSourceName);
      tilesetTarget = TilesetTargets.createFromName(tilesetTargetName);

      const tilesetSourceJsonFileName =
        TilesetProcessorContexts.determineTilesetJsonFileName(
          tilesetSourceName
        );

      const tilesetTargetJsonFileName =
        TilesetProcessorContexts.determineTilesetJsonFileName(
          tilesetTargetName
        );

      // Open the source and the target
      await tilesetSource.open(tilesetSourceName);
      await tilesetTarget.begin(tilesetTargetName, overwrite);

      return TilesetProcessorContexts.createFromData(
        tilesetSource,
        tilesetSourceJsonFileName,
        tilesetTarget,
        tilesetTargetJsonFileName
      );
    } catch (error) {
      if (tilesetSource) {
        try {
          await tilesetSource.close();
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
   * Creates a `TilesetProcessorContext` for the given source- and
   * target name.
   *
   * This assumes that the given source has already been opened
   * by calling `open`, and the given target has already been
   * initialized by calling `begin`.
   *
   * @param tilesetSourceName - The tileset source name
   * @param tilesetSourceJsonFileName - The name of the top-level
   * tileset JSON file in the source
   * @param tilesetTargetName - The tileset target name
   * @param tilesetTargetJsonFileName - The name of the top-level
   * tileset JSON file in the target
   * @returns A promise that resolves when this the context
   * has been created
   * @throws TilesetError When the required input data could not
   * be obtained from the given source
   */
  static async createFromData(
    tilesetSource: TilesetSource,
    tilesetSourceJsonFileName: string,
    tilesetTarget: TilesetTarget,
    tilesetTargetJsonFileName: string
  ): Promise<TilesetProcessorContext> {
    const context = await TilesetProcessorContexts.createInstance(
      tilesetSource,
      tilesetSourceJsonFileName,
      tilesetTarget,
      tilesetTargetJsonFileName
    );
    return context;
  }

  /**
   * A low-level method to create an instance of a tileset processor context.
   *
   * Clients will usually just call the `create` method, which creates the
   * source- and target instances and determines the tileset JSON file
   * names based on the input- and output name.
   *
   * This method will resolve the input tileset JSON and its
   * schema based on the given tileset source JSON file name.
   *
   * @param tilesetSource - The `TilesetSource` instance
   * @param tilesetSourceJsonFileName - The name of the file in the
   * given source that contains the main tileset JSON
   * @param tilesetTarget The `TilesetTarget` instance
   * @param tilesetTargetJsonFileName - The name that the main tileset
   * JSON file should have in the target
   * @returns A promise that resolves when this the context
   * has been created
   * @throws TilesetError If the source or target cannot be
   * accessed, or a required input file (like the tileset JSON
   * or its schema) cannot be resolved in the source
   */
  static async createInstance(
    tilesetSource: TilesetSource,
    tilesetSourceJsonFileName: string,
    tilesetTarget: TilesetTarget,
    tilesetTargetJsonFileName: string
  ): Promise<TilesetProcessorContext> {
    // Obtain the tileset object from the tileset JSON file
    const sourceTileset = await TilesetSources.parseSourceValue<Tileset>(
      tilesetSource,
      tilesetSourceJsonFileName
    );

    // Resolve the schema, either from the `tileset.schema`
    // or the `tileset.schemaUri`
    const schema = await TilesetProcessing.resolveSchema(
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
      await context.tilesetSource.close();
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
