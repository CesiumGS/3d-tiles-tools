import { ClassProperty } from "../../structure";

import { TileFormatError } from "../../tilesets";
import { TileTableData } from "../../tilesets";

import { TypeDetection } from "./TypeDetection";

/**
 * Methods to create `ClassProperty` objects from batch table properties.
 *
 * @internal
 */
export class BatchTableClassProperties {
  /**
   * Returns a `ClassProperty` that describes the given batch table
   * property.
   *
   * The `type`, `componentType`, `array` and `count` properties
   * of the class property will be set based on some unspecified
   * guesses. If no suitable type information can be obtained
   * from the given values, then a class property with the
   * type `STRING` will be returned.
   *
   * @param batchTablePropertyName - The property name
   * @param batchTablePropertyValue - The property value
   * @returns The `ClassProperty`
   * @throws TileFormatError If the given value is neither
   * a BatchTableBinaryBodyReference nor a numeric array
   */
  static createClassProperty(
    batchTablePropertyName: string,
    batchTablePropertyValue: any
  ): ClassProperty {
    let type: string;
    let componentType: string | undefined;
    let array = false;
    let count: number | undefined = undefined;

    if (
      TileTableData.isBatchTableBinaryBodyReference(batchTablePropertyValue)
    ) {
      type = TileTableData.convertLegacyTypeToType(
        batchTablePropertyValue.type
      );
      componentType = TileTableData.convertLegacyComponentTypeToComponentType(
        batchTablePropertyValue.componentType
      );
    } else if (Array.isArray(batchTablePropertyValue)) {
      const commonType = TypeDetection.computeCommonType(
        batchTablePropertyValue
      );
      if (commonType === undefined) {
        type = "STRING";
      } else {
        type = commonType;
        if (commonType !== "STRING" && commonType !== "BOOLEAN") {
          componentType = TypeDetection.computeCommonComponentType(
            batchTablePropertyValue
          );
        }
      }
      array = TypeDetection.containsOnlyArrays(batchTablePropertyValue);
      if (array) {
        count = TypeDetection.computeCommonArrayLegth(batchTablePropertyValue);
      }
    } else {
      throw new TileFormatError(
        `Batch table JSON property ${batchTablePropertyName} was ` +
          `not a binary body reference and not an array`
      );
    }

    const classProperty: ClassProperty = {
      name: batchTablePropertyName,
      description: `Generated from ${batchTablePropertyName}`,
      type: type,
      componentType: componentType,
      enumType: undefined,
      array: array,
      count: count,
      normalized: false,
      offset: undefined,
      scale: undefined,
      max: undefined,
      min: undefined,
      required: true,
      noData: undefined,
      default: undefined,
      semantic: undefined,
    };

    return classProperty;
  }
}
