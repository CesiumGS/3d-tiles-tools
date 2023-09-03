import { ContentData } from "./ContentData";
import { ContentDataTypeRegistry } from "./ContentDataTypeRegistry";

/**
 * Methods to create predicates that check whether a given
 * `ContentData` has a certain type.
 *
 * @internal
 */
export class ContentDataTypeChecks {
  /**
   * Creates a predicate that checks whether a given `ContentData`
   * has a type that is contained in the given included types,
   * and NOT contained in the given excluded types.
   *
   * If the `included` types are `undefined`, then each type
   * will be included by default.
   * If the `excluded` types are `undefined`, then each type
   * will be NOT excluded by default.
   *
   * @param includedContentDataTypes - The included types
   * @param excludedContentDataTypes - The excluded types
   * @returns The predicate
   */
  static createCheck(
    includedContentDataTypes: (string | undefined)[] | undefined,
    excludedContentDataTypes: (string | undefined)[] | undefined
  ): (contentData: ContentData) => Promise<boolean> {
    const typeCheck = ContentDataTypeChecks.createTypeCheck(
      includedContentDataTypes,
      excludedContentDataTypes
    );
    return async (contentData: ContentData) => {
      const contentDataType = await ContentDataTypeRegistry.findContentDataType(
        contentData
      );
      const result = typeCheck(contentDataType);
      return result;
    };
  }

  /**
   * Creates a predicate that checks whether a given string
   * (that represents one of the `ContentDataTypes`) is
   * contained in the given included types, and NOT
   * contained in the given excluded types.
   *
   * If the `included` types are `undefined`, then each type
   * will be included by default.
   * If the `excluded` types are `undefined`, then each type
   * will be NOT excluded by default.
   *
   * @param includedContentDataTypes - The included types
   * @param excludedContentDataTypes - The excluded types
   * @returns The predicate
   */
  static createTypeCheck(
    includedContentDataTypes: (string | undefined)[] | undefined,
    excludedContentDataTypes: (string | undefined)[] | undefined
  ): (contentDataType: string | undefined) => boolean {
    let localIncluded: (string | undefined)[] | undefined = undefined;
    if (includedContentDataTypes) {
      localIncluded = includedContentDataTypes.slice();
    }
    let localExcluded: (string | undefined)[] | undefined = undefined;
    if (excludedContentDataTypes) {
      localExcluded = excludedContentDataTypes.slice();
    }
    return (contentDataType: string | undefined) => {
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
   * If the `included` elements are `undefined`, then the element
   * will be included by default.
   * If the `excluded` elements are `undefined`, then the element
   * will be NOT excluded by default.
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
    let isIncluded = true;
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
