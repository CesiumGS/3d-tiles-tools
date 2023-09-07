/**
 * A basic interface for a property in a property table.
 *
 * This can be imagined as one "column" in the table.
 *
 * @internal
 */
export interface PropertyModel {
  /**
   * Obtains the property value at the given index.
   *
   * The index corresponds to a "row" in the property table.
   *
   * The type of the returned object depends on the type of
   * the property:
   * - For `STRING` properties, it will be a `string`
   * - For `BOOLEAN` properties, it will be a `boolean`
   * - For `ENUM` properties, it will be the numeric value
   *   that corresponds to the respective enum constant.
   * - For `SCALAR` properties, it will be a `number` or `bigint`
   * - For `VECn`- or `MATn` properties, it will be an array
   *   of `number`- or `bigint` elements
   * - For array properties, it will be an array of the
   *   respective elements
   *
   * @param index - The index
   * @returns The property value
   */
  getPropertyValue(index: number): any;
}
