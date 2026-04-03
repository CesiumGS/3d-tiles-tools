/**
 * A basic structure holding information about `MetadataEnum`
 * instances that appear in a `Schema`.
 *
 * It summarizes the information that is required for reading
 * and writing the metadata values in binary form.
 *
 * @internal
 */
export interface BinaryEnumInfo {
  /**
   * A mapping from enum type names (enum IDs) to the
   * `metadataEnum.valueType` of the respective enum,
   * defaulting to `UINT16` when it was not defined.
   */
  enumValueTypes: { [key: string]: string };

  /**
   * A mapping from enum type names (enum IDs) to
   * dictionaries that map the `enum.values[i].name`
   * to the `enum.values[i].value`
   */
  enumValueNameValues: { [key: string]: { [key: string]: number } };

  /**
   * A mapping from enum type names (enum IDs) to
   * dictionaries that map the `enum.values[i].value`
   * to the `enum.values[i].name`
   */
  enumValueValueNames: { [key: string]: { [key: number]: string } };
}
