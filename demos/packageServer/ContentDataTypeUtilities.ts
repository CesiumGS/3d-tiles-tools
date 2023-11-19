import { ContentDataTypes } from "../../src/contentTypes/ContentDataTypes";
import { ContentDataTypeRegistry } from "../../src/contentTypes/ContentDataTypeRegistry";
import { TilesetError } from "../../src/tilesetData/TilesetError";
import { Paths } from "../../src/base/Paths";

/**
 * Utility methods for determining default file extensions and MIME
 * types for a `ContentDataType`.
 *
 * These are only used in the package server demo. The functionality
 * could later become part of the `contentTypes` package, maybe as
 * part of the `ContentDataTypeRegistry`.
 *
 * @internal
 */
export class ContentDataTypeUtilities {
  /**
   * A mapping from `ContentDataType` strings to "default" file
   * extensions (without the `.` dot)
   */
  private static extensions: { [key: string]: string };

  /**
   * A mapping from `ContentDataType` strings to MIME types
   */
  private static mimeTypes: { [key: string]: string };

  /**
   * Initialize the `extensions` dictionary if it was not
   * initialized yet.
   */
  private static initializeExtensions() {
    if (ContentDataTypeUtilities.extensions !== undefined) {
      return;
    }
    const d: { [key: string]: string } = {};
    d[ContentDataTypes.CONTENT_TYPE_GLB] = "glb";
    d[ContentDataTypes.CONTENT_TYPE_B3DM] = "b3dm";
    d[ContentDataTypes.CONTENT_TYPE_I3DM] = "i3dm";
    d[ContentDataTypes.CONTENT_TYPE_CMPT] = "cmpt";
    d[ContentDataTypes.CONTENT_TYPE_PNTS] = "pnts";
    d[ContentDataTypes.CONTENT_TYPE_GEOM] = "geom";
    d[ContentDataTypes.CONTENT_TYPE_VCTR] = "vctr";
    d[ContentDataTypes.CONTENT_TYPE_SUBT] = "subtree";
    d[ContentDataTypes.CONTENT_TYPE_PNG] = "png";
    d[ContentDataTypes.CONTENT_TYPE_JPEG] = "jpg";
    d[ContentDataTypes.CONTENT_TYPE_GIF] = "gif";
    d[ContentDataTypes.CONTENT_TYPE_GEOJSON] = "geojson";
    d[ContentDataTypes.CONTENT_TYPE_3TZ] = "3tz";
    d[ContentDataTypes.CONTENT_TYPE_GLTF] = "gltf";
    d[ContentDataTypes.CONTENT_TYPE_TILESET] = "json";
    ContentDataTypeUtilities.extensions = d;
  }

  /**
   * Initialize the `mimeTypes` dictionary if it was not
   * initialized yet.
   */
  private static initializeMimeTypes() {
    if (ContentDataTypeUtilities.mimeTypes !== undefined) {
      return;
    }
    const d: { [key: string]: string } = {};
    d[ContentDataTypes.CONTENT_TYPE_GLB] = "model/gltf-binary";
    d[ContentDataTypes.CONTENT_TYPE_B3DM] = "application/octet-stream";
    d[ContentDataTypes.CONTENT_TYPE_I3DM] = "application/octet-stream";
    d[ContentDataTypes.CONTENT_TYPE_CMPT] = "application/octet-stream";
    d[ContentDataTypes.CONTENT_TYPE_PNTS] = "application/octet-stream";
    d[ContentDataTypes.CONTENT_TYPE_GEOM] = "text/plain"; // ???
    d[ContentDataTypes.CONTENT_TYPE_VCTR] = "application/json"; // ???
    d[ContentDataTypes.CONTENT_TYPE_SUBT] = "application/octet-stream";
    d[ContentDataTypes.CONTENT_TYPE_PNG] = "image/png";
    d[ContentDataTypes.CONTENT_TYPE_JPEG] = "image/jpeg";
    d[ContentDataTypes.CONTENT_TYPE_GIF] = "image/gif";
    d[ContentDataTypes.CONTENT_TYPE_GEOJSON] = "application/json"; // ???
    d[ContentDataTypes.CONTENT_TYPE_3TZ] = "application/octet-stream"; // ???
    d[ContentDataTypes.CONTENT_TYPE_GLTF] = "model/gltf+json";
    d[ContentDataTypes.CONTENT_TYPE_TILESET] = "application/json";
    ContentDataTypeUtilities.mimeTypes = d;
  }

  /**
   * Returns the "default" file extension (without `.` dot) for the
   * given content data type, or `undefined` if the given type is
   * `undefined` or not known.
   *
   * @param contentDataType The `ContentDataType` string
   * @returns The file extension, without `.` dot
   */
  static getFileExtension(
    contentDataType: string | undefined
  ): string | undefined {
    if (contentDataType === undefined) {
      return undefined;
    }
    ContentDataTypeUtilities.initializeExtensions();
    return ContentDataTypeUtilities.extensions[contentDataType];
  }

  /**
   * Returns the MIME type for the given content data type, or
   * `undefined` if the given type is `undefined` or not known.
   *
   * @param contentDataType The `ContentDataType` string
   * @returns The file extension, without `.` dot
   */
  static getMimeType(contentDataType: string | undefined): string | undefined {
    if (contentDataType === undefined) {
      return undefined;
    }
    ContentDataTypeUtilities.initializeMimeTypes();
    return ContentDataTypeUtilities.mimeTypes[contentDataType];
  }
}
