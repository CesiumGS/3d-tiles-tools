/**
 * glTF Property
 *
 * @internal
 */
export interface GlTFProperty {
  /**
   * The extensions of this property
   */
  extensions?: { [key: string]: { [key: string]: any } };

  /**
   * The extras of this property
   */
  extras?: { [key: string]: any };
}
