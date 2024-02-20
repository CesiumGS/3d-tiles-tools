import { ContentData } from "./ContentData";
import { ContentDataTypes } from "./ContentDataTypes";
import { ContentDataTypeEntry } from "./ContentDataTypeEntry";
import { defined } from "../base/defined";
import { DeveloperError } from "../base/DeveloperError";
import { BufferedContentData } from "./BufferedContentData";

/**
 * A class for determining the type of data that a URI points to.
 *
 * The only public methods (for now) are `findType`, which
 * determines the type of data that is given as a URI and
 * a buffer, and `findContentDataType`, which returns the
 * string that describes the type of a `ContentData` object.
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
    // registered. This allows to quickly detect the types that can
    // be determined by the file extension alone, or by the magic
    // bytes (without loading the whole data and trying to parse it
    // into JSON).
    // In the future, there might be a mechanism for 'overriding' a
    // previously registered type.
    ContentDataTypeRegistry.register(
      ContentDataTypeRegistry.byMagicString("glTF"),
      ContentDataTypes.CONTENT_TYPE_GLB
    );

    ContentDataTypeRegistry.register(
      ContentDataTypeRegistry.byMagicString("b3dm"),
      ContentDataTypes.CONTENT_TYPE_B3DM
    );

    ContentDataTypeRegistry.register(
      ContentDataTypeRegistry.byMagicString("i3dm"),
      ContentDataTypes.CONTENT_TYPE_I3DM
    );

    ContentDataTypeRegistry.register(
      ContentDataTypeRegistry.byMagicString("cmpt"),
      ContentDataTypes.CONTENT_TYPE_CMPT
    );

    ContentDataTypeRegistry.register(
      ContentDataTypeRegistry.byMagicString("pnts"),
      ContentDataTypes.CONTENT_TYPE_PNTS
    );

    ContentDataTypeRegistry.register(
      ContentDataTypeRegistry.byMagicString("geom"),
      ContentDataTypes.CONTENT_TYPE_GEOM
    );

    ContentDataTypeRegistry.register(
      ContentDataTypeRegistry.byMagicString("vctr"),
      ContentDataTypes.CONTENT_TYPE_VCTR
    );

    ContentDataTypeRegistry.register(
      ContentDataTypeRegistry.byMagicString("subt"),
      ContentDataTypes.CONTENT_TYPE_SUBT
    );

    const pngMagicHeader = [0x89, 0x50, 0x4e, 0x47];
    ContentDataTypeRegistry.register(
      ContentDataTypeRegistry.byMagicBytes(pngMagicHeader),
      ContentDataTypes.CONTENT_TYPE_PNG
    );

    const jpegMagicHeader = [0xff, 0xd8, 0xff];
    ContentDataTypeRegistry.register(
      ContentDataTypeRegistry.byMagicBytes(jpegMagicHeader),
      ContentDataTypes.CONTENT_TYPE_JPEG
    );

    ContentDataTypeRegistry.register(
      ContentDataTypeRegistry.byMagicString("GIF8"),
      ContentDataTypes.CONTENT_TYPE_GIF
    );

    ContentDataTypeRegistry.register(
      ContentDataTypeRegistry.byExtension(".geojson"),
      ContentDataTypes.CONTENT_TYPE_GEOJSON
    );

    ContentDataTypeRegistry.register(
      ContentDataTypeRegistry.byExtension(".3tz"),
      ContentDataTypes.CONTENT_TYPE_3TZ
    );

    ContentDataTypeRegistry.register(
      ContentDataTypeRegistry.byBeingTileset(),
      ContentDataTypes.CONTENT_TYPE_TILESET
    );
    ContentDataTypeRegistry.register(
      ContentDataTypeRegistry.byBeingGltf(),
      ContentDataTypes.CONTENT_TYPE_GLTF
    );

    ContentDataTypeRegistry._registeredDefaults = true;
  }

  /**
   * Tries to find the string that describes the type of the given data.
   * If the type of the data cannot be determined, then `undefined` is
   * returned.
   *
   * This is a convenience method for `findContentDataType`, for the
   * case that the data is already fully available as a buffer. If
   * the data should be fetched lazily, then `findContentDataType`
   * should be called with a `LazyContentData` object.
   *
   * @param uri - The URI of the data
   * @param data - the actual data
   * @returns The string, or `undefined`
   */
  static async findType(
    uri: string,
    data: Buffer
  ): Promise<string | undefined> {
    const contentData = new BufferedContentData(uri, data);
    const contentDataType = await this.findContentDataType(contentData);
    return contentDataType;
  }

  /**
   * Tries to find the string that describes the given content data
   * type. If the type of the content data cannot be determined,
   * then `undefined` is returned.
   *
   * The exact criteria for determining the data type are not specified.
   * It may, for example, be determined solely by a file extension of
   * the URI of the given content data, or by magic bytes in the data,
   * or by any other criterion.
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

  /**
   * Creates a predicate that checks whether the magic header of
   * a ContentData (interpreted as ASCII characters) starts with
   * the given magic header string.
   *
   * @param magic - The magic header string
   * @returns The predicate
   */
  private static byMagicString(
    magic: string
  ): (contentData: ContentData) => Promise<boolean> {
    const predicate = async (contentData: ContentData) => {
      const contentMagic = await contentData.getMagic();
      const contentMagicString = contentMagic.toString("ascii");
      return contentMagicString.startsWith(magic);
    };
    return predicate;
  }

  /**
   * Creates a predicate that checks whether the magic header of
   * a ContentData starts with the given bytes
   *
   * @param magic - The magic bytes
   * @returns The predicate
   */
  private static byMagicBytes(
    magic: number[]
  ): (contentData: ContentData) => Promise<boolean> {
    const predicate = async (contentData: ContentData) => {
      const contentMagic = await contentData.getMagic();
      for (let i = 0; i < magic.length; i++) {
        if (contentMagic[i] != magic[i]) {
          return false;
        }
      }
      return true;
    };
    return predicate;
  }

  /**
   * Creates a predicate that checks whether the extension of
   * a ContentData matches the given extension (which should
   * include the '.' dot).
   *
   * @param extension - The extension
   * @returns The predicate
   */
  private static byExtension(
    extension: string
  ): (contentData: ContentData) => Promise<boolean> {
    const predicate = async (contentData: ContentData) =>
      contentData.extension === extension.toLowerCase();
    return predicate;
  }

  /**
   * Creates a predicate that says whether a ContentData is
   * (probably) a tileset.
   *
   * @returns The predicate
   */
  private static byBeingTileset(): (
    contentData: ContentData
  ) => Promise<boolean> {
    const predicate = async (contentData: ContentData) =>
      await ContentDataTypeRegistry.isProbablyTileset(contentData);
    return predicate;
  }

  /**
   * Creates a predicate that says whether a ContentData is
   * (probably) a glTF JSON.
   *
   * @returns The predicate
   */
  private static byBeingGltf(): (contentData: ContentData) => Promise<boolean> {
    const predicate = async (contentData: ContentData) =>
      await ContentDataTypeRegistry.isProbablyGltf(contentData);
    return predicate;
  }

  /**
   * Returns whether the given content data is probably a tileset.
   *
   * The exact conditions for this method returning `true` are
   * intentionally not specified.
   *
   * @param contentData - The content data
   * @returns Whether the content data is probably a tileset
   */
  private static async isProbablyTileset(
    contentData: ContentData
  ): Promise<boolean> {
    const parsedObject = await contentData.getParsedObject();
    if (!parsedObject) {
      return false;
    }
    if (!parsedObject.asset) {
      return false;
    }
    if (defined(parsedObject.geometricError) || parsedObject.root) {
      return true;
    }
    return false;
  }

  /**
   * Returns whether the given content data is probably a glTF
   * (not a GLB, but a glTF JSON).
   *
   * The exact conditions for this method returning `true` are
   * intentionally not specified.
   *
   * @param contentData - The content data
   * @returns Whether the content data is probably glTF
   */
  private static async isProbablyGltf(
    contentData: ContentData
  ): Promise<boolean> {
    if (await ContentDataTypeRegistry.isProbablyTileset(contentData)) {
      return false;
    }
    const parsedObject = await contentData.getParsedObject();
    if (!parsedObject) {
      return false;
    }
    if (!parsedObject.asset) {
      return false;
    }
    return true;
  }

  /**
   * Registers a type name for `ContentData` that matches the given predicate.
   *
   * @param predicate - The predicate
   * @param type - The type
   * @throws DeveloperError If the given type was already registered
   */
  private static register(
    predicate: (contentData: ContentData) => Promise<boolean>,
    type: string
  ) {
    for (const entry of ContentDataTypeRegistry.entries) {
      if (entry.type === type) {
        throw new DeveloperError(
          `Content data type ${type} was already registered`
        );
      }
    }
    const entry: ContentDataTypeEntry = {
      predicate: predicate,
      type: type,
    };
    ContentDataTypeRegistry.entries.push(entry);
  }
}
