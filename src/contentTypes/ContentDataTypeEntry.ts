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
   * This is usually a string like `CONTENT_TYPE_GLB`, but the
   * details are not yet specified.
   */
  type: string;
};
