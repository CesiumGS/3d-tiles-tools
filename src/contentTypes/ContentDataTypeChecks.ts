import { ContentData } from "./ContentData";
import { ContentDataTypeRegistry } from "./ContentDataTypeRegistry";

/**
 * Methods to create predicates that check whether a given
 * `ContentData` has a certain type.
 */
export class ContentDataTypeChecks {
  /**
   * Creates a predicate that checks whether a given `ContentData`
   * has a type that is contained in the given included types,
   * and NOT contained in the given excluded types.
   *
   * @param includedContentDataTypes - The included types
   * @param excludedContentDataTypes - The excluded types
   * @returns The predicate
   */
  static createCheck(
    includedContentDataTypes: string[] | undefined,
    excludedContentDataTypes: string[] | undefined
  ): (contentData: ContentData) => Promise<boolean> {
    const localIncluded: string[] = [];
    if (includedContentDataTypes) {
      localIncluded.push(...includedContentDataTypes);
    }
    const localExcluded: string[] = [];
    if (excludedContentDataTypes) {
      localExcluded.push(...excludedContentDataTypes);
    }
    return async (contentData: ContentData) => {
      const contentDataType = await ContentDataTypeRegistry.findContentDataType(
        contentData
      );
      if (!contentDataType) {
        return false;
      }
      return ContentDataTypeChecks.matches(
        localIncluded,
        localExcluded,
        contentDataType
      );
    };
  }

  /**
   * Creates a predicate that checks whether a given `ContentData`
   * has a type that is contained in the given included types
   *
   * @param contentDataTypes - The included types
   * @returns The predicate
   */
  static createIncludedCheck(
    ...contentDataTypes: string[]
  ): (contentData: ContentData) => Promise<boolean> {
    return ContentDataTypeChecks.createCheck(contentDataTypes, undefined);
  }

  /**
   * Returns whether the given inclusion/exclusion matches the given
   * element.
   *
   * This returns whether the given element is explicitly included,
   * and NOT explicitly excluded.
   *
   * @param included - The included elements
   * @param excluded - The excluded elements
   * @param element - The element
   * @returns Whether the inclusion/exclusion matches the element
   */
  private static matches<T>(
    included: T[] | undefined,
    excluded: T[] | undefined,
    element: T
  ): boolean {
    let isIncluded = false;
    let isExcluded = false;
    if (included) {
      isIncluded = included.includes(element);
    }
    if (excluded) {
      isExcluded = excluded.includes(element);
    }
    return isIncluded && !isExcluded;
  }
}
