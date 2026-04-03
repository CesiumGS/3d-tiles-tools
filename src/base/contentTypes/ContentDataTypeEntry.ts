import { ContentData } from "./ContentData";

/**
 * An entry of the registered content data types,
 * used in the `ContentDataTypeRegistry`.
 *
 * @internal
 */
export type ContentDataTypeEntry = {
  /**
   * A predicate that determines - for a given `ContentData` -
   * whether it has the type that is indicated by the `type`
   */
  predicate: (contentData: ContentData) => Promise<boolean>;

  /**
   * The type of the content data when it matches the predicate.
   *
   * This is supposed to be a string that uniquely identifies
   * the content type. For the known content types, this will
   * be one of the constant strings in ContentDataTypes.
   */
  type: string;
};
