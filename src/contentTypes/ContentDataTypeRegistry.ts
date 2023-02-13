import { ContentData } from "./ContentData";
import { ContentDataTypes } from "./ContentDataTypes";
import { ContentDataTypeEntry } from "./ContentDataTypeEntry";

/**
 * A class for determining the type of data that a URI points to.
 *
 * The only public methods (for now) are `registerDefaults`,
 * which registers all known content data types, and
 * `findContentDataType`, which returns the string that
 * describes the type of a `ContentData` object.
 *
 * @internal
 */
export class ContentDataTypeRegistry {
  /**
   * The list of types that have been registered.
   */
  private static readonly entries: ContentDataTypeEntry[] = [];

  /**
   * Whether the default content data types have already
   * been registered by calling 'registerDefaults'
   *
   * Note: This could be solved with a static initializer block, but the
   * unclear initialization order of the classes would make this brittle
   */
  private static _registeredDefaults = false;

  /**
   * Registers all default content data types
   */
  private static registerDefaults() {
    if (ContentDataTypeRegistry._registeredDefaults) {
      return;
    }

    // The predicates will be checked in the order in which they are
    // registered. In the future, there might be a mechanism for
    // 'overriding' a previously registered types.
    ContentDataTypeRegistry.register(
      ContentDataTypes.CONTENT_TYPE_GLB,
      "CONTENT_TYPE_GLB"
    );

    ContentDataTypeRegistry.register(
      ContentDataTypes.CONTENT_TYPE_B3DM,
      "CONTENT_TYPE_B3DM"
    );

    ContentDataTypeRegistry.register(
      ContentDataTypes.CONTENT_TYPE_I3DM,
      "CONTENT_TYPE_I3DM"
    );

    ContentDataTypeRegistry.register(
      ContentDataTypes.CONTENT_TYPE_CMPT,
      "CONTENT_TYPE_CMPT"
    );

    ContentDataTypeRegistry.register(
      ContentDataTypes.CONTENT_TYPE_PNTS,
      "CONTENT_TYPE_PNTS"
    );

    ContentDataTypeRegistry.register(
      ContentDataTypes.CONTENT_TYPE_GEOM,
      "CONTENT_TYPE_GEOM"
    );
    ContentDataTypeRegistry.register(
      ContentDataTypes.CONTENT_TYPE_VCTR,
      "CONTENT_TYPE_VCTR"
    );
    ContentDataTypeRegistry.register(
      ContentDataTypes.CONTENT_TYPE_GEOJSON,
      "CONTENT_TYPE_GEOJSON"
    );

    ContentDataTypeRegistry.register(
      ContentDataTypes.CONTENT_TYPE_3TZ,
      "CONTENT_TYPE_3TZ"
    );

    ContentDataTypeRegistry.register(
      ContentDataTypes.CONTENT_TYPE_TILESET,
      "CONTENT_TYPE_TILESET"
    );
    ContentDataTypeRegistry.register(
      ContentDataTypes.CONTENT_TYPE_GLTF,
      "CONTENT_TYPE_GLTF"
    );

    ContentDataTypeRegistry._registeredDefaults = true;
  }

  /**
   * Registers a type name for `ContentData` that matches the given predicate.
   *
   * @param predicate - The predicate
   * @param type - The type
   */
  private static register(
    predicate: (contentData: ContentData) => Promise<boolean>,
    type: string
  ) {
    const entry: ContentDataTypeEntry = {
      predicate: predicate,
      type: type,
    };
    ContentDataTypeRegistry.entries.push(entry);
  }

  /**
   * Tries to find the string that describes the given content data
   * type. If the type of the content data cannot be determined,
   * then `undefined` is returned.
   *
   * @param contentData - The `ContentData`
   * @returns The string, or `undefined`
   */
  static async findContentDataType(
    contentData: ContentData
  ): Promise<string | undefined> {
    ContentDataTypeRegistry.registerDefaults();
    for (const entry of ContentDataTypeRegistry.entries) {
      const predicateMatches = await entry.predicate(contentData);
      if (predicateMatches) {
        return entry.type;
      }
    }
    return undefined;
  }
}
