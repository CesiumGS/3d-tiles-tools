/**
 * A type for objects that can contain extensions
 */
type Extended = { extensions?: object };

/**
 * A type for objects that can contain extension declarations
 */
type Extensible = { extensionsUsed?: any; extensionsRequired?: any };

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
   * @param extensible - The object that may contain the extension
   * @param extension The extension (i.e. its name as a string)
   * @returns Whether the object contains the extension
   */
  static contains(extended: Extended, extension: string) {
    if (!extended.extensions) {
      return false;
    }
    return Object.keys(extended.extensions).includes(extension);
  }

  /**
   * Add the given extension to the `extensionsUsed` of the given object.
   *
   * The extension will be added if it was not yet contained in the
   * array, creating the array of necessary.
   *
   * @param extensible - The object
   * @param extension - The extension name
   */
  static addExtensionUsed(extensible: Extensible, extension: string) {
    extensible.extensionsUsed = Extensions.addUnique(
      extensible.extensionsUsed,
      extension
    );
  }

  /**
   * Remove the given extension from the `extensionsUsed` of the given object.
   *
   * The array will be set to `undefined` if it becomes empty, and the
   * extension will also be removed from `extensionsRequired`.
   *
   * @param extensible - The object
   * @param extension - The extension name
   */
  static removeExtensionUsed(extensible: Extensible, extension: string) {
    extensible.extensionsUsed = Extensions.removeUnique(
      extensible.extensionsUsed,
      extension
    );
    Extensions.removeExtensionRequired(extensible, extension);
  }

  /**
   * Add the given extension to the `extensionsRequired` of the given object.
   *
   * The extension will be added if it was not yet contained in the
   * array, creating the array of necessary. This will also add
   * the extension to `extensionsUsed`.
   *
   * @param extensible - The object
   * @param extension - The extension name
   */
  static addExtensionRequired(extensible: Extensible, extension: string) {
    extensible.extensionsRequired = Extensions.addUnique(
      extensible.extensionsRequired,
      extension
    );
    Extensions.addExtensionUsed(extensible, extension);
  }

  /**
   * Remove the given extension to the `extensionsUsed` of the given object.
   *
   * The array will be set to `undefined` if it becomes empty.
   *
   * This will *not* remove the extension from the `extensionsUsed`!
   *
   * @param extensible - The object
   * @param extension - The extension name
   */
  static removeExtensionRequired(extensible: Extensible, extension: string) {
    extensible.extensionsRequired = Extensions.removeUnique(
      extensible.extensionsRequired,
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
