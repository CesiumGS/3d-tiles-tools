import gltfpack from "gltfpack";

import { ContentDataTypes } from "../contentTypes/ContentDataTypes";

import { TileContentProcessor } from "./TileContentProcessor";

import { TilesetError } from "../tilesetData/TilesetError";

/**
 * Methods to create `TileContentProcessor` instances that
 * process GLB data with `gltfpack`.
 */
export class TileContentProcessorsGltfpack {
  /**
   * Creates a `TileContentProcessor` that processes each GLB
   * tile content with `gltfpack`.
   *
   * It will process each tile content that has the content
   * type `ContentDataTypes.CONTENT_TYPE_GLB`, by calling
   * the `gltfpack` `pack` function with the given options
   * as arguments. It will set up the `-i` and `-o` arguments
   * internally, and resolve them to to input- and output
   * content data.
   *
   * @param options - The options for `gltfpack`
   * @returns The `TileContentProcessor`
   */
  static create(options: string[]): TileContentProcessor {
    const tileContentProcessor = async (
      inputContentData: Buffer,
      type: string | undefined
    ) => {
      if (type !== ContentDataTypes.CONTENT_TYPE_GLB) {
        return inputContentData;
      }
      let outputContentData = inputContentData;

      // The file extensions are required by gltfpack!
      const inputName = "input.glb";
      const outputName = "output.glb";
      const io = {
        read: function (path: string): Uint8Array {
          if (path === inputName) {
            return inputContentData;
          }
          throw new TilesetError(
            `The GLB data has an external reference to ${path}. ` +
              `External references are not supported.`
          );
        },
        write: function (path: string, data: Uint8Array): void {
          if (path === outputName) {
            outputContentData = Buffer.from(
              data.buffer.slice(
                data.byteOffset,
                data.byteLength + data.byteOffset
              )
            );
          } else {
            throw new TilesetError(
              `gltfpack unexpectedly tried to write to ${path}. ` +
                `External references are not supported.`
            );
          }
        },
      };
      if (options.includes("-i") || options.includes("-o")) {
        throw new TilesetError(
          `The '-i' and '-o' options are not allowed for gltfpack content processing`
        );
      }
      const args = [...options];
      args.push("-i");
      args.push(inputName);
      args.push("-o");
      args.push(outputName);
      await gltfpack.pack(args, io);
      return outputContentData;
    };
    return tileContentProcessor;
  }
}
