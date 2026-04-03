/**
 * Returns the first parameter if not undefined, otherwise the second parameter.
 * Useful for setting a default value for a parameter.
 *
 * Note: In the context of TypeScript, it should rarely be necessary to use
 * this function. In many cases, it can be replaced by the Nullish Coalescing
 * Operator, written as `??`. For example:
 * ```
 * const value = defaultValue(input, 0);
 * ```
 * can be written as
 * ```
 * const value = input ?? 0;
 * ```
 * However, a certain degree of additional type safety can be achieved with
 * this function in some cases. For example, in
 * ```
 * function example(fallback: string, input? : number) {
 *   const valueA = input ?? fallback;
 *   const valueB = defaultValue(input, fallback);
 * }
 * ```
 * the type of `valueA` will silently become `number | string`.
 * The second line will cause a compile-time error, because the
 * type of the `fallback` value does not match the type of the `input`.
 *
 * @param a - The first parameter
 * @param b - The second parameter
 * @returns Returns the first parameter if not undefined, otherwise the second parameter.
 * @internal
 */
export function defaultValue<T>(a: T | undefined, b: T): T {
  if (a !== undefined && a !== null) {
    return a;
  }
  return b;
}
