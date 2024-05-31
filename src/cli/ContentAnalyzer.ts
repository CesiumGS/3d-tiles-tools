import fs from "fs";

import { Paths } from "../base";
import { Buffers } from "../base";

import { TileFormats } from "../tilesets";
import { TileDataLayouts } from "../tilesets";

import { GltfUtilities } from "../tools";

import { ToolsUtilities } from "./ToolsUtilities";

import { Loggers } from "../base";
const logger = Loggers.get("CLI");

/**
 * Implementation of the functionality of the `analyze` command
 * of the 3D Tiles Tools.
 *
 * The `analyze` command is primarily intended for debugging, and
 * many details of its behavior are intentionally not specified.
 *
 * @internal
 */
export class ContentAnalyzer {
  /**
   * Whether the contents of JSON files in the output should be
   * formatted (pretty-printed). This might be controlled with
   * a command line option in the future.
   */
  private static readonly doFormatJson = true;

  /**
   * Analyze the data in the given buffer, which is associated with
   * a file that has the given base name.
   *
   * Note that the given `inputBaseName` is not necessarily the name
   * of a file that actually exists: This function may be called,
   * for example, with an input base name like
   * `exampleCmpt.inner[2]` to analyze the content of an inner
   * tile of a composite tile.
   *
   * (The input base name will only be used as a prefix for the
   * output file names that are written)
   *
   * @param inputBaseName - The base name (file name) of the input
   * @param inputBuffer - The buffer containing the input data
   * @param outputDirectoryName - The name of the output directory
   * @param force - Whether existing files should be overwritten
   */
  static analyze(
    inputBaseName: string,
    inputBuffer: Buffer,
    outputDirectoryName: string,
    force: boolean
  ) {
    // Read the buffer and its magic header, and call the proper
    // internal function based on the magic header
    const magic = Buffers.getMagicString(inputBuffer, 0);

    if (magic === "b3dm" || magic === "i3dm" || magic === "pnts") {
      ContentAnalyzer.analyzeBasicTileContent(
        inputBaseName,
        inputBuffer,
        outputDirectoryName,
        force
      );
    } else if (magic === "cmpt") {
      ContentAnalyzer.analyzeCompositeTileContent(
        inputBaseName,
        inputBuffer,
        outputDirectoryName,
        force
      );
    } else if (magic === "glTF") {
      ContentAnalyzer.analyzeGlb(
        inputBaseName,
        inputBuffer,
        outputDirectoryName,
        force
      );
    } else {
      logger.warn(`Could not determine content type of ${inputBaseName}`);
    }
  }

  /**
   * Implementation for `analyze`: Analyze B3DM, I3DM, or PNTS tile content
   *
   * @param inputBaseName - The base name (file name) of the input
   * @param inputBuffer - The buffer containing the input data
   * @param outputDirectoryName - The name of the output directory
   * @param force - Whether existing files should be overwritten
   */
  private static analyzeBasicTileContent(
    inputBaseName: string,
    inputBuffer: Buffer,
    outputDirectoryName: string,
    force: boolean
  ) {
    const tileDataLayout = TileDataLayouts.create(inputBuffer);
    const tileData = TileFormats.extractTileData(inputBuffer, tileDataLayout);

    // Create the JSON strings for the layout information,
    // feature table, batch table, and the GLB JSON
    const layoutJsonString = ContentAnalyzer.stringify(tileDataLayout);
    const featureTableJsonString = ContentAnalyzer.stringify(
      tileData.featureTable.json
    );
    const batchTableJsonString = ContentAnalyzer.stringify(
      tileData.batchTable.json
    );
    let glbJsonString = "{}";
    if (tileData.payload.length !== 0) {
      const glbJsonBuffer = GltfUtilities.extractJsonFromGlb(tileData.payload);
      glbJsonString = glbJsonBuffer.toString();
    }
    if (ContentAnalyzer.doFormatJson) {
      const glbJson = JSON.parse(glbJsonString);
      glbJsonString = ContentAnalyzer.stringify(glbJson);
    }

    // Determine the output file names. They are files in the
    // output directory, prefixed with the name of the input
    // file, and with suffixes that indicate the actual contents
    const outputBaseName = Paths.resolve(outputDirectoryName, inputBaseName);
    const layoutFileName = outputBaseName + ".layout.json";
    const featureTableJsonFileName = outputBaseName + ".featureTable.json";
    const batchTableJsonFileName = outputBaseName + ".batchTable.json";
    const glbFileName = outputBaseName + ".glb";
    const glbJsonFileName = outputBaseName + ".glb.json";

    // Write all output files
    Paths.ensureDirectoryExists(outputDirectoryName);
    ContentAnalyzer.writeJsonFileOptional(
      layoutJsonString,
      layoutFileName,
      force
    );
    ContentAnalyzer.writeFileOptional(tileData.payload, glbFileName, force);
    ContentAnalyzer.writeJsonFileOptional(
      featureTableJsonString,
      featureTableJsonFileName,
      force
    );
    ContentAnalyzer.writeJsonFileOptional(
      batchTableJsonString,
      batchTableJsonFileName,
      force
    );
    ContentAnalyzer.writeJsonFileOptional(
      glbJsonString,
      glbJsonFileName,
      force
    );
  }

  /**
   * Implementation for `analyze`: Analyze CMPT tile content
   *
   * @param inputBaseName - The base name (file name) of the input
   * @param inputBuffer - The buffer containing the input data
   * @param outputDirectoryName - The name of the output directory
   * @param force - Whether existing files should be overwritten
   */
  private static analyzeCompositeTileContent(
    inputBaseName: string,
    inputBuffer: Buffer,
    outputDirectoryName: string,
    force: boolean
  ) {
    const compositeTileData = TileFormats.readCompositeTileData(inputBuffer);
    const n = compositeTileData.innerTileBuffers.length;
    for (let i = 0; i < n; i++) {
      const innerTileDataBuffer = compositeTileData.innerTileBuffers[i];
      const innerTileBaseName = `${inputBaseName}.inner[${i}]`;
      ContentAnalyzer.analyze(
        innerTileBaseName,
        innerTileDataBuffer,
        outputDirectoryName,
        force
      );
    }
  }

  /**
   * Implementation for `analyze`: Analyze GLB data
   *
   * @param inputBaseName - The base name (file name) of the input
   * @param inputBuffer - The buffer containing the input data
   * @param outputDirectoryName - The name of the output directory
   * @param force - Whether existing files should be overwritten
   */
  private static analyzeGlb(
    inputBaseName: string,
    inputBuffer: Buffer,
    outputDirectoryName: string,
    force: boolean
  ) {
    let glbJsonString = "{}";
    const glbJsonBuffer = GltfUtilities.extractJsonFromGlb(inputBuffer);
    glbJsonString = glbJsonBuffer.toString();
    if (ContentAnalyzer.doFormatJson) {
      const glbJson = JSON.parse(glbJsonString);
      glbJsonString = ContentAnalyzer.stringify(glbJson);
    }
    const outputBaseName = Paths.resolve(outputDirectoryName, inputBaseName);
    const glbJsonFileName = outputBaseName + ".glb.json";
    Paths.ensureDirectoryExists(outputDirectoryName);
    ContentAnalyzer.writeJsonFileOptional(
      glbJsonString,
      glbJsonFileName,
      force
    );
  }

  /**
   * Returns a JSON string representation of the given object,
   * possibly formatted/indented.
   *
   * (This may be controlled with a command line flag in the future).
   *
   * @param input - The input object
   * @returns The stringified object
   */
  private static stringify(input: any): string {
    if (ContentAnalyzer.doFormatJson) {
      return JSON.stringify(input, null, 2);
    }
    return JSON.stringify(input);
  }

  /**
   * Writes the given JSON string to the specifified file.
   *
   * If the given JSON string represents the empty object `"{}"`,
   * then nothing will be written.
   *
   * If the file exists and `force===false`, then an error message
   * will be printed.
   *
   * @param jsonString - The JSON string
   * @param fileName - The file name
   * @param force - Whether files should be overwritten
   */
  private static writeJsonFileOptional(
    jsonString: string,
    fileName: string,
    force: boolean
  ) {
    if (jsonString === "{}") {
      return;
    }
    if (!ToolsUtilities.canWrite(fileName, force)) {
      logger.error(`Cannot write ${fileName}`);
      return;
    }
    logger.info(`Writing ${fileName}`);
    fs.writeFileSync(fileName, Buffer.from(jsonString));
  }

  /**
   * Writes the given data to the specifified file.
   *
   * If the buffer is empty, then nothing will be written.
   *
   * If the file exists and `force===false`, then an error message
   * will be printed.
   *
   * @param buffer - The file data
   * @param fileName - The file name
   * @param force - Whether files should be overwritten
   */
  private static writeFileOptional(buffer: Buffer, fileName: string, force) {
    if (buffer.length === 0) {
      return;
    }
    if (!ToolsUtilities.canWrite(fileName, force)) {
      logger.error(`Cannot write ${fileName}`);
      return;
    }
    logger.info(`Writing ${fileName}`);
    fs.writeFileSync(fileName, buffer);
  }
}
