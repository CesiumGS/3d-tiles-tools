import { Document } from "@gltf-transform/core";
import { Accessor } from "@gltf-transform/core";
import { Primitive } from "@gltf-transform/core";
import { Logger } from "@gltf-transform/core";

import { prune } from "@gltf-transform/functions";

import { GltfTransform } from "./GltfTransform";

import { defined } from "../../base";
import { Loggers } from "../../base";
const logger = Loggers.get("contentProcessing");

/**
 * Utilities for removing WEB3D_quantized_attributes extension
 * from glTF 2.0 (!) data.
 *
 * NOTE: This class is exposing an anachronism: It takes glTF 2.0 data,
 * and removes the WEB3D_quantized_attributes extension, which actually
 * is a glTF 1.0 extension.
 * The functions here are applied to a buffer that was created by upgrading
 * a glTF 1.0 to 2.0 with `gltf-pipeline`: This will upgrade most of the
 * glTF to 2.0, but keep the WEB3D_quantized_attributes extension.
 *
 * @internal
 */
export class GltfWeb3dQuantizedAttributes {
  /**
   * Replaces accessors in the given GLB that had been quantized with
   * the WEB3D_quantized_attributes extension with accessors that are
   * dequantized.
   *
   * The given `decodeMatrices` contain one entry for each accessor
   * of the glTF. This entry is the `decodeMatrix` from the extension
   * object. If the respective accessor did not contain the
   * WEB3D_quantized_attributes extension, this entry is `undefined`.
   *
   * @param inputGlb - The input GLB buffer
   * @param decodeMatrices - The decode matrices for the accessors
   * @returns The resulting GLB
   */
  static async replaceWeb3dQuantizedAttributesExtension(
    inputGlb: Buffer,
    decodeMatrices: (number[] | undefined)[]
  ): Promise<Buffer> {
    logger.info("Replacing WEB3D_quantized_attributes extension...");
    const io = await GltfTransform.getIO();
    const document = await io.readBinary(inputGlb);
    await document.transform((document) => {
      GltfWeb3dQuantizedAttributes.dequantizeAccessors(
        document,
        decodeMatrices
      );
    });
    document.setLogger(new Logger(Logger.Verbosity.WARN));
    await document.transform(prune());
    const outputGlb = await io.writeBinary(document);
    logger.info("Replacing WEB3D_quantized_attributes extension DONE");
    return Buffer.from(outputGlb);
  }

  /**
   * Transform the given document to replace all WEB3D_quantized_attributes
   * accessors with dequantized ones.
   *
   * The given `decodeMatrices` contain one entry for each accessor
   * of the glTF. This entry is the `decodeMatrix` from the extension
   * object. If the respective accessor did not contain the
   * WEB3D_quantized_attributes extension, this entry is `undefined`.
   *
   * Note that after this, the original accessors MIGHT become
   * unused. The glTF-Transform 'prune' function should be called
   * afterwards, to clean up the document.
   *
   * @param document - The glTF-Transform document
   */
  private static dequantizeAccessors(
    document: Document,
    decodeMatrices: (number[] | undefined)[]
  ) {
    let dequantizedAccessorsCounter = 0;

    // Go through all accessors
    const root = document.getRoot();
    const accessors = root.listAccessors();
    for (let i = 0; i < accessors.length; i++) {
      // If there is no decodeMatrix for the accessor, then the
      // accessor was not quantized, and nothing will be done.
      const decodeMatrix = decodeMatrices[i];
      if (!defined(decodeMatrix)) {
        continue;
      }

      // Create a dequantized version of the accessor
      const accessor = accessors[i];
      const dequantizedAccessor =
        GltfWeb3dQuantizedAttributes.createDequantizedAccessor(
          document,
          accessor,
          decodeMatrix
        );
      if (!dequantizedAccessor) {
        // If something went wrong (e.g. invalid accessor type or the
        // decode matrix not matching the type), then an error message
        // is printed and undefined is returned. Bail out in this case.
        continue;
      }
      dequantizedAccessorsCounter++;

      // Go though all parents (users) of the accessor: If they are
      // mesh primitives, then replace the quantized accessor in
      // its attributes with the dequantized one.
      // Note that after this, the original accessor MIGHT become
      // unused.
      const parents = accessor.listParents();
      for (const parent of parents) {
        if (parent instanceof Primitive) {
          const primitive = parent;
          const semantics = primitive.listSemantics();
          for (const semantic of semantics) {
            const attribute = primitive.getAttribute(semantic);
            if (attribute === accessor) {
              primitive.setAttribute(semantic, dequantizedAccessor);
            }
          }
        }
      }
    }
    if (dequantizedAccessorsCounter > 0) {
      logger.info(
        `Dequantized ${dequantizedAccessorsCounter} quantized accessors`
      );
    }
  }

  /**
   * Create a dequantized version of the given accessor, based on the
   * given decode matrix.
   *
   * The given accessor must have the type 'SCALAR', 'VEC2', 'VEC3',
   * or 'VEC4', and the decode matrix must have a length of
   * [2x2, 3x3, 4x4, 5x5], respectively. If this is not the case,
   * then an error message will be printed, and `undefined` will
   * be returned.
   *
   * @param document - The glTF-Transform document
   * @param quantizedAccessor - The quantized accessor
   * @param decodeMatrix - The decode matrix for the accessor
   * @returns The dequantized accessor
   */
  private static createDequantizedAccessor(
    document: Document,
    quantizedAccessor: Accessor,
    decodeMatrix: number[]
  ): Accessor | undefined {
    // Extract the offset and stepSize from the decodeMatrix
    let offset: number[] | undefined = undefined;
    let stepSize: number[] | undefined = undefined;

    // Perform basic sanity checks, whether the matrix size matches
    // the accessor type, and bail out with an error if necessary
    const type = quantizedAccessor.getType();
    if (type === "SCALAR") {
      if (decodeMatrix.length !== 4) {
        logger.error(
          `Accessor with type 'SCALAR' must have a decodeMatrix of ` +
            `length 4 in WEB3D_quantized_attributes, but ` +
            `the matrix has a length of ${decodeMatrix.length}`
        );
        return undefined;
      }
      offset = [decodeMatrix[2]];
      stepSize = [decodeMatrix[0]];
    } else if (type === "VEC2") {
      if (decodeMatrix.length !== 9) {
        logger.error(
          `Accessor with type 'VEC2' must have a decodeMatrix of ` +
            `length 9 in WEB3D_quantized_attributes, but ` +
            `the matrix has a length of ${decodeMatrix.length}`
        );
        return undefined;
      }
      offset = [decodeMatrix[6], decodeMatrix[7]];
      stepSize = [decodeMatrix[0], decodeMatrix[4]];
    } else if (type === "VEC3") {
      if (decodeMatrix.length !== 16) {
        logger.error(
          `Accessor with type 'VEC3' must have a decodeMatrix of ` +
            `length 16 in WEB3D_quantized_attributes, but ` +
            `the matrix has a length of ${decodeMatrix.length}`
        );
        return undefined;
      }
      offset = [decodeMatrix[12], decodeMatrix[13], decodeMatrix[14]];
      stepSize = [decodeMatrix[0], decodeMatrix[5], decodeMatrix[10]];
    } else if (type === "VEC4") {
      if (decodeMatrix.length !== 25) {
        logger.error(
          `Accessor with type 'VEC4' must have a decodeMatrix of ` +
            `length 25 in WEB3D_quantized_attributes, but ` +
            `the matrix has a length of ${decodeMatrix.length}`
        );
        return undefined;
      }
      offset = [
        decodeMatrix[20],
        decodeMatrix[21],
        decodeMatrix[22],
        decodeMatrix[23],
      ];
      stepSize = [
        decodeMatrix[0],
        decodeMatrix[6],
        decodeMatrix[12],
        decodeMatrix[18],
      ];
    } else {
      logger.error(
        `Accessor must have type 'SCALAR', 'VEC2', 'VEC3', or ` +
          `'VEC4' for WEB3D_quantized_attributes, but ` +
          `has type ${type}`
      );
      return undefined;
    }
    const dequantizedAccessor = GltfWeb3dQuantizedAttributes.dequantizeAccessor(
      document,
      quantizedAccessor,
      offset,
      stepSize
    );
    return dequantizedAccessor;
  }

  /**
   * Dequantize the given accessor using the given offset and step size,
   * and return the result.
   *
   * @param document - The glTF-Transform document
   * @param quantizedAccessor - The quantized accessor
   * @param offset - The quantization offset
   * @param stepSize - The quantization step size
   * @returns The dequantized accessor
   */
  private static dequantizeAccessor(
    document: Document,
    quantizedAccessor: Accessor,
    offset: number[],
    stepSize: number[]
  ) {
    const dequantizedData: number[] = [];

    const elementSize = quantizedAccessor.getElementSize();
    const count = quantizedAccessor.getCount();
    for (let i = 0; i < count; i++) {
      const quantized = Array<number>(elementSize);
      quantizedAccessor.getElement(i, quantized);
      const dequantized = GltfWeb3dQuantizedAttributes.dequantize(
        quantized,
        offset,
        stepSize
      );
      dequantizedData.push(...dequantized);
    }

    const dequantizedAccessor = document.createAccessor();
    dequantizedAccessor.setType(quantizedAccessor.getType());
    dequantizedAccessor.setArray(new Float32Array(dequantizedData));
    return dequantizedAccessor;
  }

  /**
   * Dequantize the given quantized value with the given offset and step
   * size.
   *
   * This just returns `offset + quantized * stepSize`, component-wise.
   * It assumes that all arrays have the same length.
   *
   * @param encoded - The quantized value
   * @param offset - The offset
   * @param stepSize - The step size
   * @returns The dequantized value
   */
  private static dequantize(
    quantized: number[],
    offset: number[],
    stepSize: number[]
  ): number[] {
    const n = quantized.length;
    const dequantized: number[] = [];
    for (let i = 0; i < n; i++) {
      const element = offset[i] + quantized[i] * stepSize[i];
      dequantized.push(element);
    }
    return dequantized;
  }
}
