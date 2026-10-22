import { GlTFChildOfRootProperty } from "./GlTFChildOfRootProperty";
import { GlTFid } from "./GlTFid";

/**
 * Image data used to create a texture. Image **MAY** be referenced by an
 * URI (or IRI) or a buffer view index.
 * @internal
 */
export interface Image extends GlTFChildOfRootProperty {
  /**
   * The URI (or IRI) of the image.
   */
  uri?: string;

  /**
   * The image's media type. This field **MUST** be defined when
   * `bufferView` is defined.
   */
  mimeType?: string;

  /**
   * The index of the bufferView that contains the image. This field **MUST
   * NOT** be defined when `uri` is defined.
   */
  bufferView?: GlTFid;
}
