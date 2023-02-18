import { ContentData } from "./ContentData";
import { ContentDataTypeRegistry } from "./ContentDataTypeRegistry";

export class ContentDataTypeChecks {
  static createCheck(
    ...contentDataTypes: string[]
  ): (contentData: ContentData) => Promise<boolean> {
    const localContentDataTypes = [...contentDataTypes];
    return async (contentData: ContentData) => {
      const contentDataType = await ContentDataTypeRegistry.findContentDataType(
        contentData
      );
      if (!contentDataType) {
        return false;
      }
      return ContentDataTypeChecks.matches(
        localContentDataTypes,
        undefined,
        contentDataType
      );
    };
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
