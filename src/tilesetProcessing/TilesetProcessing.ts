import { Buffers } from "../base/Buffers";

import { Tileset } from "../structure/Tileset";
import { Schema } from "../structure/Metadata/Schema";

import { TilesetError } from "../tilesetData/TilesetError";

import { TilesetSource } from "../tilesetData/TilesetSource";
import { TilesetTarget } from "../tilesetData/TilesetTarget";

/**
 * Internal utility methods for the tileset processing
 */
export class TilesetProcessing {
  /**
   * Convert the given object into a JSON string, put it into a buffer,
   * zip it (based on the `doZip` flag), and put the result into the
   * tileset target.
   *
   * This is only intended for the "legacy" handling of the tileset
   * JSON data, and is the counterpart of `parseSourceValue`. See
   * `parseSourceValue` for details.
   *
   * @param tilesetTarget - The `TilesetTarget`
   * @param key - The key (file name)
   * @param doZip - Whether the output should be zipped
   * @param object - The object for which the JSON should be stored
   * @throws DeveloperError When the target is not opened
   */
  static storeTargetValue(
    tilesetTarget: TilesetTarget,
    key: string,
    doZip: boolean,
    object: object
  ) {
    const jsonString = JSON.stringify(object, null, 2);
    let jsonBuffer = Buffer.from(jsonString);
    if (doZip) {
      jsonBuffer = Buffers.gzip(jsonBuffer);
    }
    tilesetTarget.addEntry(key, jsonBuffer);
  }

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
      const parsedSchema = TilesetProcessing.parseSourceValue<Schema>(
        tilesetSource,
        tileset.schemaUri
      );
      return parsedSchema.result;
    }
    return undefined;
  }

  /**
   * Parses the JSON from the value with the given key (file name),
   * and returns the parsed result, AND information of whether the
   * input was zipped.
   *
   * This is mainly a convenience function to emulate the behavior of the
   * "legacy" tools in terms of handling the tileset JSON: When writing
   * the tileset JSON data to the target, then it should zip that JSON
   * data if and only if it was zipped in the input.
   *
   * See `storeTargetValue` for the counterpart of this method.
   *
   * In the future, there might be mechanisms for a more fine-grained
   * control over whether certain files should be zipped or not...
   *
   * @param tilesetSource - The `TilesetSource`
   * @param key - The key (file name)
   * @returns A structure containing the `wasZipped` information, and
   * the parsed result
   * @throws TilesetError If the source is not opened, the specified
   * entry cannot be found, or the entry data could not be unzipped,
   * or its contents could not be parsed as JSON.
   */
  static parseSourceValue<T>(
    tilesetSource: TilesetSource,
    key: string
  ): { wasZipped: boolean; result: T } {
    let value = TilesetProcessing.getSourceValue(tilesetSource, key);
    let wasZipped = false;
    if (Buffers.isGzipped(value)) {
      wasZipped = true;
      try {
        value = Buffers.gunzip(value);
      } catch (e) {
        const message = `Could not unzip ${key}: ${e}`;
        throw new TilesetError(message);
      }
    }
    try {
      const result = JSON.parse(value.toString()) as T;
      return {
        wasZipped: wasZipped,
        result: result,
      };
    } catch (e) {
      const message = `Could not parse ${key}: ${e}`;
      throw new TilesetError(message);
    }
  }
}
