import fs from "fs";
import path from "path";

import { DeveloperError } from "../base";

import { Loggers } from "../base";
const logger = Loggers.get("CLI");

/**
 * Utilities for the command line interface functionality of
 * the tools that are implemented in ToolsMain.
 *
 * @internal
 */
export class ToolsUtilities {
  /**
   * Returns whether the specified file can be written.
   *
   * This is the case when `force` is `true`, or when it does not
   * exist yet.
   *
   * @param fileName - The file name
   * @param force The 'force' flag state from the command line
   * @returns Whether the file can be written
   */
  static canWrite(fileName: string, force: boolean): boolean {
    if (force) {
      return true;
    }
    if (!fs.existsSync(fileName)) {
      return true;
    }
    return false;
  }

  /**
   * Ensures that the specified file can be written, and throws
   * a `DeveloperError` otherwise.
   *
   * @param fileName - The file name
   * @param force The 'force' flag state from the command line
   * @returns Whether the file can be written
   * @throws DeveloperError When the file exists and `force` was `false`.
   */
  static ensureCanWrite(fileName: string, force: boolean): true {
    if (ToolsUtilities.canWrite(fileName, force)) {
      return true;
    }
    throw new DeveloperError(
      `File ${fileName} already exists. Specify -f or --force to overwrite existing files.`
    );
  }

  /**
   * Creates a function that can resolve URIs relative to
   * the given input file.
   *
   * The function will resolve relative URIs against the
   * base directory of the given input file name, and
   * return the corresponding file data. If the data
   * cannot be read, then the function will print an
   * error message and return  `undefined`.
   *
   * @param input - The input file name
   * @returns The resolver function
   */
  static createResolver(
    input: string
  ): (uri: string) => Promise<Buffer | undefined> {
    const baseDir = path.dirname(input);
    const resolver = async (uri: string): Promise<Buffer | undefined> => {
      const externalGlbUri = path.resolve(baseDir, uri);
      try {
        return fs.readFileSync(externalGlbUri);
      } catch (error) {
        logger.error(`Could not resolve ${uri} against ${baseDir}`);
      }
    };
    return resolver;
  }
}
