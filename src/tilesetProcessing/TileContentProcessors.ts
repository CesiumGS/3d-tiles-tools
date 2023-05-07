import { TileContentProcessor } from "./TileContentProcessor";

export class TileContentProcessors {
  static concat(
    ...tileContentProcessors: TileContentProcessor[]
  ): TileContentProcessor {
    const result = async (
      type: string | undefined,
      inputContentData: Buffer
    ) => {
      let currentContentData = inputContentData;
      for (const tileContentProcessor of tileContentProcessors) {
        currentContentData = await tileContentProcessor(
          type,
          currentContentData
        );
      }
      return currentContentData;
    };
    return result;
  }
}
