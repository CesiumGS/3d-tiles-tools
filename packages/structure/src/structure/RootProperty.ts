/**
 * A basis for storing extensions and extras.
 * @internal
 */
export interface RootProperty {
  /**
   */
  extensions?: { [key: string]: { [key: string]: any } };

  /**
   */
  extras?: { [key: string]: any };
}
