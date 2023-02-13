import path from "path";

import { Buffers } from "../src/base/Buffers";

/**
 * Returns whether the given file should be zipped when it is
 * added to a package.
 *
 * If the file data is given, and it is already Gzipped, then
 * `false` is returned.
 *
 * Otherwise, the decision is solely made based on the extension
 * of the given file. The exact set of extensions for which this
 * function returns `true` is not specified.
 *
 * NOTE: The behavior of this function resembles the `isTile`
 * function of the original `3d-tiles-validator` tools. In
 * fact, in resembles both of the `isTile` functions.
 * I don't know what's the 'right' thing to do here either...
 *
 * @param file - The file
 * @param data - The optional file data
 * @returns Whether the file should be zipped
 */
export function shouldGzip(file: string, data: Buffer | undefined): boolean {
  if (data) {
    if (Buffers.isGzipped(data)) {
      return false;
    }
  }
  const extension = path.extname(file);
  const extensions = [
    ".json",
    ".b3dm",
    ".i3dm",
    ".pnts",
    ".cmpt",
    ".vctr",
    ".gltf",
    ".glb",
  ];
  return extensions.includes(extension);
}
