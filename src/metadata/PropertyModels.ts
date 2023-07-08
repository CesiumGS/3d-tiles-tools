import { PropertyModel } from "./PropertyModel";

/**
 * Utility methods related to `PropertyModel` instances
 */
export class PropertyModels {
  /**
   * Creates an iterable over the values of the given property
   * model, assuming that they are numeric arrays
   *
   * @param propertyModel - The property model
   * @param numElements - The number of elements
   * @returns The iterable
   */
  static createNumericArrayIterable(
    propertyModel: PropertyModel,
    numElements: number
  ): Iterable<number[]> {
    const iterable = {
      [Symbol.iterator]: function* (): Iterator<number[]> {
        for (let index = 0; index < numElements; index++) {
          const value = propertyModel.getPropertyValue(index);
          yield value;
        }
      },
    };
    return iterable;
  }

  /**
   * Creates an iterable over the values of the given property
   * model, assuming that they are numeric scalars
   *
   * @param propertyModel - The property model
   * @param numElements - The number of elements
   * @returns The iterable
   */
  static createNumericScalarIterable(
    propertyModel: PropertyModel,
    numElements: number
  ): Iterable<number> {
    const iterable = {
      [Symbol.iterator]: function* (): Iterator<number> {
        for (let index = 0; index < numElements; index++) {
          const value = propertyModel.getPropertyValue(index);
          yield value;
        }
      },
    };
    return iterable;
  }
}