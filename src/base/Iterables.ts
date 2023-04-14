import fs from "fs";
import path from "path";

import { PathLike } from "fs";

/**
 * Utility methods for iterable objects.
 *
 * @internal
 */
export class Iterables {
  /**
   * Creates a generator that allows iterating over all files
   * in the given directory, and its subdirectories if
   * `recurse` is `true`.
   *
   * @param directory - The directory
   * @param recurse - Whether the files should
   * be listed recursively
   * @returns The generator for path strings
   */
  static *overFiles(
    directory: string | PathLike,
    recurse: boolean
  ): IterableIterator<string> {
    const fileNames = fs.readdirSync(directory);
    for (const fileName of fileNames) {
      const rawPath = path.join(directory.toString(), fileName);
      const fullPath = rawPath.replace(/\\/g, "/");
      const isDirectory = fs.statSync(fullPath).isDirectory();
      if (isDirectory && recurse) {
        yield* Iterables.overFiles(fullPath, recurse);
      } else if (!isDirectory) {
        yield fullPath;
      }
    }
  }

  /**
   * Returns filtered view on the given iterable
   *
   * @param iterable - The iterable
   * @param include - The include predicate
   * @returns The filtered iterable
   */
  static filter<T>(
    iterable: IterableIterator<T>,
    include: (element: T) => boolean
  ) {
    const iterator = iterable[Symbol.iterator]();
    return {
      [Symbol.iterator]() {
        return this;
      },
      next(): IteratorResult<T, void> {
        for (;;) {
          const result = iterator.next();
          if (result.done) {
            return { value: undefined, done: true };
          }
          const included = include(result.value);
          if (included) {
            return { value: result.value, done: false };
          }
        }
      },
    };
  }

  /**
   * Creates an iterable from the given one, applying the
   * given function to each element.
   *
   * @param iterable - The iterable object
   * @param mapper - The mapper function
   * @returns The mapped iterable
   */
  static map<S, T>(
    iterable: IterableIterator<S>,
    mapper: (element: S) => T
  ): IterableIterator<T> {
    const iterator = iterable[Symbol.iterator]();
    return {
      [Symbol.iterator]() {
        return this;
      },
      next(): IteratorResult<T, void> {
        const result = iterator.next();
        if (result.done) {
          return { value: undefined, done: true };
        }
        const mappedValue = mapper(result.value);
        return { value: mappedValue, done: false };
      },
    };
  }
}
