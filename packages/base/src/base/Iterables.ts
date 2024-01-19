import fs from "fs";
import path from "path";

import { PathLike } from "fs";

import { DeveloperError } from "./DeveloperError";

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
  static overFiles(
    directory: string | PathLike,
    recurse: boolean
  ): Iterable<string> {
    const resultIterable = {
      [Symbol.iterator]: function* (): Iterator<string> {
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
      },
    };
    return resultIterable;
  }

  /**
   * Returns filtered view on the given iterable
   *
   * @param iterable - The iterable
   * @param include - The include predicate
   * @returns The filtered iterable
   */
  static filter<T>(
    iterable: Iterable<T>,
    include: (element: T) => boolean
  ): Iterable<T> {
    const resultIterable = {
      [Symbol.iterator]: function* (): Iterator<T> {
        for (const element of iterable) {
          const included = include(element);
          if (included) {
            yield element;
          }
        }
      },
    };
    return resultIterable;
  }

  /**
   * Returns filtered view on the given iterable
   *
   * @param iterable - The iterable
   * @param include - The include predicate
   * @returns The filtered iterable
   */
  static filterWithIndex<T>(
    iterable: Iterable<T>,
    include: (element: T, index: number) => boolean
  ): Iterable<T> {
    const resultIterable = {
      [Symbol.iterator]: function* (): Iterator<T> {
        let index = 0;
        for (const element of iterable) {
          const included = include(element, index);
          if (included) {
            yield element;
          }
          index++;
        }
      },
    };
    return resultIterable;
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
    iterable: Iterable<S>,
    mapper: (element: S) => T
  ): Iterable<T> {
    const resultIterable = {
      [Symbol.iterator]: function* (): Iterator<T> {
        for (const element of iterable) {
          yield mapper(element);
        }
      },
    };
    return resultIterable;
  }

  /**
   * Creates an iterable from the given one, returning arrays
   * that always contain `segmentSize` elements from the
   * input.
   *
   * If the number of elements that are provided by the
   * given iterable is not divisible by `segmentSize`,
   * then the last (incomplete) arrays will be omitted.
   *
   * @param iterable - The iterable object
   * @param segmentSize - The segment size
   * @returns The segmentized iterable
   * @throws DeveloperError If the segment size is not positive
   */
  static segmentize<T>(
    iterable: Iterable<T>,
    segmentSize: number
  ): Iterable<T[]> {
    if (segmentSize <= 0) {
      throw new DeveloperError(
        `The segment size must be positive, but is ${segmentSize}`
      );
    }
    const resultIterable = {
      [Symbol.iterator]: function* (): Iterator<T[]> {
        let current: T[] = [];
        for (const element of iterable) {
          current.push(element);
          if (current.length === segmentSize) {
            const result = current;
            current = [];
            yield result;
          }
        }
      },
    };
    return resultIterable;
  }

  /**
   * Creates an iterable that is a flat view on the given
   * iterable.
   *
   * @param iterable - The iterable object
   * @returns The flat iterable
   */
  static flatten<T>(iterable: Iterable<T[]>): Iterable<T> {
    const resultIterable = {
      [Symbol.iterator]: function* (): Iterator<T> {
        for (const element of iterable) {
          for (const innerElement of element) {
            yield innerElement;
          }
        }
      },
    };
    return resultIterable;
  }
}
