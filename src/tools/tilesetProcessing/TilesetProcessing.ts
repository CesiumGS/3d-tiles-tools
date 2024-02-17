import { Buffers } from "../../base";

import { Tileset } from "../../structure";
import { Schema } from "../../structure";

import { TilesetError } from "../../tilesets";
import { TilesetSource } from "../../tilesets";

/**
 * Internal utility methods for the tileset processing
 *
 * @internal
 */
export class TilesetProcessing {
  /**
   * Obtains the value for the given key from the current tileset source,
   * throwing an error if the source is not opened, or when the
   * given key cannot be found.
   *
   * @param tilesetSource - The `TilesetSource`
   * @param key - The key (file name)
   * @returns The value (file contents)
   * @throws DeveloperError When the source is not opened
   * @throws TilesetError When the given key cannot be found
   */
  static getSourceValue(tilesetSource: TilesetSource, key: string): Buffer {
    const buffer = tilesetSource.getValue(key);
    if (!buffer) {
      const message = `No ${key} found in input`;
      throw new TilesetError(message);
    }
    return buffer;
  }

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
  static resolveSchema(
    tilesetSource: TilesetSource,
    tileset: Tileset
  ): Schema | undefined {
    if (tileset.schema) {
      return tileset.schema;
    }
    if (tileset.schemaUri) {
      const schema = TilesetProcessing.parseSourceValue<Schema>(
        tilesetSource,
        tileset.schemaUri
      );
      return schema;
    }
    return undefined;
  }

  /**
   * Parses the JSON from the value with the given key (file name),
   * and returns the parsed result.
   *
   * This handles the case that the input data may be compressed
   * with GZIP, and will uncompress the data if necessary.
   *
   * @param tilesetSource - The `TilesetSource`
   * @param key - The key (file name)
   * @returns The parsed result
   * @throws TilesetError If the source is not opened, the specified
   * entry cannot be found, or the entry data could not be unzipped
   * (if it was zipped), or it could not be parsed as JSON.
   */
  static parseSourceValue<T>(tilesetSource: TilesetSource, key: string): T {
    let value = TilesetProcessing.getSourceValue(tilesetSource, key);
    if (Buffers.isGzipped(value)) {
      try {
        value = Buffers.gunzip(value);
      } catch (e) {
        const message = `Could not unzip ${key}: ${e}`;
        throw new TilesetError(message);
      }
    }
    try {
      const result = JSON.parse(value.toString()) as T;
      return result;
    } catch (e) {
      const message = `Could not parse ${key}: ${e}`;
      throw new TilesetError(message);
    }
  }
}
