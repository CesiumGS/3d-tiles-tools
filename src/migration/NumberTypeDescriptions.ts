/**
 * Interface for the description of a numeric type
 */
interface NumberTypeDescription {
  /**
   * Whether the type must support signed numbers
   */
  isSigned: boolean;

  /**
   * Whether the type is an integer type
   */
  isIntegral: boolean;

  /**
   * The number of bits that are required for the type,
   * with values being 8, 16, 32, or 64
   */
  requiredBits: number;
}

/**
 * Methods to compute the ("metadata") component type for numeric values.
 *
 * @internal
 */
export class NumberTypeDescriptions {
  /**
   * Computes the metadata component type suitable for the given value.
   *
   * This will be a type like `INT(n)`, `UINT(n)` or `FLOAT(n)`, with
   * `n` being the number of bits of the type.
   *
   * @param value - The input value
   * @returns The component type
   */
  static computeComponentType(
    value: number | bigint | number[] | bigint[] | number[][] | bigint[][]
  ) {
    if (typeof value === "number" || typeof value === "bigint") {
      const d = NumberTypeDescriptions.computeSingle(value);
      return NumberTypeDescriptions.createComponentType(d);
    }
    const d = NumberTypeDescriptions.computeMinimal(value);
    return NumberTypeDescriptions.createComponentType(d);
  }

  /**
   * Creates the ("metadata") component type string for the given
   * number type description.
   *
   * This will be a type like `INT(n)`, `UINT(n)` or `FLOAT(n)`, with
   * `n` being the number of bits of the type.
   *
   * @param description - The number type description
   * @returns The component type
   */
  private static createComponentType(description: NumberTypeDescription) {
    if (!description.isIntegral) {
      return `FLOAT${description.requiredBits}`;
    }
    if (description.isSigned) {
      return `INT${description.requiredBits}`;
    }
    return `UINT${description.requiredBits}`;
  }

  /**
   * Compute the (smallest) number type description that can represent
   * the given value.
   *
   * For floating point values, it will always be "FLOAT32".
   *
   * For integral values, it will be `INT(n)` or `UINT(n)`, with `n`
   * being the number of bits (8, 16, 32, or 64) that is required
   * to represent that value.
   *
   * @param value - The value
   * @returns The number type description
   */
  private static computeSingle(value: number | bigint): NumberTypeDescription {
    let isSigned = false;
    let isIntegral = false;
    let requiredBits = 32;

    if (value < 0) {
      isSigned = true;
    }
    if (typeof value === "bigint" || Number.isInteger(value)) {
      isIntegral = true;
      requiredBits = NumberTypeDescriptions.computeRequiredBits(BigInt(value));
    }
    const result: NumberTypeDescription = {
      isSigned: isSigned,
      isIntegral: isIntegral,
      requiredBits: requiredBits,
    };
    return result;
  }

  /**
   * Computes the smallest number of bits (8, 16, 32, or 64) that is
   * required to represent the given value.
   *
   * @param v - The value
   * @returns The number of required bits
   */
  private static computeRequiredBits(v: bigint): number {
    const isNegative = v < 0n;
    const abs = BigInt(isNegative ? -v : v);
    let requiredBits = 8;
    while (requiredBits < 64) {
      const referenceValue = BigInt(1) << BigInt(requiredBits);
      let limit = referenceValue;
      if (isNegative) {
        limit = referenceValue / 2n + 1n;
      }
      if (abs < limit) {
        break;
      }
      requiredBits *= 2;
    }
    return requiredBits;
  }

  /**
   * Computes the smallest number type description that can represent
   * all the given values.
   *
   * @param values - The input values
   * @returns The smallest number type description
   */
  private static computeMinimal(
    values: number[] | bigint[] | number[][] | bigint[][]
  ): NumberTypeDescription {
    let result: NumberTypeDescription = {
      isSigned: false,
      isIntegral: true,
      requiredBits: 8,
    };
    for (const value of values) {
      if (Array.isArray(value)) {
        const element = NumberTypeDescriptions.computeMinimal(value);
        result = NumberTypeDescriptions.min(result, element);
      } else {
        const element = NumberTypeDescriptions.computeSingle(value);
        result = NumberTypeDescriptions.min(result, element);
      }
    }
    return result;
  }

  /**
   * Computes the minimum of the given descriptions.
   *
   * This is the smallest description that covers both of the
   * given descriptions. It will therefore indicate...
   * - 'signed' if either of the inputs indicates 'signed'
   * - 'integral' if both inputs indicate 'integral'
   * - A number of bits that is the maximum (!) of both input bits
   *
   * @param a - The first description
   * @param b - The second description
   * @returns The minimum
   */
  private static min(a: NumberTypeDescription, b: NumberTypeDescription) {
    const result: NumberTypeDescription = {
      isSigned: a.isSigned || b.isSigned,
      isIntegral: a.isIntegral && b.isIntegral,
      requiredBits: Math.max(a.requiredBits, b.requiredBits),
    };
    return result;
  }
}
