import { defined } from "../base/defined";
import { ContentData } from "./ContentData";

/**
 * A class for managing the set of known content data types.
 *
 * It offers a set of constants that characterize the content
 * data type (i.e. they are predicates that match when the
 * content data has the respective type).
 *
 * These are used for registering the corresponding types
 *
 * in the `ContentDataTypeRegistry` class, and for determining
 * a name (string) that describes the content type.
 *
 * @internal
 */
export class ContentDataTypes {
  // The constants for the known content data types
  static readonly CONTENT_TYPE_GLB = ContentDataTypes.byMagic("glTF");
  static readonly CONTENT_TYPE_B3DM = ContentDataTypes.byMagic("b3dm");
  static readonly CONTENT_TYPE_I3DM = ContentDataTypes.byMagic("i3dm");
  static readonly CONTENT_TYPE_CMPT = ContentDataTypes.byMagic("cmpt");
  static readonly CONTENT_TYPE_PNTS = ContentDataTypes.byMagic("pnts");
  static readonly CONTENT_TYPE_GEOM = ContentDataTypes.byMagic("geom");
  static readonly CONTENT_TYPE_VCTR = ContentDataTypes.byMagic("vctr");

  static readonly CONTENT_TYPE_GEOJSON =
    ContentDataTypes.byExtension(".geojson");
  static readonly CONTENT_TYPE_3TZ = ContentDataTypes.byExtension(".3tz");

  static readonly CONTENT_TYPE_GLTF = ContentDataTypes.byBeingGltf();
  static readonly CONTENT_TYPE_TILESET = ContentDataTypes.byBeingTileset();

  /**
   * Creates a predicate that checks whether the magic header of
   * a ContentData matches the given magic header string.
   *
   * @param magic - The magic header string
   * @returns The predicate
   */
  private static byMagic(
    magic: string
  ): (contentData: ContentData) => Promise<boolean> {
    const predicate = async (contentData: ContentData) =>
      (await contentData.getMagic()) === magic;
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
  private static byBeingTileset() {
    const predicate = async (contentData: ContentData) =>
      await ContentDataTypes.isProbablyTileset(contentData);
    return predicate;
  }

  /**
   * Creates a predicate that says whether a ContentData is
   * (probably) a glTF JSON.
   *
   * @returns The predicate
   */
  private static byBeingGltf() {
    const predicate = async (contentData: ContentData) =>
      await ContentDataTypes.isProbablyGltf(contentData);
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
  static async isProbablyTileset(contentData: ContentData): Promise<boolean> {
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
  static async isProbablyGltf(contentData: ContentData): Promise<boolean> {
    if (await ContentDataTypes.isProbablyTileset(contentData)) {
      return false;
    }
    const parsedObject = await contentData.getParsedObject();
    if (!defined(parsedObject)) {
      return false;
    }
    if (!defined(parsedObject.asset)) {
      return false;
    }
    return true;
  }
}
