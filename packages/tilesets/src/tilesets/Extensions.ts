/**
 * A type for objects that can contain extensions
 */
type Extended = { extensions?: { [key: string]: any } };

/**
 * A type for objects that can contain extension declarations
 */
type Extensible = { extensionsUsed?: any; extensionsRequired?: any };

/**
 * Utility methods for handling extensions
 *
 * @internal
 */
export class Extensions {
  /**
   * Returns whether the given object contains the given extension.
   *
   * That is, whether the `object.extensions` contains a key
   * that is the given extension name.
   *
   * @param extended - The object that may contain the extension
   * @param extension - The extension (i.e. its name as a string)
   * @returns Whether the object contains the extension
   */
  static containsExtension(extended: Extended, extension: string) {
    if (!extended.extensions) {
      return false;
    }
    return Object.keys(extended.extensions).includes(extension);
  }

  /**
   * Remove the specified extension from the `extensions` dictionary
   * of the given object, deleting the `extensions` if they become
   * empty.
   *
   * @param extended - The extended object
   * @param extension - The extension (i.e. its name as a string)
   */
  static removeExtension(extended: Extended, extension: string) {
    if (!extended.extensions) {
      return;
    }
    delete extended.extensions[extension];
    if (Object.keys(extended.extensions).length === 0) {
      delete extended.extensions;
    }
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
    Extensions.addUniqueTo(extensible, "extensionsUsed", extension);
  }

  /**
   * Remove the given extension from the `extensionsUsed` of the given object.
   *
   * The array will be deleted if it becomes empty, and the
   * extension will also be removed from `extensionsRequired`.
   *
   * @param extensible - The object
   * @param extension - The extension name
   */
  static removeExtensionUsed(extensible: Extensible, extension: string) {
    Extensions.removeFrom(extensible, "extensionsUsed", extension);
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
    Extensions.addUniqueTo(extensible, "extensionsRequired", extension);
    Extensions.addExtensionUsed(extensible, extension);
  }

  /**
   * Remove the given extension to the `extensionsUsed` of the given object.
   *
   * The array will be deleted if it becomes empty.
   *
   * This will *not* remove the extension from the `extensionsUsed`!
   *
   * @param extensible - The object
   * @param extension - The extension name
   */
  static removeExtensionRequired(extensible: Extensible, extension: string) {
    Extensions.removeFrom(extensible, "extensionsRequired", extension);
  }

  /**
   * Adds the given element to the specified array if it was not
   * contained yet, creating a new array if it did not exist yet.
   *
   * @param object - The object containing the array
   * @param key - The name of the array property
   * @param element - The element
   */
  private static addUniqueTo<T>(
    object: { [key: string]: T[] | undefined },
    key: string,
    element: T
  ) {
    let array = object[key];
    if (!array) {
      array = [];
      object[key] = array;
    }
    if (!array.includes(element)) {
      array.push(element);
    }
  }

  /**
   * Remove the given element from the specified array. If the array
   * becomes empty, it is deleted.
   *
   * @param object - The object containing the array
   * @param key - The name of the array property
   * @param element - The element
   */
  private static removeFrom<T>(
    object: { [key: string]: T[] | undefined },
    key: string,
    element: T
  ) {
    const array = object[key];
    if (!array) {
      return;
    }
    const index = array.indexOf(element);
    if (index !== -1) {
      array.splice(index, 1);
    }
    if (array.length === 0) {
      delete object[key];
    }
  }
}
