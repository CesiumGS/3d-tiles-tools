import fs from "fs";
import path from "path";

/**
 * Utility methods related to paths.
 *
 * The methods in this class are mainly convenience wrappers
 * around certain `fs`- and `path` functions.
 *
 * Unless otherwise noted, methods that return string
 * representations of paths will use the forward slash `/`
 * as the directory separator, regardless of the operating
 * system.
 */
export class Paths {
  /**
   * Ensures that the given directory exists, creating it
   * and all its parent directories if necessary.
   *
   * @param directory - The directory
   */
  static ensureDirectoryExists(directory: string): void {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
  }

  /**
   * Returns whether the given path is a directory
   *
   * @param p - The path
   * @returns Whether the path is a directory
   */
  static isDirectory(p: string): boolean {
    return fs.lstatSync(p).isDirectory();
  }

  /**
   * Returns whether the given file name has one of the given
   * extensions, case-insensitively.
   *
   * @param fileName - The file name
   * @param extensions - The extensions to check, in lowercase,
   * and including the `.` dot.
   * @param Whether the file name has one of the given extensions.
   */
  static hasExtension(fileName: string, ...extensions: string[]): boolean {
    const extension = path.extname(fileName).toLowerCase();
    return extensions.includes(extension);
  }

  /**
   * Does whatever `path.join` does, but makes sure that
   * the result uses `/` forward slashes as the directory
   * separator.
   *
   * @param paths - The input paths
   * @returns The resulting joined path
   */
  static join(...paths: string[]): string {
    const joined = path.join(...paths);
    return Paths.normalize(joined);
  }

  /**
   * Does whatever `path.resolve` does, but makes sure that
   * the result uses `/` forward slashes as the directory
   * separator.
   *
   * @param paths - The input paths
   * @returns The resulting resolved path
   */
  static resolve(...paths: string[]): string {
    const resolved = path.resolve(...paths);
    return Paths.normalize(resolved);
  }

  /**
   * Does whatever `path.relative` does, but makes sure that
   * the result uses `/` forward slashes as the directory
   * separator.
   *
   * @param directory - The directory
   * @param fileName - The file name
   * @returns The resulting path
   */
  static relativize(directory: string, fileName: string): string {
    const relative = path.relative(directory, fileName);
    return Paths.normalize(relative);
  }

  /**
   * Internal method to replace `\` backslashes with `/` forward slashes.
   *
   * @param p - The input path
   * @returns The result
   */
  private static normalize(p: string): string {
    return p.replace(/\\/g, "/");
  }
}
