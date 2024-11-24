import { Tileset } from "../../structure";
import { Schema } from "../../structure";

import { TilesetSources } from "../../tilesets";
import { TilesetSource } from "../../tilesets";

/**
 * Internal utility methods for the tileset processing
 *
 * @internal
 */
export class TilesetProcessing {
  /**
   * Resolve the `Schema` for the given tileset.
   *
   * This is either the `tileset.schema`, or the schema that is
   * obtained from the `tileset.schemaUri`, or `undefined` if
   * neither of them are present.
   *
   * @param tilesetSource - The `TilesetSource`
   * @param tileset - The tileset
   * @returns The `Schema`, or `undefined` if there is none
   * @throws DeveloperError If the source is not opened
   * @throws TilesetError If the schema from the `schemaUri`
   * could not be resolved or parsed.
   */
  static async resolveSchema(
    tilesetSource: TilesetSource,
    tileset: Tileset
  ): Promise<Schema | undefined> {
    if (tileset.schema) {
      return tileset.schema;
    }
    if (tileset.schemaUri) {
      const schema = await TilesetSources.parseSourceValue<Schema>(
        tilesetSource,
        tileset.schemaUri
      );
      return schema;
    }
    return undefined;
  }
}
