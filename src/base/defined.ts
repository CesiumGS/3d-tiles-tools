/**
 * Returns whether the given value is not `undefined` and not `null`.
 *
 * Note: In the context of TypeScript, ideally, it should rarely
 * be necessary to use this function. A statement like
 * `if (defined(something)) { ... }`
 * can be written as
 * `if (something) { ... }`
 * in most cases.
 *
 * But great care has to be taken when the statement is supposed to
 * really check definedness, and not only truthyness. As part of the
 * quirks that TypeScript inherited from JavaScript, the output of
 * ```
 * const value = 0;
 * if (defined(value)) console.log('defined');
 * else                console.log('not defined');
 * if (value)          console.log('truthy');
 * else                console.log('not truthy');
 * ```
 * will be
 * ```
 * defined
 * not truthy
 * ```
 *
 * @param value - The value to check.
 * @returns `true` if the value is not `undefined` and not `null`
 * @internal
 */
export function defined<T>(value: T): value is NonNullable<T> {
  return value !== undefined && value !== null;
}
