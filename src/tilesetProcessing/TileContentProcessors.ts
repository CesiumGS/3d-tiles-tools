import { TileContentProcessor } from "./TileContentProcessor";

/**
 * Methods related to `TileContentProcessor` instances
 *
 * @internal
 */
export class TileContentProcessors {
  /**
   * Concatenates the given `TileContentProcessor` instances.
   *
   * This creates a `TileContentProcessor` that applies the given
   * processors, in the given order, to the input data.
   *
   * This asssumes that none of the given processors changes the
   * _type_ of the input data (even though it _may_ change the
   * type, if subsequent processors are agnostic of that...)
   *
   * @param tileContentProcessors - The `TileContentProcessor` instances
   * @returns The concatenated `TileContentProcessor`
   */
  static concat(
    ...tileContentProcessors: TileContentProcessor[]
  ): TileContentProcessor {
    const result = async (
      inputContentData: Buffer,
      type: string | undefined
    ) => {
      let currentContentData = inputContentData;
      for (const tileContentProcessor of tileContentProcessors) {
        currentContentData = await tileContentProcessor(
          currentContentData,
          type
        );
      }
      return currentContentData;
    };
    return result;
  }
}
