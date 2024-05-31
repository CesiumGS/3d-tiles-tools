import { ContentDataTypeRegistry } from "./ContentDataTypeRegistry";
import { ContentDataTypes } from "./ContentDataTypes";

/**
 * Methods related to file extensions for the content data types
 * that are defined in `ContentDataTypes`
 */
export class FileExtensions {
  /**
   * A dictionary of the content data types to the default
   * file extensions (without dot)
   */
  private static readonly knownFileExtensionsWithoutDot = {
    [ContentDataTypes.CONTENT_TYPE_GLB]: "glb",
    [ContentDataTypes.CONTENT_TYPE_B3DM]: "b3dm",
    [ContentDataTypes.CONTENT_TYPE_I3DM]: "i3dm",
    [ContentDataTypes.CONTENT_TYPE_CMPT]: "cmpt",
    [ContentDataTypes.CONTENT_TYPE_PNTS]: "pnts",
    [ContentDataTypes.CONTENT_TYPE_GEOM]: "geom",
    [ContentDataTypes.CONTENT_TYPE_VCTR]: "vctr",
    [ContentDataTypes.CONTENT_TYPE_SUBT]: "subt",
    [ContentDataTypes.CONTENT_TYPE_PNG]: "png",
    [ContentDataTypes.CONTENT_TYPE_JPEG]: "jpg",
    [ContentDataTypes.CONTENT_TYPE_GIF]: "gif",
    [ContentDataTypes.CONTENT_TYPE_GEOJSON]: "geojson",
    [ContentDataTypes.CONTENT_TYPE_3TZ]: "3tz",
    [ContentDataTypes.CONTENT_TYPE_GLTF]: "gltf",
    [ContentDataTypes.CONTENT_TYPE_TILESET]: "json",
  };

  /**
   * Returns the default extension (without dot) for files with the given
   * content data type. If the given content data type is undefined or
   * not known, then an empty string will be returned.
   *
   * @param type - The `ContentDataType`
   * @returns The file extension
   */
  static getDefaultFileExtension(type: string | undefined): string {
    if (type === undefined) {
      return "";
    }
    const result = FileExtensions.knownFileExtensionsWithoutDot[type];
    if (result === undefined) {
      return "";
    }
    return result;
  }

  /**
   * Returns the default extension (without dot) for the given file
   * data, depending on its content type. If the content data type
   * cannot be determined or is not known, then an empty string will
   * be returned.
   *
   * @param data - The file data
   * @returns A promise to the file extension
   */
  static async determineFileExtension(data: Buffer): Promise<string> {
    const type = await ContentDataTypeRegistry.findType("", data);
    return FileExtensions.getDefaultFileExtension(type);
  }
}
