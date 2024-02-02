import path from "path";

/**
 * Methods related to tilesets.
 *
 * Most of the methods in this class are either utility methods, or
 * wrappers around the classes that implement parts of the command
 * line functionality (and that may become `TilesetStage`s in a
 * pipeline at some point).
 *
 * @internal
 */
export class Tilesets {
  /**
   * Determine the name of the file that contains the tileset JSON data.
   *
   * If the given name ends with '.json' (case insensitively), then the
   * name is the last path component of the given name.
   *
   * Otherwise (if the given name is a directory, or the name of a file
   * that does not end with '.json' - for example, an archive file
   * that ends with `.3tz` or `.3dtiles`), then the default name
   * 'tileset.json' is returned.
   *
   * @param tilesetDataName - The name of the tileset data
   * @returns The tileset file name
   */
  static determineTilesetJsonFileName(tilesetDataName: string): string {
    if (tilesetDataName.toLowerCase().endsWith(".json")) {
      return path.basename(tilesetDataName);
    }
    return "tileset.json";
  }

  /**
   * Returns whether the given names likely refer to the same package.
   *
   * This will interpret the given strings as paths and normalize them.
   * When the names end with `.json` (case insensitively), then the
   * method returns whether the names refer to the same directory.
   * Otherwise, it returns whether the paths are equal.
   *
   * @param tilesetPackageName0 - The first package name
   * @param tilesetPackageName1 - The second package name
   * @returns Whether the names refer to the same package
   */
  static areEqualPackages(
    tilesetPackageName0: string,
    tilesetPackageName1: string
  ): boolean {
    let name0 = path.normalize(tilesetPackageName0);
    if (name0.toLowerCase().endsWith(".json")) {
      name0 = path.dirname(tilesetPackageName0);
    }
    let name1 = path.normalize(tilesetPackageName1);
    if (name1.toLowerCase().endsWith(".json")) {
      name1 = path.dirname(tilesetPackageName1);
    }
    return name0 === name1;
  }
}
