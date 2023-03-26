import { RootProperty } from "../structure/RootProperty";
import { Tileset } from "../structure/Tileset";

/**
 * Utility methods for handling extensions
 */
export class Extensions {
  /**
   * Returns whether the given object contains the given extension.
   *
   * That is, whether the `object.extensions` contains a key
   * that is the given extension name.
   *
   * @param rootProperty - The object that may contain the extension
   * @param extension The extension (i.e. its name as a string)
   * @returns Whether the object contains the extension
   */
  static contains(rootProperty: RootProperty, extension: string) {
    if (!rootProperty.extensions) {
      return false;
    }
    return Object.keys(rootProperty.extensions).includes(extension);
  }

  /**
   * Add the given extension to the `extensionsUsed` of the given tileset.
   *
   * The extension will be added if it was not yet contained in the
   * array, creating the array of necessary.
   *
   * @param tileset - The tileset
   * @param extension - The extension name
   */
  static addExtensionUsed(tileset: Tileset, extension: string) {
    tileset.extensionsUsed = Extensions.addUnique(
      tileset.extensionsUsed,
      extension
    );
  }

  /**
   * Remove the given extension from the `extensionsUsed` of the given tileset.
   *
   * The array will be set to `undefined` if it becomes empty, and the
   * extension will also be removed from `extensionsRequired`.
   *
   * @param tileset - The tileset
   * @param extension - The extension name
   */
  static removeExtensionUsed(tileset: Tileset, extension: string) {
    tileset.extensionsUsed = Extensions.removeUnique(
      tileset.extensionsUsed,
      extension
    );
    Extensions.removeExtensionRequired(tileset, extension);
  }

  /**
   * Add the given extension to the `extensionsRequired` of the given tileset.
   *
   * The extension will be added if it was not yet contained in the
   * array, creating the array of necessary. This will also add
   * the extension to `extensionsUsed`.
   *
   * @param tileset - The tileset
   * @param extension - The extension name
   */
  static addExtensionRequired(tileset: Tileset, extension: string) {
    tileset.extensionsRequired = Extensions.addUnique(
      tileset.extensionsRequired,
      extension
    );
    Extensions.addExtensionUsed(tileset, extension);
  }

  /**
   * Remove the given extension to the `extensionsUsed` of the given tileset.
   *
   * The array will be set to `undefined` if it becomes empty.
   *
   * This will *not* remove the extension from the `extensionsUsed`!
   *
   * @param tileset - The tileset
   * @param extension - The extension name
   */
  static removeExtensionRequired(tileset: Tileset, extension: string) {
    tileset.extensionsRequired = Extensions.removeUnique(
      tileset.extensionsRequired,
      extension
    );
  }

  /**
   * Adds the given element to the given array and returns the
   * array, creating a new array if the array was `undefined`.
   *
   * @param array - The array
   * @param element - The element
   * @returns The new array
   */
  private static addUnique<T>(array: T[] | undefined, element: T): T[] {
    if (!array) {
      array = [];
    }
    if (!array.includes(element)) {
      array.push(element);
    }
    return array;
  }

  /**
   * Remove the given element from the given array and returns the
   * array. If the array becomes empty, this method returns `undefined`.
   *
   * @param array - The array
   * @param element - The element
   * @returns The new array
   */
  private static removeUnique<T>(
    array: T[] | undefined,
    element: T
  ): T[] | undefined {
    if (!array) {
      return undefined;
    }
    const index = array.indexOf(element);
    if (index !== -1) {
      array.splice(index, 1);
    }
    if (array.length === 0) {
      return undefined;
    }
    return array;
  }
}
