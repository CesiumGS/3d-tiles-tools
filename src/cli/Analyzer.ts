import fs from "fs";
import path from "path";

import { Paths } from "../base";
import { ResourceResolvers } from "../base";
import { ContentDataTypes } from "../base";
import { ContentDataTypeRegistry } from "../base";

import { Subtree } from "../structure";
import { Availability } from "../structure";
import { TileImplicitTiling } from "../structure";

import { AvailabilityInfo } from "../tilesets";
import { BinarySubtreeDataResolver } from "../tilesets";
import { ExplicitTraversedTile } from "../tilesets";
import { SubtreeInfo } from "../tilesets";
import { SubtreeInfos } from "../tilesets";
import { TileFormats } from "../tilesets";
import { TilesetTraverser } from "../tilesets";
import { TraversedTile } from "../tilesets";
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
 * This class is only used internally, and may change arbitrarily
 * in the future.
 *
 * @internal
 */
export class Analyzer {
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
   * @param inputDirectoryName - The directory name of the input
   * @param inputBaseName - The base name (file name) of the input
   * @param inputBuffer - The buffer containing the input data
   * @param outputDirectoryName - The name of the output directory
   * @param force - Whether existing files should be overwritten
   */
  static async analyze(
    inputDirectoryName: string,
    inputBaseName: string,
    inputBuffer: Buffer,
    outputDirectoryName: string,
    force: boolean
  ) {
    const type = await ContentDataTypeRegistry.findType("", inputBuffer);
    if (
      type === ContentDataTypes.CONTENT_TYPE_B3DM ||
      type === ContentDataTypes.CONTENT_TYPE_I3DM ||
      type === ContentDataTypes.CONTENT_TYPE_PNTS
    ) {
      Analyzer.analyzeBasicTileContent(
        inputBaseName,
        inputBuffer,
        outputDirectoryName,
        force
      );
    } else if (type === ContentDataTypes.CONTENT_TYPE_CMPT) {
      await Analyzer.analyzeCompositeTileContent(
        inputDirectoryName,
        inputBaseName,
        inputBuffer,
        outputDirectoryName,
        force
      );
    } else if (type === ContentDataTypes.CONTENT_TYPE_GLB) {
      Analyzer.analyzeGlb(
        inputBaseName,
        inputBuffer,
        outputDirectoryName,
        force
      );
    } else if (type === ContentDataTypes.CONTENT_TYPE_TILESET) {
      await Analyzer.analyzeTileset(
        inputDirectoryName,
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
    const layoutJsonString = Analyzer.stringify(tileDataLayout);
    const featureTableJsonString = Analyzer.stringify(
      tileData.featureTable.json
    );
    const batchTableJsonString = Analyzer.stringify(tileData.batchTable.json);
    let glbJsonString = "{}";
    if (tileData.payload.length !== 0) {
      const glbJsonBuffer = GltfUtilities.extractJsonFromGlb(tileData.payload);
      glbJsonString = glbJsonBuffer.toString();
    }
    if (Analyzer.doFormatJson) {
      const glbJson = JSON.parse(glbJsonString);
      glbJsonString = Analyzer.stringify(glbJson);
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
    Analyzer.writeJsonFileOptional(layoutJsonString, layoutFileName, force);
    Analyzer.writeFileOptional(tileData.payload, glbFileName, force);
    Analyzer.writeJsonFileOptional(
      featureTableJsonString,
      featureTableJsonFileName,
      force
    );
    Analyzer.writeJsonFileOptional(
      batchTableJsonString,
      batchTableJsonFileName,
      force
    );
    Analyzer.writeJsonFileOptional(glbJsonString, glbJsonFileName, force);
  }

  /**
   * Implementation for `analyze`: Analyze CMPT tile content
   *
   * @param inputDirectoryName - The directory name of the input
   * @param inputBaseName - The base name (file name) of the input
   * @param inputBuffer - The buffer containing the input data
   * @param outputDirectoryName - The name of the output directory
   * @param force - Whether existing files should be overwritten
   */
  private static async analyzeCompositeTileContent(
    inputDirectoryName: string,
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
      await Analyzer.analyze(
        inputDirectoryName,
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
    if (Analyzer.doFormatJson) {
      const glbJson = JSON.parse(glbJsonString);
      glbJsonString = Analyzer.stringify(glbJson);
    }
    const outputBaseName = Paths.resolve(outputDirectoryName, inputBaseName);
    const glbJsonFileName = outputBaseName + ".glb.json";
    Paths.ensureDirectoryExists(outputDirectoryName);
    Analyzer.writeJsonFileOptional(glbJsonString, glbJsonFileName, force);
  }

  /**
   * Implementation for `analyze`: Analyze a tileset (subtrees only)
   *
   * @param inputDirectoryName - The directory name of the input
   * @param inputBaseName - The base name (file name) of the input
   * @param inputBuffer - The buffer containing the input data
   * @param outputDirectoryName - The name of the output directory
   * @param force - Whether existing files should be overwritten
   */
  private static async analyzeTileset(
    inputDirectoryName: string,
    inputBaseName: string,
    inputBuffer: Buffer,
    outputDirectoryName: string,
    force: boolean
  ) {
    // Assmemble the information about all subtrees
    // in a single markdown string
    let subtreeInfosMarkdown = "";

    // Traverse the tile hierarchy of the given tileset JSON
    const resourceResolver =
      ResourceResolvers.createFileResourceResolver(inputDirectoryName);
    const tileset = JSON.parse(inputBuffer.toString());
    const tilesetTraverser = new TilesetTraverser(
      inputDirectoryName,
      resourceResolver,
      {
        depthFirst: false,
        traverseExternalTilesets: false,
      }
    );
    await tilesetTraverser.traverse(
      tileset,
      async (traversedTile: TraversedTile) => {
        // Check if the traversed tile is the root of
        // a subtree within an implicit tile hierarchy
        if (traversedTile instanceof ExplicitTraversedTile) {
          return true;
        }
        const subtreeUri = traversedTile.getSubtreeUri();
        if (subtreeUri === undefined) {
          return true;
        }
        const implicitTiling = Analyzer.findImplicitTiling(traversedTile);
        if (implicitTiling === undefined) {
          // Should never happen
          logger.error(
            `Could not obtain implicit tiling for traversed tile: ${traversedTile}`
          );
          return false;
        }

        // Create the markdown string for the single subtree file
        const fullSubtreeFileName = Paths.resolve(
          inputDirectoryName,
          subtreeUri
        );
        const subtreeDirectoryName = path.dirname(fullSubtreeFileName);
        const subtreeData = fs.readFileSync(fullSubtreeFileName);
        const subtreeInfoMarkdown = await Analyzer.createSubtreeInfoMarkdown(
          subtreeDirectoryName,
          subtreeData,
          implicitTiling
        );

        // Append the markdown for the single subtree file
        // to the global one, with a header containing the
        // current subtree URI
        subtreeInfosMarkdown += "## Subtree " + subtreeUri + ":";
        subtreeInfosMarkdown += "\n";
        subtreeInfosMarkdown += subtreeInfoMarkdown;
        return true;
      }
    );

    // Write the resuling subtree information as a markdown file
    const outputBaseName = Paths.resolve(outputDirectoryName, inputBaseName);
    const subtreeInfosMarkdownFileName = outputBaseName + ".subtrees.md";
    Analyzer.writeFileOptional(
      Buffer.from(subtreeInfosMarkdown),
      subtreeInfosMarkdownFileName,
      force
    );
  }

  /**
   * Implementation for `analyze`: Analyze subtree data
   *
   * @param inputDirectoryName - The directory name of the input
   * @param inputBuffer - The buffer containing the input data
   * @param implicitTiling - The `TileImplicitTiling` that describes
   * the structure of the subtree data in the input buffer
   */
  private static async createSubtreeInfoMarkdown(
    inputDirectoryName: string,
    inputBuffer: Buffer,
    implicitTiling: TileImplicitTiling
  ) {
    // Obtain the "raw" data for the given subtree data, including
    // the parsed 'Subtree' object, and create a 'SubtreeInfo'
    const resourceResolver =
      ResourceResolvers.createFileResourceResolver(inputDirectoryName);
    const binarySubtreeData = await BinarySubtreeDataResolver.resolveFromBuffer(
      inputBuffer,
      resourceResolver
    );
    const subtree = binarySubtreeData.subtree;
    const subtreeInfo = SubtreeInfos.create(binarySubtreeData, implicitTiling);

    // Create the JSON string for the 'Subtree', and the markdown
    // string that contains availability information
    const subtreeJsonString = JSON.stringify(subtree, null, 2);
    const availabilityMarkdownString = Analyzer.createAvailabilityInfosMarkdown(
      subtree,
      subtreeInfo
    );

    // Assemble the resulting string: The subtree JSON
    // as a code block, and the availability info string:
    let s = "";
    s += "Subtree JSON:";
    s += "\n";
    s += "```";
    s += subtreeJsonString;
    s += "\n";
    s += "```";
    s += "\n";
    s += availabilityMarkdownString;
    s += "\n";
    return s;
  }

  /**
   * Returns a markdown string containing information about the
   * tile-, content-, and child subtree availability that is
   * stored in the given subtree data.
   *
   * Details about the structure of the returned string are
   * totally unspecified.
   *
   * @param subtree - The `Subtree`
   * @param subtreeInfo - The `SubtreeInfo`
   * @returns The markdown string
   */
  private static createAvailabilityInfosMarkdown(
    subtree: Subtree,
    subtreeInfo: SubtreeInfo
  ) {
    const tileAvailability = subtree.tileAvailability;
    const contentAvailability = subtree.contentAvailability;
    const childSubtreeAvailability = subtree.childSubtreeAvailability;

    const tileAvailabilityInfo = subtreeInfo.tileAvailabilityInfo;
    const contentAvailabilityInfos = subtreeInfo.contentAvailabilityInfos;
    const childSubtreeAvailabilityInfo =
      subtreeInfo.childSubtreeAvailabilityInfo;

    let s = "";
    s += "#### Tile Availability:";
    s += "\n";
    s += Analyzer.createAvailabilityInfoMarkdown(
      tileAvailability,
      tileAvailabilityInfo
    );
    s += "\n";

    if (contentAvailability != undefined) {
      const n = contentAvailability.length;
      for (let i = 0; i < n; i++) {
        s += "#### Content Availability (" + i + " of " + n + "):";
        s += "\n";
        s += Analyzer.createAvailabilityInfoMarkdown(
          contentAvailability[i],
          contentAvailabilityInfos[i]
        );
        s += "\n";
      }
    }

    s += "#### Child Subtree Availability:";
    s += "\n";
    s += Analyzer.createAvailabilityInfoMarkdown(
      childSubtreeAvailability,
      childSubtreeAvailabilityInfo
    );
    s += "\n";

    return s;
  }

  /**
   * Returns a markdown string containing information about the
   * given availabiltiy data.
   *
   * Details about the structure of the returned string are
   * totally unspecified.
   *
   * @param availability - The `Availability`
   * @param availabilityInfo - The `AvailabilityInfo`
   * @returns The markdown string
   */
  private static createAvailabilityInfoMarkdown(
    availability: Availability,
    availabilityInfo: AvailabilityInfo
  ) {
    if (availability.constant !== undefined) {
      return "Constant: " + availability.constant + "\n";
    }
    return Analyzer.createAvailabilityInfoMarkdownTable(availabilityInfo);
  }

  /**
   * Returns a markdown string containing information about the
   * given availabiltiy info.
   *
   * Details about the structure of the returned string are
   * totally unspecified.
   *
   * @param availabilityInfo - The `AvailabilityInfo`
   * @returns The markdown string
   */
  private static createAvailabilityInfoMarkdownTable(
    availabilityInfo: AvailabilityInfo
  ) {
    // Create a markdown table with the following structure:
    //
    //| Byte index: | 0|1|2|
    //| --- | --- | --- | --- |
    //| Bytes: |   0x0d  |  0x32  |  0x01  |
    //| Bits [0...7] : | 10110000|01001100|10000000|
    //
    const length = availabilityInfo.length;
    const numBytes = Math.ceil(length / 8);

    let s = "";

    // Header
    s += "| Byte index: |";
    for (let i = 0; i < numBytes; i++) {
      if (i > 0) {
        s += "|";
      }
      s += i.toString();
    }
    s += "|";
    s += "\n";

    // Separator
    s += "| --- |";
    for (let i = 0; i < numBytes; i++) {
      if (i > 0) {
        s += "|";
      }
      s += " --- ";
    }
    s += "|";
    s += "\n";

    // Bytes
    s += "| Byte: |";
    for (let i = 0; i < numBytes; i++) {
      if (i > 0) {
        s += "|";
      }
      let byte = 0;
      for (let j = 0; j < 8; j++) {
        const index = i * 8 + j;
        if (index < length) {
          const a = availabilityInfo.isAvailable(index);
          if (a) {
            byte |= 1 << j;
          }
        }
      }
      const bs = byte.toString(16);
      s += "0x";
      if (bs.length < 2) {
        s += "0";
      }
      s += bs;
    }
    s += "|";
    s += "\n";

    // Bits [0...7]
    s += "| Bits [0...7]: |";
    for (let i = 0; i < numBytes; i++) {
      if (i > 0) {
        s += "|";
      }
      for (let j = 0; j < 8; j++) {
        const index = i * 8 + j;
        if (index < length) {
          const a = availabilityInfo.isAvailable(index);
          if (a) {
            s += "1";
          } else {
            s += "0";
          }
        } else {
          s += "0";
        }
      }
    }
    s += "|";
    s += "\n";

    return s;
  }

  /**
   * Returns the first `TileImplicitTiling` that is found for the
   * given traversed tile or any of its ancestors, or `undefined`
   * if no implicit tiling information can be found.
   *
   * @param traversedTile - The `TraversedTile` instance
   * @returns The `TileImplicitTiling`, or `undefined`
   */
  private static findImplicitTiling(
    traversedTile: TraversedTile
  ): TileImplicitTiling | undefined {
    if (traversedTile instanceof ExplicitTraversedTile) {
      const explicitTraversedTile = traversedTile as ExplicitTraversedTile;
      const implicitTiling = explicitTraversedTile.getImplicitTiling();
      if (implicitTiling !== undefined) {
        return implicitTiling;
      }
    }
    const parent = traversedTile.getParent();
    if (parent === undefined) {
      return undefined;
    }
    return Analyzer.findImplicitTiling(parent);
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
    if (Analyzer.doFormatJson) {
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
