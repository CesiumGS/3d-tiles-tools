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
   * Determine a directory name from the given tileset name.
   *
   * When the given name ends with `.json`, `.3tz`, or `.3dtiles`
   * (case-insensitively), then the directory name of that file
   * name is returned. Otherwise, the given name is assumed to
   * be a directory name and returned directly.
   *
   * NOTE: This is working around the ambiguity that is related to
   * https://github.com/CesiumGS/3d-tiles/issues/184 : When someone
   * uses a path like "./data/target" as a target name, then it is
   * not clear whether the result should be
   *
   * - a JSON file "./data/target" (without extension)
   * - a file called "./data/target/tileset.json"
   *
   * The latter is the default assumption that is used for source
   * data: When the source is a directory, then it assumes
   * that there is a 'tileset.json' file in this directory.
   *
   * For the target, checking whether there is a file extension
   * seems to be a reasonable workaround.
   *
   * @param tilesetName - The tileset name
   * @returns The directory name
   */
  static determineTilesetDirectoryName(tilesetName: string) {
    const n = tilesetName.toLowerCase();
    if (n.endsWith(".json") || n.endsWith(".3tz") || n.endsWith(".3dtiles")) {
      return path.dirname(tilesetName);
    }
    return tilesetName;
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
