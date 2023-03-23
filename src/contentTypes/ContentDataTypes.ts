/**
 * A class defining constants for known content data types.
 *
 * The constants here are the strings that are returned by
 * `ContentDataTypeRegistry.findContentDataType`
 *
 * @internal
 */
export class ContentDataTypes {
  // The constants for the known content data types
  static readonly CONTENT_TYPE_GLB = "CONTENT_TYPE_GLB";
  static readonly CONTENT_TYPE_B3DM = "CONTENT_TYPE_B3DM";
  static readonly CONTENT_TYPE_I3DM = "CONTENT_TYPE_I3DM";
  static readonly CONTENT_TYPE_CMPT = "CONTENT_TYPE_CMPT";
  static readonly CONTENT_TYPE_PNTS = "CONTENT_TYPE_PNTS";
  static readonly CONTENT_TYPE_GEOM = "CONTENT_TYPE_GEOM";
  static readonly CONTENT_TYPE_VCTR = "CONTENT_TYPE_VCTR";
  static readonly CONTENT_TYPE_SUBT = "CONTENT_TYPE_SUBT";
  static readonly CONTENT_TYPE_PNG = "CONTENT_TYPE_PNG";
  static readonly CONTENT_TYPE_JPEG = "CONTENT_TYPE_JPEG";
  static readonly CONTENT_TYPE_GIF = "CONTENT_TYPE_GIF";

  static readonly CONTENT_TYPE_GEOJSON = "CONTENT_TYPE_GEOJSON";
  static readonly CONTENT_TYPE_3TZ = "CONTENT_TYPE_3TZ";

  // The glTF content data type. This only refers to glTF JSON.
  // For binary glTF, CONTENT_TYPE_GLB has to be used.
  static readonly CONTENT_TYPE_GLTF = "CONTENT_TYPE_GLTF";
  static readonly CONTENT_TYPE_TILESET = "CONTENT_TYPE_TILESET";
}
